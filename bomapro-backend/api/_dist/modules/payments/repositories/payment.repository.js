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
exports.PaymentRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const base_repository_1 = require("../../database/repositories/base.repository");
const payment_schema_1 = require("../schemas/payment.schema");
let PaymentRepository = class PaymentRepository extends base_repository_1.BaseRepository {
    constructor(model) {
        super(model);
    }
    async findByTenant(tenantId) {
        return this.model.find({ tenantId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
    }
    async findByLease(tenantId, leaseId) {
        return this.model.find({ tenantId, leaseId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
    }
    async findByProperty(tenantId, propertyId) {
        return this.model.find({ tenantId, propertyId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
    }
    async findByPropertyTenant(tenantId, propertyTenantId) {
        return this.model.find({ tenantId, propertyTenantId, isDeleted: false }).sort({ paymentDate: -1 }).exec();
    }
    async findByDateRange(tenantId, startDate, endDate) {
        return this.model.find({
            tenantId,
            paymentDate: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        }).sort({ paymentDate: -1 }).exec();
    }
    async getTotalByStatus(tenantId, status) {
        const result = await this.model.aggregate([
            { $match: { tenantId, status, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async getMonthlyRevenue(tenantId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const result = await this.model.aggregate([
            {
                $match: {
                    tenantId,
                    status: 'completed',
                    paymentDate: { $gte: startDate, $lte: endDate },
                    isDeleted: false,
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async getAnnualMonthlyRevenue(tenantId, year, propertyId) {
        const startDate = new Date(year, 0, 1, 0, 0, 0);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        const match = {
            tenantId,
            status: 'completed',
            paymentDate: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };
        if (propertyId) {
            match.propertyId = propertyId;
        }
        const rows = await this.model.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $month: '$paymentDate' },
                    revenue: { $sum: '$amount' },
                },
            },
        ]);
        const byMonth = new Map();
        for (const row of rows) {
            byMonth.set(row._id, row.revenue || 0);
        }
        const months = [];
        for (let m = 1; m <= 12; m++) {
            months.push({ month: m, revenue: byMonth.get(m) || 0 });
        }
        return months;
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
    async getMonthlyRevenueByProperty(tenantId, year, month, propertyId) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const result = await this.model.aggregate([
            { $match: { tenantId, propertyId, status: 'completed', paymentDate: { $gte: startDate, $lte: endDate }, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async getTotalByStatusAndProperty(tenantId, status, propertyId) {
        const result = await this.model.aggregate([
            { $match: { tenantId, propertyId, status, isDeleted: false } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return result.length > 0 ? result[0].total : 0;
    }
    async getDashboardPaymentBreakdown(tenantId, propertyId) {
        const match = { tenantId, isDeleted: false };
        if (propertyId) {
            match.propertyId = propertyId;
        }
        const [byMethodRaw, byStatusRaw, byPropertyRaw, recent] = await Promise.all([
            this.model.aggregate([
                { $match: { ...match, status: 'completed' } },
                {
                    $group: {
                        _id: { $ifNull: ['$paymentMethod', 'other'] },
                        amount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { amount: -1 } },
            ]),
            this.model.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { $ifNull: ['$status', 'pending'] },
                        amount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
            ]),
            this.model.aggregate([
                { $match: { ...match, status: 'completed' } },
                {
                    $group: {
                        _id: '$propertyId',
                        propertyName: { $first: '$propertyName' },
                        amount: { $sum: '$amount' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { amount: -1 } },
                { $limit: 8 },
            ]),
            this.model.find(match).sort({ paymentDate: -1, createdAt: -1 }).limit(6).lean().exec(),
        ]);
        return {
            byMethod: byMethodRaw.map((r) => ({
                method: r._id || 'other',
                amount: r.amount || 0,
                count: r.count || 0,
            })),
            byStatus: byStatusRaw.map((r) => ({
                status: r._id || 'pending',
                amount: r.amount || 0,
                count: r.count || 0,
            })),
            byProperty: byPropertyRaw.map((r) => ({
                propertyId: r._id || '',
                propertyName: r.propertyName || 'Unassigned Property',
                amount: r.amount || 0,
                count: r.count || 0,
            })),
            recent: recent,
        };
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PaymentRepository);
//# sourceMappingURL=payment.repository.js.map