import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
import { Unit } from '../units/schemas/unit.schema';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Tenant } from '../tenants/schemas/tenant.schema';
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
    private readonly leaseModel;
    private readonly propertyModel;
    private readonly unitModel;
    private readonly propertyTenantModel;
    private readonly tenantModel;
    constructor(scheduleRepository: RentScheduleRepository, leaseModel: Model<Lease>, propertyModel: Model<Property>, unitModel: Model<Unit>, propertyTenantModel: Model<PropertyTenant>, tenantModel: Model<Tenant>);
    getMailConfig(tenantId: string): Promise<{
        transporter: nodemailer.Transporter<import("nodemailer/lib/smtp-transport").SentMessageInfo, import("nodemailer/lib/smtp-transport").Options>;
        fromHeader: string;
        fromEmail: any;
        fromName: any;
        orgName: any;
        frontendUrl: any;
        adminEmails: string[];
        preferences: any;
        billingSettings: any;
        supportPhone: any;
    }>;
    private getTokenSecret;
    generatePublicToken(scheduleId: string, tenantId: string): string;
    verifyPublicToken(token: string): {
        scheduleId: string;
        tenantId: string;
    };
    findByPublicToken(token: string): Promise<any>;
    createSchedule(dto: CreateScheduleDto): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    generateSchedulesForLease(leaseId: string, tenantId: string, propertyId: string, unitId: string, startDate: Date, rentAmount: number, gracePeriodDays?: number, months?: number): Promise<any[]>;
    ensureSchedulesForActiveLeases(tenantId: string): Promise<void>;
    extendLeaseSchedulesIfNeeded(tenantId: string, leaseOrId: any, existingSchedules?: any[]): Promise<void>;
    enrichSchedules(schedules: any[], tenantId: string): Promise<any[]>;
    findAll(tenantId: string, options?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        propertyId?: string;
        leaseId?: string;
        month?: string;
        scope?: string;
    }): Promise<{
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
    findByLease(tenantId: string, leaseId: string): Promise<any[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<any[]>;
    findByUnit(tenantId: string, unitId: string): Promise<any[]>;
    findOverdue(tenantId: string): Promise<any[]>;
    getLeaseBalance(tenantId: string, leaseId: string): Promise<{
        balance: number;
        contractBalance: number;
        totalDue: number;
        totalPaid: number;
        totalOverdue: number;
        totalContractAmount: number;
    }>;
    private parseTargetMonths;
    recordPayment(tenantId: string, leaseId: string, paymentAmount: number, paymentId: string, paymentDate: Date, paymentMethod: string, options?: {
        scheduleId?: string;
        selectedMonths?: string[];
        paymentPeriod?: string;
    }): Promise<{
        success: boolean;
        appliedAmount: number;
        overpayment: number;
    }>;
    reversePayment(tenantId: string, leaseId: string, paymentId: string, paymentAmount: number): Promise<void>;
    sendInvoiceEmail(scheduleId: string, tenantId: string): Promise<{
        message: string;
        publicPayUrl: string;
    }>;
    sendTenantReminderWithLinks(propertyTenantId: string, tenantId: string): Promise<{
        message: string;
        publicPayUrl: string;
    }>;
    sendBulkReminders(tenantId: string, mode?: 'overdue' | 'all_due'): Promise<{
        tenantsEmailed: number;
        adminsNotified: number;
        accountsCount: number;
        totalDueAmount: number;
        message: string;
    }>;
    updateScheduleStatus(scheduleId: string, tenantId: string): Promise<import("./schemas/rent-schedule.schema").RentSchedule>;
    delete(scheduleId: string, tenantId: string): Promise<boolean>;
    cancelFutureSchedulesForLease(tenantId: string, leaseId: string, terminationDate?: Date): Promise<void>;
    deleteSchedulesForLease(tenantId: string, leaseId: string): Promise<void>;
}
