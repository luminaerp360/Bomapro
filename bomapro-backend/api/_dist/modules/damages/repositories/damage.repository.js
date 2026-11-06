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
exports.DamageRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const damage_schema_1 = require("../schemas/damage.schema");
let DamageRepository = class DamageRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findByTenant(tenantId) {
        return this.model.find({ tenantId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
    }
    async findByProperty(tenantId, propertyId) {
        return this.model.find({ tenantId, propertyId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.model.find({ tenantId, propertyTenantId, isDeleted: false }).sort({ reportedDate: -1 }).exec();
    }
    async findByStatus(tenantId, status) {
        return this.model.find({ tenantId, status, isDeleted: false }).sort({ reportedDate: -1 }).exec();
    }
    async getTotalCost(tenantId) {
        const result = await this.model.aggregate([
            { $match: { tenantId, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$actualCost' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async countByTenant(tenantId) {
        return this.model.countDocuments({ tenantId, isDeleted: false });
    }
    async countByStatus(tenantId, status) {
        return this.model.countDocuments({ tenantId, status, isDeleted: false });
    }
    async countByProperty(tenantId, propertyId) {
        return this.model.countDocuments({ tenantId, propertyId, isDeleted: false });
    }
    async countByStatusAndProperty(tenantId, status, propertyId) {
        return this.model.countDocuments({ tenantId, propertyId, status, isDeleted: false });
    }
    async getTotalCostByProperty(tenantId, propertyId) {
        const result = await this.model.aggregate([
            { $match: { tenantId, propertyId, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$actualCost' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async getDashboardDamageBreakdown(tenantId, propertyId) {
        const match = { tenantId, isDeleted: false };
        if (propertyId) {
            match.propertyId = propertyId;
        }
        const [byStatusRaw, costAgg, recent] = await Promise.all([
            this.model.aggregate([
                { $match: match },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            this.model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        estimatedCost: { $sum: { $ifNull: ['$estimatedCost', 0] } },
                        actualCost: { $sum: { $ifNull: ['$actualCost', 0] } },
                    },
                },
            ]),
            this.model.find(match).sort({ reportedDate: -1, createdAt: -1 }).limit(5).lean().exec(),
        ]);
        const counts = {};
        for (const row of byStatusRaw) {
            counts[row._id || 'reported'] = row.count || 0;
        }
        return {
            reported: counts['reported'] || 0,
            assessed: counts['assessed'] || 0,
            inRepair: counts['in_repair'] || 0,
            repaired: counts['repaired'] || 0,
            estimatedCost: costAgg[0]?.estimatedCost || 0,
            actualCost: costAgg[0]?.actualCost || 0,
            recent,
        };
    }
};
exports.DamageRepository = DamageRepository;
exports.DamageRepository = DamageRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(damage_schema_1.Damage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DamageRepository);
//# sourceMappingURL=damage.repository.js.map