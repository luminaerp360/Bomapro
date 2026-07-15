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
exports.DamagesController = void 0;
const common_1 = require("@nestjs/common");
const damages_service_1 = require("./damages.service");
const damage_dto_1 = require("./dto/damage.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let DamagesController = class DamagesController {
    constructor(damagesService) {
        this.damagesService = damagesService;
    }
    create(dto, req) {
        const tenantId = req.user?.tenantId || '';
        const reportedBy = req.user?.userId || '';
        return this.damagesService.create(dto, tenantId, reportedBy);
    }
    findAll(req, page, limit, search, status, severity) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.findAll(tenantId, page, limit, search, status, severity);
    }
    getStats(req) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.getStats(tenantId);
    }
    findByProperty(req, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.findByProperty(tenantId, propertyId);
    }
    findByPropertyTenant(req, propertyTenantId) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.findByPropertyTenant(tenantId, propertyTenantId);
    }
    findOne(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.findById(id, tenantId);
    }
    update(id, dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.update(id, tenantId, dto);
    }
    remove(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.damagesService.remove(id, tenantId);
    }
};
exports.DamagesController = DamagesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [damage_dto_1.CreateDamageDto, Object]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('severity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('by-property/:propertyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)('by-tenant/:propertyTenantId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyTenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "findByPropertyTenant", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, damage_dto_1.UpdateDamageDto, Object]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DamagesController.prototype, "remove", null);
exports.DamagesController = DamagesController = __decorate([
    (0, swagger_1.ApiTags)('Damages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('damages'),
    __metadata("design:paramtypes", [damages_service_1.DamagesService])
], DamagesController);
//# sourceMappingURL=damages.controller.js.map