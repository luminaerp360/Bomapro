import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum UnitStatus {
    VACANT = "vacant",
    OCCUPIED = "occupied",
    MAINTENANCE = "maintenance",
    RESERVED = "reserved"
}
export declare enum UnitType {
    BEDSITTER = "bedsitter",
    SINGLE_ROOM = "single_room",
    ONE_BEDROOM = "one_bedroom",
    TWO_BEDROOM = "two_bedroom",
    THREE_BEDROOM = "three_bedroom"
}
export declare enum RentCycle {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    ANNUAL = "annual"
}
export declare class Unit extends BaseDocument {
    tenantId: string;
    propertyId: string;
    unitNumber: string;
    description: string;
    unitType: UnitType;
    floor: number | string;
    status: UnitStatus;
    rentAmount: number;
    currency: string;
    securityDeposit: number;
    electricityMeterNumber: string;
    waterMeterNumber: string;
    rentCycle: RentCycle;
    currentTenantId: string;
    currentLeaseId: string;
    currentPropertyTenantId: string;
}
export declare const UnitSchema: import("mongoose").Schema<Unit, import("mongoose").Model<Unit, any, any, any, import("mongoose").Document<unknown, any, Unit, any, {}> & Unit & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Unit, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Unit>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Unit> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
