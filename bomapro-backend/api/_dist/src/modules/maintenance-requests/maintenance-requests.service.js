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
exports.MaintenanceRequestsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const maintenance_request_schema_1 = require("./schemas/maintenance-request.schema");
let MaintenanceRequestsService = class MaintenanceRequestsService {
    constructor(maintenanceRequestModel) {
        this.maintenanceRequestModel = maintenanceRequestModel;
    }
    async create(tenantId, propertyTenantId, dto) {
        const request = new this.maintenanceRequestModel({
            tenantId,
            propertyTenantId,
            ...dto,
        });
        return request.save();
    }
    async getById(id, tenantId, propertyTenantId) {
        const request = await this.maintenanceRequestModel.findById(id);
        if (!request)
            throw new common_1.NotFoundException('Maintenance request not found');
        if (request.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (propertyTenantId && request.propertyTenantId !== propertyTenantId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        return request;
    }
    async getByTenant(tenantId, page = 1, limit = 20, status) {
        const filter = { tenantId, isDeleted: { $ne: true } };
        if (status) {
            filter.status = status;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.maintenanceRequestModel
                .find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.maintenanceRequestModel.countDocuments(filter),
        ]);
        return {
            data,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    async getByPropertyTenant(tenantId, propertyTenantId, page = 1, limit = 20, status) {
        const filter = { tenantId, propertyTenantId, isDeleted: { $ne: true } };
        if (status) {
            filter.status = status;
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.maintenanceRequestModel
                .find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.maintenanceRequestModel.countDocuments(filter),
        ]);
        return {
            data,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    async getByUnit(tenantId, unitId, page = 1, limit = 20) {
        const filter = { tenantId, unitId, isDeleted: { $ne: true } };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.maintenanceRequestModel
                .find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
            this.maintenanceRequestModel.countDocuments(filter),
        ]);
        return {
            data,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    async update(id, tenantId, dto) {
        const request = await this.getById(id, tenantId);
        Object.assign(request, dto);
        return request.save();
    }
    async complete(id, tenantId, dto) {
        const request = await this.getById(id, tenantId);
        request.status = 'resolved';
        request.completedAt = new Date();
        request.completionNotes = dto.completionNotes;
        if (dto.attachments?.length) {
            request.attachments = dto.attachments;
        }
        return request.save();
    }
    async assignRequest(id, tenantId, userId) {
        const request = await this.getById(id, tenantId);
        request.assignedToUserId = userId;
        return request.save();
    }
    async delete(id, tenantId) {
        const request = await this.getById(id, tenantId);
        request.isDeleted = true;
        return request.save();
    }
    async getStats(tenantId) {
        const [pending, inProgress, resolved] = await Promise.all([
            this.maintenanceRequestModel.countDocuments({
                tenantId,
                status: 'pending',
                isDeleted: { $ne: true },
            }),
            this.maintenanceRequestModel.countDocuments({
                tenantId,
                status: 'in_progress',
                isDeleted: { $ne: true },
            }),
            this.maintenanceRequestModel.countDocuments({
                tenantId,
                status: 'resolved',
                isDeleted: { $ne: true },
            }),
        ]);
        return {
            pending,
            inProgress,
            resolved,
            total: pending + inProgress + resolved,
        };
    }
};
exports.MaintenanceRequestsService = MaintenanceRequestsService;
exports.MaintenanceRequestsService = MaintenanceRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(maintenance_request_schema_1.MaintenanceRequest.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MaintenanceRequestsService);
//# sourceMappingURL=maintenance-requests.service.js.map