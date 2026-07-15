import { DamageStatus, DamageSeverity, DamageType } from '../schemas/damage.schema';
export declare class CreateDamageDto {
    propertyId: string;
    propertyTenantId?: string;
    leaseId?: string;
    description: string;
    damageType?: DamageType;
    severity?: DamageSeverity;
    estimatedCost?: number;
    reportedDate: string;
    images?: string[];
    location?: string;
    notes?: string;
    propertyName?: string;
    propertyTenantName?: string;
}
declare const UpdateDamageDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDamageDto>>;
export declare class UpdateDamageDto extends UpdateDamageDto_base {
    status?: DamageStatus;
    actualCost?: number;
    repairVendor?: string;
    deductedFromDeposit?: boolean;
}
export {};
