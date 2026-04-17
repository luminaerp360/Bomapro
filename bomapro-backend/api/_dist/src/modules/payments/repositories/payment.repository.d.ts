import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Payment } from '../schemas/payment.schema';
export declare class PaymentRepository extends BaseRepository<Payment> {
    constructor(model: Model<Payment>);
    findByTenant(tenantId: string): Promise<Payment[]>;
    findByLease(tenantId: string, leaseId: string): Promise<Payment[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<Payment[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<Payment[]>;
    findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<Payment[]>;
    getTotalByStatus(tenantId: string, status: string): Promise<number>;
    getMonthlyRevenue(tenantId: string, year: number, month: number): Promise<number>;
    countByTenant(tenantId: string): Promise<number>;
    countByStatus(tenantId: string, status: string): Promise<number>;
    countByProperty(tenantId: string, propertyId: string): Promise<number>;
    countByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number>;
    getMonthlyRevenueByProperty(tenantId: string, year: number, month: number, propertyId: string): Promise<number>;
    getTotalByStatusAndProperty(tenantId: string, status: string, propertyId: string): Promise<number>;
}
