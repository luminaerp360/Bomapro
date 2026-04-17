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
exports.TenantPortalController = void 0;
const common_1 = require("@nestjs/common");
const tenant_portal_service_1 = require("./tenant-portal.service");
const tenant_portal_jwt_guard_1 = require("./guards/tenant-portal-jwt.guard");
const portal_auth_dto_1 = require("./dto/portal-auth.dto");
const portal_payment_dto_1 = require("./dto/portal-payment.dto");
const swagger_1 = require("@nestjs/swagger");
let TenantPortalController = class TenantPortalController {
    constructor(service) {
        this.service = service;
    }
    setupPassword(dto) {
        return this.service.setupPassword(dto);
    }
    login(dto) {
        return this.service.login(dto);
    }
    getProfile(req) {
        return this.service.getProfile(req.user.sub);
    }
    updateProfile(req, dto) {
        return this.service.updateProfile(req.user.sub, dto);
    }
    getLease(req) {
        return this.service.getLease(req.user.sub, req.user.orgTenantId);
    }
    signLease(id, req) {
        return this.service.signLease(id, req.user.sub, req.user.orgTenantId);
    }
    getPayments(req) {
        return this.service.getPayments(req.user.sub, req.user.orgTenantId);
    }
    confirmMpesaPayment(req, body) {
        return this.service.confirmMpesaPayment(req.user.sub, req.user.orgTenantId, body);
    }
    initiateMpesaPayment(req, dto) {
        return this.service.initiateMpesaPayment(req.user.sub, req.user.orgTenantId, dto);
    }
    getPaymentStatus(id, req) {
        return this.service.getPaymentStatus(id, req.user.sub);
    }
    getOrgSettings(req) {
        return this.service.getOrgSettings(req.user.orgTenantId);
    }
    getInvoices(req) {
        return this.service.getPayments(req.user.sub, req.user.orgTenantId);
    }
    mpesaCallback(body) {
        return this.service.handleMpesaCallback(body);
    }
    getBalance(req) {
        return this.service.getBalance(req.user.sub, req.user.orgTenantId);
    }
    submitDamage(req, body) {
        return this.service.submitDamage(req.user.sub, req.user.orgTenantId, body);
    }
    getDamages(req) {
        return this.service.getDamages(req.user.sub, req.user.orgTenantId);
    }
    resendReceipt(id, req) {
        return this.service.resendReceiptEmail(id, req.user.sub, req.user.orgTenantId);
    }
    resendInvite(propertyTenantId, req) {
        return this.service.resendInvite(propertyTenantId, req.user.orgTenantId);
    }
};
exports.TenantPortalController = TenantPortalController;
__decorate([
    (0, common_1.Post)('auth/setup-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Set portal password using invite token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [portal_auth_dto_1.PortalSetupPasswordDto]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "setupPassword", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Tenant portal login' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [portal_auth_dto_1.PortalLoginDto]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant profile' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getProfile", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant phone number' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, portal_auth_dto_1.UpdatePortalProfileDto]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "updateProfile", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('lease'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant active lease' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getLease", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('lease/:id/sign'),
    (0, swagger_1.ApiOperation)({ summary: 'Sign lease agreement' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "signLease", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant payment history' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getPayments", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('payments/confirm-mpesa'),
    (0, swagger_1.ApiOperation)({ summary: 'Record confirmed M-Pesa payment (proxy-polled flow)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "confirmMpesaPayment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('payments/mpesa-stk'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate M-Pesa STK push payment' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, portal_payment_dto_1.InitiateMpesaPaymentDto]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "initiateMpesaPayment", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('payments/:id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check payment status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getPaymentStatus", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('org-settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get organisation settings (incl. mpesaClientId)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getOrgSettings", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoices (completed payments)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Post)('mpesa/callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'M-Pesa STK push callback (Safaricom only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "mpesaCallback", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant rent balance (outstanding dues)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getBalance", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('damages'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a damage report' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "submitDamage", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Get)('damages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all damage reports submitted by this tenant' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "getDamages", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('payments/:id/resend-receipt'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend payment receipt email' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "resendReceipt", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(tenant_portal_jwt_guard_1.TenantPortalJwtGuard),
    (0, common_1.Post)('resend-invite/:propertyTenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend portal invite email (for property managers)' }),
    __param(0, (0, common_1.Param)('propertyTenantId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TenantPortalController.prototype, "resendInvite", null);
exports.TenantPortalController = TenantPortalController = __decorate([
    (0, swagger_1.ApiTags)('Tenant Portal'),
    (0, common_1.Controller)('tenant-portal'),
    __metadata("design:paramtypes", [tenant_portal_service_1.TenantPortalService])
], TenantPortalController);
//# sourceMappingURL=tenant-portal.controller.js.map