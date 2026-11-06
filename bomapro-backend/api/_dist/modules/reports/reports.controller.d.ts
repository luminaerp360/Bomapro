import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboard(req: any, propertyId?: string): Promise<{
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
    getRevenue(req: any, year?: number, propertyId?: string): Promise<{
        year: number;
        months: {
            month: number;
            revenue: number;
        }[];
        totalAnnual: number;
    }>;
    getOccupancy(req: any): Promise<{
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
    getLeaseExpiry(req: any, days?: number, propertyId?: string): Promise<{
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
    getDamages(req: any, propertyId?: string): Promise<{
        total: number;
        reported: number;
        assessed: number;
        inRepair: number;
        repaired: number;
        totalCost: number;
    }>;
}
