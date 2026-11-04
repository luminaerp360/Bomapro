export declare class CreatePropertyTenantDto {
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    kraPin?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    occupation?: string;
    employer?: string;
    avatar?: string;
    documents?: string[];
}
declare const UpdatePropertyTenantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePropertyTenantDto>>;
export declare class UpdatePropertyTenantDto extends UpdatePropertyTenantDto_base {
    isActive?: boolean;
    currentPropertyId?: string;
    currentLeaseId?: string;
}
export {};
