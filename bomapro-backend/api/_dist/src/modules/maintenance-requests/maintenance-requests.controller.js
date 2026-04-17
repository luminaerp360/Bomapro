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
exports.MaintenanceRequestsController = void 0;
const common_1 = require("@nestjs/common");
const maintenance_requests_service_1 = require("./maintenance-requests.service");
const maintenance_request_dto_1 = require("./dto/maintenance-request.dto");
let MaintenanceRequestsController = class MaintenanceRequestsController {
    constructor(maintenanceRequestsService) {
        this.maintenanceRequestsService = maintenanceRequestsService;
    }
    async create(req, dto) {
        return this.maintenanceRequestsService.create(req.user.tenantId, req.user.role === 'tenant' ? req.user.propertyTenantId : undefined, dto);
    }
    async getAll(req, page = 1, limit = 20, status) {
        if (req.user.role === 'tenant') {
            return this.maintenanceRequestsService.getByPropertyTenant(req.user.tenantId, req.user.propertyTenantId, page, limit, status);
        }
        return this.maintenanceRequestsService.getByTenant(req.user.tenantId, page, limit, status);
    }
    async getByUnit(req, unitId, page = 1, limit = 20) {
        return this.maintenanceRequestsService.getByUnit(req.user.tenantId, unitId, page, limit);
    }
    async getById(req, id) {
        const propertyTenantId = req.user.role === 'tenant' ? req.user.propertyTenantId : undefined;
        return this.maintenanceRequestsService.getById(id, req.user.tenantId, propertyTenantId);
    }
    async update(req, id, dto) {
        return this.maintenanceRequestsService.update(id, req.user.tenantId, dto);
    }
    async complete(req, id, dto) {
        return this.maintenanceRequestsService.complete(id, req.user.tenantId, dto);
    }
    async assign(req, id, userId) {
        return this.maintenanceRequestsService.assignRequest(id, req.user.tenantId, userId);
    }
    async delete(req, id) {
        return this.maintenanceRequestsService.delete(id, req.user.tenantId);
    }
    async getStats(req) {
        return this.maintenanceRequestsService.getStats(req.user.tenantId);
    }
};
exports.MaintenanceRequestsController = MaintenanceRequestsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, maintenance_request_dto_1.CreateMaintenanceRequestDto]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('unit/:unitId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('unitId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "getByUnit", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "getById", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, maintenance_request_dto_1.UpdateMaintenanceRequestDto]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, maintenance_request_dto_1.CompleteMaintenanceRequestDto]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/assign/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceRequestsController.prototype, "getStats", null);
exports.MaintenanceRequestsController = MaintenanceRequestsController = __decorate([
    (0, common_1.Controller)('maintenance-requests'),
    __metadata("design:paramtypes", [maintenance_requests_service_1.MaintenanceRequestsService])
], MaintenanceRequestsController);
//# sourceMappingURL=maintenance-requests.controller.js.map