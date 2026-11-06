import { Model } from 'mongoose';
import { PaymentsService } from './payments.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { Tenant } from '../tenants/schemas/tenant.schema';
import { PaymentMethod } from './schemas/payment.schema';
export declare class PublicInvoicesController {
    private readonly paymentsService;
    private readonly rentSchedulesService;
    private readonly tenantModel;
    constructor(paymentsService: PaymentsService, rentSchedulesService: RentSchedulesService, tenantModel: Model<Tenant>);
    getPublicInvoice(token: string): Promise<{
        invoice: any;
        organization: {
            name: any;
            logoUrl: any;
            contactEmail: any;
            mpesaClientId: any;
        };
    }>;
    payManual(token: string, body: {
        amount: number;
        paymentMethod: PaymentMethod;
        mpesaTransactionId?: string;
        mpesaPhoneNumber?: string;
        bankReference?: string;
        chequeNumber?: string;
        referenceNumber?: string;
        notes?: string;
    }): Promise<{
        message: string;
        payment: any;
        invoice: any;
    }>;
    confirmMpesa(token: string, body: {
        amount: number;
        phoneNumber: string;
        mpesaReceiptNumber: string;
        checkoutRequestId: string;
        notes?: string;
    }): Promise<{
        message: string;
        payment: any;
        invoice: any;
    }>;
}
