import { TenantPlan } from '../schemas/tenant.schema';
export declare class CreateTenantDto {
    name: string;
    slug: string;
    domain?: string;
    logoUrl?: string;
    plan?: TenantPlan;
    contactEmail?: string;
    billingEmail?: string;
    maxUsers?: number;
    maxProperties?: number;
}
declare const UpdateTenantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTenantDto>>;
export declare class UpdateTenantDto extends UpdateTenantDto_base {
    isActive?: boolean;
    mpesaClientId?: string;
}
export {};
