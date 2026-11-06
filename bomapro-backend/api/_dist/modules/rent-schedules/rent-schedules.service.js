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
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rent_schedule_repository_1 = require("./repositories/rent-schedule.repository");
const rent_schedule_schema_1 = require("./schemas/rent-schedule.schema");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
let RentSchedulesService = class RentSchedulesService {
    constructor(scheduleRepository, leaseModel, propertyModel, unitModel, propertyTenantModel, tenantModel) {
        this.scheduleRepository = scheduleRepository;
        this.leaseModel = leaseModel;
        this.propertyModel = propertyModel;
        this.unitModel = unitModel;
        this.propertyTenantModel = propertyTenantModel;
        this.tenantModel = tenantModel;
    }
    async getMailConfig(tenantId) {
        let org = null;
        if (tenantId) {
            try {
                org = await this.tenantModel.findById(tenantId).lean().exec();
            }
            catch { }
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
        const rawFrontendUrl = (preferences.publicPortalUrl || '').trim() ||
            process.env.FRONTEND_URL ||
            'https://ecommerse.lumina360.tech';
        const frontendUrl = rawFrontendUrl.replace(/\/$/, '');
        const adminEmails = [
            ...new Set([
                ...(Array.isArray(org?.notificationEmails) ? org.notificationEmails : []),
                org?.billingEmail,
                org?.contactEmail,
            ]
                .map((e) => (typeof e === 'string' ? e.trim().toLowerCase() : ''))
                .filter((e) => e && e.includes('@'))),
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
    getTokenSecret() {
        return process.env.JWT_SECRET || 'bomapro-public-invoice-hmac-secret-2026';
    }
    generatePublicToken(scheduleId, tenantId) {
        const payload = Buffer.from(`${scheduleId}:${tenantId}`, 'utf8').toString('base64url');
        const sig = crypto
            .createHmac('sha256', this.getTokenSecret())
            .update(payload)
            .digest('base64url')
            .slice(0, 24);
        return `${payload}.${sig}`;
    }
    verifyPublicToken(token) {
        if (!token || typeof token !== 'string' || !token.includes('.')) {
            throw new common_1.UnauthorizedException('Invalid payment link token');
        }
        const [payload, sig] = token.split('.');
        if (!payload || !sig) {
            throw new common_1.UnauthorizedException('Malformed payment link token');
        }
        const expectedSig = crypto
            .createHmac('sha256', this.getTokenSecret())
            .update(payload)
            .digest('base64url')
            .slice(0, 24);
        if (sig !== expectedSig) {
            throw new common_1.UnauthorizedException('Invalid or tampered payment link');
        }
        const decoded = Buffer.from(payload, 'base64url').toString('utf8');
        const [scheduleId, tenantId] = decoded.split(':');
        if (!scheduleId || !tenantId) {
            throw new common_1.UnauthorizedException('Invalid payment token payload');
        }
        return { scheduleId, tenantId };
    }
    async findByPublicToken(token) {
        const { scheduleId, tenantId } = this.verifyPublicToken(token);
        const raw = await this.scheduleRepository.findById(scheduleId);
        if (!raw || raw.isDeleted || String(raw.tenantId) !== String(tenantId)) {
            throw new common_1.NotFoundException('Invoice not found or no longer active');
        }
        const [enriched] = await this.enrichSchedules([raw], tenantId);
        return enriched;
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
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice details could not be loaded');
        }
        const mailCfg = await this.getMailConfig(tenantId);
        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        let unpaidLeaseSchedules = [];
        if (invoice.leaseId) {
            const allLeaseRaw = await this.scheduleRepository.findByLease(tenantId, invoice.leaseId);
            const enrichedLease = await this.enrichSchedules(allLeaseRaw, tenantId);
            unpaidLeaseSchedules = enrichedLease
                .filter((s) => s.status !== rent_schedule_schema_1.ScheduleStatus.PAID &&
                (s.balanceDue || 0) > 0 &&
                (new Date(s.dueDate) <= endOfCurrentMonth || String(s._id) === String(invoice._id)))
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        }
        const totalUnpaidBalance = unpaidLeaseSchedules.reduce((sum, s) => sum + (Number(s.balanceDue) || 0), 0);
        const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        const publicPayUrl = `${mailCfg.frontendUrl}/pay/${invoice.publicPayToken}`;
        const isPaid = invoice.status === rent_schedule_schema_1.ScheduleStatus.PAID;
        const arrearsRowsHtml = unpaidLeaseSchedules.length > 1
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
                      <td style="padding: 8px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${s.status === 'overdue' ? '#dc2626' : '#d97706'};">${s.status}</td>
                      <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${s.currency} ${Number(s.balanceDue || 0).toLocaleString()}</td>
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
                  <td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #dc2626; font-size: 14px;">${invoice.currency} ${totalUnpaidBalance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        `
            : '';
        const paymentInstructionsHtml = mailCfg.billingSettings.paybillOrTillNumber ||
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
          ${invoice.balanceDue > 0
            ? `<div style="text-align: center; margin: 24px 0 8px;">
                  <a href="${publicPayUrl}" style="display: inline-block; padding: 13px 32px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">Pay ${invoice.monthLabel} Invoice Now (No Login Required)</a>
                  <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Instant M-Pesa STK Push or Manual Reference: <a href="${publicPayUrl}" style="color: #059669;">${publicPayUrl}</a></p>
                </div>`
            : `<div style="text-align: center; margin-top: 16px;">
                  <p style="color: #059669; font-weight: 600;">✓ This invoice has been paid in full. Thank you!</p>
                  <a href="${publicPayUrl}" style="display: inline-block; margin-top: 8px; padding: 10px 24px; background: #0f172a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 13px;">View Official Receipt</a>
                </div>`}
          ${arrearsRowsHtml}
          ${paymentInstructionsHtml}
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">&copy; ${new Date().getFullYear()} ${mailCfg.orgName}. All rights reserved.</p>
      </div>`;
        const notifiedTargets = [];
        if (invoice.propertyTenantEmail) {
            await mailCfg.transporter.sendMail({
                from: mailCfg.fromHeader,
                to: invoice.propertyTenantEmail,
                subject: `${isPaid ? 'Paid Rent Invoice' : 'Rent Invoice & Payment Link'} – ${invoice.invoiceNumber} (${invoice.monthLabel})`,
                html: htmlBody,
            });
            notifiedTargets.push(invoice.propertyTenantEmail);
        }
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
                }
                catch (err) {
                    console.error('Failed to send admin copy of invoice email:', err.message);
                }
            }
        }
        if (notifiedTargets.length === 0) {
            throw new common_1.NotFoundException('neither the tenant email nor organization notification emails are configured');
        }
        return {
            message: `Invoice ${invoice.invoiceNumber} sent to ${notifiedTargets.join(', ')}`,
            publicPayUrl,
        };
    }
    async sendTenantReminderWithLinks(propertyTenantId, tenantId) {
        await this.ensureSchedulesForActiveLeases(tenantId);
        const pt = await this.propertyTenantModel
            .findOne({ _id: propertyTenantId, tenantId, isDeleted: false })
            .lean()
            .exec();
        if (!pt) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const leases = await this.leaseModel
            .find({ tenantId, propertyTenantId, isDeleted: false })
            .lean()
            .exec();
        const leaseIds = leases.map((l) => String(l._id));
        const allSchedulesRaw = leaseIds.length
            ? await this.scheduleRepository.model
                .find({ tenantId, leaseId: { $in: leaseIds }, isDeleted: false })
                .sort({ dueDate: 1 })
                .lean()
                .exec()
            : [];
        const enriched = await this.enrichSchedules(allSchedulesRaw, tenantId);
        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        let dueUnpaid = enriched.filter((s) => s.status !== rent_schedule_schema_1.ScheduleStatus.PAID && (s.balanceDue || 0) > 0 && new Date(s.dueDate) <= endOfCurrentMonth);
        if (dueUnpaid.length === 0) {
            const nextUnpaid = enriched.find((s) => s.status !== rent_schedule_schema_1.ScheduleStatus.PAID && (s.balanceDue || 0) > 0);
            if (nextUnpaid)
                dueUnpaid = [nextUnpaid];
        }
        if (dueUnpaid.length > 0) {
            const primarySchedule = dueUnpaid[dueUnpaid.length - 1];
            return this.sendInvoiceEmail(String(primarySchedule._id), tenantId);
        }
        throw new common_1.BadRequestException('This tenant has no unpaid or upcoming invoices.');
    }
    async sendBulkReminders(tenantId, mode = 'all_due') {
        await this.ensureSchedulesForActiveLeases(tenantId);
        const mailCfg = await this.getMailConfig(tenantId);
        const allRaw = await this.scheduleRepository.model
            .find({ tenantId, isDeleted: false })
            .sort({ dueDate: 1 })
            .lean()
            .exec();
        const enriched = await this.enrichSchedules(allRaw, tenantId);
        const now = new Date();
        const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const targetSchedules = enriched.filter((s) => {
            if (s.status === rent_schedule_schema_1.ScheduleStatus.PAID || (s.balanceDue || 0) <= 0)
                return false;
            if (mode === 'overdue') {
                return s.status === rent_schedule_schema_1.ScheduleStatus.OVERDUE;
            }
            return new Date(s.dueDate) <= endOfCurrentMonth;
        });
        const byLease = new Map();
        for (const s of targetSchedules) {
            const key = String(s.leaseId || s._id);
            if (!byLease.has(key))
                byLease.set(key, []);
            byLease.get(key).push(s);
        }
        let tenantsEmailed = 0;
        let totalDueAmount = 0;
        const summaryRows = [];
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
                            <td style="padding: 8px; text-transform: uppercase; font-size: 11px; font-weight: 700; color: ${s.status === 'overdue' ? '#dc2626' : '#d97706'};">${s.status}</td>
                            <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${s.currency} ${Number(s.balanceDue || 0).toLocaleString()}</td>
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
                        <td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 800; color: #dc2626; font-size: 15px;">${latestDue.currency} ${leaseTotalDue.toLocaleString()}</td>
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
                }
                catch (err) {
                    console.error(`Failed to email tenant ${latestDue.propertyTenantEmail}:`, err.message);
                }
            }
        }
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
                        .map((r) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 8px;"><strong>${r.tenantName}</strong><br/><span style="color:#64748b;">${r.tenantEmail}</span></td>
                      <td style="padding: 8px;">${r.propertyUnit}</td>
                      <td style="padding: 8px; color: #475569;">${r.monthsText}</td>
                      <td style="padding: 8px; text-align: right; font-weight: 700; color: #dc2626;">${r.currency} ${r.totalDue.toLocaleString()}</td>
                      <td style="padding: 8px; text-align: center;"><a href="${r.payLink}" style="color: #059669; font-weight: 600;">Open Link</a></td>
                    </tr>`)
                        .join('')}
                </tbody>
              </table>
            </div>
          `,
                });
                adminsNotified = mailCfg.adminEmails.length;
            }
            catch (err) {
                console.error('Failed to send admin digest email:', err.message);
            }
        }
        return {
            tenantsEmailed,
            adminsNotified,
            accountsCount: summaryRows.length,
            totalDueAmount,
            message: `Sent itemized payment reminders to ${tenantsEmailed} tenant(s)${adminsNotified > 0 ? ` and notified ${adminsNotified} admin email(s)` : ''}.`,
        };
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
    __param(5, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __metadata("design:paramtypes", [rent_schedule_repository_1.RentScheduleRepository,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], RentSchedulesService);
//# sourceMappingURL=rent-schedules.service.js.map