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
exports.LeasesController = void 0;
const common_1 = require("@nestjs/common");
const leases_service_1 = require("./leases.service");
const lease_dto_1 = require("./dto/lease.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let LeasesController = class LeasesController {
    constructor(leasesService) {
        this.leasesService = leasesService;
    }
    create(dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.create(dto, tenantId);
    }
    findAll(req, page, limit, search, status) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findAll(tenantId, page, limit, search, status);
    }
    getStats(req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.getStats(tenantId);
    }
    getExpiringSoon(req, days) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findExpiringSoon(tenantId, days);
    }
    findByProperty(req, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findByProperty(tenantId, propertyId);
    }
    findByPropertyTenant(req, propertyTenantId) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findByPropertyTenant(tenantId, propertyTenantId);
    }
    findByUnit(req, unitId) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findByUnit(tenantId, unitId);
    }
    findOne(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findById(id, tenantId);
    }
    async findWithBalance(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.findWithBalance(id, tenantId);
    }
    update(id, dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.update(id, tenantId, dto);
    }
    activate(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.activate(id, tenantId);
    }
    terminate(id, reason, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.terminate(id, tenantId, reason);
    }
    sign(id, req) {
        const tenantId = req.user?.tenantId || '';
        const propertyTenantId = req.user?.propertyTenantId || '';
        return this.leasesService.signLease(id, propertyTenantId, tenantId);
    }
    remove(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.leasesService.remove(id, tenantId);
    }
};
exports.LeasesController = LeasesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lease_dto_1.CreateLeaseDto, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('expiring-soon'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "getExpiringSoon", null);
__decorate([
    (0, common_1.Get)('by-property/:propertyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)('by-tenant/:propertyTenantId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyTenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findByPropertyTenant", null);
__decorate([
    (0, common_1.Get)('by-unit/:unitId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findByUnit", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/details-with-balance'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeasesController.prototype, "findWithBalance", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lease_dto_1.UpdateLeaseDto, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "activate", null);
__decorate([
    (0, common_1.Put)(':id/terminate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "terminate", null);
__decorate([
    (0, common_1.Put)(':id/sign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "sign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeasesController.prototype, "remove", null);
exports.LeasesController = LeasesController = __decorate([
    (0, swagger_1.ApiTags)('Leases'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('leases'),
    __metadata("design:paramtypes", [leases_service_1.LeasesService])
], LeasesController);
//# sourceMappingURL=leases.controller.js.map