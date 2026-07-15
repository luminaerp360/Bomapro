import { RentSchedulesService } from './rent-schedules.service';
export declare class RentSchedulesController {
    private readonly scheduleService;
    constructor(scheduleService: RentSchedulesService);
    findByLease(req: any, leaseId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findByProperty(req: any, propertyId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findByUnit(req: any, unitId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findOverdue(req: any): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    getLeaseBalance(req: any, leaseId: string): Promise<{
        balance: number;
        totalDue: number;
        totalPaid: number;
        totalOverdue: number;
    }>;
    applyPayment(scheduleId: string, paymentId: string, amount: number, paymentDate: string, paymentMethod: string, req: any): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    delete(scheduleId: string, req: any): Promise<boolean>;
}
