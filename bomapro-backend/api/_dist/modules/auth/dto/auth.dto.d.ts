import { RentiumUserRole, Permission } from '../schemas/rentium-user.schema';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: RentiumUserRole;
    permissions?: Permission[];
}
export declare class InviteUserDto {
    name: string;
    email: string;
    role?: RentiumUserRole;
    password?: string;
    tenantIds?: string[];
    permissions?: Permission[];
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: RentiumUserRole;
    isActive?: boolean;
    assignedPropertyIds?: string[];
    permissions?: Permission[];
    tenantIds?: string[];
    activeTenantId?: string;
}
