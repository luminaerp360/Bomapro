import { Model } from 'mongoose';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
import { Lease } from '../leases/schemas/lease.schema';
import { Property } from '../properties/schemas/property.schema';
import { Unit } from '../units/schemas/unit.schema';
export declare class PaymentsService {
    private readonly paymentRepository;
    private readonly rentSchedulesService;
    private propertyTenantModel;
    private leaseModel;
    private propertyModel;
    private unitModel;
    constructor(paymentRepository: PaymentRepository, rentSchedulesService: RentSchedulesService, propertyTenantModel: Model<PropertyTenant>, leaseModel: Model<Lease>, propertyModel: Model<Property>, unitModel: Model<Unit>);
    private enrichPayments;
    create(dto: CreatePaymentDto, tenantId: string, recordedBy: string): Promise<any>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, status?: string, paymentMethod?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string, tenantId: string): Promise<any>;
    findByLease(tenantId: string, leaseId: string): Promise<any[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<any[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<any[]>;
    findByDateRange(tenantId: string, startDate: string, endDate: string): Promise<any[]>;
    markCompleted(id: string, tenantId: string): Promise<any>;
    update(id: string, tenantId: string, dto: UpdatePaymentDto): Promise<any>;
    remove(id: string, tenantId: string): Promise<boolean>;
    getStats(tenantId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        totalCompleted: number;
        totalPending: number;
        monthlyRevenue: number;
    }>;
    confirmMpesaPayment(tenantId: string, recordedBy: string, dto: {
        leaseId?: string;
        propertyTenantId?: string;
        propertyId?: string;
        unitId?: string;
        unitNumber?: string;
        leaseNumber?: string;
        scheduleId?: string;
        selectedMonths?: string[];
        amount: number;
        phoneNumber: string;
        mpesaReceiptNumber: string;
        checkoutRequestId: string;
        paymentPeriod?: string;
        paymentType?: string;
        notes?: string;
        propertyName?: string;
        propertyTenantName?: string;
    }): Promise<any>;
    resendInvoice(id: string, tenantId: string): Promise<{
        message: string;
    }>;
    sendPaymentReminder(propertyTenantId: string, tenantId: string): Promise<{
        message: string;
    }>;
}
