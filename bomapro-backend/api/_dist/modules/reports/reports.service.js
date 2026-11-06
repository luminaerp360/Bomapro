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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const property_repository_1 = require("../properties/repositories/property.repository");
const unit_repository_1 = require("../units/repositories/unit.repository");
const property_tenant_repository_1 = require("../property-tenants/repositories/property-tenant.repository");
const lease_repository_1 = require("../leases/repositories/lease.repository");
const payment_repository_1 = require("../payments/repositories/payment.repository");
const damage_repository_1 = require("../damages/repositories/damage.repository");
let ReportsService = class ReportsService {
    constructor(propertyRepo, unitRepo, propertyTenantRepo, leaseRepo, paymentRepo, damageRepo) {
        this.propertyRepo = propertyRepo;
        this.unitRepo = unitRepo;
        this.propertyTenantRepo = propertyTenantRepo;
        this.leaseRepo = leaseRepo;
        this.paymentRepo = paymentRepo;
        this.damageRepo = damageRepo;
    }
    async getDashboardStats(tenantId, propertyId) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        const [totalProperties, unitStats, totalTenants, activeTenants, totalLeases, activeLeases, activeLeaseMonthlyRent, totalPayments, completedPayments, pendingPayments, totalDamages, damageBreakdown, monthlyRevenue, lastMonthRevenue, totalRevenue, annualMonths, paymentBreakdown, expiringSoon,] = await Promise.all([
            propertyId ? Promise.resolve(1) : this.propertyRepo.countByTenant(tenantId),
            this.unitRepo.getUnitStats(tenantId, propertyId),
            propertyId
                ? this.propertyTenantRepo.countByProperty(tenantId, propertyId)
                : this.propertyTenantRepo.countBySystemTenant(tenantId),
            propertyId
                ? this.propertyTenantRepo.countActiveByProperty(tenantId, propertyId)
                : this.propertyTenantRepo.countActive(tenantId),
            propertyId ? this.leaseRepo.countByProperty(tenantId, propertyId) : this.leaseRepo.countByTenant(tenantId),
            propertyId
                ? this.leaseRepo.countByStatusAndProperty(tenantId, 'active', propertyId)
                : this.leaseRepo.countByStatus(tenantId, 'active'),
            this.leaseRepo.getActiveMonthlyRentTotal(tenantId, propertyId),
            propertyId ? this.paymentRepo.countByProperty(tenantId, propertyId) : this.paymentRepo.countByTenant(tenantId),
            propertyId
                ? this.paymentRepo.countByStatusAndProperty(tenantId, 'completed', propertyId)
                : this.paymentRepo.countByStatus(tenantId, 'completed'),
            propertyId
                ? this.paymentRepo.countByStatusAndProperty(tenantId, 'pending', propertyId)
                : this.paymentRepo.countByStatus(tenantId, 'pending'),
            propertyId ? this.damageRepo.countByProperty(tenantId, propertyId) : this.damageRepo.countByTenant(tenantId),
            this.damageRepo.getDashboardDamageBreakdown(tenantId, propertyId),
            propertyId
                ? this.paymentRepo.getMonthlyRevenueByProperty(tenantId, currentYear, currentMonth, propertyId)
                : this.paymentRepo.getMonthlyRevenue(tenantId, currentYear, currentMonth),
            propertyId
                ? this.paymentRepo.getMonthlyRevenueByProperty(tenantId, prevYear, prevMonth, propertyId)
                : this.paymentRepo.getMonthlyRevenue(tenantId, prevYear, prevMonth),
            propertyId
                ? this.paymentRepo.getTotalByStatusAndProperty(tenantId, 'completed', propertyId)
                : this.paymentRepo.getTotalByStatus(tenantId, 'completed'),
            this.paymentRepo.getAnnualMonthlyRevenue(tenantId, currentYear, propertyId),
            this.paymentRepo.getDashboardPaymentBreakdown(tenantId, propertyId),
            propertyId
                ? this.leaseRepo.findExpiringSoonByProperty(tenantId, propertyId, 60)
                : this.leaseRepo.findExpiringSoon(tenantId, 60),
        ]);
        const occupancyRate = unitStats.total > 0 ? Math.round((unitStats.occupied / unitStats.total) * 100) : 0;
        const expectedMonthly = Math.max(activeLeaseMonthlyRent || 0, unitStats.occupiedRentTotal || 0);
        const collectionRate = expectedMonthly > 0 ? Math.min(100, Math.round((monthlyRevenue / expectedMonthly) * 100)) : 0;
        const arrears = Math.max(0, expectedMonthly - monthlyRevenue);
        const momGrowth = lastMonthRevenue > 0
            ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : monthlyRevenue > 0
                ? 100
                : 0;
        const statusAmounts = {};
        for (const s of paymentBreakdown.byStatus) {
            statusAmounts[s.status] = s.amount;
        }
        return {
            properties: {
                total: totalProperties,
                available: unitStats.available,
                occupied: unitStats.occupied,
                occupancyRate,
            },
            units: unitStats,
            tenants: {
                total: totalTenants,
                active: activeTenants,
                inactive: Math.max(0, totalTenants - activeTenants),
            },
            leases: {
                total: totalLeases,
                active: activeLeases,
                expiringSoonCount: expiringSoon.length,
                expiringSoon: expiringSoon.slice(0, 6).map((l) => ({
                    id: l._id,
                    leaseNumber: l.leaseNumber,
                    propertyName: l.propertyName,
                    tenantName: l.propertyTenantName,
                    endDate: l.endDate,
                    rentAmount: l.rentAmount,
                    daysRemaining: l.endDate
                        ? Math.ceil((new Date(l.endDate).getTime() - now.getTime()) / 86400000)
                        : 0,
                })),
            },
            payments: {
                total: totalPayments,
                completed: completedPayments,
                pending: pendingPayments,
                completedAmount: statusAmounts['completed'] || totalRevenue,
                pendingAmount: statusAmounts['pending'] || 0,
                byMethod: paymentBreakdown.byMethod,
                byStatus: paymentBreakdown.byStatus,
                byProperty: paymentBreakdown.byProperty,
                recent: paymentBreakdown.recent,
            },
            revenue: {
                monthly: monthlyRevenue,
                lastMonth: lastMonthRevenue,
                momGrowth,
                expectedMonthly,
                potentialMonthly: unitStats.potentialRentTotal || 0,
                collectionRate,
                arrears,
                total: totalRevenue,
                monthlyTrend: annualMonths,
            },
            damages: {
                total: totalDamages,
                reported: damageBreakdown.reported,
                assessed: damageBreakdown.assessed,
                inRepair: damageBreakdown.inRepair,
                repaired: damageBreakdown.repaired,
                estimatedCost: damageBreakdown.estimatedCost,
                actualCost: damageBreakdown.actualCost,
                recent: damageBreakdown.recent,
            },
        };
    }
    async getRevenueReport(tenantId, year, propertyId) {
        const months = await this.paymentRepo.getAnnualMonthlyRevenue(tenantId, year, propertyId);
        const totalAnnual = months.reduce((sum, m) => sum + m.revenue, 0);
        return { year, months, totalAnnual };
    }
    async getOccupancyReport(tenantId) {
        const [properties, unitStats] = await Promise.all([
            this.propertyRepo.findByTenant(tenantId),
            this.unitRepo.getUnitStats(tenantId),
        ]);
        const total = properties.length;
        const active = properties.filter((p) => p.status === 'active').length;
        const inactive = properties.filter((p) => p.status === 'inactive').length;
        const maintenance = properties.filter((p) => p.status === 'maintenance').length;
        const occupancyRate = unitStats.total > 0 ? Math.round((unitStats.occupied / unitStats.total) * 100) : 0;
        return {
            total,
            active,
            inactive,
            maintenance,
            units: unitStats,
            occupancyRate,
        };
    }
    async getLeaseExpiryReport(tenantId, daysAhead = 90, propertyId) {
        const expiring = propertyId
            ? await this.leaseRepo.findExpiringSoonByProperty(tenantId, propertyId, daysAhead)
            : await this.leaseRepo.findExpiringSoon(tenantId, daysAhead);
        return {
            daysAhead,
            count: expiring.length,
            leases: expiring.map((l) => ({
                id: l._id,
                leaseNumber: l.leaseNumber,
                propertyName: l.propertyName,
                tenantName: l.propertyTenantName,
                endDate: l.endDate,
                rentAmount: l.rentAmount,
            })),
        };
    }
    async getDamagesReport(tenantId, propertyId) {
        const totalCost = propertyId
            ? await this.damageRepo.getTotalCostByProperty(tenantId, propertyId)
            : await this.damageRepo.getTotalCost(tenantId);
        const [total, reported, assessed, inRepair, repaired] = await Promise.all([
            propertyId ? this.damageRepo.countByProperty(tenantId, propertyId) : this.damageRepo.countByTenant(tenantId),
            propertyId ? this.damageRepo.countByStatusAndProperty(tenantId, 'reported', propertyId) : this.damageRepo.countByStatus(tenantId, 'reported'),
            propertyId ? this.damageRepo.countByStatusAndProperty(tenantId, 'assessed', propertyId) : this.damageRepo.countByStatus(tenantId, 'assessed'),
            propertyId ? this.damageRepo.countByStatusAndProperty(tenantId, 'in_repair', propertyId) : this.damageRepo.countByStatus(tenantId, 'in_repair'),
            propertyId ? this.damageRepo.countByStatusAndProperty(tenantId, 'repaired', propertyId) : this.damageRepo.countByStatus(tenantId, 'repaired'),
        ]);
        return { total, reported, assessed, inRepair, repaired, totalCost };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [property_repository_1.PropertyRepository,
        unit_repository_1.UnitRepository,
        property_tenant_repository_1.PropertyTenantRepository,
        lease_repository_1.LeaseRepository,
        payment_repository_1.PaymentRepository,
        damage_repository_1.DamageRepository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map