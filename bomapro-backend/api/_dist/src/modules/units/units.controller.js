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
exports.UnitsController = void 0;
const common_1 = require("@nestjs/common");
const units_service_1 = require("./units.service");
const unit_dto_1 = require("./dto/unit.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let UnitsController = class UnitsController {
    constructor(unitsService) {
        this.unitsService = unitsService;
    }
    create(dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.create(dto, tenantId);
    }
    findAll(req, page, limit, propertyId, status, search, unitType, floor) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.findAll(tenantId, page, limit, propertyId, status, search, unitType, floor);
    }
    getStats(req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.getStats(tenantId);
    }
    findOne(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.findById(id, tenantId);
    }
    findByProperty(propertyId, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.findByProperty(propertyId, tenantId);
    }
    findAvailable(propertyId, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.findAvailableByProperty(propertyId, tenantId);
    }
    update(id, dto, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.update(id, tenantId, dto);
    }
    remove(id, req) {
        const tenantId = req.user?.tenantId || '';
        return this.unitsService.remove(id, tenantId);
    }
};
exports.UnitsController = UnitsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [unit_dto_1.CreateUnitDto, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('propertyId')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('unitType')),
    __param(7, (0, common_1.Query)('floor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('property/:propertyId'),
    __param(0, (0, common_1.Param)('propertyId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "findByProperty", null);
__decorate([
    (0, common_1.Get)('available/:propertyId'),
    __param(0, (0, common_1.Param)('propertyId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "findAvailable", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, unit_dto_1.UpdateUnitDto, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UnitsController.prototype, "remove", null);
exports.UnitsController = UnitsController = __decorate([
    (0, swagger_1.ApiTags)('Units'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('units'),
    __metadata("design:paramtypes", [units_service_1.UnitsService])
], UnitsController);
//# sourceMappingURL=units.controller.js.map