import { PaymentStatus, PaymentMethod, PaymentType } from '../schemas/payment.schema';
export declare class CreatePaymentDto {
    leaseId: string;
    propertyTenantId: string;
    propertyId: string;
    amount: number;
    currency?: string;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    paymentType?: PaymentType;
    mpesaTransactionId?: string;
    mpesaPhoneNumber?: string;
    bankReference?: string;
    referenceNumber?: string;
    chequeNumber?: string;
    paymentPeriod?: string;
    notes?: string;
    propertyName?: string;
    propertyTenantName?: string;
}
declare const UpdatePaymentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePaymentDto>>;
export declare class UpdatePaymentDto extends UpdatePaymentDto_base {
    status?: PaymentStatus;
    receiptNumber?: string;
}
export {};
