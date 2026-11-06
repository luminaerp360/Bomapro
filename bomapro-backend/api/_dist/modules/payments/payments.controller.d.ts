import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(dto: CreatePaymentDto, req: any): Promise<any>;
    findAll(req: any, page?: number, limit?: number, search?: string, status?: string, paymentMethod?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(req: any): Promise<{
        total: number;
        completed: number;
        pending: number;
        failed: number;
        totalCompleted: number;
        totalPending: number;
        monthlyRevenue: number;
    }>;
    findByLease(req: any, leaseId: string): Promise<any[]>;
    findByProperty(req: any, propertyId: string): Promise<any[]>;
    findByPropertyTenant(req: any, propertyTenantId: string): Promise<any[]>;
    findByDateRange(req: any, startDate: string, endDate: string): Promise<any[]>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, dto: UpdatePaymentDto, req: any): Promise<any>;
    markCompleted(id: string, req: any): Promise<any>;
    confirmMpesaPayment(body: any, req: any): Promise<any>;
    resendInvoice(id: string, req: any): Promise<{
        message: string;
    }>;
    sendReminder(propertyTenantId: string, req: any): Promise<{
        message: string;
    }>;
    remove(id: string, req: any): Promise<boolean>;
}
