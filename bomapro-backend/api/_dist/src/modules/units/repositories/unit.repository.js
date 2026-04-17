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
exports.UnitRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const unit_schema_1 = require("../schemas/unit.schema");
let UnitRepository = class UnitRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findByProperty(propertyId, tenantId) {
        return this.model
            .find({ propertyId, tenantId, isDeleted: false })
            .sort({ unitNumber: 1 })
            .exec();
    }
    async findByPropertyId(propertyId) {
        return this.model
            .find({ propertyId, isDeleted: false })
            .sort({ unitNumber: 1 })
            .exec();
    }
    async findByTenant(tenantId) {
        return this.model
            .find({ tenantId, isDeleted: false })
            .sort({ createdAt: -1 })
            .exec();
    }
    async findByStatus(tenantId, status) {
        return this.model
            .find({ tenantId, status, isDeleted: false })
            .sort({ unitNumber: 1 })
            .exec();
    }
    async findOccupied(tenantId) {
        return this.model
            .find({
            tenantId,
            status: 'occupied',
            currentTenantId: { $ne: '' },
            isDeleted: false,
        })
            .sort({ unitNumber: 1 })
            .exec();
    }
    async findAvailable(propertyId, tenantId) {
        return this.model
            .find({
            propertyId,
            tenantId,
            status: 'vacant',
            currentTenantId: '',
            isDeleted: false,
        })
            .sort({ unitNumber: 1 })
            .exec();
    }
    async findByPropertyTenant(propertyTenantId, tenantId) {
        return this.model
            .findOne({
            currentPropertyTenantId: propertyTenantId,
            tenantId,
            isDeleted: false,
        })
            .exec();
    }
    async countByTenant(tenantId) {
        return this.model.countDocuments({ tenantId, isDeleted: false });
    }
    async countByStatus(tenantId, status) {
        return this.model.countDocuments({ tenantId, status, isDeleted: false });
    }
    async countByProperty(propertyId, tenantId) {
        return this.model.countDocuments({ propertyId, tenantId, isDeleted: false });
    }
    async countOccupied(tenantId) {
        return this.model.countDocuments({
            tenantId,
            status: 'occupied',
            currentTenantId: { $ne: '' },
            isDeleted: false,
        });
    }
    async countAvailable(tenantId) {
        return this.model.countDocuments({
            tenantId,
            status: 'vacant',
            currentTenantId: '',
            isDeleted: false,
        });
    }
};
exports.UnitRepository = UnitRepository;
exports.UnitRepository = UnitRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(unit_schema_1.Unit.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UnitRepository);
//# sourceMappingURL=unit.repository.js.map