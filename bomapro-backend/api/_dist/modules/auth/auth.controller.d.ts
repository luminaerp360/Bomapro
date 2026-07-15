import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, UpdateUserDto, InviteUserDto } from './dto/auth.dto';
import { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: any): Promise<any>;
    inviteUser(dto: InviteUserDto, req: any): Promise<any>;
    createUser(dto: InviteUserDto, req: any): Promise<any>;
    setPassword(req: any, password: string): Promise<{
        message: string;
    }>;
    signup(dto: {
        name: string;
        email: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: any;
        token: string;
        tenants: import("../tenants/schemas/tenant.schema").Tenant[];
        activeTenantId: string;
    }>;
    googleAuth(): void;
    googleAuthCallback(req: any, res: Response): Promise<void>;
    approveUser(id: string, req: any): Promise<any>;
    rejectUser(id: string, req: any): Promise<any>;
    getProfile(req: any): Promise<any>;
    getPermissions(): {
        all: import("./schemas/rentium-user.schema").Permission[];
        defaults: {
            admin: import("./schemas/rentium-user.schema").Permission[];
            manager: import("./schemas/rentium-user.schema").Permission[];
            agent: import("./schemas/rentium-user.schema").Permission[];
        };
    };
    getUsers(req: any, page?: number, limit?: number, search?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/rentium-user.schema").RentiumUser, {}, {}> & import("./schemas/rentium-user.schema").RentiumUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    searchAllUsers(query: string, req: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/rentium-user.schema").RentiumUser, {}, {}> & import("./schemas/rentium-user.schema").RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getTenantMembers(tenantId: string, req: any): Promise<(import("mongoose").Document<unknown, {}, import("./schemas/rentium-user.schema").RentiumUser, {}, {}> & import("./schemas/rentium-user.schema").RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getUserById(id: string, req: any): Promise<import("mongoose").Document<unknown, {}, import("./schemas/rentium-user.schema").RentiumUser, {}, {}> & import("./schemas/rentium-user.schema").RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, req: any): Promise<any>;
    deleteUser(id: string, req: any): Promise<{
        message: string;
    }>;
    switchTenant(req: any, tenantId: string): Promise<{
        token: string;
        user: any;
        tenants: import("../tenants/schemas/tenant.schema").Tenant[];
        activeTenantId: string;
    }>;
    addUserToTenant(userId: string, tenantId: string, req: any): Promise<any>;
    removeUserFromTenant(userId: string, tenantId: string, req: any): Promise<any>;
}
