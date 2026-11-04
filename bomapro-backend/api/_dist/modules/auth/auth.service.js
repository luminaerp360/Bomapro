"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const rentium_user_schema_1 = require("./schemas/rentium-user.schema");
const email_service_1 = require("./email.service");
const tenants_service_1 = require("../tenants/tenants.service");
let AuthService = class AuthService {
    constructor(userModel, jwtService, emailService, tenantsService) {
        this.userModel = userModel;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.tenantsService = tenantsService;
    }
    async register(dto, tenantId) {
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const role = dto.role || rentium_user_schema_1.RentiumUserRole.AGENT;
        const permissions = dto.permissions || this.getDefaultPermissions(role);
        const user = new this.userModel({
            ...dto,
            password: hashedPassword,
            role,
            permissions,
            isEmailVerified: true,
            isApproved: true,
            tenantIds: tenantId ? [tenantId] : [],
            activeTenantId: tenantId || '',
        });
        await user.save();
        return this.sanitizeUser(user);
    }
    async login(dto) {
        const user = await this.userModel.findOne({
            email: dto.email,
            isDeleted: false,
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const { tenants, activeTenantId } = await this.getTenantContext(user);
        const token = this.generateToken(user);
        return {
            user: this.sanitizeUser(user),
            token,
            tenants,
            activeTenantId,
        };
    }
    async getProfile(userId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const { tenants, activeTenantId } = await this.getTenantContext(user);
        return {
            ...this.sanitizeUser(user),
            tenants,
            activeTenantId,
        };
    }
    async getUsers(page = 1, limit = 20, search, tenantId) {
        const filter = { isDeleted: { $ne: true } };
        if (tenantId) {
            filter.tenantIds = tenantId;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.userModel.find(filter).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
            this.userModel.countDocuments(filter),
        ]);
        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }
    async getUserById(id, requester) {
        const user = await this.userModel.findById(id).select('-password');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        this.assertUserAccessible(user, requester);
        return user;
    }
    async updateUser(id, dto, requester) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        this.assertUserAccessible(user, requester);
        if (dto.email && dto.email !== user.email) {
            const existing = await this.userModel.findOne({ email: dto.email });
            if (existing)
                throw new common_1.ConflictException('Email already in use');
        }
        if (dto.password) {
            dto.password = await bcrypt.hash(dto.password, 10);
        }
        if (dto.role && !dto.permissions) {
            dto.permissions = this.getDefaultPermissions(dto.role);
        }
        if (dto.tenantIds) {
            user.tenantIds = [...new Set(dto.tenantIds.filter(Boolean))];
            delete dto.tenantIds;
        }
        if (dto.activeTenantId !== undefined) {
            user.activeTenantId = dto.activeTenantId;
            delete dto.activeTenantId;
        }
        Object.assign(user, dto);
        await this.ensureActiveTenant(user);
        await user.save();
        return this.sanitizeUser(user);
    }
    async deleteUser(id, requester) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        this.assertUserAccessible(user, requester);
        user.isDeleted = true;
        user.isActive = false;
        await user.save();
        return { message: 'User deleted successfully' };
    }
    async inviteUser(dto, tenantId) {
        const requestedTenantIds = Array.isArray(dto.tenantIds) ? dto.tenantIds.filter(Boolean) : [];
        const normalizedTenantIds = [...new Set([...(tenantId ? [tenantId] : []), ...requestedTenantIds])];
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing) {
            for (const id of normalizedTenantIds) {
                if (!existing.tenantIds.includes(id)) {
                    existing.tenantIds.push(id);
                }
            }
            if (dto.role) {
                existing.role = dto.role;
                if (!dto.permissions) {
                    existing.permissions = this.getDefaultPermissions(dto.role);
                }
            }
            if (dto.permissions) {
                existing.permissions = dto.permissions;
            }
            if (dto.password) {
                existing.password = await bcrypt.hash(dto.password, 10);
            }
            await this.ensureActiveTenant(existing);
            await existing.save();
            return this.sanitizeUser(existing);
        }
        const role = dto.role || rentium_user_schema_1.RentiumUserRole.AGENT;
        const permissions = dto.permissions || this.getDefaultPermissions(role);
        const hashedPassword = dto.password ? await bcrypt.hash(dto.password, 10) : '';
        const user = new this.userModel({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role,
            permissions,
            isEmailVerified: true,
            isApproved: true,
            tenantIds: normalizedTenantIds,
            activeTenantId: normalizedTenantIds[0] || '',
        });
        await this.ensureActiveTenant(user);
        await user.save();
        return this.sanitizeUser(user);
    }
    async setPassword(userId, password) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        return { message: 'Password set successfully' };
    }
    async signup(dto) {
        const existing = await this.userModel.findOne({ email: dto.email });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = new this.userModel({
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: rentium_user_schema_1.RentiumUserRole.AGENT,
            permissions: rentium_user_schema_1.DEFAULT_AGENT_PERMISSIONS,
            isEmailVerified: false,
            isApproved: false,
            verificationToken,
        });
        await user.save();
        await this.emailService.sendVerificationEmail(dto.email, dto.name, verificationToken);
        return { message: 'Signup successful. Please check your email to verify your account.' };
    }
    async verifyEmail(token) {
        const user = await this.userModel.findOne({ verificationToken: token });
        if (!user)
            throw new common_1.BadRequestException('Invalid or expired verification token');
        user.isEmailVerified = true;
        user.verificationToken = '';
        await user.save();
        const admins = await this.userModel.find({ role: { $in: [rentium_user_schema_1.RentiumUserRole.ADMIN, rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN] }, isActive: true });
        for (const admin of admins) {
            await this.emailService.sendNewUserNotificationToAdmin(admin.email, user.name, user.email);
        }
        return { message: 'Email verified. An administrator will review your account.' };
    }
    async googleLogin(googleUser) {
        if (!googleUser) {
            return { error: 'auth_failed', message: 'Google authentication failed' };
        }
        let user = await this.userModel.findOne({ email: googleUser.email });
        if (!user) {
            user = new this.userModel({
                name: googleUser.name || `${googleUser.firstName || ''} ${googleUser.lastName || ''}`.trim(),
                email: googleUser.email,
                googleId: googleUser.googleId,
                avatar: googleUser.picture || '',
                authProvider: 'google',
                isEmailVerified: true,
                isApproved: false,
                role: rentium_user_schema_1.RentiumUserRole.AGENT,
                permissions: rentium_user_schema_1.DEFAULT_AGENT_PERMISSIONS,
            });
            await user.save();
            const admins = await this.userModel.find({ role: { $in: [rentium_user_schema_1.RentiumUserRole.ADMIN, rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN] }, isActive: true });
            for (const admin of admins) {
                await this.emailService.sendNewUserNotificationToAdmin(admin.email, user.name, user.email);
            }
            return { error: 'pending_approval', message: 'Account created. Awaiting administrator approval.' };
        }
        if (!user.isApproved) {
            return { error: 'pending_approval', message: 'Your account is awaiting administrator approval.' };
        }
        if (!user.isActive) {
            return { error: 'account_disabled', message: 'Your account has been deactivated.' };
        }
        if (!user.googleId) {
            user.googleId = googleUser.googleId;
            user.authProvider = 'google';
        }
        if (googleUser.picture)
            user.avatar = googleUser.picture;
        await user.save();
        const { tenants, activeTenantId } = await this.getTenantContext(user);
        const token = this.generateToken(user);
        return {
            token,
            user: this.sanitizeUser(user),
            tenants,
            activeTenantId,
        };
    }
    async approveUser(id, requester) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        this.assertUserAccessible(user, requester);
        user.isApproved = true;
        user.isActive = true;
        await user.save();
        await this.emailService.sendApprovalNotification(user.email, user.name);
        return this.sanitizeUser(user);
    }
    async rejectUser(id, requester) {
        const user = await this.userModel.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        this.assertUserAccessible(user, requester);
        user.isApproved = false;
        user.isActive = false;
        await user.save();
        return this.sanitizeUser(user);
    }
    async searchAllUsers(query, requester) {
        const filter = {
            isDeleted: { $ne: true },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ],
        };
        if (requester.role !== rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN) {
            filter.tenantIds = requester.tenantId;
        }
        return this.userModel.find(filter).select('-password').limit(20).sort({ name: 1 });
    }
    async getTenantMembers(tenantId, requester) {
        this.assertTenantAccess(tenantId, requester);
        return this.userModel.find({ tenantIds: tenantId, isDeleted: { $ne: true } }).select('-password');
    }
    async switchTenant(userId, tenantId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const accessibleTenants = await this.resolveAccessibleTenants(user);
        const canAccessTenant = accessibleTenants.some((tenant) => tenant._id.toString() === tenantId);
        if (!canAccessTenant) {
            throw new common_1.BadRequestException('User does not belong to this tenant');
        }
        user.activeTenantId = tenantId;
        await user.save();
        const { tenants, activeTenantId } = await this.getTenantContext(user);
        const token = this.generateToken(user);
        return {
            token,
            user: this.sanitizeUser(user),
            tenants,
            activeTenantId,
        };
    }
    async addUserToTenant(userId, tenantId, requester) {
        this.assertTenantAccess(tenantId, requester);
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.tenantIds.includes(tenantId)) {
            user.tenantIds.push(tenantId);
        }
        await this.ensureActiveTenant(user);
        await user.save();
        return this.sanitizeUser(user);
    }
    async removeUserFromTenant(userId, tenantId, requester) {
        this.assertTenantAccess(tenantId, requester);
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.tenantIds = user.tenantIds.filter((id) => id !== tenantId);
        await this.ensureActiveTenant(user);
        await user.save();
        return this.sanitizeUser(user);
    }
    getDefaultPermissions(role) {
        switch (role) {
            case rentium_user_schema_1.RentiumUserRole.ADMIN:
            case rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN:
                return rentium_user_schema_1.DEFAULT_ADMIN_PERMISSIONS;
            case rentium_user_schema_1.RentiumUserRole.MANAGER:
                return rentium_user_schema_1.DEFAULT_MANAGER_PERMISSIONS;
            case rentium_user_schema_1.RentiumUserRole.TENANT:
                return rentium_user_schema_1.DEFAULT_TENANT_PERMISSIONS;
            default:
                return rentium_user_schema_1.DEFAULT_AGENT_PERMISSIONS;
        }
    }
    generateToken(user) {
        return this.jwtService.sign({
            sub: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantIds: user.tenantIds || [],
            tenantId: user.activeTenantId || '',
        });
    }
    async resolveAccessibleTenants(user) {
        if (user.role === rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN) {
            return this.tenantsService.findAll();
        }
        if (!user.tenantIds?.length) {
            return [];
        }
        return this.tenantsService.findByIds(user.tenantIds);
    }
    async ensureActiveTenant(user) {
        const accessibleTenants = await this.resolveAccessibleTenants(user);
        const accessibleIds = accessibleTenants.map((tenant) => tenant._id.toString());
        if (!accessibleIds.length) {
            user.activeTenantId = '';
            return { tenants: accessibleTenants, activeTenantId: '' };
        }
        if (!accessibleIds.includes(user.activeTenantId)) {
            user.activeTenantId = accessibleIds[0];
        }
        return { tenants: accessibleTenants, activeTenantId: user.activeTenantId };
    }
    async getTenantContext(user) {
        const { tenants, activeTenantId } = await this.ensureActiveTenant(user);
        if (user.isModified?.() || user.activeTenantId !== activeTenantId) {
            await user.save();
        }
        return { tenants, activeTenantId };
    }
    sanitizeUser(user) {
        const obj = user.toObject();
        delete obj.password;
        return obj;
    }
    assertTenantAccess(tenantId, requester) {
        if (requester.role === rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN) {
            return;
        }
        if (requester.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('You do not have access to this organization');
        }
    }
    assertUserAccessible(user, requester) {
        if (requester.role === rentium_user_schema_1.RentiumUserRole.SUPER_ADMIN) {
            return;
        }
        if (!user.tenantIds?.includes(requester.tenantId)) {
            throw new common_1.ForbiddenException('You do not have access to this user');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(rentium_user_schema_1.RentiumUser.name)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => tenants_service_1.TenantsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        jwt_1.JwtService,
        email_service_1.EmailService,
        tenants_service_1.TenantsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map