import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RentiumUser, DEFAULT_ADMIN_PERMISSIONS, DEFAULT_AGENT_PERMISSIONS, DEFAULT_MANAGER_PERMISSIONS, DEFAULT_TENANT_PERMISSIONS, RentiumUserRole, ALL_PERMISSIONS } from './schemas/rentium-user.schema';
import { RegisterDto, LoginDto, UpdateUserDto, InviteUserDto } from './dto/auth.dto';
import { EmailService } from './email.service';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(RentiumUser.name) private userModel: Model<RentiumUser>,
    private jwtService: JwtService,
    private emailService: EmailService,
    @Inject(forwardRef(() => TenantsService)) private tenantsService: TenantsService,
  ) {}

  async register(dto: RegisterDto, tenantId?: string) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role || RentiumUserRole.AGENT;
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

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({
      email: dto.email,
      isDeleted: false,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
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

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const { tenants, activeTenantId } = await this.getTenantContext(user);
    return {
      ...this.sanitizeUser(user),
      tenants,
      activeTenantId,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string, tenantId?: string) {
    const filter: any = { isDeleted: { $ne: true } };
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

  async getUserById(id: string, requester: any) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    this.assertUserAccessible(user, requester);
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, requester: any) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    this.assertUserAccessible(user, requester);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) throw new ConflictException('Email already in use');
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

  async deleteUser(id: string, requester: any) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    this.assertUserAccessible(user, requester);

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    return { message: 'User deleted successfully' };
  }

  async inviteUser(dto: InviteUserDto, tenantId: string) {
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

    const role = dto.role || RentiumUserRole.AGENT;
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

  async setPassword(userId: string, password: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    return { message: 'Password set successfully' };
  }

  async signup(dto: { name: string; email: string; password: string }) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new this.userModel({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: RentiumUserRole.AGENT,
      permissions: DEFAULT_AGENT_PERMISSIONS,
      isEmailVerified: false,
      isApproved: false,
      verificationToken,
    });
    await user.save();

    try {
      await this.emailService.sendVerificationEmail(dto.email, dto.name, verificationToken);
    } catch (err) {
      console.warn('Failed to send verification email:', (err as any)?.message || err);
    }

    return { message: 'Signup successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string) {
    const user = await this.userModel.findOne({ verificationToken: token });
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    user.isEmailVerified = true;
    user.verificationToken = '';
    await user.save();

    const admins = await this.userModel.find({ role: { $in: [RentiumUserRole.ADMIN, RentiumUserRole.SUPER_ADMIN] }, isActive: true });
    for (const admin of admins) {
      await this.emailService.sendNewUserNotificationToAdmin(admin.email, user.name, user.email);
    }

    return { message: 'Email verified. An administrator will review your account.' };
  }

  async googleLogin(googleUser: any) {
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
        role: RentiumUserRole.AGENT,
        permissions: DEFAULT_AGENT_PERMISSIONS,
      });
      await user.save();

      const admins = await this.userModel.find({ role: { $in: [RentiumUserRole.ADMIN, RentiumUserRole.SUPER_ADMIN] }, isActive: true });
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
    if (googleUser.picture) user.avatar = googleUser.picture;
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

  async approveUser(id: string, requester: any) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    this.assertUserAccessible(user, requester);

    user.isApproved = true;
    user.isActive = true;
    await user.save();

    await this.emailService.sendApprovalNotification(user.email, user.name);

    return this.sanitizeUser(user);
  }

  async rejectUser(id: string, requester: any) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    this.assertUserAccessible(user, requester);

    user.isApproved = false;
    user.isActive = false;
    await user.save();

    return this.sanitizeUser(user);
  }

  async searchAllUsers(query: string, requester: any) {
    const filter: any = {
      isDeleted: { $ne: true },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };

    if (requester.role !== RentiumUserRole.SUPER_ADMIN) {
      filter.tenantIds = requester.tenantId;
    }
    return this.userModel.find(filter).select('-password').limit(20).sort({ name: 1 });
  }

  async getTenantMembers(tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    return this.userModel.find({ tenantIds: tenantId, isDeleted: { $ne: true } }).select('-password');
  }

  async switchTenant(userId: string, tenantId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const accessibleTenants = await this.resolveAccessibleTenants(user);
    const canAccessTenant = accessibleTenants.some((tenant) => tenant._id.toString() === tenantId);
    if (!canAccessTenant) {
      throw new BadRequestException('User does not belong to this tenant');
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

  async addUserToTenant(userId: string, tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.tenantIds.includes(tenantId)) {
      user.tenantIds.push(tenantId);
    }
    await this.ensureActiveTenant(user);
    await user.save();
    return this.sanitizeUser(user);
  }

  async removeUserFromTenant(userId: string, tenantId: string, requester: any) {
    this.assertTenantAccess(tenantId, requester);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.tenantIds = user.tenantIds.filter((id) => id !== tenantId);
    await this.ensureActiveTenant(user);
    await user.save();
    return this.sanitizeUser(user);
  }

  private getDefaultPermissions(role: RentiumUserRole) {
    switch (role) {
      case RentiumUserRole.ADMIN:
      case RentiumUserRole.SUPER_ADMIN:
        return DEFAULT_ADMIN_PERMISSIONS;
      case RentiumUserRole.MANAGER:
        return DEFAULT_MANAGER_PERMISSIONS;
      case RentiumUserRole.TENANT:
        return DEFAULT_TENANT_PERMISSIONS;
      default:
        return DEFAULT_AGENT_PERMISSIONS;
    }
  }

  private generateToken(user: RentiumUser): string {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantIds: user.tenantIds || [],
      tenantId: user.activeTenantId || '',
    });
  }

  private async resolveAccessibleTenants(user: RentiumUser) {
    if (user.role === RentiumUserRole.SUPER_ADMIN) {
      return this.tenantsService.findAll();
    }

    if (!user.tenantIds?.length) {
      return [];
    }

    return this.tenantsService.findByIds(user.tenantIds);
  }

  private async ensureActiveTenant(user: RentiumUser) {
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

  private async getTenantContext(user: RentiumUser) {
    const { tenants, activeTenantId } = await this.ensureActiveTenant(user);
    if (user.isModified?.() || user.activeTenantId !== activeTenantId) {
      await user.save();
    }

    return { tenants, activeTenantId };
  }

  private sanitizeUser(user: RentiumUser) {
    const obj = user.toObject();
    delete obj.password;
    return obj;
  }

  private assertTenantAccess(tenantId: string, requester: any) {
    if (requester.role === RentiumUserRole.SUPER_ADMIN) {
      return;
    }

    if (requester.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this organization');
    }
  }

  private assertUserAccessible(user: any, requester: any) {
    if (requester.role === RentiumUserRole.SUPER_ADMIN) {
      return;
    }

    if (!user.tenantIds?.includes(requester.tenantId)) {
      throw new ForbiddenException('You do not have access to this user');
    }
  }
}
