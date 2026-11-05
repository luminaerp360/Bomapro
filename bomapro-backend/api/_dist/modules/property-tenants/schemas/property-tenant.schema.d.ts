import { BaseDocument } from '../../database/schemas/base.schema';
export declare class PropertyTenant extends BaseDocument {
    tenantId: string;
    name: string;
    email: string;
    phone: string;
    idNumber: string;
    kraPin: string;
<<<<<<< HEAD
    address: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    occupation: string;
    employer: string;
    notes: string;
=======
    emergencyContactName: string;
    emergencyContactPhone: string;
    occupation: string;
    employer: string;
>>>>>>> 48a44983b554e31f7d32fcbfe5323087ad9634fb
    avatar: string;
    currentPropertyId: string;
    currentLeaseId: string;
    isActive: boolean;
    documents: string[];
    metadata: Record<string, any>;
    portalPassword: string;
    portalPasswordSet: boolean;
    portalInviteToken: string;
    portalInviteTokenExpiry: Date;
    portalInviteTokenUsed: boolean;
}
export declare const PropertyTenantSchema: import("mongoose").Schema<PropertyTenant, import("mongoose").Model<PropertyTenant, any, any, any, import("mongoose").Document<unknown, any, PropertyTenant, any, {}> & PropertyTenant & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PropertyTenant, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<PropertyTenant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<PropertyTenant> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
