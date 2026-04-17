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
var TenantPortalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPortalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const property_tenant_schema_1 = require("../property-tenants/schemas/property-tenant.schema");
const lease_schema_1 = require("../leases/schemas/lease.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const unit_schema_1 = require("../units/schemas/unit.schema");
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
const damage_schema_1 = require("../damages/schemas/damage.schema");
const mpesa_service_1 = require("./mpesa.service");
let TenantPortalService = TenantPortalService_1 = class TenantPortalService {
    constructor(propertyTenantModel, leaseModel, paymentModel, unitModel, tenantOrgModel, damageModel, jwtService, mpesaService) {
        this.propertyTenantModel = propertyTenantModel;
        this.leaseModel = leaseModel;
        this.paymentModel = paymentModel;
        this.unitModel = unitModel;
        this.tenantOrgModel = tenantOrgModel;
        this.damageModel = damageModel;
        this.jwtService = jwtService;
        this.mpesaService = mpesaService;
        this.logger = new common_1.Logger(TenantPortalService_1.name);
    }
    async setupPassword(dto) {
        const tenant = await this.propertyTenantModel.findOne({
            portalInviteToken: dto.token,
            portalInviteTokenUsed: false,
            isDeleted: false,
        });
        if (!tenant)
            throw new common_1.BadRequestException('Invalid or expired invite link');
        if (tenant.portalInviteTokenExpiry && new Date() > tenant.portalInviteTokenExpiry) {
            throw new common_1.BadRequestException('Invite link has expired. Ask your property manager to resend the invite.');
        }
        const hashed = await bcrypt.hash(dto.password, 10);
        tenant.portalPassword = hashed;
        tenant.portalPasswordSet = true;
        tenant.portalInviteTokenUsed = true;
        await tenant.save();
        return { message: 'Password set successfully. You can now log in.' };
    }
    async login(dto) {
        const tenant = await this.propertyTenantModel.findOne({
            email: dto.email.toLowerCase(),
            isDeleted: false,
            isActive: true,
        });
        if (!tenant) {
            throw new common_1.UnauthorizedException('No tenant account found with this email. Please contact your property manager.');
        }
        if (!tenant.portalPasswordSet) {
            throw new common_1.UnauthorizedException('Your account has not been activated yet. Please check your email for the setup link sent by your property manager.');
        }
        const isValid = await bcrypt.compare(dto.password, tenant.portalPassword);
        if (!isValid)
            throw new common_1.UnauthorizedException('Incorrect password. Please try again.');
        const token = this.jwtService.sign({
            sub: tenant._id.toString(),
            email: tenant.email,
            name: tenant.name,
            orgTenantId: tenant.tenantId,
            type: 'tenant-portal',
        }, {
            secret: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
            expiresIn: '7d',
        });
        const profile = this.sanitize(tenant);
        return { token, profile };
    }
    async getProfile(propertyTenantId) {
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant || tenant.isDeleted)
            throw new common_1.NotFoundException('Tenant not found');
        return this.sanitize(tenant);
    }
    async updateProfile(propertyTenantId, dto) {
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant || tenant.isDeleted)
            throw new common_1.NotFoundException('Tenant not found');
        tenant.phone = dto.phone;
        await tenant.save();
        return this.sanitize(tenant);
    }
    async getLease(propertyTenantId, orgTenantId) {
        const lease = await this.leaseModel
            .findOne({
            propertyTenantId,
            tenantId: orgTenantId,
            isDeleted: false,
        })
            .sort({ createdAt: -1 });
        if (!lease)
            throw new common_1.NotFoundException('No lease found for this account');
        let unitNumber = '';
        if (lease.unitId) {
            const unit = await this.unitModel.findById(lease.unitId).select('unitNumber').lean();
            if (unit)
                unitNumber = unit.unitNumber || '';
        }
        return { ...lease.toObject(), unitNumber };
    }
    async signLease(leaseId, propertyTenantId, orgTenantId) {
        const lease = await this.leaseModel.findOne({
            _id: leaseId,
            propertyTenantId,
            tenantId: orgTenantId,
            isDeleted: false,
        });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        if (lease.isSigned)
            throw new common_1.BadRequestException('Lease is already signed');
        lease.isSigned = true;
        lease.signedAt = new Date();
        lease.signedByPropertyTenantId = propertyTenantId;
        await lease.save();
        return lease;
    }
    async getPayments(propertyTenantId, orgTenantId) {
        return this.paymentModel
            .find({ propertyTenantId, tenantId: orgTenantId, isDeleted: false })
            .sort({ paymentDate: -1 });
    }
    async getPaymentStatus(paymentId, propertyTenantId) {
        const payment = await this.paymentModel.findOne({
            _id: paymentId,
            propertyTenantId,
            isDeleted: false,
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return payment;
    }
    async confirmMpesaPayment(propertyTenantId, orgTenantId, dto) {
        const lease = await this.leaseModel.findOne({
            _id: dto.leaseId,
            propertyTenantId,
            tenantId: orgTenantId,
            isDeleted: false,
        });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant profile not found');
        const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
        const formattedPhone = this.mpesaService.formatPhone(dto.phoneNumber);
        const payment = await this.paymentModel.create({
            tenantId: orgTenantId,
            leaseId: dto.leaseId,
            propertyTenantId,
            propertyId: lease.propertyId,
            amount: dto.amount,
            currency: 'KES',
            paymentDate: new Date(),
            paymentMethod: payment_schema_1.PaymentMethod.MPESA,
            paymentType: payment_schema_1.PaymentType.RENT,
            status: payment_schema_1.PaymentStatus.COMPLETED,
            mpesaTransactionId: dto.mpesaReceiptNumber,
            mpesaPhoneNumber: formattedPhone,
            receiptNumber,
            paymentPeriod: dto.paymentPeriod || '',
            notes: dto.notes || '',
            propertyName: lease.propertyName || '',
            propertyTenantName: lease.propertyTenantName || tenant.name,
            recordedBy: 'tenant-portal',
        });
        if (tenant.email) {
            this.sendReceiptEmail(tenant.email, tenant.name, {
                receiptNumber,
                mpesaReceiptNumber: dto.mpesaReceiptNumber,
                amount: dto.amount,
                paymentPeriod: dto.paymentPeriod || '',
                propertyName: lease.propertyName || '',
                paymentDate: new Date(),
                phone: formattedPhone,
            }).catch((err) => this.logger.error('Receipt email error', err));
        }
        return payment;
    }
    async getOrgSettings(orgTenantId) {
        const org = await this.tenantOrgModel.findById(orgTenantId).lean();
        return {
            mpesaClientId: org?.mpesaClientId || '',
            orgName: org?.name || '',
        };
    }
    async initiateMpesaPayment(propertyTenantId, orgTenantId, dto) {
        const lease = await this.leaseModel.findOne({
            _id: dto.leaseId,
            propertyTenantId,
            tenantId: orgTenantId,
            isDeleted: false,
        });
        if (!lease)
            throw new common_1.NotFoundException('Lease not found');
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant profile not found');
        const stkResult = await this.mpesaService.stkPush(dto.phoneNumber, dto.amount, lease.leaseNumber || lease._id.toString(), `Rent ${dto.paymentPeriod || ''}`.trim());
        if (stkResult.ResponseCode !== '0') {
            throw new common_1.BadRequestException(stkResult.ResponseDescription || 'STK push failed. Please try again.');
        }
        const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
        const payment = new this.paymentModel({
            tenantId: orgTenantId,
            leaseId: dto.leaseId,
            propertyTenantId,
            propertyId: lease.propertyId,
            amount: dto.amount,
            currency: 'KES',
            paymentDate: new Date(),
            paymentMethod: payment_schema_1.PaymentMethod.MPESA,
            paymentType: payment_schema_1.PaymentType.RENT,
            status: payment_schema_1.PaymentStatus.PENDING,
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
            paymentId: payment._id.toString(),
        };
    }
    async handleMpesaCallback(body) {
        this.logger.log(`M-Pesa callback received: ${JSON.stringify(body)}`);
        try {
            const stkCallback = body?.Body?.stkCallback;
            if (!stkCallback)
                return { ResultCode: 0, ResultDesc: 'Accepted' };
            const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
            const payment = await this.paymentModel.findOne({
                mpesaTransactionId: CheckoutRequestID,
                status: payment_schema_1.PaymentStatus.PENDING,
                isDeleted: false,
            });
            if (!payment) {
                this.logger.warn(`No pending payment found for CheckoutRequestID: ${CheckoutRequestID}`);
                return { ResultCode: 0, ResultDesc: 'Accepted' };
            }
            if (ResultCode === 0) {
                const items = CallbackMetadata?.Item || [];
                const getItem = (name) => items.find((i) => i.Name === name)?.Value;
                const mpesaReceiptNumber = getItem('MpesaReceiptNumber') || '';
                const amount = getItem('Amount') || payment.amount;
                const phone = getItem('PhoneNumber') || payment.mpesaPhoneNumber;
                payment.status = payment_schema_1.PaymentStatus.COMPLETED;
                payment.mpesaTransactionId = mpesaReceiptNumber;
                payment.mpesaPhoneNumber = String(phone);
                payment.amount = Number(amount);
                await payment.save();
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
            }
            else {
                payment.status = payment_schema_1.PaymentStatus.FAILED;
                payment.notes = `Payment failed: ${ResultDesc}`;
                await payment.save();
            }
        }
        catch (err) {
            this.logger.error('M-Pesa callback processing error', err);
        }
        return { ResultCode: 0, ResultDesc: 'Accepted' };
    }
    async resendInvite(propertyTenantId, orgTenantId) {
        const tenant = await this.propertyTenantModel.findOne({
            _id: propertyTenantId,
            tenantId: orgTenantId,
            isDeleted: false,
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const { token } = await this.generateAndSaveInviteToken(tenant);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const link = `${frontendUrl}/tenant-portal/setup-password?token=${token}`;
        await this.sendPortalInviteEmail(tenant.email, tenant.name, link);
        return { message: 'Invite resent successfully' };
    }
    async generateAndSaveInviteToken(tenant) {
        const crypto = await Promise.resolve().then(() => require('crypto'));
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        tenant.portalInviteToken = token;
        tenant.portalInviteTokenExpiry = expiry;
        tenant.portalInviteTokenUsed = false;
        await tenant.save();
        return { token };
    }
    get mailer() {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    async sendPortalInviteEmail(to, name, inviteLink) {
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
    async sendReceiptEmail(to, name, data) {
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
    async getBalance(propertyTenantId, orgTenantId) {
        let lease = null;
        try {
            lease = await this.leaseModel.findOne({ propertyTenantId, tenantId: orgTenantId, isDeleted: false }).sort({ createdAt: -1 }).lean();
        }
        catch { }
        if (!lease)
            return { balance: 0, totalPaid: 0, rentAmount: 0, currency: 'KES', overdueMonths: 0 };
        const payments = await this.paymentModel.find({ propertyTenantId, tenantId: orgTenantId, status: 'completed', isDeleted: false }).lean();
        const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
        const today = new Date();
        const start = new Date(lease.startDate);
        let months = 0;
        const iter = new Date(start.getFullYear(), start.getMonth(), 1);
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        while (iter <= thisMonthStart) {
            months++;
            iter.setMonth(iter.getMonth() + 1);
        }
        const totalDue = months * (lease.rentAmount || 0);
        const balance = Math.max(0, totalDue - totalPaid);
        const overdueMonths = lease.rentAmount > 0 ? Math.floor(balance / lease.rentAmount) : 0;
        return {
            balance,
            totalPaid,
            totalDue,
            rentAmount: lease.rentAmount || 0,
            currency: lease.currency || 'KES',
            overdueMonths,
        };
    }
    async submitDamage(propertyTenantId, orgTenantId, dto) {
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant || tenant.isDeleted)
            throw new common_1.NotFoundException('Tenant not found');
        const lease = await this.leaseModel.findOne({ propertyTenantId, tenantId: orgTenantId, isDeleted: false }).sort({ createdAt: -1 }).lean();
        const damage = await this.damageModel.create({
            tenantId: orgTenantId,
            propertyId: lease?.propertyId || dto.propertyId || '',
            propertyTenantId,
            leaseId: lease?._id?.toString() || '',
            description: dto.description,
            damageType: dto.damageType || 'other',
            severity: dto.severity || 'medium',
            reportedDate: new Date(),
            location: dto.location || '',
            notes: dto.notes || '',
            propertyName: lease?.propertyName || '',
            propertyTenantName: tenant.name,
            reportedBy: propertyTenantId,
            status: 'reported',
        });
        return damage;
    }
    async getDamages(propertyTenantId, orgTenantId) {
        return this.damageModel.find({ propertyTenantId, tenantId: orgTenantId, isDeleted: { $ne: true } }).sort({ reportedDate: -1 }).lean();
    }
    async resendReceiptEmail(paymentId, propertyTenantId, orgTenantId) {
        const payment = await this.paymentModel.findOne({ _id: paymentId, tenantId: orgTenantId, isDeleted: false }).lean();
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const tenant = await this.propertyTenantModel.findById(propertyTenantId);
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        await this.sendReceiptEmail(tenant.email, tenant.name, {
            receiptNumber: payment.receiptNumber || '',
            mpesaReceiptNumber: payment.mpesaTransactionId || '',
            amount: payment.amount,
            paymentPeriod: payment.paymentPeriod || '',
            propertyName: payment.propertyName || '',
            paymentDate: payment.paymentDate,
            phone: payment.mpesaPhoneNumber || '',
        });
        return { message: 'Receipt email sent successfully' };
    }
    sanitize(tenant) {
        const obj = tenant.toObject ? tenant.toObject() : { ...tenant };
        delete obj.portalPassword;
        delete obj.portalInviteToken;
        delete obj.portalInviteTokenExpiry;
        delete obj.portalInviteTokenUsed;
        return obj;
    }
};
exports.TenantPortalService = TenantPortalService;
exports.TenantPortalService = TenantPortalService = TenantPortalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_tenant_schema_1.PropertyTenant.name)),
    __param(1, (0, mongoose_1.InjectModel)(lease_schema_1.Lease.name)),
    __param(2, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(3, (0, mongoose_1.InjectModel)(unit_schema_1.Unit.name)),
    __param(4, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __param(5, (0, mongoose_1.InjectModel)(damage_schema_1.Damage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService,
        mpesa_service_1.MpesaService])
], TenantPortalService);
//# sourceMappingURL=tenant-portal.service.js.map