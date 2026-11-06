import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';
import { ScheduleStatus } from './schemas/rent-schedule.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
import { Unit } from '../units/schemas/unit.schema';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';

export interface CreateScheduleDto {
  leaseId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  dueDate: Date;
  amount: number;
  month: string;
  gracePeriodDays?: number;
}

@Injectable()
export class RentSchedulesService {
  constructor(
    private readonly scheduleRepository: RentScheduleRepository,
    @InjectModel(Lease.name) private readonly leaseModel: Model<Lease>,
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
    @InjectModel(Unit.name) private readonly unitModel: Model<Unit>,
    @InjectModel(PropertyTenant.name) private readonly propertyTenantModel: Model<PropertyTenant>,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
  ) {}

  async getMailConfig(tenantId: string) {
    let org: any = null;
    if (tenantId) {
      try {
        org = await this.tenantModel.findById(tenantId).lean().exec();
      } catch {}
    }

    const smtp = org?.smtpConfig || {};
    const useCustom = Boolean(smtp.useCustomSmtp && smtp.host && smtp.user && smtp.pass);

    const host = useCustom ? smtp.host : process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = useCustom ? Number(smtp.port || 465) : parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = useCustom
      ? smtp.secure !== undefined
        ? Boolean(smtp.secure)
        : port === 465
      : process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;
    const user = useCustom ? smtp.user : process.env.SMTP_USER || 'luminaerp360@gmail.com';
    const pass = useCustom
      ? smtp.pass
      : process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'uloh bcxz vqgf stgt';
    const fromEmail = useCustom
      ? smtp.fromEmail || smtp.user || user
      : process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'luminaerp360@gmail.com';
    const orgName = org?.name || 'Bomapro Property Management';
    const fromName = (useCustom && smtp.fromName) || orgName;

    const preferences = {
      emailTenantOnPayment: true,
      emailAdminsOnPayment: true,
      emailTenantOnInvoiceDue: true,
      emailAdminsOnOverdue: true,
      publicPortalUrl: '',
      ...(org?.notificationPreferences || {}),
    };

    const billingSettings = {
      defaultCurrency: 'KES',
      defaultPaymentDueDay: 5,
      defaultGracePeriodDays: 5,
      defaultLeaseDurationMonths: 12,
      paybillOrTillNumber: '',
      bankAccountDetails: '',
      paymentInstructions: '',
      ...(org?.billingSettings || {}),
    };

    const rawFrontendUrl =
      (preferences.publicPortalUrl || '').trim() ||
      process.env.FRONTEND_URL ||
      'https://ecommerse.lumina360.tech';
    const frontendUrl = rawFrontendUrl.replace(/\/$/, '');

    const adminEmails = [
      ...new Set(
        [
          ...(Array.isArray(org?.notificationEmails) ? org.notificationEmails : []),
          org?.billingEmail,
          org?.contactEmail,
        ]
          .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
          .filter((e) => e && e.includes('@')),
      ),
    ];

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    return {
      transporter,
      fromHeader: `"${fromName}" <${fromEmail}>`,
      fromEmail,
      fromName,
      orgName,
      frontendUrl,
      adminEmails,
      preferences,
      billingSettings,
      supportPhone: org?.supportPhone || '',
    };
  }

  private getTokenSecret(): string {
    return process.env.JWT_SECRET || 'bomapro-public-invoice-hmac-secret-2026';
  }

  /**
   * Generate a tamper-proof HMAC-SHA256 signed public payment token for an invoice
   */
  generatePublicToken(scheduleId: string, tenantId: string): string {
    const payload = Buffer.from(`${scheduleId}:${tenantId}`, 'utf8').toString('base64url');
    const sig = crypto
      .createHmac('sha256', this.getTokenSecret())
      .update(payload)
      .digest('base64url')
      .slice(0, 24);
    return `${payload}.${sig}`;
  }

  /**
   * Verify and decode a signed public payment token
   */
  verifyPublicToken(token: string): { scheduleId: string; tenantId: string } {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      throw new UnauthorizedException('Invalid payment link token');
    }
    const [payload, sig] = token.split('.');
    if (!payload || !sig) {
      throw new UnauthorizedException('Malformed payment link token');
    }
    const expectedSig = crypto
      .createHmac('sha256', this.getTokenSecret())
      .update(payload)
      .digest('base64url')
      .slice(0, 24);

