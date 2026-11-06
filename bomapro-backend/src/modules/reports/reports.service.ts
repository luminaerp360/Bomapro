import { Injectable } from '@nestjs/common';
import { PropertyRepository } from '../properties/repositories/property.repository';
import { UnitRepository } from '../units/repositories/unit.repository';
import { PropertyTenantRepository } from '../property-tenants/repositories/property-tenant.repository';
import { LeaseRepository } from '../leases/repositories/lease.repository';
import { PaymentRepository } from '../payments/repositories/payment.repository';
import { DamageRepository } from '../damages/repositories/damage.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly propertyRepo: PropertyRepository,
    private readonly unitRepo: UnitRepository,
    private readonly propertyTenantRepo: PropertyTenantRepository,
    private readonly leaseRepo: LeaseRepository,
    private readonly paymentRepo: PaymentRepository,
    private readonly damageRepo: DamageRepository,
  ) {}

  async getDashboardStats(tenantId: string, propertyId?: string) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    const [
      totalProperties,
      unitStats,
      totalTenants,
      activeTenants,
      totalLeases,
      activeLeases,
      activeLeaseMonthlyRent,
      totalPayments,
      completedPayments,
      pendingPayments,
      totalDamages,
      damageBreakdown,
      monthlyRevenue,
      lastMonthRevenue,
      totalRevenue,
      annualMonths,
      paymentBreakdown,
      expiringSoon,
    ] = await Promise.all([
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

    const occupancyRate =
      unitStats.total > 0 ? Math.round((unitStats.occupied / unitStats.total) * 100) : 0;

    // Expected monthly rent from active leases or occupied units
    const expectedMonthly = Math.max(activeLeaseMonthlyRent || 0, unitStats.occupiedRentTotal || 0);
    const collectionRate =
      expectedMonthly > 0 ? Math.min(100, Math.round((monthlyRevenue / expectedMonthly) * 100)) : 0;
    const arrears = Math.max(0, expectedMonthly - monthlyRevenue);
    const momGrowth =
      lastMonthRevenue > 0
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : monthlyRevenue > 0
          ? 100
          : 0;

    const statusAmounts: Record<string, number> = {};
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
        expiringSoon: expiringSoon.slice(0, 6).map((l: any) => ({
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

  async getRevenueReport(tenantId: string, year: number, propertyId?: string) {
    const months = await this.paymentRepo.getAnnualMonthlyRevenue(tenantId, year, propertyId);
    const totalAnnual = months.reduce((sum, m) => sum + m.revenue, 0);
    return { year, months, totalAnnual };
  }

  async getOccupancyReport(tenantId: string) {
    const [properties, unitStats] = await Promise.all([
      this.propertyRepo.findByTenant(tenantId),
      this.unitRepo.getUnitStats(tenantId),
    ]);
    const total = properties.length;
    const active = properties.filter((p) => p.status === 'active').length;
    const inactive = properties.filter((p) => p.status === 'inactive').length;
    const maintenance = properties.filter((p) => p.status === 'maintenance').length;
    const occupancyRate =
      unitStats.total > 0 ? Math.round((unitStats.occupied / unitStats.total) * 100) : 0;
    return {
      total,
      active,
      inactive,
      maintenance,
      units: unitStats,
      occupancyRate,
    };
  }

  async getLeaseExpiryReport(tenantId: string, daysAhead = 90, propertyId?: string) {
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

  async getDamagesReport(tenantId: string, propertyId?: string) {
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
}
