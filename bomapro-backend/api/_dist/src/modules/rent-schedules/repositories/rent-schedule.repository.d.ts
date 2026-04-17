import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { RentSchedule } from '../schemas/rent-schedule.schema';
export declare class RentScheduleRepository extends BaseRepository<RentSchedule> {
    constructor(model: Model<RentSchedule>);
    findByLease(tenantId: string, leaseId: string): Promise<RentSchedule[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<RentSchedule[]>;
    findByUnit(tenantId: string, unitId: string): Promise<RentSchedule[]>;
    findOverdue(tenantId: string): Promise<RentSchedule[]>;
    findByStatus(tenantId: string, status: string): Promise<RentSchedule[]>;
    findNextUnpaidSchedule(leaseId: string): Promise<RentSchedule | null>;
    getTotalByLease(tenantId: string, leaseId: string): Promise<{
        totalDue: number;
        totalPaid: number;
        totalOverdue: number;
    }>;
    countByStatus(tenantId: string, status: string): Promise<number>;
}
