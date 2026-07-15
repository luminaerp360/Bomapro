import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum PropertyType {
    APARTMENT = "apartment",
    HOUSE = "house",
    COMMERCIAL = "commercial",
    LAND = "land",
    BEDSITTER = "bedsitter",
    SINGLE_ROOM = "single_room",
    ONE_BEDROOM = "one_bedroom",
    TWO_BEDROOM = "two_bedroom",
    THREE_BEDROOM = "three_bedroom"
}
export declare enum PropertyStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance"
}
export declare class Property extends BaseDocument {
    tenantId: string;
    name: string;
    propertyCode: string;
    type: PropertyType;
    status: PropertyStatus;
    address: string;
    description: string;
    owner: string;
    yearBuilt: number;
    amenities: string[];
    images: string[];
    floors: number;
}
export declare const PropertySchema: import("mongoose").Schema<Property, import("mongoose").Model<Property, any, any, any, import("mongoose").Document<unknown, any, Property, any, {}> & Property & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Property, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Property>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Property> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
