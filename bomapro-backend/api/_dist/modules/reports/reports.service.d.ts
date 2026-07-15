import { PropertyRepository } from '../properties/repositories/property.repository';
import { PropertyTenantRepository } from '../property-tenants/repositories/property-tenant.repository';
import { LeaseRepository } from '../leases/repositories/lease.repository';
import { PaymentRepository } from '../payments/repositories/payment.repository';
import { DamageRepository } from '../damages/repositories/damage.repository';
export declare class ReportsService {
    private readonly propertyRepo;
    private readonly propertyTenantRepo;
    private readonly leaseRepo;
    private readonly paymentRepo;
    private readonly damageRepo;
    constructor(propertyRepo: PropertyRepository, propertyTenantRepo: PropertyTenantRepository, leaseRepo: LeaseRepository, paymentRepo: PaymentRepository, damageRepo: DamageRepository);
    getDashboardStats(tenantId: string, propertyId?: string): Promise<{
        properties: {
            total: number;
            available: number;
            occupied: number;
            occupancyRate: number;
        };
        tenants: {
            total: number;
            active: number;
        };
        leases: {
            total: number;
            active: number;
            expiringSoonCount: number;
        };
        payments: {
            total: number;
            completed: number;
            pending: number;
        };
        revenue: {
            monthly: number;
            total: number;
        };
        damages: {
            total: number;
            reported: number;
        };
    }>;
    getRevenueReport(tenantId: string, year: number, propertyId?: string): Promise<{
        year: number;
        months: any[];
        totalAnnual: any;
    }>;
    getOccupancyReport(tenantId: string): Promise<{
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
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
