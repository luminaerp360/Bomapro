import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../payments/schemas/payment.schema';
import { Unit } from '../units/schemas/unit.schema';
import { PortalLoginDto, PortalSetupPasswordDto, UpdatePortalProfileDto } from './dto/portal-auth.dto';
import { InitiateMpesaPaymentDto } from './dto/portal-payment.dto';
import { MpesaService } from './mpesa.service';

@Injectable()
export class TenantPortalService {
  private readonly logger = new Logger(TenantPortalService.name);

  constructor(
    @InjectModel(PropertyTenant.name) private propertyTenantModel: Model<PropertyTenant>,
    @InjectModel(Lease.name) private leaseModel: Model<Lease>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Unit.name) private unitModel: Model<Unit>,
    private readonly jwtService: JwtService,
    private readonly mpesaService: MpesaService,
  ) {}

  // ──────────────────────────────────────────────────────
  //  Auth
  // ──────────────────────────────────────────────────────

  async setupPassword(dto: PortalSetupPasswordDto) {
    const tenant = await this.propertyTenantModel.findOne({
      portalInviteToken: dto.token,
      portalInviteTokenUsed: false,
      isDeleted: false,
    });
    if (!tenant) throw new BadRequestException('Invalid or expired invite link');

    if (tenant.portalInviteTokenExpiry && new Date() > tenant.portalInviteTokenExpiry) {
      throw new BadRequestException('Invite link has expired. Ask your property manager to resend the invite.');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    tenant.portalPassword = hashed;
    tenant.portalPasswordSet = true;
    tenant.portalInviteTokenUsed = true;
    await tenant.save();

    return { message: 'Password set successfully. You can now log in.' };
  }

  async login(dto: PortalLoginDto) {
    const tenant = await this.propertyTenantModel.findOne({
      email: dto.email.toLowerCase(),
      isDeleted: false,
      isActive: true,
    });
    
    if (!tenant) {
      throw new UnauthorizedException('No tenant account found with this email. Please contact your property manager.');
    }

    if (!tenant.portalPasswordSet) {
      throw new UnauthorizedException('Your account has not been activated yet. Please check your email for the setup link sent by your property manager.');
    }

    const isValid = await bcrypt.compare(dto.password, tenant.portalPassword);
    if (!isValid) throw new UnauthorizedException('Incorrect password. Please try again.');

    const token = this.jwtService.sign(
      {
        sub: (tenant as any)._id.toString(),
        email: tenant.email,
        name: tenant.name,
        orgTenantId: tenant.tenantId,
        type: 'tenant-portal',
      },
      {
        secret: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
        expiresIn: '7d',
      },
    );

    const profile = this.sanitize(tenant);
    return { token, profile };
  }

  // ──────────────────────────────────────────────────────
  //  Profile
  // ──────────────────────────────────────────────────────

  async getProfile(propertyTenantId: string) {
    const tenant = await this.propertyTenantModel.findById(propertyTenantId);
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');
    return this.sanitize(tenant);
  }

  async updateProfile(propertyTenantId: string, dto: UpdatePortalProfileDto) {
    const tenant = await this.propertyTenantModel.findById(propertyTenantId);
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');
    tenant.phone = dto.phone;
    await tenant.save();
    return this.sanitize(tenant);
  }

  // ──────────────────────────────────────────────────────
  //  Lease
  // ──────────────────────────────────────────────────────

  async getLease(propertyTenantId: string, orgTenantId: string) {
    const lease = await this.leaseModel
      .findOne({
        propertyTenantId,
        tenantId: orgTenantId,
        isDeleted: false,
      })
      .sort({ createdAt: -1 });
    if (!lease) throw new NotFoundException('No lease found for this account');

    let unitNumber = '';
    if ((lease as any).unitId) {
      const unit = await this.unitModel.findById((lease as any).unitId).select('unitNumber').lean();
      if (unit) unitNumber = (unit as any).unitNumber || '';
    }

    return { ...(lease as any).toObject(), unitNumber };
  }

  async signLease(leaseId: string, propertyTenantId: string, orgTenantId: string) {
    const lease = await this.leaseModel.findOne({
      _id: leaseId,
      propertyTenantId,
      tenantId: orgTenantId,
      isDeleted: false,
    });
    if (!lease) throw new NotFoundException('Lease not found');
    if ((lease as any).isSigned) throw new BadRequestException('Lease is already signed');

    (lease as any).isSigned = true;
    (lease as any).signedAt = new Date();
    (lease as any).signedByPropertyTenantId = propertyTenantId;
    await lease.save();
    return lease;
  }

  // ──────────────────────────────────────────────────────
  //  Payments / Invoices
  // ──────────────────────────────────────────────────────

  async getPayments(propertyTenantId: string, orgTenantId: string) {
    return this.paymentModel
      .find({ propertyTenantId, tenantId: orgTenantId, isDeleted: false })
      .sort({ paymentDate: -1 });
  }

  async getPaymentStatus(paymentId: string, propertyTenantId: string) {
    const payment = await this.paymentModel.findOne({
      _id: paymentId,
      propertyTenantId,
      isDeleted: false,
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async initiateMpesaPayment(propertyTenantId: string, orgTenantId: string, dto: InitiateMpesaPaymentDto) {
    // Validate lease
    const lease = await this.leaseModel.findOne({
      _id: dto.leaseId,
      propertyTenantId,
      tenantId: orgTenantId,
      isDeleted: false,
    });
    if (!lease) throw new NotFoundException('Lease not found');

    const tenant = await this.propertyTenantModel.findById(propertyTenantId);
    if (!tenant) throw new NotFoundException('Tenant profile not found');

    // Initiate STK push
    const stkResult = await this.mpesaService.stkPush(
      dto.phoneNumber,
      dto.amount,
      lease.leaseNumber || lease._id.toString(),
      `Rent ${dto.paymentPeriod || ''}`.trim(),
    );

    if (stkResult.ResponseCode !== '0') {
      throw new BadRequestException(stkResult.ResponseDescription || 'STK push failed. Please try again.');
    }

    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

    // Create pending payment record
    const payment = new this.paymentModel({
      tenantId: orgTenantId,
      leaseId: dto.leaseId,
      propertyTenantId,
      propertyId: lease.propertyId,
      amount: dto.amount,
      currency: 'KES',
      paymentDate: new Date(),
      paymentMethod: PaymentMethod.MPESA,
      paymentType: PaymentType.RENT,
      status: PaymentStatus.PENDING,
      mpesaTransactionId: stkResult.CheckoutRequestID,
      mpesaPhoneNumber: this.mpesaService.formatPhone(dto.phoneNumber),
      receiptNumber,
      paymentPeriod: dto.paymentPeriod || '',
      notes: dto.notes || '',
      propertyName: lease.propertyName || '',
      propertyTenantName: lease.propertyTenantName || tenant.name,
      recordedBy: 'tenant-portal',
    });
    await payment.save();

    return {
      message: 'Payment request sent to your phone. Please enter your M-Pesa PIN to complete.',
      checkoutRequestId: stkResult.CheckoutRequestID,
      paymentId: (payment as any)._id.toString(),
    };
  }

  // ──────────────────────────────────────────────────────
  //  M-Pesa Callback
  // ──────────────────────────────────────────────────────

  async handleMpesaCallback(body: any) {
    this.logger.log(`M-Pesa callback received: ${JSON.stringify(body)}`);
    try {
      const stkCallback = body?.Body?.stkCallback;
      if (!stkCallback) return { ResultCode: 0, ResultDesc: 'Accepted' };

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      // Find the pending payment
      const payment = await this.paymentModel.findOne({
        mpesaTransactionId: CheckoutRequestID,
        status: PaymentStatus.PENDING,
        isDeleted: false,
      });

      if (!payment) {
        this.logger.warn(`No pending payment found for CheckoutRequestID: ${CheckoutRequestID}`);
        return { ResultCode: 0, ResultDesc: 'Accepted' };
      }

      if (ResultCode === 0) {
        // Extract M-Pesa receipt from metadata
        const items: any[] = CallbackMetadata?.Item || [];
        const getItem = (name: string) => items.find((i: any) => i.Name === name)?.Value;

        const mpesaReceiptNumber = getItem('MpesaReceiptNumber') || '';
        const amount = getItem('Amount') || payment.amount;
        const phone = getItem('PhoneNumber') || payment.mpesaPhoneNumber;

        payment.status = PaymentStatus.COMPLETED;
        payment.mpesaTransactionId = mpesaReceiptNumber;
        payment.mpesaPhoneNumber = String(phone);
        payment.amount = Number(amount);
        await payment.save();

        // Send receipt email to tenant
        const tenant = await this.propertyTenantModel.findOne({
          _id: payment.propertyTenantId,
          isDeleted: false,
        });
        if (tenant?.email) {
          await this.sendReceiptEmail(tenant.email, tenant.name, {
            receiptNumber: payment.receiptNumber,
            mpesaReceiptNumber,
            amount: payment.amount,
            paymentPeriod: payment.paymentPeriod,
            propertyName: payment.propertyName,
            paymentDate: payment.paymentDate,
            phone: String(phone),
          }).catch((err) => this.logger.error('Receipt email error', err));
        }
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.notes = `Payment failed: ${ResultDesc}`;
        await payment.save();
      }
    } catch (err) {
      this.logger.error('M-Pesa callback processing error', err);
    }

    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  // ──────────────────────────────────────────────────────
  //  Portal Invite (called from PropertyTenantsService)
  // ──────────────────────────────────────────────────────

  async resendInvite(propertyTenantId: string, orgTenantId: string) {
    const tenant = await this.propertyTenantModel.findOne({
      _id: propertyTenantId,
      tenantId: orgTenantId,
      isDeleted: false,
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const { token } = await this.generateAndSaveInviteToken(tenant);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const link = `${frontendUrl}/tenant-portal/setup-password?token=${token}`;
    await this.sendPortalInviteEmail(tenant.email, tenant.name, link);
    return { message: 'Invite resent successfully' };
  }

  async generateAndSaveInviteToken(tenant: any): Promise<{ token: string }> {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    tenant.portalInviteToken = token;
    tenant.portalInviteTokenExpiry = expiry;
    tenant.portalInviteTokenUsed = false;
    await tenant.save();
    return { token };
  }

  // ──────────────────────────────────────────────────────
  //  Email helpers
  // ──────────────────────────────────────────────────────

  private get mailer() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async sendPortalInviteEmail(to: string, name: string, inviteLink: string) {
    await this.mailer.sendMail({
      from: `"Bomapro" <${process.env.SMTP_USER}>`,
      to,
      subject: 'You have been added — Access your Tenant Portal',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:50px;height:50px;background:#059669;border-radius:12px;line-height:50px;color:white;font-size:22px;">🏠</div>
            <h1 style="color:#1e293b;margin-top:10px;font-size:22px;">Bomapro Tenant Portal</h1>
          </div>
          <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
            <h2 style="color:#1e293b;margin-top:0;">Welcome, ${name}!</h2>
            <p style="color:#475569;line-height:1.7;">Your property manager has added you to the Bomapro system. You can now access your Tenant Portal to:</p>
            <ul style="color:#475569;line-height:1.9;">
              <li>View and sign your lease agreement</li>
              <li>Make rent payments via M-Pesa</li>
              <li>View your payment history and invoices</li>
            </ul>
            <p style="color:#475569;">Click the button below to set up your password and get started:</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${inviteLink}" style="display:inline-block;padding:12px 32px;background:#059669;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Set Up My Account</a>
            </div>
            <p style="color:#94a3b8;font-size:12px;">This link is valid for 7 days. If you didn't expect this email, you can safely ignore it.</p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });
  }

  private async sendReceiptEmail(
    to: string,
    name: string,
    data: {
      receiptNumber: string;
      mpesaReceiptNumber: string;
      amount: number;
      paymentPeriod: string;
      propertyName: string;
      paymentDate: Date;
      phone: string;
    },
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    await this.mailer.sendMail({
      from: `"Bomapro" <${process.env.SMTP_USER}>`,
      to,
      subject: `Payment Successful — KES ${data.amount.toLocaleString()} Receipt`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f8fafc;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:50px;height:50px;background:#059669;border-radius:12px;line-height:50px;color:white;font-size:22px;">🏠</div>
            <h1 style="color:#1e293b;margin-top:10px;font-size:22px;">Bomapro</h1>
          </div>
          <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
            <div style="text-align:center;margin-bottom:20px;">
              <div style="display:inline-block;width:56px;height:56px;background:#d1fae5;border-radius:50%;line-height:56px;font-size:28px;">✓</div>
              <h2 style="color:#059669;margin-top:10px;">Payment Successful!</h2>
            </div>
            <p style="color:#475569;">Dear <strong>${name}</strong>, your rent payment has been received. Here are the details:</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-size:13px;width:45%;">Receipt No.</td><td style="padding:10px 14px;color:#1e293b;font-weight:600;">${data.receiptNumber}</td></tr>
              <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;">M-Pesa Receipt</td><td style="padding:10px 14px;color:#1e293b;font-weight:600;">${data.mpesaReceiptNumber}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-size:13px;">Amount Paid</td><td style="padding:10px 14px;color:#059669;font-weight:700;font-size:16px;">KES ${data.amount.toLocaleString()}</td></tr>
              <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;">Property</td><td style="padding:10px 14px;color:#1e293b;">${data.propertyName}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-size:13px;">Period</td><td style="padding:10px 14px;color:#1e293b;">${data.paymentPeriod || '—'}</td></tr>
              <tr><td style="padding:10px 14px;color:#64748b;font-size:13px;">Phone</td><td style="padding:10px 14px;color:#1e293b;">${data.phone}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#64748b;font-size:13px;">Date</td><td style="padding:10px 14px;color:#1e293b;">${new Date(data.paymentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            </table>
            <div style="text-align:center;margin-top:24px;">
              <a href="${frontendUrl}/tenant-portal/invoices" style="display:inline-block;padding:10px 28px;background:#059669;color:white;text-decoration:none;border-radius:8px;font-size:13px;">View All Invoices</a>
            </div>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });
  }

  // ──────────────────────────────────────────────────────
  //  Helpers
  // ──────────────────────────────────────────────────────

  private sanitize(tenant: any) {
    const obj = tenant.toObject ? tenant.toObject() : { ...tenant };
    delete obj.portalPassword;
    delete obj.portalInviteToken;
    delete obj.portalInviteTokenExpiry;
    delete obj.portalInviteTokenUsed;
    return obj;
  }
}
