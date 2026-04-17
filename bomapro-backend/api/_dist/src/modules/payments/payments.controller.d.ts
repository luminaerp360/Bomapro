import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(dto: CreatePaymentDto, req: any): Promise<import("./schemas/payment.schema").Payment>;
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string, paymentMethod?: string): Promise<import("../database/interfaces/paginated-response.interface").PaginatedResponse<import("./schemas/payment.schema").Payment>>;
    getStats(req: any): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        totalCompleted: number;
        totalPending: number;
        monthlyRevenue: number;
    }>;
    findByLease(req: any, leaseId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByProperty(req: any, propertyId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByPropertyTenant(req: any, propertyTenantId: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findByDateRange(req: any, startDate: string, endDate: string): Promise<import("./schemas/payment.schema").Payment[]>;
    findOne(id: string, req: any): Promise<import("./schemas/payment.schema").Payment>;
    update(id: string, dto: UpdatePaymentDto, req: any): Promise<import("./schemas/payment.schema").Payment>;
    markCompleted(id: string, req: any): Promise<import("./schemas/payment.schema").Payment>;
    confirmMpesaPayment(body: any, req: any): Promise<import("./schemas/payment.schema").Payment>;
    resendInvoice(id: string, req: any): Promise<{
        message: string;
    }>;
    sendReminder(propertyTenantId: string, req: any): Promise<{
        message: string;
    }>;
    remove(id: string, req: any): Promise<boolean>;
}
