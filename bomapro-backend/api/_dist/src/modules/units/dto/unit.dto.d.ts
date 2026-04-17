import { UnitStatus, UnitType, RentCycle } from '../schemas/unit.schema';
export declare class CreateUnitDto {
    propertyId: string;
    unitNumber: string;
    description?: string;
    unitType?: UnitType;
    floor?: number | string;
    rentAmount: number;
    currency?: string;
    securityDeposit?: number;
    electricityMeterNumber?: string;
    waterMeterNumber?: string;
    rentCycle?: RentCycle;
    status?: UnitStatus;
}
declare const UpdateUnitDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUnitDto>>;
export declare class UpdateUnitDto extends UpdateUnitDto_base {
}
export {};