    if (sig !== expectedSig) {
      throw new UnauthorizedException('Invalid or tampered payment link');
    }

    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const [scheduleId, tenantId] = decoded.split(':');
    if (!scheduleId || !tenantId) {
      throw new UnauthorizedException('Invalid payment token payload');
    }
    return { scheduleId, tenantId };
  }

  async findByPublicToken(token: string) {
    const { scheduleId, tenantId } = this.verifyPublicToken(token);
    const raw = await this.scheduleRepository.findById(scheduleId);
    if (!raw || raw.isDeleted || String(raw.tenantId) !== String(tenantId)) {
      throw new NotFoundException('Invoice not found or no longer active');
    }
    const [enriched] = await this.enrichSchedules([raw], tenantId);
    return enriched;
  }

  async createSchedule(dto: CreateScheduleDto) {
    const dueWithGracePeriodDate = new Date(dto.dueDate);
    dueWithGracePeriodDate.setDate(dueWithGracePeriodDate.getDate() + (dto.gracePeriodDays || 5));

    return this.scheduleRepository.create({
      ...dto,
      paidAmount: 0,
      status: ScheduleStatus.UNPAID,
      dueWithGracePeriodDate,
    } as any);
  }

  async generateSchedulesForLease(
    leaseId: string,
    tenantId: string,
    propertyId: string,
    unitId: string,
    startDate: Date,
    rentAmount: number,
    gracePeriodDays: number = 5,
    months: number = 12,
  ) {
    const schedules = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < months; i++) {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, currentDate.getDate());
      const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;

      const schedule = await this.createSchedule({
        leaseId,
        tenantId,
        propertyId,
        unitId,
        dueDate,
        amount: rentAmount,
        month,
        gracePeriodDays,
      });

      schedules.push(schedule);
    }

    return schedules;
  }

  /**
   * Ensure that any active lease without rent schedules gets its monthly schedules generated,
   * and if an active lease is on its last generated month (or has fewer than 3 unpaid future months left),
   * automatically roll/extend it by another 12 months so billing never stops while the lease is active.
   */
  async ensureSchedulesForActiveLeases(tenantId: string) {
    try {
      const activeLeases = await this.leaseModel
        .find({ tenantId, status: 'active', isDeleted: false })
        .lean()
        .exec();

      for (const lease of activeLeases) {
        const leaseId = String(lease._id);
        const existing = await this.scheduleRepository.findByLease(tenantId, leaseId);
        if (!existing || existing.length === 0) {
          const start = new Date(lease.startDate || new Date());
          const end = lease.endDate
            ? new Date(lease.endDate)
            : new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
          const months = Math.max(
            12,
            (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()),
          );
          const firstDue = new Date(start.getFullYear(), start.getMonth(), lease.paymentDueDay || 5);
          await this.generateSchedulesForLease(
            leaseId,
            tenantId,
            lease.propertyId || '',
            lease.unitId || '',
            firstDue,
            lease.rentAmount || 0,
            lease.gracePeriodDays || 5,
            months,
          );
        } else {
          await this.extendLeaseSchedulesIfNeeded(tenantId, lease, existing);
        }
      }
    } catch (error) {
      console.error('Error ensuring schedules for active leases:', error.message);
    }
  }

  /**
   * If an active lease has paid up to its last generated month (e.g. month 5 of 5) or has
   * fewer than 3 unpaid upcoming schedules left, automatically generate the next 12 months
   * and extend the active lease's endDate.
   */
  async extendLeaseSchedulesIfNeeded(tenantId: string, leaseOrId: any, existingSchedules?: any[]) {
    try {
      const lease =
        typeof leaseOrId === 'string'
          ? await this.leaseModel.findById(leaseOrId).lean().exec()
          : leaseOrId;
      if (!lease || lease.status !== 'active' || lease.isDeleted) return;

      const leaseId = String(lease._id);
      const schedules =
        existingSchedules || (await this.scheduleRepository.findByLease(tenantId, leaseId));
      if (!schedules || schedules.length === 0) return;

      const sorted = [...schedules].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      );
      const unpaidRemaining = sorted.filter(
        (s) => (Number(s.paidAmount) || 0) < (Number(s.amount) || 0),
      );

      // If all generated months are paid (e.g., paying the 5th month of a 5-month schedule)
      // or fewer than 2 unpaid months remain on an active lease, generate the next 12 months
      if (unpaidRemaining.length <= 1) {
        const lastSchedule = sorted[sorted.length - 1];
        const lastDue = new Date(lastSchedule.dueDate);
        const dueDay = lease.paymentDueDay || lastDue.getDate() || 5;
        const nextStart = new Date(lastDue.getFullYear(), lastDue.getMonth() + 1, dueDay);
        const extensionMonths = 12;

        const existingMonthSet = new Set(sorted.map((s) => s.month).filter(Boolean));
        let lastCreatedDue = lastDue;

        for (let i = 0; i < extensionMonths; i++) {
          const dueDate = new Date(
            nextStart.getFullYear(),
            nextStart.getMonth() + i,
            dueDay,
          );
          const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
          if (!existingMonthSet.has(month)) {
            await this.createSchedule({
              leaseId,
              tenantId,
              propertyId: lease.propertyId || lastSchedule.propertyId || '',
              unitId: lease.unitId || lastSchedule.unitId || '',
              dueDate,
              amount: lease.rentAmount || lastSchedule.amount || 0,
              month,
              gracePeriodDays: lease.gracePeriodDays || 5,
            });
            existingMonthSet.add(month);
            lastCreatedDue = dueDate;
          }
        }

        // Also extend the lease endDate if the newly generated schedules go past the current endDate
        const newEndDate = new Date(
          lastCreatedDue.getFullYear(),
          lastCreatedDue.getMonth() + 1,
          lastCreatedDue.getDate(),
        );
        if (!lease.endDate || new Date(lease.endDate) < newEndDate) {
          await this.leaseModel.findByIdAndUpdate(leaseId, { endDate: newEndDate });
        }
      }
    } catch (error) {
      console.error('Error auto-extending lease schedules:', error.message);
    }
  }

  /**
   * Batch-enrich schedules with Lease, Property, Unit, and PropertyTenant info
   */
  async enrichSchedules(schedules: any[], tenantId: string) {
    if (!schedules || schedules.length === 0) return [];

    const plainList = schedules.map((s) => (typeof s.toObject === 'function' ? s.toObject() : { ...s }));

    const leaseIds = [...new Set(plainList.map((s) => s.leaseId).filter(Boolean))];
    const leases = leaseIds.length
      ? await this.leaseModel.find({ _id: { $in: leaseIds } }).lean().exec()
      : [];
    const leaseMap = new Map<string, any>();
    leases.forEach((l) => leaseMap.set(String(l._id), l));

    const propertyIds = [
      ...new Set([
        ...plainList.map((s) => s.propertyId).filter(Boolean),
        ...leases.map((l: any) => l.propertyId).filter(Boolean),
      ]),
    ];
    const unitIds = [
      ...new Set([
        ...plainList.map((s) => s.unitId).filter(Boolean),
        ...leases.map((l: any) => l.unitId).filter(Boolean),
      ]),
    ];
    const propertyTenantIds = [
      ...new Set(leases.map((l: any) => l.propertyTenantId).filter(Boolean)),
    ];

    const [properties, units, propertyTenants] = await Promise.all([
      propertyIds.length ? this.propertyModel.find({ _id: { $in: propertyIds } }).lean().exec() : [],
      unitIds.length ? this.unitModel.find({ _id: { $in: unitIds } }).lean().exec() : [],
      propertyTenantIds.length
        ? this.propertyTenantModel.find({ _id: { $in: propertyTenantIds } }).lean().exec()
        : [],
    ]);

    const propMap = new Map<string, any>();
    properties.forEach((p) => propMap.set(String(p._id), p));

    const unitMap = new Map<string, any>();
    units.forEach((u) => unitMap.set(String(u._id), u));

    const ptMap = new Map<string, any>();
    propertyTenants.forEach((pt) => ptMap.set(String(pt._id), pt));

    const now = new Date();

    return plainList.map((s) => {
      const lease = leaseMap.get(String(s.leaseId));
      const propId = s.propertyId || lease?.propertyId || '';
      const unitId = s.unitId || lease?.unitId || '';
      const ptId = lease?.propertyTenantId || '';

      const prop = propMap.get(String(propId));
      const unit = unitMap.get(String(unitId));
      const pt = ptMap.get(String(ptId));

      const amount = Number(s.amount) || 0;
      const paidAmount = Number(s.paidAmount) || 0;
      const balanceDue = Math.max(0, amount - paidAmount);

      let computedStatus = s.status || ScheduleStatus.UNPAID;
      if (paidAmount >= amount && amount > 0) {
        computedStatus = ScheduleStatus.PAID;
      } else if (paidAmount > 0 && paidAmount < amount) {
        computedStatus =
          s.dueWithGracePeriodDate && new Date(s.dueWithGracePeriodDate) < now
            ? ScheduleStatus.OVERDUE
            : ScheduleStatus.PARTIAL;
      } else if (s.dueWithGracePeriodDate && new Date(s.dueWithGracePeriodDate) < now) {
        computedStatus = ScheduleStatus.OVERDUE;
      } else {
        computedStatus = ScheduleStatus.UNPAID;
      }

      const monthStr =
        s.month ||
        (s.dueDate
          ? `${new Date(s.dueDate).getFullYear()}-${String(new Date(s.dueDate).getMonth() + 1).padStart(2, '0')}`
          : '');
      const monthLabel = s.dueDate
        ? new Date(s.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : monthStr;

      const invoiceNumber = `INV-${monthStr.replace('-', '')}-${String(s._id).slice(-4).toUpperCase()}`;
      const effectiveTenantId = String(s.tenantId || tenantId || '');
      const publicPayToken = this.generatePublicToken(String(s._id), effectiveTenantId);

      return {
        ...s,
        invoiceNumber,
        publicPayToken,
        month: monthStr,
        monthLabel,
        status: computedStatus,
        balanceDue,
        currency: lease?.currency || 'KES',
        leaseNumber: lease?.leaseNumber || '',
        leaseStatus: lease?.status || '',
        propertyId: propId,
        propertyName: lease?.propertyName || prop?.name || '',
        unitId,
        unitNumber: lease?.unitNumber || unit?.unitNumber || '',
        propertyTenantId: ptId,
        propertyTenantName: lease?.propertyTenantName || pt?.name || '',
        propertyTenantEmail: pt?.email || '',
        propertyTenantPhone: pt?.phone || '',
      };
    });
  }

  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      propertyId?: string;
      leaseId?: string;
      month?: string;
      scope?: string; // 'due' (default: up to current/next month) | 'all' (entire lease schedule)
    } = {},
  ) {
    await this.ensureSchedulesForActiveLeases(tenantId);

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Number(options.limit) || 50);
    const scope = options.scope || 'due';

    const rawFilter: any = { tenantId, isDeleted: false };
    if (options.propertyId) rawFilter.propertyId = options.propertyId;
    if (options.leaseId) rawFilter.leaseId = options.leaseId;
    if (options.month) rawFilter.month = options.month;

    const allRaw = await (this.scheduleRepository as any).model
      .find(rawFilter)
      .sort({ dueDate: 1 })
      .lean()
      .exec();

    const enriched = await this.enrichSchedules(allRaw, tenantId);

    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Track first schedule per lease so newly-created leases always show at least their first invoice
    const seenLeaseFirstSchedule = new Set<string>();
    const dueSetIds = new Set<string>();
    enriched.forEach((item) => {
      const due = new Date(item.dueDate);
      const isFirstForLease = item.leaseId && !seenLeaseFirstSchedule.has(String(item.leaseId));
      if (isFirstForLease) {
        seenLeaseFirstSchedule.add(String(item.leaseId));
      }
      if (due <= endOfCurrentMonth || isFirstForLease || (item.paidAmount || 0) > 0) {
        dueSetIds.add(String(item._id));
      }
    });

    // Compute stats across all due-to-date schedules
    let totalInvoicedDue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let unpaidCount = 0;
    let paidThisMonthCount = 0;
    let paidThisMonthAmount = 0;

    enriched.forEach((item) => {
      const isDue = dueSetIds.has(String(item._id));
      if (isDue) {
        totalInvoicedDue += item.amount || 0;
        totalOutstanding += item.balanceDue || 0;
        if (item.status === ScheduleStatus.OVERDUE) {
          overdueCount++;
          overdueAmount += item.balanceDue || 0;
        }
        if (item.status !== ScheduleStatus.PAID) {
          unpaidCount++;
        }
      }
      totalCollected += item.paidAmount || 0;
      if (item.month === currentMonthKey && (item.paidAmount || 0) > 0) {
        if (item.status === ScheduleStatus.PAID) paidThisMonthCount++;
        paidThisMonthAmount += item.paidAmount || 0;
      }
    });

    // Filter items for response
    let filtered = enriched.filter((item) => {
      if (scope === 'due' && !dueSetIds.has(String(item._id))) {
        return false;
      }
      if (options.status && item.status !== options.status) {
        return false;
      }
      if (options.search && options.search.trim()) {
        const q = options.search.trim().toLowerCase();
        const match =
          (item.invoiceNumber || '').toLowerCase().includes(q) ||
          (item.propertyTenantName || '').toLowerCase().includes(q) ||
          (item.propertyName || '').toLowerCase().includes(q) ||
          (item.unitNumber || '').toLowerCase().includes(q) ||
          (item.leaseNumber || '').toLowerCase().includes(q) ||
          (item.monthLabel || '').toLowerCase().includes(q) ||
          (item.month || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Sort: Overdue/Unpaid/Partial due dates most recent first, then Paid
    filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIdx = (page - 1) * limit;
    const data = filtered.slice(startIdx, startIdx + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      stats: {
        totalInvoicedDue,
        totalCollected,
        totalOutstanding,
        overdueCount,
        overdueAmount,
        unpaidCount,
        paidThisMonthCount,
        paidThisMonthAmount,
      },
    };
  }

  async findByLease(tenantId: string, leaseId: string) {
    const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
    return this.enrichSchedules(schedules, tenantId);
  }

  async findByProperty(tenantId: string, propertyId: string) {
    const schedules = await this.scheduleRepository.findByProperty(tenantId, propertyId);
    return this.enrichSchedules(schedules, tenantId);
  }

  async findByUnit(tenantId: string, unitId: string) {
    const schedules = await this.scheduleRepository.findByUnit(tenantId, unitId);
    return this.enrichSchedules(schedules, tenantId);
  }

  async findOverdue(tenantId: string) {
    const schedules = await this.scheduleRepository.findOverdue(tenantId);
    return this.enrichSchedules(schedules, tenantId);
  }

  async getLeaseBalance(tenantId: string, leaseId: string) {
    const totals = await this.scheduleRepository.getTotalByLease(tenantId, leaseId);
    return {
      ...totals,
      balance: Math.max(0, totals.totalDue - totals.totalPaid),
      contractBalance: Math.max(0, (totals.totalContractAmount || totals.totalDue) - totals.totalPaid),
    };
  }

  /**
   * Helper to parse month labels like "May 2026, June 2026" or "2026-05" into ['2026-05', '2026-06']
   */
  private parseTargetMonths(selectedMonths?: string[], paymentPeriod?: string): string[] {
    const result = new Set<string>();
    if (Array.isArray(selectedMonths)) {
      selectedMonths.forEach((m) => {
        if (/^\d{4}-\d{2}$/.test(m.trim())) result.add(m.trim());
      });
    }
    if (paymentPeriod && typeof paymentPeriod === 'string') {
      const parts = paymentPeriod.split(',').map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        if (/^\d{4}-\d{2}$/.test(part)) {
          result.add(part);
        } else {
          const parsed = new Date(`${part} 1`);
          if (!isNaN(parsed.getTime())) {
            const ym = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
            result.add(ym);
          }
        }
      }
    }
    return [...result];
  }

  async recordPayment(
    tenantId: string,
    leaseId: string,
    paymentAmount: number,
    paymentId: string,
    paymentDate: Date,
    paymentMethod: string,
    options?: {
      scheduleId?: string;
      selectedMonths?: string[];
      paymentPeriod?: string;
    },
  ) {
    if (paymentAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    await this.ensureSchedulesForActiveLeases(tenantId);

    let remainingAmount = paymentAmount;
    const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);

    // Sort by dueDate ascending
    schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const targetMonths = this.parseTargetMonths(options?.selectedMonths, options?.paymentPeriod);
    const targetScheduleId = options?.scheduleId ? String(options.scheduleId) : '';

    // Prioritize targeted scheduleId or targeted months first, then FIFO for all other unpaid schedules
    const prioritizedSchedules: any[] = [];
    const remainingSchedules: any[] = [];

    for (const s of schedules) {
      const sid = String(s._id);
      if ((targetScheduleId && sid === targetScheduleId) || (s.month && targetMonths.includes(s.month))) {
        prioritizedSchedules.push(s);
      } else {
        remainingSchedules.push(s);
      }
    }

    const orderedSchedules = [...prioritizedSchedules, ...remainingSchedules];
    const now = new Date();

    for (const schedule of orderedSchedules) {
      if (remainingAmount <= 0) break;

      const amountNeeded = Math.max(0, schedule.amount - (schedule.paidAmount || 0));

      if (amountNeeded > 0) {
        const amountToApply = Math.min(remainingAmount, amountNeeded);
        const updatedPaidAmount = (schedule.paidAmount || 0) + amountToApply;
        let newStatus = schedule.status;

        if (updatedPaidAmount >= schedule.amount) {
          newStatus = ScheduleStatus.PAID;
        } else if (updatedPaidAmount > 0) {
          newStatus =
            schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
              ? ScheduleStatus.OVERDUE
              : ScheduleStatus.PARTIAL;
        } else {
          newStatus = ScheduleStatus.UNPAID;
        }

        const payments = Array.isArray(schedule.payments) ? [...schedule.payments] : [];
        payments.push({
          paymentId,
          amount: amountToApply,
          paymentDate,
          paymentMethod,
        });

        await this.scheduleRepository.update(schedule._id.toString(), {
          paidAmount: updatedPaidAmount,
          status: newStatus,
          payments,
        } as any);

        remainingAmount -= amountToApply;
      }
    }

    // Auto-extend by another 12 months if the tenant just paid the last (or 2nd-to-last) generated month
    await this.extendLeaseSchedulesIfNeeded(tenantId, leaseId);

    // If the payment was larger than the previously generated months (e.g. paying month 5 + month 6 together),
    // apply any remaining amount to the newly generated months
    if (remainingAmount > 0) {
      const refreshedSchedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
      refreshedSchedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      for (const schedule of refreshedSchedules) {
        if (remainingAmount <= 0) break;
        const amountNeeded = Math.max(0, schedule.amount - (schedule.paidAmount || 0));
        if (amountNeeded > 0) {
          const amountToApply = Math.min(remainingAmount, amountNeeded);
          const updatedPaidAmount = (schedule.paidAmount || 0) + amountToApply;
          const newStatus =
            updatedPaidAmount >= schedule.amount ? ScheduleStatus.PAID : ScheduleStatus.PARTIAL;
          const payments = Array.isArray(schedule.payments) ? [...schedule.payments] : [];
          payments.push({
            paymentId,
            amount: amountToApply,
            paymentDate,
            paymentMethod,
          });
          await this.scheduleRepository.update(schedule._id.toString(), {
            paidAmount: updatedPaidAmount,
            status: newStatus,
            payments,
          } as any);
          remainingAmount -= amountToApply;
        }
      }
    }

    return {
      success: true,
      appliedAmount: paymentAmount - remainingAmount,
      overpayment: remainingAmount > 0 ? remainingAmount : 0,
    };
  }

  /**
   * Reverse a payment from rent schedules when a payment is deleted
   */
  async reversePayment(tenantId: string, leaseId: string, paymentId: string, paymentAmount: number) {
    const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
    if (!schedules || schedules.length === 0) return;

    const now = new Date();
    let reversedAny = false;

    for (const schedule of schedules) {
      const payments = Array.isArray(schedule.payments) ? schedule.payments : [];
      const matchingEntries = payments.filter((p) => String(p.paymentId) === String(paymentId));
      if (matchingEntries.length > 0) {
        reversedAny = true;
        const amountToReverse = matchingEntries.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const remainingPayments = payments.filter((p) => String(p.paymentId) !== String(paymentId));
        const updatedPaidAmount = Math.max(0, (schedule.paidAmount || 0) - amountToReverse);

        let newStatus = ScheduleStatus.UNPAID;
        if (updatedPaidAmount >= schedule.amount) {
          newStatus = ScheduleStatus.PAID;
        } else if (updatedPaidAmount > 0) {
          newStatus =
            schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
              ? ScheduleStatus.OVERDUE
              : ScheduleStatus.PARTIAL;
        } else if (schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now) {
          newStatus = ScheduleStatus.OVERDUE;
        }

        await this.scheduleRepository.update(schedule._id.toString(), {
          paidAmount: updatedPaidAmount,
          status: newStatus,
          payments: remainingPayments,
        } as any);
      }
    }

    // Fallback for legacy payments that did not record paymentId inside schedule.payments
    if (!reversedAny && paymentAmount > 0) {
      let toDeduct = paymentAmount;
      const paidSchedules = [...schedules]
        .filter((s) => (s.paidAmount || 0) > 0)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

      for (const schedule of paidSchedules) {
        if (toDeduct <= 0) break;
        const deduct = Math.min(toDeduct, schedule.paidAmount || 0);
        const updatedPaidAmount = Math.max(0, (schedule.paidAmount || 0) - deduct);

        let newStatus = ScheduleStatus.UNPAID;
        if (updatedPaidAmount >= schedule.amount) {
          newStatus = ScheduleStatus.PAID;
        } else if (updatedPaidAmount > 0) {
          newStatus =
            schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
              ? ScheduleStatus.OVERDUE
              : ScheduleStatus.PARTIAL;
        } else if (schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now) {
          newStatus = ScheduleStatus.OVERDUE;
        }

        await this.scheduleRepository.update(schedule._id.toString(), {
          paidAmount: updatedPaidAmount,
          status: newStatus,
        } as any);

        toDeduct -= deduct;
      }
    }
  }

  async sendInvoiceEmail(scheduleId: string, tenantId: string) {
    const raw = await this.scheduleRepository.findById(scheduleId);
    if (!raw || raw.tenantId !== tenantId) {
      throw new NotFoundException('Invoice schedule not found');
    }

    const [invoice] = await this.enrichSchedules([raw], tenantId);
    if (!invoice) {
      throw new NotFoundException('Invoice details could not be loaded');
    }

    const mailCfg = await this.getMailConfig(tenantId);

    // Also fetch all unpaid/overdue schedules up to current month for this lease so the reminder includes total arrears & links
    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    let unpaidLeaseSchedules: any[] = [];
    if (invoice.leaseId) {
      const allLeaseRaw = await this.scheduleRepository.findByLease(tenantId, invoice.leaseId);
      const enrichedLease = await this.enrichSchedules(allLeaseRaw, tenantId);
      unpaidLeaseSchedules = enrichedLease
        .filter(
          (s) =>
            s.status !== ScheduleStatus.PAID &&
            (s.balanceDue || 0) > 0 &&
            (new Date(s.dueDate) <= endOfCurrentMonth || String(s._id) === String(invoice._id)),
        )
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    const totalUnpaidBalance = unpaidLeaseSchedules.reduce((sum, s) => sum + (Number(s.balanceDue) || 0), 0);

    const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const publicPayUrl = `${mailCfg.frontendUrl}/pay/${invoice.publicPayToken}`;
    const isPaid = invoice.status === ScheduleStatus.PAID;

    const arrearsRowsHtml =
      unpaidLeaseSchedules.length > 1
        ? `
          <div style="margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 18px;">
            <h3 style="color: #0f172a; font-size: 14px; margin: 0 0 10px;">Unpaid / Due Months Breakdown (${unpaidLeaseSchedules.length} Months)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #f1f5f9; text-align: left;">
                  <th style="padding: 8px; color: #475569;">Month</th>
                  <th style="padding: 8px; color: #475569;">Invoice</th>
                  <th style="padding: 8px; color: #475569;">Status</th>
                  <th style="padding: 8px; color: #475569; text-align: right;">Due</th>
                  <th style="padding: 8px; color: #475569; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${unpaidLeaseSchedules
                  .map((s) => {
                    const link = `${mailCfg.frontendUrl}/pay/${s.publicPayToken}`;
                    return `<tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 8px; font-weight: 600; color: #1e293b;">${s.monthLabel}</td>
                      <td style="padding: 8px; font-family: monospace; color: #64748b;">${s.invoiceNumber}</td>
                      <td style="padding: 8px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${
                        s.status === 'overdue' ? '#dc2626' : '#d97706'
                      };">${s.status}</td>
                      <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${
                        s.currency
                      } ${Number(s.balanceDue || 0).toLocaleString()}</td>
                      <td style="padding: 8px; text-align: center;">
                        <a href="${link}" style="display: inline-block; padding: 4px 10px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 600;">Pay</a>
                      </td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
              <tfoot>
                <tr style="background: #fef2f2;">
                  <td colspan="3" style="padding: 10px 8px; font-weight: 700; color: #991b1b;">Total Outstanding Balance</td>
                  <td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #dc2626; font-size: 14px;">${
                    invoice.currency
                  } ${totalUnpaidBalance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `
        : '';

    const paymentInstructionsHtml =
      mailCfg.billingSettings.paybillOrTillNumber ||
      mailCfg.billingSettings.bankAccountDetails ||
      mailCfg.billingSettings.paymentInstructions
        ? `
          <div style="margin-top: 18px; background: #f8fafc; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #475569; border: 1px solid #e2e8f0;">
            <strong style="color: #1e293b; display: block; margin-bottom: 4px;">Payment Instructions:</strong>
            ${mailCfg.billingSettings.paybillOrTillNumber ? `<div><strong>Paybill / Till:</strong> ${mailCfg.billingSettings.paybillOrTillNumber}</div>` : ''}
            ${mailCfg.billingSettings.bankAccountDetails ? `<div><strong>Bank Details:</strong> ${mailCfg.billingSettings.bankAccountDetails}</div>` : ''}
            ${mailCfg.billingSettings.paymentInstructions ? `<div style="margin-top: 4px;">${mailCfg.billingSettings.paymentInstructions}</div>` : ''}
          </div>
        `
        : '';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; background: #f8fafc; border-radius: 14px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 50px; height: 50px; background: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
          <h1 style="color: #1e293b; margin-top: 8px; font-size: 22px;">${mailCfg.orgName}</h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">${isPaid ? 'Paid Rent Invoice' : 'Rent Invoice & Payment Statement'} · ${invoice.invoiceNumber}</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #475569;">Dear <strong>${invoice.propertyTenantName || 'Valued Tenant'}</strong>,</p>
          <p style="color: #475569;">Below is your rent invoice summary for <strong>${invoice.monthLabel}</strong>:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 8px; color: #64748b;">Invoice No</td><td style="padding: 8px; font-weight: 600; font-family: monospace;">${invoice.invoiceNumber}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Property / Unit</td><td style="padding: 8px; font-weight: 600;">${invoice.propertyName || '–'} ${invoice.unitNumber ? `(Unit ${invoice.unitNumber})` : ''}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Lease No</td><td style="padding: 8px;">${invoice.leaseNumber || '–'}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Billing Period</td><td style="padding: 8px; font-weight: 600;">${invoice.monthLabel}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Due Date</td><td style="padding: 8px;">${dueDateStr}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Invoice Amount</td><td style="padding: 8px; font-weight: 600;">${invoice.currency} ${Number(invoice.amount || 0).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Amount Paid</td><td style="padding: 8px; color: #059669; font-weight: 600;">${invoice.currency} ${Number(invoice.paidAmount || 0).toLocaleString()}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #1e293b; font-weight: 700;">Balance Due (${invoice.monthLabel})</td><td style="padding: 8px; font-weight: 700; color: ${invoice.balanceDue > 0 ? '#dc2626' : '#059669'};">${invoice.currency} ${Number(invoice.balanceDue || 0).toLocaleString()}</td></tr>
          </table>
          ${
            invoice.balanceDue > 0
              ? `<div style="text-align: center; margin: 24px 0 8px;">
                  <a href="${publicPayUrl}" style="display: inline-block; padding: 13px 32px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Pay ${invoice.monthLabel} Invoice Now (No Login Required)</a>
                  <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Instant M-Pesa STK Push or Manual Reference: <a href="${publicPayUrl}" style="color: #059669;">${publicPayUrl}</a></p>
                </div>`
              : `<div style="text-align: center; margin-top: 16px;">
                  <p style="color: #059669; font-weight: 600;">✓ This invoice has been paid in full. Thank you!</p>
                  <a href="${publicPayUrl}" style="display: inline-block; margin-top: 8px; padding: 10px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">View Official Receipt</a>
                </div>`
          }
          ${arrearsRowsHtml}
          ${paymentInstructionsHtml}
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} ${mailCfg.orgName}. All rights reserved.</p>
      </div>`;

    const notifiedTargets: string[] = [];

    if (invoice.propertyTenantEmail) {
      await mailCfg.transporter.sendMail({
        from: mailCfg.fromHeader,
        to: invoice.propertyTenantEmail,
        subject: `${isPaid ? 'Paid Rent Invoice' : 'Rent Invoice & Payment Link'} – ${invoice.invoiceNumber} (${invoice.monthLabel})`,
        html: htmlBody,
      });
      notifiedTargets.push(invoice.propertyTenantEmail);
    }

    // Also notify configured admin notificationEmails if enabled
    if (mailCfg.adminEmails.length > 0 && mailCfg.preferences.emailAdminsOnOverdue !== false) {
      const adminTargets = mailCfg.adminEmails.filter((e) => e !== (invoice.propertyTenantEmail || '').toLowerCase());
      if (adminTargets.length > 0) {
        try {
          await mailCfg.transporter.sendMail({
            from: mailCfg.fromHeader,
            to: adminTargets.join(', '),
            subject: `[Admin Copy] Invoice Reminder Sent – ${invoice.propertyTenantName || 'Tenant'} (${invoice.unitNumber ? `Unit ${invoice.unitNumber}` : invoice.propertyName})`,
            html: htmlBody,
          });
          notifiedTargets.push(...adminTargets);
        } catch (err) {
          console.error('Failed to send admin copy of invoice email:', err.message);
        }
      }
    }

    if (notifiedTargets.length === 0) {
      throw new NotFoundException(
        'neither the tenant email nor organization notification emails are configured',
      );
    }

    return {
      message: `Invoice ${invoice.invoiceNumber} sent to ${notifiedTargets.join(', ')}`,
      publicPayUrl,
    };
  }

  /**
   * Send an itemized payment reminder to a specific PropertyTenant including all unpaid/overdue months and their /pay/:token links
   */
  async sendTenantReminderWithLinks(propertyTenantId: string, tenantId: string) {
    await this.ensureSchedulesForActiveLeases(tenantId);

    const pt = await this.propertyTenantModel
      .findOne({ _id: propertyTenantId, tenantId, isDeleted: false })
      .lean()
      .exec();
    if (!pt) {
      throw new NotFoundException('Tenant not found');
    }

    const leases = await this.leaseModel
      .find({ tenantId, propertyTenantId, isDeleted: false })
      .lean()
      .exec();
    const leaseIds = leases.map((l) => String(l._id));

    const allSchedulesRaw = leaseIds.length
      ? await (this.scheduleRepository as any).model
          .find({ tenantId, leaseId: { $in: leaseIds }, isDeleted: false })
          .sort({ dueDate: 1 })
          .lean()
          .exec()
      : [];

    const enriched = await this.enrichSchedules(allSchedulesRaw, tenantId);
    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let dueUnpaid = enriched.filter(
      (s) => s.status !== ScheduleStatus.PAID && (s.balanceDue || 0) > 0 && new Date(s.dueDate) <= endOfCurrentMonth,
    );
    if (dueUnpaid.length === 0) {
      // Fallback to earliest upcoming unpaid schedule so reminder always has a valid payment link
      const nextUnpaid = enriched.find((s) => s.status !== ScheduleStatus.PAID && (s.balanceDue || 0) > 0);
      if (nextUnpaid) dueUnpaid = [nextUnpaid];
    }

    if (dueUnpaid.length > 0) {
      // Delegate to sendInvoiceEmail using the primary/current unpaid month so it sends the full itemized breakdown
      const primarySchedule = dueUnpaid[dueUnpaid.length - 1];
      return this.sendInvoiceEmail(String(primarySchedule._id), tenantId);
    }

    throw new BadRequestException('This tenant has no unpaid or upcoming invoices.');
  }

  /**
   * Send bulk reminders for all overdue or due-this-month invoices to tenants + send a summary digest to admin notificationEmails
   */
  async sendBulkReminders(tenantId: string, mode: 'overdue' | 'all_due' = 'all_due') {
    await this.ensureSchedulesForActiveLeases(tenantId);
    const mailCfg = await this.getMailConfig(tenantId);

    const allRaw = await (this.scheduleRepository as any).model
      .find({ tenantId, isDeleted: false })
      .sort({ dueDate: 1 })
      .lean()
      .exec();
    const enriched = await this.enrichSchedules(allRaw, tenantId);

    const now = new Date();
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const targetSchedules = enriched.filter((s) => {
      if (s.status === ScheduleStatus.PAID || (s.balanceDue || 0) <= 0) return false;
      if (mode === 'overdue') {
        return s.status === ScheduleStatus.OVERDUE;
      }
      return new Date(s.dueDate) <= endOfCurrentMonth;
    });

    // Group by leaseId so each tenant receives one clean consolidated email with all their unpaid months
    const byLease = new Map<string, any[]>();
    for (const s of targetSchedules) {
      const key = String(s.leaseId || s._id);
      if (!byLease.has(key)) byLease.set(key, []);
      byLease.get(key)!.push(s);
    }

    let tenantsEmailed = 0;
    let totalDueAmount = 0;
    const summaryRows: {
      tenantName: string;
      tenantEmail: string;
      propertyUnit: string;
      monthsText: string;
      totalDue: number;
      currency: string;
      payLink: string;
    }[] = [];

    for (const [, schedules] of byLease.entries()) {
      schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      const latestDue = schedules[schedules.length - 1];
      const leaseTotalDue = schedules.reduce((sum, x) => sum + (Number(x.balanceDue) || 0), 0);
      totalDueAmount += leaseTotalDue;
      const primaryPayLink = `${mailCfg.frontendUrl}/pay/${latestDue.publicPayToken}`;

      summaryRows.push({
        tenantName: latestDue.propertyTenantName || 'Tenant',
        tenantEmail: latestDue.propertyTenantEmail || 'No email',
        propertyUnit: `${latestDue.propertyName || ''} ${latestDue.unitNumber ? `(Unit ${latestDue.unitNumber})` : ''}`.trim(),
        monthsText: schedules.map((x) => x.monthLabel).join(', '),
        totalDue: leaseTotalDue,
        currency: latestDue.currency || 'KES',
        payLink: primaryPayLink,
      });

      if (latestDue.propertyTenantEmail && mailCfg.preferences.emailTenantOnInvoiceDue !== false) {
        try {
          await mailCfg.transporter.sendMail({
            from: mailCfg.fromHeader,
            to: latestDue.propertyTenantEmail,
            subject: `Rent Payment Reminder (${schedules.length} Unpaid ${schedules.length === 1 ? 'Month' : 'Months'}) – ${mailCfg.orgName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; background: #f8fafc; border-radius: 14px;">
                <div style="text-align: center; margin-bottom: 22px;">
                  <div style="display: inline-block; width: 48px; height: 48px; background: #059669; border-radius: 12px; line-height: 48px; color: white; font-size: 22px;">🏠</div>
                  <h2 style="color: #0f172a; margin: 10px 0 4px;">Rent Payment Reminder</h2>
                  <p style="color: #64748b; font-size: 13px; margin: 0;">${mailCfg.orgName}</p>
                </div>
                <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
                  <p style="color: #334155;">Dear <strong>${latestDue.propertyTenantName || 'Valued Tenant'}</strong>,</p>
                  <p style="color: #475569; font-size: 14px;">This is a friendly reminder regarding your outstanding rent balance for <strong>${latestDue.propertyName || ''} ${latestDue.unitNumber ? `(Unit ${latestDue.unitNumber})` : ''}</strong>:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
                    <thead>
                      <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 8px;">Month</th>
                        <th style="padding: 8px;">Invoice</th>
                        <th style="padding: 8px;">Status</th>
                        <th style="padding: 8px; text-align: right;">Balance Due</th>
                        <th style="padding: 8px; text-align: center;">Pay Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${schedules
                        .map((s) => {
                          const link = `${mailCfg.frontendUrl}/pay/${s.publicPayToken}`;
                          return `<tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px; font-weight: 600;">${s.monthLabel}</td>
                            <td style="padding: 8px; font-family: monospace; color: #64748b;">${s.invoiceNumber}</td>
                            <td style="padding: 8px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${
                              s.status === 'overdue' ? '#dc2626' : '#d97706'
                            };">${s.status}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${
                              s.currency
                            } ${Number(s.balanceDue || 0).toLocaleString()}</td>
                            <td style="padding: 8px; text-align: center;">
                              <a href="${link}" style="display: inline-block; padding: 5px 12px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 600;">Pay Now</a>
                            </td>
                          </tr>`;
                        })
                        .join('')}
                    </tbody>
                    <tfoot>
                      <tr style="background: #fef2f2;">
                        <td colspan="3" style="padding: 10px 8px; font-weight: 700; color: #991b1b;">Total Amount Due</td>
                        <td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #dc2626; font-size: 15px;">${
                          latestDue.currency
                        } ${leaseTotalDue.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style="text-align: center; margin: 24px 0 8px;">
                    <a href="${primaryPayLink}" style="display: inline-block; padding: 13px 32px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Pay Online Now (M-Pesa STK / Manual Ref)</a>
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">No login required · Direct Link: <a href="${primaryPayLink}" style="color: #059669;">${primaryPayLink}</a></p>
                  </div>
                </div>
              </div>
            `,
          });
          tenantsEmailed++;
        } catch (err) {
          console.error(`Failed to email tenant ${latestDue.propertyTenantEmail}:`, err.message);
        }
      }
    }

    // Send consolidated digest to all configured admin notificationEmails
    let adminsNotified = 0;
    if (mailCfg.adminEmails.length > 0 && summaryRows.length > 0) {
      try {
        await mailCfg.transporter.sendMail({
          from: mailCfg.fromHeader,
          to: mailCfg.adminEmails.join(', '),
          subject: `[Admin Alert] ${summaryRows.length} Due/Overdue Tenant Accounts (KES ${totalDueAmount.toLocaleString()}) – ${mailCfg.orgName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 28px; background: #f8fafc; border-radius: 14px;">
              <h2 style="color: #0f172a; margin-top: 0;">Due & Overdue Rent Digest – ${mailCfg.orgName}</h2>
              <p style="color: #475569; font-size: 14px;">
                <strong>${tenantsEmailed}</strong> tenant reminder email(s) were dispatched. Total outstanding across <strong>${summaryRows.length}</strong> active lease(s):
                <strong style="color: #dc2626;">KES ${totalDueAmount.toLocaleString()}</strong>.
              </p>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; font-size: 12px; border: 1px solid #e2e8f0;">
                <thead>
                  <tr style="background: #0f172a; color: white; text-align: left;">
                    <th style="padding: 10px 8px;">Tenant</th>
                    <th style="padding: 10px 8px;">Property / Unit</th>
                    <th style="padding: 10px 8px;">Unpaid Months</th>
                    <th style="padding: 10px 8px; text-align: right;">Total Due</th>
                    <th style="padding: 10px 8px; text-align: center;">Public Link</th>
                  </tr>
                </thead>
                <tbody>
                  ${summaryRows
                    .map(
                      (r) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px;"><strong>${r.tenantName}</strong><br/><span style="color:#64748b;">${r.tenantEmail}</span></td>
                      <td style="padding: 8px;">${r.propertyUnit}</td>
                      <td style="padding: 8px; color: #475569;">${r.monthsText}</td>
                      <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${r.currency} ${r.totalDue.toLocaleString()}</td>
                      <td style="padding: 8px; text-align: center;"><a href="${r.payLink}" style="color: #059669; font-weight: 600;">Open Link</a></td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `,
        });
        adminsNotified = mailCfg.adminEmails.length;
      } catch (err) {
        console.error('Failed to send admin digest email:', err.message);
      }
    }

    return {
      tenantsEmailed,
      adminsNotified,
      accountsCount: summaryRows.length,
      totalDueAmount,
      message: `Sent itemized payment reminders to ${tenantsEmailed} tenant(s)${
        adminsNotified > 0 ? ` and notified ${adminsNotified} admin email(s)` : ''
      }.`,
    };
  }

  async updateScheduleStatus(scheduleId: string, tenantId: string) {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      throw new NotFoundException('Schedule not found');
    }

    let status = ScheduleStatus.UNPAID;
    if (schedule.paidAmount >= schedule.amount) {
      status = ScheduleStatus.PAID;
    } else if (schedule.paidAmount > 0) {
      status = ScheduleStatus.PARTIAL;
    }

    const now = new Date();
    if (status !== ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
      status = ScheduleStatus.OVERDUE;
    }

    return this.scheduleRepository.update(scheduleId, { status } as any);
  }

  async delete(scheduleId: string, tenantId: string) {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule || schedule.tenantId !== tenantId) {
      throw new NotFoundException('Schedule not found');
    }
    return this.scheduleRepository.delete(scheduleId);
  }

  async cancelFutureSchedulesForLease(tenantId: string, leaseId: string, terminationDate = new Date()) {
    await this.scheduleRepository.cancelFutureUnpaidByLease(tenantId, leaseId, terminationDate);
  }

  async deleteSchedulesForLease(tenantId: string, leaseId: string) {
    await this.scheduleRepository.deleteAllByLease(tenantId, leaseId);
  }
}
