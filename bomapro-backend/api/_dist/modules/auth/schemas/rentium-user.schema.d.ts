import { BaseDocument } from '../../database/schemas/base.schema';
export declare enum RentiumUserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    MANAGER = "manager",
    AGENT = "agent",
    TENANT = "tenant"
}
export declare enum Permission {
    VIEW_DASHBOARD = "view_dashboard",
    VIEW_PROPERTIES = "view_properties",
    CREATE_PROPERTIES = "create_properties",
    EDIT_PROPERTIES = "edit_properties",
    DELETE_PROPERTIES = "delete_properties",
    VIEW_TENANTS = "view_tenants",
    CREATE_TENANTS = "create_tenants",
    EDIT_TENANTS = "edit_tenants",
    DELETE_TENANTS = "delete_tenants",
    VIEW_LEASES = "view_leases",
    CREATE_LEASES = "create_leases",
    EDIT_LEASES = "edit_leases",
    DELETE_LEASES = "delete_leases",
    SIGN_LEASE = "sign_lease",
    VIEW_PAYMENTS = "view_payments",
    CREATE_PAYMENTS = "create_payments",
    EDIT_PAYMENTS = "edit_payments",
    DELETE_PAYMENTS = "delete_payments",
    VIEW_DAMAGES = "view_damages",
    CREATE_DAMAGES = "create_damages",
    EDIT_DAMAGES = "edit_damages",
    DELETE_DAMAGES = "delete_damages",
    VIEW_REPORTS = "view_reports",
    EXPORT_REPORTS = "export_reports",
    VIEW_USERS = "view_users",
    CREATE_USERS = "create_users",
    EDIT_USERS = "edit_users",
    DELETE_USERS = "delete_users",
    CREATE_MAINTENANCE_REQUESTS = "create_maintenance_requests",
    VIEW_MAINTENANCE_REQUESTS = "view_maintenance_requests",
    EDIT_MAINTENANCE_REQUESTS = "edit_maintenance_requests"
}
export declare const ALL_PERMISSIONS: Permission[];
export declare const DEFAULT_ADMIN_PERMISSIONS: Permission[];
export declare const DEFAULT_MANAGER_PERMISSIONS: Permission[];
export declare const DEFAULT_AGENT_PERMISSIONS: Permission[];
export declare const DEFAULT_TENANT_PERMISSIONS: Permission[];
export declare class RentiumUser extends BaseDocument {
    name: string;
    email: string;
    password: string;
    role: RentiumUserRole;
    isActive: boolean;
    assignedPropertyIds: string[];
    permissions: Permission[];
    googleId: string;
    avatar: string;
    phone: string;
    isEmailVerified: boolean;
    verificationToken: string;
    isApproved: boolean;
    authProvider: string;
    tenantIds: string[];
    activeTenantId: string;
}
export declare const RentiumUserSchema: import("mongoose").Schema<RentiumUser, import("mongoose").Model<RentiumUser, any, any, any, import("mongoose").Document<unknown, any, RentiumUser, any, {}> & RentiumUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, RentiumUser, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<RentiumUser>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<RentiumUser> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
