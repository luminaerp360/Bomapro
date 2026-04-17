import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    PARTIAL = "partial"
}
export declare enum PaymentMethod {
    MPESA = "mpesa",
    BANK_TRANSFER = "bank_transfer",
    CASH = "cash",
    CHEQUE = "cheque",
    CARD = "card",
    OTHER = "other"
}
export declare enum PaymentType {
    RENT = "rent",
    DEPOSIT = "deposit",
    LATE_FEE = "late_fee",
    DAMAGE = "damage",
    UTILITY = "utility",
    OTHER = "other"
}
export declare class Payment extends BaseDocument {
    tenantId: string;
    leaseId: string;
    propertyTenantId: string;
    propertyId: string;
    amount: number;
    currency: string;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    paymentType: PaymentType;
    status: PaymentStatus;
    mpesaTransactionId: string;
    mpesaPhoneNumber: string;
    bankReference: string;
    chequeNumber: string;
    receiptNumber: string;
    referenceNumber: string;
    paymentPeriod: string;
    notes: string;
    propertyName: string;
    propertyTenantName: string;
    recordedBy: string;
}
export declare const PaymentSchema: import("mongoose").Schema<Payment, import("mongoose").Model<Payment, any, any, any, import("mongoose").Document<unknown, any, Payment, any, {}> & Payment & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Payment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Payment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Payment> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
