import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly rentSchedulesService: RentSchedulesService,
    @InjectModel(PropertyTenant.name) private propertyTenantModel: Model<PropertyTenant>,
  ) {}

  async create(dto: CreatePaymentDto, tenantId: string, recordedBy: string) {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const payment = await this.paymentRepository.create({
      ...dto,
      tenantId,
      recordedBy,
      receiptNumber,
      status: 'completed', // Auto-complete payments on creation
    } as any);

    // Apply payment to rent schedule if it's a rent payment
    if (payment.leaseId && dto.paymentType === 'rent') {
      try {
        await this.rentSchedulesService.recordPayment(
          tenantId,
          payment.leaseId,
          payment.amount,
          payment._id.toString(),
          payment.paymentDate,
          payment.paymentMethod,
        );
      } catch (error) {
        console.error('Failed to record payment in rent schedule:', error.message);
        // Don't fail payment creation if schedule update fails
      }
    }

    return payment;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string, paymentMethod?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { mpesaTransactionId: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
        { propertyTenantName: { $regex: search, $options: 'i' } },
        { paymentPeriod: { $regex: search, $options: 'i' } },
      ];
    }
    return this.paymentRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment || payment.isDeleted || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByLease(tenantId: string, leaseId: string) {
    return this.paymentRepository.findByLease(tenantId, leaseId);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.paymentRepository.findByProperty(tenantId, propertyId);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    return this.paymentRepository.findByPropertyTenant(tenantId, propertyTenantId);
  }

  async findByDateRange(tenantId: string, startDate: string, endDate: string) {
    return this.paymentRepository.findByDateRange(tenantId, new Date(startDate), new Date(endDate));
  }

  async markCompleted(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, { status: 'completed' } as any);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(id: string, tenantId: string, dto: UpdatePaymentDto) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, dto as any);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.paymentRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, completed, pending, failed] = await Promise.all([
      this.paymentRepository.countByTenant(tenantId),
      this.paymentRepository.countByStatus(tenantId, 'completed'),
      this.paymentRepository.countByStatus(tenantId, 'pending'),
      this.paymentRepository.countByStatus(tenantId, 'failed'),
    ]);
    const [totalCompleted, totalPending] = await Promise.all([
      this.paymentRepository.getTotalByStatus(tenantId, 'completed'),
      this.paymentRepository.getTotalByStatus(tenantId, 'pending'),
    ]);
    const now = new Date();
    const monthlyRevenue = await this.paymentRepository.getMonthlyRevenue(tenantId, now.getFullYear(), now.getMonth() + 1);
    return { total, completed, pending, failed, totalCompleted, totalPending, monthlyRevenue };
  }

  /** Record a completed M-Pesa payment confirmed via proxy polling (no STK push initiated here) */
  async confirmMpesaPayment(
    tenantId: string,
    recordedBy: string,
    dto: {
      leaseId?: string;
      propertyTenantId?: string;
      propertyId?: string;
      amount: number;
      phoneNumber: string;
      mpesaReceiptNumber: string;
      checkoutRequestId: string;
      paymentPeriod?: string;
      paymentType?: string;
      notes?: string;
      propertyName?: string;
      propertyTenantName?: string;
    },
  ) {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
    // Format phone
    const cleanPhone = dto.phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '254' + cleanPhone.slice(1)
      : cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone;

    const payment = await this.paymentRepository.create({
      tenantId,
      leaseId: dto.leaseId || '',
      propertyTenantId: dto.propertyTenantId || '',
      propertyId: dto.propertyId || '',
      amount: dto.amount,
      currency: 'KES',
      paymentDate: new Date(),
      paymentMethod: 'mpesa',
      paymentType: dto.paymentType || 'rent',
      status: 'completed',
      mpesaTransactionId: dto.mpesaReceiptNumber,
      mpesaPhoneNumber: formattedPhone,
      receiptNumber,
      paymentPeriod: dto.paymentPeriod || '',
      notes: dto.notes || '',
      propertyName: dto.propertyName || '',
      propertyTenantName: dto.propertyTenantName || '',
      recordedBy,
    } as any);

    // Apply to rent schedule
    if (payment.leaseId && (payment as any).paymentType === 'rent') {
      this.rentSchedulesService.recordPayment(
        tenantId,
        payment.leaseId,
        payment.amount,
        payment._id.toString(),
        payment.paymentDate,
        'mpesa',
      ).catch((e) => console.error('Rent schedule error', e.message));
    }

    return payment;
  }

  async resendInvoice(id: string, tenantId: string) {
    const payment = await this.findById(id, tenantId);
    const pt = await this.propertyTenantModel.findOne({
      _id: payment.propertyTenantId,
      tenantId,
      isDeleted: false,
    }).exec();
    if (!pt || !pt.email) throw new NotFoundException('Tenant email not found');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const date = new Date(payment.paymentDate).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    await transporter.sendMail({
      from: `"Bomapro" <${process.env.SMTP_USER}>`,
      to: pt.email,
      subject: `Payment Receipt – ${payment.receiptNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 8px; font-size: 22px;">Payment Receipt</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #475569;">Dear <strong>${pt.name}</strong>,</p>
            <p style="color: #475569;">Here is your payment receipt for the following transaction:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #64748b;">Receipt No</td><td style="padding: 8px; font-weight: 600;">${payment.receiptNumber}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Amount</td><td style="padding: 8px; font-weight: 600; color: #059669;">${payment.currency} ${payment.amount.toLocaleString()}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">Date</td><td style="padding: 8px;">${date}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Method</td><td style="padding: 8px; text-transform: capitalize;">${payment.paymentMethod}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">Property</td><td style="padding: 8px;">${payment.propertyName || '–'}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Period</td><td style="padding: 8px;">${payment.paymentPeriod || '–'}</td></tr>
              ${payment.mpesaTransactionId ? `<tr><td style="padding: 8px; color: #64748b;">M-Pesa Ref</td><td style="padding: 8px; font-family: monospace;">${payment.mpesaTransactionId}</td></tr>` : ''}
            </table>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });
    return { message: 'Invoice resent successfully' };
  }

  async sendPaymentReminder(propertyTenantId: string, tenantId: string) {
    const pt = await this.propertyTenantModel.findOne({
      _id: propertyTenantId,
      tenantId,
      isDeleted: false,
    }).exec();
    if (!pt || !pt.email) throw new NotFoundException('Tenant not found or no email');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const portalUrl = process.env.TENANT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4400';
    await transporter.sendMail({
      from: `"Bomapro" <${process.env.SMTP_USER}>`,
      to: pt.email,
      subject: 'Rent Payment Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 8px; font-size: 22px;">Rent Payment Reminder</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #475569;">Dear <strong>${pt.name}</strong>,</p>
            <p style="color: #475569;">This is a friendly reminder that your rent payment is due. Please log in to the tenant portal to make your payment.</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${portalUrl}/tenant-portal/payments" style="display: inline-block; padding: 12px 32px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Pay Now</a>
            </div>
            <p style="color: #94a3b8; font-size: 13px;">If you have already made your payment, please disregard this message.</p>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });
    return { message: 'Payment reminder sent successfully' };
  }
}
