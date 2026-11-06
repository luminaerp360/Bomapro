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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payment_repository_1 = require("./repositories/payment.repository");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const property_schema_1 = require("../properties/schemas/property.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
let PaymentsService = class PaymentsService {
    constructor(paymentRepository, rentSchedulesService, propertyTenantModel, leaseModel, propertyModel, unitModel) {
        this.paymentRepository = paymentRepository;
        this.rentSchedulesService = rentSchedulesService;
        this.propertyTenantModel = propertyTenantModel;
        this.leaseModel = leaseModel;
        this.propertyModel = propertyModel;
        this.unitModel = unitModel;
    }
    async enrichPayments(payments) {
        if (!payments || payments.length === 0)
            return [];
        const plainList = payments.map((p) => (typeof p.toObject === 'function' ? p.toObject() : { ...p }));
        const leaseIds = [...new Set(plainList.map((p) => p.leaseId).filter(Boolean))];
        const leases = leaseIds.length
            ? await this.leaseModel.find({ _id: { $in: leaseIds } }).lean().exec()
            : [];
        const leaseMap = new Map();
        leases.forEach((l) => leaseMap.set(String(l._id), l));
        const propertyIds = [
            ...new Set([
                ...plainList.map((p) => p.propertyId).filter(Boolean),
                ...leases.map((l) => l.propertyId).filter(Boolean),
            ]),
        ];
        const unitIds = [
            ...new Set([
                ...plainList.map((p) => p.unitId).filter(Boolean),
                ...leases.map((l) => l.unitId).filter(Boolean),
            ]),
        ];
        const ptIds = [
            ...new Set([
                ...plainList.map((p) => p.propertyTenantId).filter(Boolean),
                ...leases.map((l) => l.propertyTenantId).filter(Boolean),
            ]),
        ];
        const [properties, units, propertyTenants] = await Promise.all([
            propertyIds.length ? this.propertyModel.find({ _id: { $in: propertyIds } }).lean().exec() : [],
            unitIds.length ? this.unitModel.find({ _id: { $in: unitIds } }).lean().exec() : [],
            ptIds.length ? this.propertyTenantModel.find({ _id: { $in: ptIds } }).lean().exec() : [],
        ]);
        const propMap = new Map();
        properties.forEach((pr) => propMap.set(String(pr._id), pr));
        const unitMap = new Map();
        units.forEach((u) => unitMap.set(String(u._id), u));
        const ptMap = new Map();
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
    async create(dto, tenantId, recordedBy) {
        const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
        let lease = null;
        if (dto.leaseId) {
            try {
                lease = await this.leaseModel.findById(dto.leaseId).lean().exec();
            }
            catch { }
        }
        const propertyId = dto.propertyId || lease?.propertyId || '';
        const unitId = dto.unitId || lease?.unitId || '';
        const propertyTenantId = dto.propertyTenantId || lease?.propertyTenantId || '';
        let propertyName = dto.propertyName || lease?.propertyName || '';
        if (!propertyName && propertyId) {
            try {
                const prop = await this.propertyModel.findById(propertyId).lean().exec();
                if (prop)
                    propertyName = prop.name || '';
            }
            catch { }
        }
        let unitNumber = dto.unitNumber || lease?.unitNumber || '';
        if (!unitNumber && unitId) {
            try {
                const unit = await this.unitModel.findById(unitId).lean().exec();
                if (unit)
                    unitNumber = unit.unitNumber || '';
            }
            catch { }
        }
        let propertyTenantName = dto.propertyTenantName || lease?.propertyTenantName || '';
        if (!propertyTenantName && propertyTenantId) {
            try {
                const pt = await this.propertyTenantModel.findById(propertyTenantId).lean().exec();
                if (pt)
                    propertyTenantName = pt.name || '';
            }
            catch { }
        }
        const paymentType = dto.paymentType || 'rent';
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
            status: 'completed',
        });
        if (payment.leaseId && paymentType === 'rent') {
            try {
                await this.rentSchedulesService.recordPayment(tenantId, payment.leaseId, payment.amount, payment._id.toString(), payment.paymentDate, payment.paymentMethod, {
                    scheduleId: dto.scheduleId,
                    selectedMonths: dto.selectedMonths,
                    paymentPeriod: dto.paymentPeriod,
                });
            }
            catch (error) {
                console.error('Failed to record payment in rent schedule:', error.message);
            }
        }
        const [enriched] = await this.enrichPayments([payment]);
        const result = enriched || payment;
        this.sendPaymentNotifications(result, tenantId).catch((err) => console.error('Payment notification dispatch error:', err.message));
        return result;
    }
    async findAll(tenantId, page = 1, limit = 20, search, status, paymentMethod) {
        const filter = { tenantId };
        if (status)
            filter.status = status;
        if (paymentMethod)
            filter.paymentMethod = paymentMethod;
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
    async findById(id, tenantId) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment || payment.isDeleted || payment.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Payment not found');
        }
        const [enriched] = await this.enrichPayments([payment]);
        return enriched || payment;
    }
    async findByLease(tenantId, leaseId) {
        const list = await this.paymentRepository.findByLease(tenantId, leaseId);
        return this.enrichPayments(list);
    }
    async findByProperty(tenantId, propertyId) {
        const list = await this.paymentRepository.findByProperty(tenantId, propertyId);
        return this.enrichPayments(list);
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        const list = await this.paymentRepository.findByPropertyTenant(tenantId, propertyTenantId);
        return this.enrichPayments(list);
    }
    async findByDateRange(tenantId, startDate, endDate) {
        const list = await this.paymentRepository.findByDateRange(tenantId, new Date(startDate), new Date(endDate));
        return this.enrichPayments(list);
    }
    async markCompleted(id, tenantId) {
        await this.findById(id, tenantId);
        const payment = await this.paymentRepository.update(id, { status: 'completed' });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const [enriched] = await this.enrichPayments([payment]);
        return enriched || payment;
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const payment = await this.paymentRepository.update(id, dto);
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const [enriched] = await this.enrichPayments([payment]);
        return enriched || payment;
    }
    async remove(id, tenantId) {
        const payment = await this.findById(id, tenantId);
        if (payment.leaseId && (!payment.paymentType || payment.paymentType === 'rent')) {
            try {
                await this.rentSchedulesService.reversePayment(tenantId, payment.leaseId, id, payment.amount);
            }
            catch (error) {
                console.error('Failed to reverse payment from rent schedule:', error.message);
            }
        }
        return this.paymentRepository.delete(id);
    }
    async getStats(tenantId) {
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
    async confirmMpesaPayment(tenantId, recordedBy, dto) {
        const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
        const cleanPhone = dto.phoneNumber.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('0')
            ? '254' + cleanPhone.slice(1)
            : cleanPhone.startsWith('254')
                ? cleanPhone
                : '254' + cleanPhone;
        let lease = null;
        if (dto.leaseId) {
            try {
                lease = await this.leaseModel.findById(dto.leaseId).lean().exec();
            }
            catch { }
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
        });
        if (payment.leaseId && payment.paymentType === 'rent') {
            this.rentSchedulesService
                .recordPayment(tenantId, payment.leaseId, payment.amount, payment._id.toString(), payment.paymentDate, 'mpesa', {
                scheduleId: dto.scheduleId,
                selectedMonths: dto.selectedMonths,
                paymentPeriod: dto.paymentPeriod,
            })
                .catch((e) => console.error('Rent schedule error', e.message));
        }
        const [enriched] = await this.enrichPayments([payment]);
        const result = enriched || payment;
        this.sendPaymentNotifications(result, tenantId).catch((err) => console.error('Payment notification dispatch error:', err.message));
        return result;
    }
    async sendPaymentNotifications(payment, tenantId) {
        const mailCfg = await this.rentSchedulesService.getMailConfig(tenantId);
        const dateStr = new Date(payment.paymentDate || new Date()).toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        let remainingLeaseBalance = null;
        if (payment.leaseId) {
            try {
                const bal = await this.rentSchedulesService.getLeaseBalance(tenantId, String(payment.leaseId));
                remainingLeaseBalance = bal?.balance ?? null;
            }
            catch { }
        }
        const receiptHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background: #f8fafc; border-radius: 14px;">
        <div style="text-align: center; margin-bottom: 22px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #059669; border-radius: 12px; line-height: 48px; color: white; font-size: 22px;">✓</div>
          <h2 style="color: #0f172a; margin: 10px 0 4px;">Payment Receipt Confirmed</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">${mailCfg.orgName} · ${payment.receiptNumber}</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <p style="color: #334155;">Dear <strong>${payment.propertyTenantName || 'Valued Tenant'}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">We have received your payment. Below is your official receipt:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr><td style="padding: 8px; color: #64748b;">Receipt No</td><td style="padding: 8px; font-weight: 700; font-family: monospace;">${payment.receiptNumber}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Amount Paid</td><td style="padding: 8px; font-weight: 700; color: #059669;">${payment.currency || 'KES'} ${Number(payment.amount || 0).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Date</td><td style="padding: 8px;">${dateStr}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Payment Method</td><td style="padding: 8px; text-transform: uppercase; font-weight: 600;">${payment.paymentMethod || '–'}</td></tr>
            <tr><td style="padding: 8px; color: #64748b;">Property / Unit</td><td style="padding: 8px; font-weight: 600;">${payment.propertyName || '–'} ${payment.unitNumber ? `(Unit ${payment.unitNumber})` : ''}</td></tr>
            <tr style="background:#f8fafc;"><td style="padding: 8px; color: #64748b;">Billing Period</td><td style="padding: 8px;">${payment.paymentPeriod || '–'}</td></tr>
            ${payment.mpesaTransactionId ? `<tr><td style="padding: 8px; color: #64748b;">Transaction Ref</td><td style="padding: 8px; font-family: monospace; font-weight: 600;">${payment.mpesaTransactionId}</td></tr>` : ''}
            ${remainingLeaseBalance !== null
            ? `<tr style="background:#f8fafc;"><td style="padding: 8px; color: #1e293b; font-weight: 700;">Remaining Due Balance</td><td style="padding: 8px; font-weight: 700; color: ${remainingLeaseBalance > 0 ? '#dc2626' : '#059669'};">${payment.currency || 'KES'} ${remainingLeaseBalance.toLocaleString()}</td></tr>`
            : ''}
          </table>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 18px;">&copy; ${new Date().getFullYear()} ${mailCfg.orgName}. All rights reserved.</p>
      </div>
    `;
        if (payment.propertyTenantEmail && mailCfg.preferences.emailTenantOnPayment !== false) {
            try {
                await mailCfg.transporter.sendMail({
                    from: mailCfg.fromHeader,
                    to: payment.propertyTenantEmail,
                    subject: `Payment Receipt – ${payment.receiptNumber} (${payment.currency || 'KES'} ${Number(payment.amount || 0).toLocaleString()})`,
                    html: receiptHtml,
                });
            }
            catch (err) {
                console.error('Failed to send payment receipt to tenant:', err.message);
            }
        }
        if (mailCfg.adminEmails.length > 0 && mailCfg.preferences.emailAdminsOnPayment !== false) {
            try {
                await mailCfg.transporter.sendMail({
                    from: mailCfg.fromHeader,
                    to: mailCfg.adminEmails.join(', '),
                    subject: `[Payment Received] ${payment.currency || 'KES'} ${Number(payment.amount || 0).toLocaleString()} from ${payment.propertyTenantName || 'Tenant'} (${payment.unitNumber ? `Unit ${payment.unitNumber}` : payment.propertyName || 'Property'})`,
                    html: receiptHtml,
                });
            }
            catch (err) {
                console.error('Failed to send payment alert to admin notificationEmails:', err.message);
            }
        }
    }
    async resendInvoice(id, tenantId) {
        const payment = await this.findById(id, tenantId);
        const mailCfg = await this.rentSchedulesService.getMailConfig(tenantId);
        const recipientList = [payment.propertyTenantEmail, ...(mailCfg.adminEmails || [])]
            .map((e) => (e || '').trim())
            .filter((e) => e && e.includes('@'));
        const uniqueRecipients = [...new Set(recipientList)];
        if (uniqueRecipients.length === 0) {
            throw new common_1.NotFoundException('No tenant email or organization notification email configured');
        }
        await this.sendPaymentNotifications(payment, tenantId);
        return { message: `Receipt ${payment.receiptNumber} sent to ${uniqueRecipients.join(', ')}` };
    }
    async sendPaymentReminder(propertyTenantId, tenantId) {
        return this.rentSchedulesService.sendTenantReminderWithLinks(propertyTenantId, tenantId);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(property_tenant_schema_1.PropertyTenant.name)),
    __param(3, (0, mongoose_1.InjectModel)(lease_schema_1.Lease.name)),
    __param(4, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(5, (0, mongoose_1.InjectModel)(unit_schema_1.Unit.name)),
    __metadata("design:paramtypes", [payment_repository_1.PaymentRepository,
        rent_schedules_service_1.RentSchedulesService,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map