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
exports.PublicInvoicesController = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const rent_schedules_service_1 = require("../rent-schedules/rent-schedules.service");
const tenant_schema_1 = require("../tenants/schemas/tenant.schema");
const payment_schema_1 = require("./schemas/payment.schema");
let PublicInvoicesController = class PublicInvoicesController {
    constructor(paymentsService, rentSchedulesService, tenantModel) {
        this.paymentsService = paymentsService;
        this.rentSchedulesService = rentSchedulesService;
        this.tenantModel = tenantModel;
    }
    async getPublicInvoice(token) {
        const invoice = await this.rentSchedulesService.findByPublicToken(token);
        let org = null;
        if (invoice.tenantId) {
            try {
                org = await this.tenantModel.findById(invoice.tenantId).lean().exec();
            }
            catch { }
        }
        return {
            invoice,
            organization: {
                name: org?.name || 'Bomapro Property Management',
                logoUrl: org?.logoUrl || '',
                contactEmail: org?.billingEmail || org?.contactEmail || '',
                mpesaClientId: org?.mpesaClientId || '',
            },
        };
    }
    async payManual(token, body) {
        const invoice = await this.rentSchedulesService.findByPublicToken(token);
        const amount = Number(body.amount);
        if (!amount || amount <= 0) {
            throw new common_1.BadRequestException('Please enter a valid payment amount greater than 0');
        }
        const method = body.paymentMethod || payment_schema_1.PaymentMethod.MPESA;
        const payment = await this.paymentsService.create({
            leaseId: invoice.leaseId,
            propertyTenantId: invoice.propertyTenantId || '',
            propertyId: invoice.propertyId,
            unitId: invoice.unitId,
            unitNumber: invoice.unitNumber || '',
            leaseNumber: invoice.leaseNumber || '',
            propertyName: invoice.propertyName || '',
            propertyTenantName: invoice.propertyTenantName || '',
            scheduleId: String(invoice._id),
            selectedMonths: invoice.month ? [invoice.month] : [],
            paymentPeriod: invoice.monthLabel || invoice.month,
            amount,
            currency: invoice.currency || 'KES',
            paymentDate: new Date().toISOString(),
            paymentMethod: method,
            paymentType: payment_schema_1.PaymentType.RENT,
            mpesaTransactionId: body.mpesaTransactionId || '',
            mpesaPhoneNumber: body.mpesaPhoneNumber || invoice.propertyTenantPhone || '',
            bankReference: body.bankReference || '',
            chequeNumber: body.chequeNumber || '',
            referenceNumber: body.referenceNumber || '',
            notes: body.notes || `Paid via public invoice link (${invoice.invoiceNumber})`,
        }, String(invoice.tenantId), 'public-invoice-link');
        const updatedInvoice = await this.rentSchedulesService.findByPublicToken(token);
        return {
            message: 'Payment recorded successfully',
            payment,
            invoice: updatedInvoice,
        };
    }
    async confirmMpesa(token, body) {
        const invoice = await this.rentSchedulesService.findByPublicToken(token);
        const amount = Number(body.amount) || invoice.balanceDue || invoice.amount;
        const payment = await this.paymentsService.confirmMpesaPayment(String(invoice.tenantId), 'public-invoice-stk', {
            leaseId: invoice.leaseId,
            propertyTenantId: invoice.propertyTenantId || '',
            propertyId: invoice.propertyId,
            unitId: invoice.unitId,
            unitNumber: invoice.unitNumber || '',
            leaseNumber: invoice.leaseNumber || '',
            propertyName: invoice.propertyName || '',
            propertyTenantName: invoice.propertyTenantName || '',
            scheduleId: String(invoice._id),
            selectedMonths: invoice.month ? [invoice.month] : [],
            paymentPeriod: invoice.monthLabel || invoice.month,
            amount,
            phoneNumber: body.phoneNumber || invoice.propertyTenantPhone || '',
            mpesaReceiptNumber: body.mpesaReceiptNumber,
            checkoutRequestId: body.checkoutRequestId,
            paymentType: 'rent',
            notes: body.notes || `M-Pesa STK payment via public invoice link (${invoice.invoiceNumber})`,
        });
        const updatedInvoice = await this.rentSchedulesService.findByPublicToken(token);
        return {
            message: 'M-Pesa payment confirmed successfully',
            payment,
            invoice: updatedInvoice,
        };
    }
};
exports.PublicInvoicesController = PublicInvoicesController;
__decorate([
    (0, common_1.Get)(':token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicInvoicesController.prototype, "getPublicInvoice", null);
__decorate([
    (0, common_1.Post)(':token/pay-manual'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicInvoicesController.prototype, "payManual", null);
__decorate([
    (0, common_1.Post)(':token/confirm-mpesa'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PublicInvoicesController.prototype, "confirmMpesa", null);
exports.PublicInvoicesController = PublicInvoicesController = __decorate([
    (0, swagger_1.ApiTags)('Public Invoices'),
    (0, common_1.Controller)('public-invoices'),
    __param(2, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        rent_schedules_service_1.RentSchedulesService,
        mongoose_2.Model])
], PublicInvoicesController);
//# sourceMappingURL=public-invoices.controller.js.map