import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum DamageStatus {
    REPORTED = "reported",
    ASSESSED = "assessed",
    IN_REPAIR = "in_repair",
    REPAIRED = "repaired",
    DEDUCTED = "deducted",
    CLOSED = "closed"
}
export declare enum DamageSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum DamageType {
    STRUCTURAL = "structural",
    PLUMBING = "plumbing",
    ELECTRICAL = "electrical",
    APPLIANCE = "appliance",
    COSMETIC = "cosmetic",
    FIXTURE = "fixture",
    FLOORING = "flooring",
    WINDOW_DOOR = "window_door",
    OTHER = "other"
}
export declare class Damage extends BaseDocument {
    tenantId: string;
    propertyId: string;
    propertyTenantId: string;
    leaseId: string;
    description: string;
    damageType: DamageType;
    severity: DamageSeverity;
    status: DamageStatus;
    estimatedCost: number;
    actualCost: number;
    currency: string;
    reportedDate: Date;
    assessedDate: Date;
    repairedDate: Date;
    images: string[];
    location: string;
    notes: string;
    repairVendor: string;
    deductedFromDeposit: boolean;
    propertyName: string;
    propertyTenantName: string;
    reportedBy: string;
}
export declare const DamageSchema: import("mongoose").Schema<Damage, import("mongoose").Model<Damage, any, any, any, import("mongoose").Document<unknown, any, Damage, any, {}> & Damage & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Damage, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Damage>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Damage> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
