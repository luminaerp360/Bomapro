import { RentSchedulesService } from './rent-schedules.service';
export declare class RentSchedulesController {
    private readonly scheduleService;
    constructor(scheduleService: RentSchedulesService);
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string, propertyId?: string, leaseId?: string, month?: string, scope?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        stats: {
            totalInvoicedDue: number;
            totalCollected: number;
            totalOutstanding: number;
            overdueCount: number;
            overdueAmount: number;
            unpaidCount: number;
            paidThisMonthCount: number;
            paidThisMonthAmount: number;
        };
    }>;
    findByLease(req: any, leaseId: string): Promise<any[]>;
    findByProperty(req: any, propertyId: string): Promise<any[]>;
    findByUnit(req: any, unitId: string): Promise<any[]>;
    findOverdue(req: any): Promise<any[]>;
    getLeaseBalance(req: any, leaseId: string): Promise<{
        balance: number;
        contractBalance: number;
        totalDue: number;
        totalPaid: number;
        totalOverdue: number;
        totalContractAmount: number;
    }>;
    sendInvoice(scheduleId: string, req: any): Promise<{
        message: string;
    }>;
    applyPayment(scheduleId: string, paymentId: string, amount: number, paymentDate: string, paymentMethod: string, req: any): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    delete(scheduleId: string, req: any): Promise<boolean>;
}
