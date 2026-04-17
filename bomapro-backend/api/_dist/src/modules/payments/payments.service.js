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
const nodemailer = require("nodemailer");
const payment_repository_1 = require("./repositories/payment.repository");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
let PaymentsService = class PaymentsService {
    constructor(paymentRepository, rentSchedulesService, propertyTenantModel) {
        this.paymentRepository = paymentRepository;
        this.rentSchedulesService = rentSchedulesService;
        this.propertyTenantModel = propertyTenantModel;
    }
    async create(dto, tenantId, recordedBy) {
        const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
        const payment = await this.paymentRepository.create({
            ...dto,
            tenantId,
            recordedBy,
            receiptNumber,
            status: 'completed',
        });
        if (payment.leaseId && dto.paymentType === 'rent') {
            try {
                await this.rentSchedulesService.recordPayment(tenantId, payment.leaseId, payment.amount, payment._id.toString(), payment.paymentDate, payment.paymentMethod);
            }
            catch (error) {
                console.error('Failed to record payment in rent schedule:', error.message);
            }
        }
        return payment;
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
                { paymentPeriod: { $regex: search, $options: 'i' } },
            ];
        }
        return this.paymentRepository.findPaginated({ page, limit, filter });
    }
    async findById(id, tenantId) {
        const payment = await this.paymentRepository.findById(id);
        if (!payment || payment.isDeleted || payment.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async findByLease(tenantId, leaseId) {
        return this.paymentRepository.findByLease(tenantId, leaseId);
    }
    async findByProperty(tenantId, propertyId) {
        return this.paymentRepository.findByProperty(tenantId, propertyId);
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.paymentRepository.findByPropertyTenant(tenantId, propertyTenantId);
    }
    async findByDateRange(tenantId, startDate, endDate) {
        return this.paymentRepository.findByDateRange(tenantId, new Date(startDate), new Date(endDate));
    }
    async markCompleted(id, tenantId) {
        await this.findById(id, tenantId);
        const payment = await this.paymentRepository.update(id, { status: 'completed' });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async update(id, tenantId, dto) {
        await this.findById(id, tenantId);
        const payment = await this.paymentRepository.update(id, dto);
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async remove(id, tenantId) {
        await this.findById(id, tenantId);
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
        });
        if (payment.leaseId && payment.paymentType === 'rent') {
            this.rentSchedulesService.recordPayment(tenantId, payment.leaseId, payment.amount, payment._id.toString(), payment.paymentDate, 'mpesa').catch((e) => console.error('Rent schedule error', e.message));
        }
        return payment;
    }
    async resendInvoice(id, tenantId) {
        const payment = await this.findById(id, tenantId);
        const pt = await this.propertyTenantModel.findOne({
            _id: payment.propertyTenantId,
            tenantId,
            isDeleted: false,
        }).exec();
        if (!pt || !pt.email)
            throw new common_1.NotFoundException('Tenant email not found');
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
    async sendPaymentReminder(propertyTenantId, tenantId) {
        const pt = await this.propertyTenantModel.findOne({
            _id: propertyTenantId,
            tenantId,
            isDeleted: false,
        }).exec();
        if (!pt || !pt.email)
            throw new common_1.NotFoundException('Tenant not found or no email');
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
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, mongoose_1.InjectModel)(property_tenant_schema_1.PropertyTenant.name)),
    __metadata("design:paramtypes", [payment_repository_1.PaymentRepository,
        rent_schedules_service_1.RentSchedulesService,
        mongoose_2.Model])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map