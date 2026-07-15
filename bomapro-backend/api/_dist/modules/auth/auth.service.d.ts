import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RentiumUser } from './schemas/rentium-user.schema';
import { RegisterDto, LoginDto, UpdateUserDto, InviteUserDto } from './dto/auth.dto';
import { EmailService } from './email.service';
import { TenantsService } from '../tenants/tenants.service';
export declare class AuthService {
    private userModel;
    private jwtService;
    private emailService;
    private tenantsService;
    constructor(userModel: Model<RentiumUser>, jwtService: JwtService, emailService: EmailService, tenantsService: TenantsService);
    register(dto: RegisterDto, tenantId?: string): Promise<any>;
    login(dto: LoginDto): Promise<{
        user: any;
        token: string;
        tenants: import("../tenants/schemas/tenant.schema").Tenant[];
        activeTenantId: string;
    }>;
    getProfile(userId: string): Promise<any>;
    getUsers(page?: number, limit?: number, search?: string, tenantId?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, RentiumUser, {}, {}> & RentiumUser & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserById(id: string, requester: any): Promise<import("mongoose").Document<unknown, {}, RentiumUser, {}, {}> & RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    updateUser(id: string, dto: UpdateUserDto, requester: any): Promise<any>;
    deleteUser(id: string, requester: any): Promise<{
        message: string;
    }>;
    inviteUser(dto: InviteUserDto, tenantId: string): Promise<any>;
    setPassword(userId: string, password: string): Promise<{
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
    googleLogin(googleUser: any): Promise<{
        error: string;
        message: string;
        token?: undefined;
        user?: undefined;
        tenants?: undefined;
        activeTenantId?: undefined;
    } | {
        token: string;
        user: any;
        tenants: import("../tenants/schemas/tenant.schema").Tenant[];
        activeTenantId: string;
        error?: undefined;
        message?: undefined;
    }>;
    approveUser(id: string, requester: any): Promise<any>;
    rejectUser(id: string, requester: any): Promise<any>;
    searchAllUsers(query: string, requester: any): Promise<(import("mongoose").Document<unknown, {}, RentiumUser, {}, {}> & RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    getTenantMembers(tenantId: string, requester: any): Promise<(import("mongoose").Document<unknown, {}, RentiumUser, {}, {}> & RentiumUser & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    switchTenant(userId: string, tenantId: string): Promise<{
        token: string;
        user: any;
        tenants: import("../tenants/schemas/tenant.schema").Tenant[];
        activeTenantId: string;
    }>;
    addUserToTenant(userId: string, tenantId: string, requester: any): Promise<any>;
    removeUserFromTenant(userId: string, tenantId: string, requester: any): Promise<any>;
    private getDefaultPermissions;
    private generateToken;
    private resolveAccessibleTenants;
    private ensureActiveTenant;
    private getTenantContext;
    private sanitizeUser;
    private assertTenantAccess;
    private assertUserAccessible;
}
