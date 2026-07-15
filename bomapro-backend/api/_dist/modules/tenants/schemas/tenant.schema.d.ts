import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum TenantPlan {
    FREE = "free",
    BASIC = "basic",
    PRO = "pro",
    ENTERPRISE = "enterprise"
}
export declare class Tenant extends BaseDocument {
    name: string;
    slug: string;
    domain: string;
    logoUrl: string;
    isActive: boolean;
    plan: TenantPlan;
    settings: Record<string, any>;
    ownerUserId: string;
    contactEmail: string;
    billingEmail: string;
    maxUsers: number;
    maxProperties: number;
    mpesaClientId: string;
}
export declare const TenantSchema: import("mongoose").Schema<Tenant, import("mongoose").Model<Tenant, any, any, any, import("mongoose").Document<unknown, any, Tenant, any, {}> & Tenant & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Tenant, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Tenant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Tenant> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
