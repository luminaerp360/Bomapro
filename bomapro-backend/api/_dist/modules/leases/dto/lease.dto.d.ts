import { LeaseStatus, PaymentFrequency } from '../schemas/lease.schema';
export declare class CreateLeaseDto {
    propertyId: string;
    unitId: string;
    propertyTenantId: string;
    startDate: string;
    endDate?: string;
    rentAmount: number;
    currency?: string;
    depositAmount?: number;
    paymentFrequency?: PaymentFrequency;
    paymentDueDay?: number;
    lateFeeAmount?: number;
    gracePeriodDays?: number;
    terms?: string;
    documents?: string[];
    notes?: string;
    propertyName?: string;
    propertyTenantName?: string;
}
declare const UpdateLeaseDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLeaseDto>>;
export declare class UpdateLeaseDto extends UpdateLeaseDto_base {
    status?: LeaseStatus;
    depositPaid?: boolean;
    terminationReason?: string;
}
export {};
