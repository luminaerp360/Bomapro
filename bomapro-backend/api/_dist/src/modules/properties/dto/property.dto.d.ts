import { PropertyType, PropertyStatus } from '../schemas/property.schema';
export declare class CreatePropertyDto {
    name: string;
    propertyCode?: string;
    type?: PropertyType;
    status?: PropertyStatus;
    address: string;
    description?: string;
    owner?: string;
    yearBuilt?: number;
    amenities?: string[];
    images?: string[];
    floors?: number;
}
declare const UpdatePropertyDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePropertyDto>>;
export declare class UpdatePropertyDto extends UpdatePropertyDto_base {
    status?: PropertyStatus;
}
export {};
