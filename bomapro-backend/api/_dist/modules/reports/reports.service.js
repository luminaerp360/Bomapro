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
const property_tenant_repository_1 = require("../property-tenants/repositories/property-tenant.repository");
const lease_repository_1 = require("../leases/repositories/lease.repository");
const payment_repository_1 = require("../payments/repositories/payment.repository");
const damage_repository_1 = require("../damages/repositories/damage.repository");
let ReportsService = class ReportsService {
    constructor(propertyRepo, propertyTenantRepo, leaseRepo, paymentRepo, damageRepo) {
        this.propertyRepo = propertyRepo;
        this.propertyTenantRepo = propertyTenantRepo;
        this.leaseRepo = leaseRepo;
        this.paymentRepo = paymentRepo;
        this.damageRepo = damageRepo;
    }
    async getDashboardStats(tenantId, propertyId) {
        const now = new Date();
        if (propertyId) {
            const [totalLeases, activeLeases, totalTenants, activeTenants, totalPayments, completedPayments, pendingPayments, totalDamages, reportedDamages] = await Promise.all([
                this.leaseRepo.countByProperty(tenantId, propertyId),
                this.leaseRepo.countByStatusAndProperty(tenantId, 'active', propertyId),
                this.propertyTenantRepo.countByProperty(tenantId, propertyId),
                this.propertyTenantRepo.countActiveByProperty(tenantId, propertyId),
                this.paymentRepo.countByProperty(tenantId, propertyId),
                this.paymentRepo.countByStatusAndProperty(tenantId, 'completed', propertyId),
                this.paymentRepo.countByStatusAndProperty(tenantId, 'pending', propertyId),
                this.damageRepo.countByProperty(tenantId, propertyId),
                this.damageRepo.countByStatusAndProperty(tenantId, 'reported', propertyId),
            ]);
            const monthlyRevenue = await this.paymentRepo.getMonthlyRevenueByProperty(tenantId, now.getFullYear(), now.getMonth() + 1, propertyId);
            const totalRevenue = await this.paymentRepo.getTotalByStatusAndProperty(tenantId, 'completed', propertyId);
            const expiringSoon = await this.leaseRepo.findExpiringSoonByProperty(tenantId, propertyId, 30);
            return {
                properties: { total: 1, available: 0, occupied: 1, occupancyRate: 100 },
                tenants: { total: totalTenants, active: activeTenants },
                leases: { total: totalLeases, active: activeLeases, expiringSoonCount: expiringSoon.length },
                payments: { total: totalPayments, completed: completedPayments, pending: pendingPayments },
                revenue: { monthly: monthlyRevenue, total: totalRevenue },
                damages: { total: totalDamages, reported: reportedDamages },
            };
        }
        const [totalProperties, availableProperties, occupiedProperties, totalTenants, activeTenants, totalLeases, activeLeases, totalPayments, completedPayments, pendingPayments, totalDamages, reportedDamages,] = await Promise.all([
            this.propertyRepo.countByTenant(tenantId),
            this.propertyRepo.countByStatus(tenantId, 'available'),
            this.propertyRepo.countByStatus(tenantId, 'occupied'),
            this.propertyTenantRepo.countBySystemTenant(tenantId),
            this.propertyTenantRepo.countActive(tenantId),
            this.leaseRepo.countByTenant(tenantId),
            this.leaseRepo.countByStatus(tenantId, 'active'),
            this.paymentRepo.countByTenant(tenantId),
            this.paymentRepo.countByStatus(tenantId, 'completed'),
            this.paymentRepo.countByStatus(tenantId, 'pending'),
            this.damageRepo.countByTenant(tenantId),
            this.damageRepo.countByStatus(tenantId, 'reported'),
        ]);
        const monthlyRevenue = await this.paymentRepo.getMonthlyRevenue(tenantId, now.getFullYear(), now.getMonth() + 1);
        const totalRevenue = await this.paymentRepo.getTotalByStatus(tenantId, 'completed');
        const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;
        const expiringSoon = await this.leaseRepo.findExpiringSoon(tenantId, 30);
        return {
            properties: { total: totalProperties, available: availableProperties, occupied: occupiedProperties, occupancyRate },
            tenants: { total: totalTenants, active: activeTenants },
            leases: { total: totalLeases, active: activeLeases, expiringSoonCount: expiringSoon.length },
            payments: { total: totalPayments, completed: completedPayments, pending: pendingPayments },
            revenue: { monthly: monthlyRevenue, total: totalRevenue },
            damages: { total: totalDamages, reported: reportedDamages },
        };
    }
    async getRevenueReport(tenantId, year, propertyId) {
        const months = [];
        for (let m = 1; m <= 12; m++) {
            const revenue = propertyId
                ? await this.paymentRepo.getMonthlyRevenueByProperty(tenantId, year, m, propertyId)
                : await this.paymentRepo.getMonthlyRevenue(tenantId, year, m);
            months.push({ month: m, revenue });
        }
        const totalAnnual = months.reduce((sum, m) => sum + m.revenue, 0);
        return { year, months, totalAnnual };
    }
    async getOccupancyReport(tenantId) {
        const properties = await this.propertyRepo.findByTenant(tenantId);
        const total = properties.length;
        const active = properties.filter(p => p.status === 'active').length;
        const inactive = properties.filter(p => p.status === 'inactive').length;
        const maintenance = properties.filter(p => p.status === 'maintenance').length;
        return { total, active, inactive, maintenance };
    }
    async getLeaseExpiryReport(tenantId, daysAhead = 90, propertyId) {
        const expiring = propertyId
            ? await this.leaseRepo.findExpiringSoonByProperty(tenantId, propertyId, daysAhead)
            : await this.leaseRepo.findExpiringSoon(tenantId, daysAhead);
        return {
            daysAhead,
            count: expiring.length,
            leases: expiring.map(l => ({
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
        property_tenant_repository_1.PropertyTenantRepository,
        lease_repository_1.LeaseRepository,
        payment_repository_1.PaymentRepository,
        damage_repository_1.DamageRepository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map