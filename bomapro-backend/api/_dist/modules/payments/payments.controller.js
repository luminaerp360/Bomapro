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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    create(dto, req) {
        const tenantId = req.user?.tenantId || '';
        const recordedBy = req.user?.userId || '';
        return this.paymentsService.create(dto, tenantId, recordedBy);
    }
    findAll(req, page, limit, search, status, paymentMethod) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findAll(tenantId, page, limit, search, status, paymentMethod);
    }
    getStats(req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.getStats(tenantId);
    }
    findByLease(req, leaseId) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findByLease(tenantId, leaseId);
    }
    findByProperty(req, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findByProperty(tenantId, propertyId);
    }
    findByPropertyTenant(req, propertyTenantId) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findByPropertyTenant(tenantId, propertyTenantId);
    }
    findByDateRange(req, startDate, endDate) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findByDateRange(tenantId, startDate, endDate);
    }
    findOne(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.findById(id, tenantId);
    }
    update(id, dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.update(id, tenantId, dto);
    }
    markCompleted(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.markCompleted(id, tenantId);
    }
    confirmMpesaPayment(body, req) {
        const tenantId = req.user?.tenantId || '';
        const recordedBy = req.user?.userId || '';
        return this.paymentsService.confirmMpesaPayment(tenantId, recordedBy, body);
    }
    resendInvoice(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.resendInvoice(id, tenantId);
    }
    sendReminder(propertyTenantId, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.sendPaymentReminder(propertyTenantId, tenantId);
    }
    remove(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.paymentsService.remove(id, tenantId);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('paymentMethod')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('by-lease/:leaseId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByLease", null);
__decorate([
    (0, common_1.Get)('by-property/:propertyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)('by-tenant/:propertyTenantId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyTenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByPropertyTenant", null);
__decorate([
    (0, common_1.Get)('date-range'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByDateRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_dto_1.UpdatePaymentDto, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "markCompleted", null);
__decorate([
    (0, common_1.Post)('confirm-mpesa'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirmMpesaPayment", null);
__decorate([
    (0, common_1.Post)(':id/resend-invoice'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "resendInvoice", null);
__decorate([
    (0, common_1.Post)('send-reminder/:propertyTenantId'),
    __param(0, (0, common_1.Param)('propertyTenantId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "sendReminder", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "remove", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map