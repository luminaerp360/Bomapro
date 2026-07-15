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
exports.PropertyTenantsController = void 0;
const common_1 = require("@nestjs/common");
const property_tenants_service_1 = require("./property-tenants.service");
const property_tenant_dto_1 = require("./dto/property-tenant.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let PropertyTenantsController = class PropertyTenantsController {
    constructor(propertyTenantsService) {
        this.propertyTenantsService = propertyTenantsService;
    }
    create(dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.create(dto, tenantId);
    }
    findAll(req, page, limit, search, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.findAll(tenantId, page, limit, search, propertyId);
    }
    getStats(req) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.getStats(tenantId);
    }
    findByProperty(req, propertyId) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.findByProperty(tenantId, propertyId);
    }
    findOne(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.findById(id, tenantId);
    }
    update(id, dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.update(id, tenantId, dto);
    }
    remove(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.propertyTenantsService.remove(id, tenantId);
    }
};
exports.PropertyTenantsController = PropertyTenantsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [property_tenant_dto_1.CreatePropertyTenantDto, Object]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('by-property/:propertyId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, property_tenant_dto_1.UpdatePropertyTenantDto, Object]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PropertyTenantsController.prototype, "remove", null);
exports.PropertyTenantsController = PropertyTenantsController = __decorate([
    (0, swagger_1.ApiTags)('Property Tenants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('property-tenants'),
    __metadata("design:paramtypes", [property_tenants_service_1.PropertyTenantsService])
], PropertyTenantsController);
//# sourceMappingURL=property-tenants.controller.js.map