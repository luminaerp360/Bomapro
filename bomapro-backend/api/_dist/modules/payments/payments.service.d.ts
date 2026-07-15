import { Model } from 'mongoose';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { PropertyTenant } from '../property-tenants/schemas/property-tenant.schema';
export declare class PaymentsService {
    private readonly paymentRepository;
    private readonly rentSchedulesService;
    private propertyTenantModel;
    constructor(paymentRepository: PaymentRepository, rentSchedulesService: RentSchedulesService, propertyTenantModel: Model<PropertyTenant>);
    create(dto: CreatePaymentDto, tenantId: string, recordedBy: string): Promise<import("./schemas/payment.schema").Payment>;
    findAll(tenantId: string, page?: number, limit?: number, search?: string, status?: string, paymentMethod?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/payment.schema").Payment>>;
    findById(id: string, tenantId: string): Promise<import("./schemas/payment.schema").Payment>;
    findByLease(tenantId: string, leaseId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByProperty(tenantId: string, propertyId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByPropertyTenant(tenantId: string, propertyTenantId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByDateRange(tenantId: string, startDate: string, endDate: string): Promise<import("./schemas/payment.schema").Payment[]>;
    markCompleted(id: string, tenantId: string): Promise<import("./schemas/payment.schema").Payment>;
    update(id: string, tenantId: string, dto: UpdatePaymentDto): Promise<import("./schemas/payment.schema").Payment>;
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
        amount: number;
        phoneNumber: string;
        mpesaReceiptNumber: string;
        checkoutRequestId: string;
        paymentPeriod?: string;
        paymentType?: string;
        notes?: string;
        propertyName?: string;
        propertyTenantName?: string;
    }): Promise<import("./schemas/payment.schema").Payment>;
    resendInvoice(id: string, tenantId: string): Promise<{
        message: string;
    }>;
    sendPaymentReminder(propertyTenantId: string, tenantId: string): Promise<{
        message: string;
    }>;
}
