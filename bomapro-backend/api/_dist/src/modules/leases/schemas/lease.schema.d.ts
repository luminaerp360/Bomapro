import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum LeaseStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    EXPIRED = "expired",
    TERMINATED = "terminated",
    RENEWED = "renewed"
}
export declare enum PaymentFrequency {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    SEMI_ANNUALLY = "semi_annually",
    ANNUALLY = "annually"
}
export declare class Lease extends BaseDocument {
    tenantId: string;
    propertyId: string;
    unitId: string;
    propertyTenantId: string;
    leaseNumber: string;
    status: LeaseStatus;
    startDate: Date;
    endDate?: Date;
    rentAmount: number;
    currency: string;
    depositAmount: number;
    depositPaid: boolean;
    paymentFrequency: PaymentFrequency;
    paymentDueDay: number;
    lateFeeAmount: number;
    gracePeriodDays: number;
    terms: string;
    documents: string[];
    terminatedAt: Date;
    terminationReason: string;
    renewedFromLeaseId: string;
    propertyName: string;
    propertyTenantName: string;
    isSigned: boolean;
    signedAt: Date;
    signedByPropertyTenantId: string;
    scheduleGenerated: boolean;
    scheduleGeneratedAt?: Date;
}
export declare const LeaseSchema: import("mongoose").Schema<Lease, import("mongoose").Model<Lease, any, any, any, import("mongoose").Document<unknown, any, Lease, any, {}> & Lease & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Lease, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Lease>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Lease> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
