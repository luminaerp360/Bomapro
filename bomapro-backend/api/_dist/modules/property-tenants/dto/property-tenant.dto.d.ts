export declare class CreatePropertyTenantDto {
    name: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    kraPin?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    occupation?: string;
    employer?: string;
    notes?: string;
    avatar?: string;
    documents?: string[];
    propertyId?: string;
    unitId?: string;
    startDate?: string;
    rentAmount?: number;
    depositAmount?: number;
}
declare const UpdatePropertyTenantDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePropertyTenantDto>>;
export declare class UpdatePropertyTenantDto extends UpdatePropertyTenantDto_base {
    isActive?: boolean;
    currentPropertyId?: string;
    currentLeaseId?: string;
}
export {};
