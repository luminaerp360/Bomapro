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
exports.RentSchedulesController = void 0;
const common_1 = require("@nestjs/common");
const rent_schedules_service_1 = require("./rent-schedules.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let RentSchedulesController = class RentSchedulesController {
    constructor(scheduleService) {
        this.scheduleService = scheduleService;
    }
    findAll(req, page, limit, search, status, propertyId, leaseId, month, scope) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.findAll(tenantId, {
            page,
            limit,
            search,
            status,
            propertyId,
            leaseId,
            month,
            scope,
        });
    }
    findByLease(req, leaseId) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.findByLease(tenantId, leaseId);
    }
    findByProperty(req, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.findByProperty(tenantId, propertyId);
    }
    findByUnit(req, unitId) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.findByUnit(tenantId, unitId);
    }
    findOverdue(req) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.findOverdue(tenantId);
    }
    getLeaseBalance(req, leaseId) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.getLeaseBalance(tenantId, leaseId);
    }
    sendInvoice(scheduleId, req) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.sendInvoiceEmail(scheduleId, tenantId);
    }
    applyPayment(scheduleId, paymentId, amount, paymentDate, paymentMethod, req) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.updateScheduleStatus(scheduleId, tenantId);
    }
    delete(scheduleId, req) {
        const tenantId = req.user?.tenantId || '';
        return this.scheduleService.delete(scheduleId, tenantId);
    }
};
exports.RentSchedulesController = RentSchedulesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('propertyId')),
    __param(6, (0, common_1.Query)('leaseId')),
    __param(7, (0, common_1.Query)('month')),
    __param(8, (0, common_1.Query)('scope')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-lease/:leaseId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "findByLease", null);
__decorate([
    (0, common_1.Get)('by-property/:propertyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)('by-unit/:unitId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "findByUnit", null);
__decorate([
    (0, common_1.Get)('overdue'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "findOverdue", null);
__decorate([
    (0, common_1.Get)('balance/:leaseId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('leaseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "getLeaseBalance", null);
__decorate([
    (0, common_1.Post)(':scheduleId/send-invoice'),
    __param(0, (0, common_1.Param)('scheduleId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "sendInvoice", null);
__decorate([
    (0, common_1.Post)(':scheduleId/apply-payment'),
    __param(0, (0, common_1.Param)('scheduleId')),
    __param(1, (0, common_1.Body)('paymentId')),
    __param(2, (0, common_1.Body)('amount')),
    __param(3, (0, common_1.Body)('paymentDate')),
    __param(4, (0, common_1.Body)('paymentMethod')),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String, String, Object]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "applyPayment", null);
__decorate([
    (0, common_1.Delete)(':scheduleId'),
    __param(0, (0, common_1.Param)('scheduleId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RentSchedulesController.prototype, "delete", null);
exports.RentSchedulesController = RentSchedulesController = __decorate([
    (0, swagger_1.ApiTags)('Rent Schedules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rent-schedules'),
    __metadata("design:paramtypes", [rent_schedules_service_1.RentSchedulesService])
], RentSchedulesController);
//# sourceMappingURL=rent-schedules.controller.js.map