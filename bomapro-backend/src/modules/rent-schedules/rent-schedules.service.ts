import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';
import { ScheduleStatus } from './schemas/rent-schedule.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
import { Unit } from '../units/schemas/unit.schema';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';

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
  ) {}

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

      return {
        ...s,
        invoiceNumber,
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
    if (!invoice || !invoice.propertyTenantEmail) {
      throw new NotFoundException('Tenant email address not found for this invoice');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const portalUrl = process.env.TENANT_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:4200';
    const isPaid = invoice.status === ScheduleStatus.PAID;

    await transporter.sendMail({
      from: `"Bomapro" <${process.env.SMTP_USER}>`,
      to: invoice.propertyTenantEmail,
      subject: `${isPaid ? 'Paid Rent Invoice' : 'Rent Invoice'} – ${invoice.invoiceNumber} (${invoice.monthLabel})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: #059669; border-radius: 12px; line-height: 50px; color: white; font-size: 22px;">🏠</div>
            <h1 style="color: #1e293b; margin-top: 8px; font-size: 22px;">Rent Invoice</h1>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">${invoice.invoiceNumber} · ${invoice.monthLabel}</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="color: #475569;">Dear <strong>${invoice.propertyTenantName || 'Tenant'}</strong>,</p>
            <p style="color: #475569;">Below is your rent invoice summary for <strong>${invoice.monthLabel}</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #64748b;">Invoice No</td><td style="padding: 8px; font-weight: 600; font-family: monospace;">${invoice.invoiceNumber}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Property / Unit</td><td style="padding: 8px; font-weight: 600;">${invoice.propertyName || '–'} ${invoice.unitNumber ? `(Unit ${invoice.unitNumber})` : ''}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">Lease No</td><td style="padding: 8px;">${invoice.leaseNumber || '–'}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Billing Period</td><td style="padding: 8px;">${invoice.monthLabel}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">Due Date</td><td style="padding: 8px;">${dueDateStr}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Invoice Amount</td><td style="padding: 8px; font-weight: 600;">${invoice.currency} ${Number(invoice.amount || 0).toLocaleString()}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;">Amount Paid</td><td style="padding: 8px; color: #059669; font-weight: 600;">${invoice.currency} ${Number(invoice.paidAmount || 0).toLocaleString()}</td></tr>
              <tr style="background:#f8fafc;"><td style="padding: 8px; color: #1e293b; font-weight: 700;">Balance Due</td><td style="padding: 8px; font-weight: 700; color: ${invoice.balanceDue > 0 ? '#dc2626' : '#059669'};">${invoice.currency} ${Number(invoice.balanceDue || 0).toLocaleString()}</td></tr>
            </table>
            ${
              invoice.balanceDue > 0
                ? `<div style="text-align: center; margin: 24px 0 8px;">
                    <a href="${portalUrl}/tenant-portal/payments" style="display: inline-block; padding: 12px 32px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Pay Online Now</a>
                  </div>`
                : `<p style="text-align: center; color: #059669; font-weight: 600; margin-top: 16px;">✓ This invoice has been paid in full. Thank you!</p>`
            }
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
    });

    return { message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.propertyTenantEmail}` };
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
