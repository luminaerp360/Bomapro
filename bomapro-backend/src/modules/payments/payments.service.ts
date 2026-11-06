import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
import { Unit } from '../units/schemas/unit.schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly rentSchedulesService: RentSchedulesService,
    @InjectModel(PropertyTenant.name) private propertyTenantModel: Model<PropertyTenant>,
    @InjectModel(Lease.name) private leaseModel: Model<Lease>,
    @InjectModel(Property.name) private propertyModel: Model<Property>,
    @InjectModel(Unit.name) private unitModel: Model<Unit>,
  ) {}

  private async enrichPayments(payments: any[]) {
    if (!payments || payments.length === 0) return [];
    const plainList = payments.map((p) => (typeof p.toObject === 'function' ? p.toObject() : { ...p }));

    const leaseIds = [...new Set(plainList.map((p) => p.leaseId).filter(Boolean))];
    const leases = leaseIds.length
      ? await this.leaseModel.find({ _id: { $in: leaseIds } }).lean().exec()
      : [];
    const leaseMap = new Map<string, any>();
    leases.forEach((l) => leaseMap.set(String(l._id), l));

    const propertyIds = [
      ...new Set([
        ...plainList.map((p) => p.propertyId).filter(Boolean),
        ...leases.map((l: any) => l.propertyId).filter(Boolean),
      ]),
    ];
    const unitIds = [
      ...new Set([
        ...plainList.map((p) => p.unitId).filter(Boolean),
        ...leases.map((l: any) => l.unitId).filter(Boolean),
      ]),
    ];
    const ptIds = [
      ...new Set([
        ...plainList.map((p) => p.propertyTenantId).filter(Boolean),
        ...leases.map((l: any) => l.propertyTenantId).filter(Boolean),
      ]),
    ];

    const [properties, units, propertyTenants] = await Promise.all([
      propertyIds.length ? this.propertyModel.find({ _id: { $in: propertyIds } }).lean().exec() : [],
      unitIds.length ? this.unitModel.find({ _id: { $in: unitIds } }).lean().exec() : [],
      ptIds.length ? this.propertyTenantModel.find({ _id: { $in: ptIds } }).lean().exec() : [],
    ]);

    const propMap = new Map<string, any>();
    properties.forEach((pr) => propMap.set(String(pr._id), pr));

    const unitMap = new Map<string, any>();
    units.forEach((u) => unitMap.set(String(u._id), u));

    const ptMap = new Map<string, any>();
    propertyTenants.forEach((pt) => ptMap.set(String(pt._id), pt));

    return plainList.map((p) => {
      const lease = leaseMap.get(String(p.leaseId));
      const propId = p.propertyId || lease?.propertyId || '';
      const unitId = p.unitId || lease?.unitId || '';
      const ptId = p.propertyTenantId || lease?.propertyTenantId || '';

      const prop = propMap.get(String(propId));
      const unit = unitMap.get(String(unitId));
      const pt = ptMap.get(String(ptId));

      return {
        ...p,
        propertyId: propId,
        propertyName: p.propertyName || lease?.propertyName || prop?.name || '',
        unitId,
        unitNumber: p.unitNumber || lease?.unitNumber || unit?.unitNumber || '',
        leaseNumber: p.leaseNumber || lease?.leaseNumber || '',
        propertyTenantId: ptId,
        propertyTenantName: p.propertyTenantName || lease?.propertyTenantName || pt?.name || '',
        propertyTenantEmail: pt?.email || '',
        propertyTenantPhone: pt?.phone || '',
      };
    });
  }

  async create(dto: CreatePaymentDto, tenantId: string, recordedBy: string) {
    const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;

    // Resolve lease/property/unit/tenant names if missing
    let lease: any = null;
    if (dto.leaseId) {
      try {
        lease = await this.leaseModel.findById(dto.leaseId).lean().exec();
      } catch {}
    }

    const propertyId = dto.propertyId || lease?.propertyId || '';
    const unitId = dto.unitId || lease?.unitId || '';
    const propertyTenantId = dto.propertyTenantId || lease?.propertyTenantId || '';

    let propertyName = dto.propertyName || lease?.propertyName || '';
    if (!propertyName && propertyId) {
      try {
        const prop = await this.propertyModel.findById(propertyId).lean().exec();
        if (prop) propertyName = (prop as any).name || '';
      } catch {}
    }

    let unitNumber = dto.unitNumber || lease?.unitNumber || '';
    if (!unitNumber && unitId) {
      try {
        const unit = await this.unitModel.findById(unitId).lean().exec();
        if (unit) unitNumber = (unit as any).unitNumber || '';
      } catch {}
    }

    let propertyTenantName = dto.propertyTenantName || lease?.propertyTenantName || '';
    if (!propertyTenantName && propertyTenantId) {
      try {
        const pt = await this.propertyTenantModel.findById(propertyTenantId).lean().exec();
        if (pt) propertyTenantName = (pt as any).name || '';
      } catch {}
    }

    const paymentType = dto.paymentType || ('rent' as any);

    const payment = await this.paymentRepository.create({
      ...dto,
      tenantId,
      recordedBy,
      receiptNumber,
      paymentType,
      propertyId,
      unitId,
      unitNumber,
      leaseNumber: dto.leaseNumber || lease?.leaseNumber || '',
      propertyName,
      propertyTenantId,
      propertyTenantName,
      scheduleId: dto.scheduleId || '',
      status: 'completed', // Auto-complete payments on creation
    } as any);

    // Apply payment to rent schedule if it's a rent payment
    if (payment.leaseId && paymentType === 'rent') {
      try {
        await this.rentSchedulesService.recordPayment(
          tenantId,
          payment.leaseId,
          payment.amount,
          payment._id.toString(),
          payment.paymentDate,
          payment.paymentMethod,
          {
            scheduleId: dto.scheduleId,
            selectedMonths: dto.selectedMonths,
            paymentPeriod: dto.paymentPeriod,
          },
        );
      } catch (error) {
        console.error('Failed to record payment in rent schedule:', error.message);
      }
    }

    const [enriched] = await this.enrichPayments([payment]);
    return enriched || payment;
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
        { unitNumber: { $regex: search, $options: 'i' } },
        { leaseNumber: { $regex: search, $options: 'i' } },
        { paymentPeriod: { $regex: search, $options: 'i' } },
      ];
    }
    const res = await this.paymentRepository.findPaginated({ page, limit, filter });
    const enrichedData = await this.enrichPayments(res.data || []);
    return {
      ...res,
      data: enrichedData,
    };
  }

  async findById(id: string, tenantId: string) {
    const payment = await this.paymentRepository.findById(id);
    if (!payment || payment.isDeleted || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }
    const [enriched] = await this.enrichPayments([payment]);
    return enriched || payment;
  }

  async findByLease(tenantId: string, leaseId: string) {
    const list = await this.paymentRepository.findByLease(tenantId, leaseId);
    return this.enrichPayments(list);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    const list = await this.paymentRepository.findByProperty(tenantId, propertyId);
    return this.enrichPayments(list);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    const list = await this.paymentRepository.findByPropertyTenant(tenantId, propertyTenantId);
    return this.enrichPayments(list);
  }

  async findByDateRange(tenantId: string, startDate: string, endDate: string) {
    const list = await this.paymentRepository.findByDateRange(tenantId, new Date(startDate), new Date(endDate));
    return this.enrichPayments(list);
  }

  async markCompleted(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, { status: 'completed' } as any);
    if (!payment) throw new NotFoundException('Payment not found');
    const [enriched] = await this.enrichPayments([payment]);
    return enriched || payment;
  }

  async update(id: string, tenantId: string, dto: UpdatePaymentDto) {
    await this.findById(id, tenantId);
    const payment = await this.paymentRepository.update(id, dto as any);
    if (!payment) throw new NotFoundException('Payment not found');
    const [enriched] = await this.enrichPayments([payment]);
    return enriched || payment;
  }

  async remove(id: string, tenantId: string) {
    const payment = await this.findById(id, tenantId);
    if (payment.leaseId && (!payment.paymentType || payment.paymentType === 'rent')) {
      try {
        await this.rentSchedulesService.reversePayment(tenantId, payment.leaseId, id, payment.amount);
      } catch (error) {
        console.error('Failed to reverse payment from rent schedule:', error.message);
      }
    }
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
      unitId?: string;
      unitNumber?: string;
      leaseNumber?: string;
      scheduleId?: string;
      selectedMonths?: string[];
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
    const cleanPhone = dto.phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? '254' + cleanPhone.slice(1)
      : cleanPhone.startsWith('254')
      ? cleanPhone
      : '254' + cleanPhone;

    let lease: any = null;
    if (dto.leaseId) {
      try {
        lease = await this.leaseModel.findById(dto.leaseId).lean().exec();
      } catch {}
    }

    const payment = await this.paymentRepository.create({
      tenantId,
      leaseId: dto.leaseId || '',
      propertyTenantId: dto.propertyTenantId || lease?.propertyTenantId || '',
      propertyId: dto.propertyId || lease?.propertyId || '',
      unitId: dto.unitId || lease?.unitId || '',
      unitNumber: dto.unitNumber || lease?.unitNumber || '',
      leaseNumber: dto.leaseNumber || lease?.leaseNumber || '',
      scheduleId: dto.scheduleId || '',
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
      propertyName: dto.propertyName || lease?.propertyName || '',
      propertyTenantName: dto.propertyTenantName || lease?.propertyTenantName || '',
      recordedBy,
    } as any);

    // Apply to rent schedule
    if (payment.leaseId && (payment as any).paymentType === 'rent') {
      this.rentSchedulesService
        .recordPayment(
          tenantId,
          payment.leaseId,
          payment.amount,
          payment._id.toString(),
          payment.paymentDate,
          'mpesa',
          {
            scheduleId: dto.scheduleId,
            selectedMonths: dto.selectedMonths,
            paymentPeriod: dto.paymentPeriod,
          },
        )
        .catch((e) => console.error('Rent schedule error', e.message));
    }

    const [enriched] = await this.enrichPayments([payment]);
    return enriched || payment;
  }

  async resendInvoice(id: string, tenantId: string) {
    const payment = await this.findById(id, tenantId);
    const pt = await this.propertyTenantModel
      .findOne({
        _id: payment.propertyTenantId,
        tenantId,
        isDeleted: false,
      })
      .exec();
    if (!pt || !pt.email) throw new NotFoundException('Tenant email not found');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const date = new Date(payment.paymentDate).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
              <tr><td style="padding: 8px; color: #64748b;">Property / Unit</td><td style="padding: 8px;">${payment.propertyName || '–'} ${payment.unitNumber ? `(Unit ${payment.unitNumber})` : ''}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Period</td><td style="padding: 8px;">${payment.paymentPeriod || '–'}</td></tr>
              ${payment.mpesaTransactionId ? `<tr><td style="padding: 8px; color: #64748b;">M-Pesa Ref</td><td style="padding: 8px; font-family: monospace;">${payment.mpesaTransactionId}</td></tr>` : ''}
            </table>
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });
    return { message: 'Receipt resent successfully' };
  }

  async sendPaymentReminder(propertyTenantId: string, tenantId: string) {
    const pt = await this.propertyTenantModel
      .findOne({
        _id: propertyTenantId,
        tenantId,
        isDeleted: false,
      })
      .exec();
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
