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
exports.LeaseRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const lease_schema_1 = require("../schemas/lease.schema");
let LeaseRepository = class LeaseRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findByTenant(tenantId) {
        return this.model.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    }
    async findByProperty(tenantId, propertyId) {
        return this.model.find({ tenantId, propertyId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.model.find({ tenantId, propertyTenantId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    }
    async findByUnit(tenantId, unitId) {
        return this.model.find({ tenantId, unitId, isDeleted: false }).sort({ createdAt: -1 }).exec();
    }
    async findActiveByUnit(unitId, tenantId) {
        return this.model.findOne({ unitId, tenantId, status: 'active', isDeleted: false }).exec();
    }
    async findActiveByProperty(propertyId) {
        return this.model.findOne({ propertyId, status: 'active', isDeleted: false }).exec();
    }
    async findExpiringSoon(tenantId, daysAhead) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        return this.model.find({
            tenantId,
            status: 'active',
            endDate: { $lte: futureDate },
            isDeleted: false,
        }).sort({ endDate: 1 }).exec();
    }
    async countByStatus(tenantId, status) {
        return this.model.countDocuments({ tenantId, status, isDeleted: false });
    }
    async countByTenant(tenantId) {
        return this.model.countDocuments({ tenantId, isDeleted: false });
    }
    async countByProperty(tenantId, propertyId) {
        return this.model.countDocuments({ tenantId, propertyId, isDeleted: false });
    }
    async countByStatusAndProperty(tenantId, status, propertyId) {
        return this.model.countDocuments({ tenantId, propertyId, status, isDeleted: false });
    }
    async findExpiringSoonByProperty(tenantId, propertyId, daysAhead) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        return this.model.find({ tenantId, propertyId, status: 'active', endDate: { $lte: futureDate }, isDeleted: false }).sort({ endDate: 1 }).exec();
    }
};
exports.LeaseRepository = LeaseRepository;
exports.LeaseRepository = LeaseRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(lease_schema_1.Lease.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LeaseRepository);
//# sourceMappingURL=lease.repository.js.map