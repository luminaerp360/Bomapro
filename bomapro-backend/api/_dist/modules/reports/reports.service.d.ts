import { PropertyRepository } from '../properties/repositories/property.repository';
import { UnitRepository } from '../units/repositories/unit.repository';
import { PropertyTenantRepository } from '../property-tenants/repositories/property-tenant.repository';
import { LeaseRepository } from '../leases/repositories/lease.repository';
import { PaymentRepository } from '../payments/repositories/payment.repository';
import { DamageRepository } from '../damages/repositories/damage.repository';
export declare class ReportsService {
    private readonly propertyRepo;
    private readonly unitRepo;
    private readonly propertyTenantRepo;
    private readonly leaseRepo;
    private readonly paymentRepo;
    private readonly damageRepo;
    constructor(propertyRepo: PropertyRepository, unitRepo: UnitRepository, propertyTenantRepo: PropertyTenantRepository, leaseRepo: LeaseRepository, paymentRepo: PaymentRepository, damageRepo: DamageRepository);
    getDashboardStats(tenantId: string, propertyId?: string): Promise<{
        properties: {
            total: number;
            available: number;
            occupied: number;
            occupancyRate: number;
        };
        units: {
            total: number;
            occupied: number;
            vacant: number;
            maintenance: number;
            available: number;
            occupiedRentTotal: number;
            potentialRentTotal: number;
        };
        tenants: {
            total: number;
            active: number;
            inactive: number;
        };
        leases: {
            total: number;
            active: number;
            expiringSoonCount: number;
            expiringSoon: {
                id: any;
                leaseNumber: any;
                propertyName: any;
                tenantName: any;
                endDate: any;
                rentAmount: any;
                daysRemaining: number;
            }[];
        };
        payments: {
            total: number;
            completed: number;
            pending: number;
            completedAmount: number;
            pendingAmount: number;
            byMethod: {
                method: string;
                amount: number;
                count: number;
            }[];
            byStatus: {
                status: string;
                amount: number;
                count: number;
            }[];
            byProperty: {
                propertyId: string;
                propertyName: string;
                amount: number;
                count: number;
            }[];
            recent: import("../payments/schemas/payment.schema").Payment[];
        };
        revenue: {
            monthly: number;
            lastMonth: number;
            momGrowth: number;
            expectedMonthly: number;
            potentialMonthly: number;
            collectionRate: number;
            arrears: number;
            total: number;
            monthlyTrend: {
                month: number;
                revenue: number;
            }[];
        };
        damages: {
            total: number;
            reported: number;
            assessed: number;
            inRepair: number;
            repaired: number;
            estimatedCost: any;
            actualCost: any;
            recent: (import("mongoose").FlattenMaps<import("../damages/schemas/damage.schema").Damage> & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            })[];
        };
    }>;
    getRevenueReport(tenantId: string, year: number, propertyId?: string): Promise<{
        year: number;
        months: {
            month: number;
            revenue: number;
        }[];
        totalAnnual: number;
    }>;
    getOccupancyReport(tenantId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
        units: {
            total: number;
            occupied: number;
            vacant: number;
            maintenance: number;
            available: number;
            occupiedRentTotal: number;
            potentialRentTotal: number;
        };
        occupancyRate: number;
    }>;
    getLeaseExpiryReport(tenantId: string, daysAhead?: number, propertyId?: string): Promise<{
        daysAhead: number;
        count: number;
        leases: {
            id: import("mongoose").Types.ObjectId;
            leaseNumber: string;
            propertyName: string;
            tenantName: string;
            endDate: Date;
            rentAmount: number;
        }[];
    }>;
    getDamagesReport(tenantId: string, propertyId?: string): Promise<{
        total: number;
        reported: number;
        assessed: number;
        inRepair: number;
        repaired: number;
        totalCost: number;
    }>;
}
