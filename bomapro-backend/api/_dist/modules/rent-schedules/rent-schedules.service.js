"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const nodemailer = require("nodemailer");
const rent_schedule_repository_1 = require("./repositories/rent-schedule.repository");
const rent_schedule_schema_1 = require("./schemas/rent-schedule.schema");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
let RentSchedulesService = class RentSchedulesService {
    constructor(scheduleRepository, leaseModel, propertyModel, unitModel, propertyTenantModel) {
        this.scheduleRepository = scheduleRepository;
        this.leaseModel = leaseModel;
        this.propertyModel = propertyModel;
        this.unitModel = unitModel;
        this.propertyTenantModel = propertyTenantModel;
    }
    async createSchedule(dto) {
        const dueWithGracePeriodDate = new Date(dto.dueDate);
        dueWithGracePeriodDate.setDate(dueWithGracePeriodDate.getDate() + (dto.gracePeriodDays || 5));
        return this.scheduleRepository.create({
            ...dto,
            paidAmount: 0,
            status: rent_schedule_schema_1.ScheduleStatus.UNPAID,
            dueWithGracePeriodDate,
        });
    }
    async generateSchedulesForLease(leaseId, tenantId, propertyId, unitId, startDate, rentAmount, gracePeriodDays = 5, months = 12) {
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
    async ensureSchedulesForActiveLeases(tenantId) {
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
                    const months = Math.max(12, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
                    const firstDue = new Date(start.getFullYear(), start.getMonth(), lease.paymentDueDay || 5);
                    await this.generateSchedulesForLease(leaseId, tenantId, lease.propertyId || '', lease.unitId || '', firstDue, lease.rentAmount || 0, lease.gracePeriodDays || 5, months);
                }
                else {
                    await this.extendLeaseSchedulesIfNeeded(tenantId, lease, existing);
                }
            }
        }
        catch (error) {
            console.error('Error ensuring schedules for active leases:', error.message);
        }
    }
    async extendLeaseSchedulesIfNeeded(tenantId, leaseOrId, existingSchedules) {
        try {
            const lease = typeof leaseOrId === 'string'
                ? await this.leaseModel.findById(leaseOrId).lean().exec()
                : leaseOrId;
            if (!lease || lease.status !== 'active' || lease.isDeleted)
                return;
            const leaseId = String(lease._id);
            const schedules = existingSchedules || (await this.scheduleRepository.findByLease(tenantId, leaseId));
            if (!schedules || schedules.length === 0)
                return;
            const sorted = [...schedules].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            const unpaidRemaining = sorted.filter((s) => (Number(s.paidAmount) || 0) < (Number(s.amount) || 0));
            if (unpaidRemaining.length <= 1) {
                const lastSchedule = sorted[sorted.length - 1];
                const lastDue = new Date(lastSchedule.dueDate);
                const dueDay = lease.paymentDueDay || lastDue.getDate() || 5;
                const nextStart = new Date(lastDue.getFullYear(), lastDue.getMonth() + 1, dueDay);
                const extensionMonths = 12;
                const existingMonthSet = new Set(sorted.map((s) => s.month).filter(Boolean));
                let lastCreatedDue = lastDue;
                for (let i = 0; i < extensionMonths; i++) {
                    const dueDate = new Date(nextStart.getFullYear(), nextStart.getMonth() + i, dueDay);
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
                const newEndDate = new Date(lastCreatedDue.getFullYear(), lastCreatedDue.getMonth() + 1, lastCreatedDue.getDate());
                if (!lease.endDate || new Date(lease.endDate) < newEndDate) {
                    await this.leaseModel.findByIdAndUpdate(leaseId, { endDate: newEndDate });
                }
            }
        }
        catch (error) {
            console.error('Error auto-extending lease schedules:', error.message);
        }
    }
    async enrichSchedules(schedules, tenantId) {
        if (!schedules || schedules.length === 0)
            return [];
        const plainList = schedules.map((s) => (typeof s.toObject === 'function' ? s.toObject() : { ...s }));
        const leaseIds = [...new Set(plainList.map((s) => s.leaseId).filter(Boolean))];
        const leases = leaseIds.length
            ? await this.leaseModel.find({ _id: { $in: leaseIds } }).lean().exec()
            : [];
        const leaseMap = new Map();
        leases.forEach((l) => leaseMap.set(String(l._id), l));
        const propertyIds = [
            ...new Set([
                ...plainList.map((s) => s.propertyId).filter(Boolean),
                ...leases.map((l) => l.propertyId).filter(Boolean),
            ]),
        ];
        const unitIds = [
            ...new Set([
                ...plainList.map((s) => s.unitId).filter(Boolean),
                ...leases.map((l) => l.unitId).filter(Boolean),
            ]),
        ];
        const propertyTenantIds = [
            ...new Set(leases.map((l) => l.propertyTenantId).filter(Boolean)),
        ];
        const [properties, units, propertyTenants] = await Promise.all([
            propertyIds.length ? this.propertyModel.find({ _id: { $in: propertyIds } }).lean().exec() : [],
            unitIds.length ? this.unitModel.find({ _id: { $in: unitIds } }).lean().exec() : [],
            propertyTenantIds.length
                ? this.propertyTenantModel.find({ _id: { $in: propertyTenantIds } }).lean().exec()
                : [],
        ]);
        const propMap = new Map();
        properties.forEach((p) => propMap.set(String(p._id), p));
        const unitMap = new Map();
        units.forEach((u) => unitMap.set(String(u._id), u));
        const ptMap = new Map();
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
            let computedStatus = s.status || rent_schedule_schema_1.ScheduleStatus.UNPAID;
            if (paidAmount >= amount && amount > 0) {
                computedStatus = rent_schedule_schema_1.ScheduleStatus.PAID;
            }
            else if (paidAmount > 0 && paidAmount < amount) {
                computedStatus =
                    s.dueWithGracePeriodDate && new Date(s.dueWithGracePeriodDate) < now
                        ? rent_schedule_schema_1.ScheduleStatus.OVERDUE
                        : rent_schedule_schema_1.ScheduleStatus.PARTIAL;
            }
            else if (s.dueWithGracePeriodDate && new Date(s.dueWithGracePeriodDate) < now) {
                computedStatus = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
            }
            else {
                computedStatus = rent_schedule_schema_1.ScheduleStatus.UNPAID;
            }
            const monthStr = s.month ||
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
    async findAll(tenantId, options = {}) {
        await this.ensureSchedulesForActiveLeases(tenantId);
        const page = Math.max(1, Number(options.page) || 1);
        const limit = Math.max(1, Number(options.limit) || 50);
        const scope = options.scope || 'due';
        const rawFilter = { tenantId, isDeleted: false };
        if (options.propertyId)
            rawFilter.propertyId = options.propertyId;
        if (options.leaseId)
            rawFilter.leaseId = options.leaseId;
        if (options.month)
            rawFilter.month = options.month;
        const allRaw = await this.scheduleRepository.model
            .find(rawFilter)
            .sort({ dueDate: 1 })
            .lean()
            .exec();
        const enriched = await this.enrichSchedules(allRaw, tenantId);
        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const seenLeaseFirstSchedule = new Set();
        const dueSetIds = new Set();
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
                if (item.status === rent_schedule_schema_1.ScheduleStatus.OVERDUE) {
                    overdueCount++;
                    overdueAmount += item.balanceDue || 0;
                }
                if (item.status !== rent_schedule_schema_1.ScheduleStatus.PAID) {
                    unpaidCount++;
                }
            }
            totalCollected += item.paidAmount || 0;
            if (item.month === currentMonthKey && (item.paidAmount || 0) > 0) {
                if (item.status === rent_schedule_schema_1.ScheduleStatus.PAID)
                    paidThisMonthCount++;
                paidThisMonthAmount += item.paidAmount || 0;
            }
        });
        let filtered = enriched.filter((item) => {
            if (scope === 'due' && !dueSetIds.has(String(item._id))) {
                return false;
            }
            if (options.status && item.status !== options.status) {
                return false;
            }
            if (options.search && options.search.trim()) {
                const q = options.search.trim().toLowerCase();
                const match = (item.invoiceNumber || '').toLowerCase().includes(q) ||
                    (item.propertyTenantName || '').toLowerCase().includes(q) ||
                    (item.propertyName || '').toLowerCase().includes(q) ||
                    (item.unitNumber || '').toLowerCase().includes(q) ||
                    (item.leaseNumber || '').toLowerCase().includes(q) ||
                    (item.monthLabel || '').toLowerCase().includes(q) ||
                    (item.month || '').toLowerCase().includes(q);
                if (!match)
                    return false;
            }
            return true;
        });
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
    async findByLease(tenantId, leaseId) {
        const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
        return this.enrichSchedules(schedules, tenantId);
    }
    async findByProperty(tenantId, propertyId) {
        const schedules = await this.scheduleRepository.findByProperty(tenantId, propertyId);
        return this.enrichSchedules(schedules, tenantId);
    }
    async findByUnit(tenantId, unitId) {
        const schedules = await this.scheduleRepository.findByUnit(tenantId, unitId);
        return this.enrichSchedules(schedules, tenantId);
    }
    async findOverdue(tenantId) {
        const schedules = await this.scheduleRepository.findOverdue(tenantId);
        return this.enrichSchedules(schedules, tenantId);
    }
    async getLeaseBalance(tenantId, leaseId) {
        const totals = await this.scheduleRepository.getTotalByLease(tenantId, leaseId);
        return {
            ...totals,
            balance: Math.max(0, totals.totalDue - totals.totalPaid),
            contractBalance: Math.max(0, (totals.totalContractAmount || totals.totalDue) - totals.totalPaid),
        };
    }
    parseTargetMonths(selectedMonths, paymentPeriod) {
        const result = new Set();
        if (Array.isArray(selectedMonths)) {
            selectedMonths.forEach((m) => {
                if (/^\d{4}-\d{2}$/.test(m.trim()))
                    result.add(m.trim());
            });
        }
        if (paymentPeriod && typeof paymentPeriod === 'string') {
            const parts = paymentPeriod.split(',').map((p) => p.trim()).filter(Boolean);
            for (const part of parts) {
                if (/^\d{4}-\d{2}$/.test(part)) {
                    result.add(part);
                }
                else {
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
    async recordPayment(tenantId, leaseId, paymentAmount, paymentId, paymentDate, paymentMethod, options) {
        if (paymentAmount <= 0) {
            throw new common_1.BadRequestException('Payment amount must be greater than 0');
        }
        await this.ensureSchedulesForActiveLeases(tenantId);
        let remainingAmount = paymentAmount;
        const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
        schedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const targetMonths = this.parseTargetMonths(options?.selectedMonths, options?.paymentPeriod);
        const targetScheduleId = options?.scheduleId ? String(options.scheduleId) : '';
        const prioritizedSchedules = [];
        const remainingSchedules = [];
        for (const s of schedules) {
            const sid = String(s._id);
            if ((targetScheduleId && sid === targetScheduleId) || (s.month && targetMonths.includes(s.month))) {
                prioritizedSchedules.push(s);
            }
            else {
                remainingSchedules.push(s);
            }
        }
        const orderedSchedules = [...prioritizedSchedules, ...remainingSchedules];
        const now = new Date();
        for (const schedule of orderedSchedules) {
            if (remainingAmount <= 0)
                break;
            const amountNeeded = Math.max(0, schedule.amount - (schedule.paidAmount || 0));
            if (amountNeeded > 0) {
                const amountToApply = Math.min(remainingAmount, amountNeeded);
                const updatedPaidAmount = (schedule.paidAmount || 0) + amountToApply;
                let newStatus = schedule.status;
                if (updatedPaidAmount >= schedule.amount) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.PAID;
                }
                else if (updatedPaidAmount > 0) {
                    newStatus =
                        schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
                            ? rent_schedule_schema_1.ScheduleStatus.OVERDUE
                            : rent_schedule_schema_1.ScheduleStatus.PARTIAL;
                }
                else {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.UNPAID;
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
                });
                remainingAmount -= amountToApply;
            }
        }
        await this.extendLeaseSchedulesIfNeeded(tenantId, leaseId);
        if (remainingAmount > 0) {
            const refreshedSchedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
            refreshedSchedules.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            for (const schedule of refreshedSchedules) {
                if (remainingAmount <= 0)
                    break;
                const amountNeeded = Math.max(0, schedule.amount - (schedule.paidAmount || 0));
                if (amountNeeded > 0) {
                    const amountToApply = Math.min(remainingAmount, amountNeeded);
                    const updatedPaidAmount = (schedule.paidAmount || 0) + amountToApply;
                    const newStatus = updatedPaidAmount >= schedule.amount ? rent_schedule_schema_1.ScheduleStatus.PAID : rent_schedule_schema_1.ScheduleStatus.PARTIAL;
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
                    });
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
    async reversePayment(tenantId, leaseId, paymentId, paymentAmount) {
        const schedules = await this.scheduleRepository.findByLease(tenantId, leaseId);
        if (!schedules || schedules.length === 0)
            return;
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
                let newStatus = rent_schedule_schema_1.ScheduleStatus.UNPAID;
                if (updatedPaidAmount >= schedule.amount) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.PAID;
                }
                else if (updatedPaidAmount > 0) {
                    newStatus =
                        schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
                            ? rent_schedule_schema_1.ScheduleStatus.OVERDUE
                            : rent_schedule_schema_1.ScheduleStatus.PARTIAL;
                }
                else if (schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
                }
                await this.scheduleRepository.update(schedule._id.toString(), {
                    paidAmount: updatedPaidAmount,
                    status: newStatus,
                    payments: remainingPayments,
                });
            }
        }
        if (!reversedAny && paymentAmount > 0) {
            let toDeduct = paymentAmount;
            const paidSchedules = [...schedules]
                .filter((s) => (s.paidAmount || 0) > 0)
                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
            for (const schedule of paidSchedules) {
                if (toDeduct <= 0)
                    break;
                const deduct = Math.min(toDeduct, schedule.paidAmount || 0);
                const updatedPaidAmount = Math.max(0, (schedule.paidAmount || 0) - deduct);
                let newStatus = rent_schedule_schema_1.ScheduleStatus.UNPAID;
                if (updatedPaidAmount >= schedule.amount) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.PAID;
                }
                else if (updatedPaidAmount > 0) {
                    newStatus =
                        schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now
                            ? rent_schedule_schema_1.ScheduleStatus.OVERDUE
                            : rent_schedule_schema_1.ScheduleStatus.PARTIAL;
                }
                else if (schedule.dueWithGracePeriodDate && new Date(schedule.dueWithGracePeriodDate) < now) {
                    newStatus = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
                }
                await this.scheduleRepository.update(schedule._id.toString(), {
                    paidAmount: updatedPaidAmount,
                    status: newStatus,
                });
                toDeduct -= deduct;
            }
        }
    }
    async sendInvoiceEmail(scheduleId, tenantId) {
        const raw = await this.scheduleRepository.findById(scheduleId);
        if (!raw || raw.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Invoice schedule not found');
        }
        const [invoice] = await this.enrichSchedules([raw], tenantId);
        if (!invoice || !invoice.propertyTenantEmail) {
            throw new common_1.NotFoundException('Tenant email address not found for this invoice');
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
        const isPaid = invoice.status === rent_schedule_schema_1.ScheduleStatus.PAID;
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
            ${invoice.balanceDue > 0
                ? `<div style="text-align: center; margin: 24px 0 8px;">
                    <a href="${portalUrl}/tenant-portal/payments" style="display: inline-block; padding: 12px 32px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Pay Online Now</a>
                  </div>`
                : `<p style="text-align: center; color: #059669; font-weight: 600; margin-top: 16px;">✓ This invoice has been paid in full. Thank you!</p>`}
          </div>
          <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} Bomapro. All rights reserved.</p>
        </div>`,
        });
        return { message: `Invoice ${invoice.invoiceNumber} sent to ${invoice.propertyTenantEmail}` };
    }
    async updateScheduleStatus(scheduleId, tenantId) {
        const schedule = await this.scheduleRepository.findById(scheduleId);
        if (!schedule || schedule.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        let status = rent_schedule_schema_1.ScheduleStatus.UNPAID;
        if (schedule.paidAmount >= schedule.amount) {
            status = rent_schedule_schema_1.ScheduleStatus.PAID;
        }
        else if (schedule.paidAmount > 0) {
            status = rent_schedule_schema_1.ScheduleStatus.PARTIAL;
        }
        const now = new Date();
        if (status !== rent_schedule_schema_1.ScheduleStatus.PAID && schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now) {
            status = rent_schedule_schema_1.ScheduleStatus.OVERDUE;
        }
        return this.scheduleRepository.update(scheduleId, { status });
    }
    async delete(scheduleId, tenantId) {
        const schedule = await this.scheduleRepository.findById(scheduleId);
        if (!schedule || schedule.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Schedule not found');
        }
        return this.scheduleRepository.delete(scheduleId);
    }
    async cancelFutureSchedulesForLease(tenantId, leaseId, terminationDate = new Date()) {
        await this.scheduleRepository.cancelFutureUnpaidByLease(tenantId, leaseId, terminationDate);
    }
    async deleteSchedulesForLease(tenantId, leaseId) {
        await this.scheduleRepository.deleteAllByLease(tenantId, leaseId);
    }
};
exports.RentSchedulesService = RentSchedulesService;
exports.RentSchedulesService = RentSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(lease_schema_1.Lease.name)),
    __param(2, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(3, (0, mongoose_1.InjectModel)(unit_schema_1.Unit.name)),
    __param(4, (0, mongoose_1.InjectModel)(property_tenant_schema_1.PropertyTenant.name)),
    __metadata("design:paramtypes", [rent_schedule_repository_1.RentScheduleRepository,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], RentSchedulesService);
//# sourceMappingURL=rent-schedules.service.js.map