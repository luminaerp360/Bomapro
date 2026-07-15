import { RentScheduleRepository } from './repositories/rent-schedule.repository';
export interface CreateScheduleDto {
    leaseId: string;
    tenantId: string;
    propertyId: string;
    unitId: string;
    dueDate: Date;
    amount: number;
    month: string;
    gracePeriodDays?: number;
}
export declare class RentSchedulesService {
    private readonly scheduleRepository;
    constructor(scheduleRepository: RentScheduleRepository);
    createSchedule(dto: CreateScheduleDto): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    generateSchedulesForLease(leaseId: string, tenantId: string, propertyId: string, unitId: string, startDate: Date, rentAmount: number, gracePeriodDays?: number, months?: number): Promise<any[]>;
    findByLease(tenantId: string, leaseId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findByUnit(tenantId: string, unitId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    findOverdue(tenantId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule[]>;
    getLeaseBalance(tenantId: string, leaseId: string): Promise<{
        balance: number;
        totalDue: number;
        totalPaid: number;
        totalOverdue: number;
    }>;
    recordPayment(tenantId: string, leaseId: string, paymentAmount: number, paymentId: string, paymentDate: Date, paymentMethod: string): Promise<{
        success: boolean;
        appliedAmount: number;
        overpayment: number;
    }>;
    updateScheduleStatus(scheduleId: string, tenantId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    delete(scheduleId: string, tenantId: string): Promise<boolean>;
}
