import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum RentiumUserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  TENANT = 'tenant',
}

export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_PROPERTIES = 'view_properties',
  CREATE_PROPERTIES = 'create_properties',
  EDIT_PROPERTIES = 'edit_properties',
  DELETE_PROPERTIES = 'delete_properties',
  VIEW_TENANTS = 'view_tenants',
  CREATE_TENANTS = 'create_tenants',
  EDIT_TENANTS = 'edit_tenants',
  DELETE_TENANTS = 'delete_tenants',
  VIEW_LEASES = 'view_leases',
  CREATE_LEASES = 'create_leases',
  EDIT_LEASES = 'edit_leases',
  DELETE_LEASES = 'delete_leases',
  SIGN_LEASE = 'sign_lease',
  VIEW_PAYMENTS = 'view_payments',
  CREATE_PAYMENTS = 'create_payments',
  EDIT_PAYMENTS = 'edit_payments',
  DELETE_PAYMENTS = 'delete_payments',
  VIEW_DAMAGES = 'view_damages',
  CREATE_DAMAGES = 'create_damages',
  EDIT_DAMAGES = 'edit_damages',
  DELETE_DAMAGES = 'delete_damages',
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  CREATE_MAINTENANCE_REQUESTS = 'create_maintenance_requests',
  VIEW_MAINTENANCE_REQUESTS = 'view_maintenance_requests',
  EDIT_MAINTENANCE_REQUESTS = 'edit_maintenance_requests',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export const DEFAULT_ADMIN_PERMISSIONS = ALL_PERMISSIONS;

export const DEFAULT_MANAGER_PERMISSIONS = [
  Permission.VIEW_DASHBOARD,
  Permission.VIEW_PROPERTIES,
  Permission.CREATE_PROPERTIES,
  Permission.EDIT_PROPERTIES,
  Permission.VIEW_TENANTS,
  Permission.CREATE_TENANTS,
  Permission.EDIT_TENANTS,
  Permission.VIEW_LEASES,
  Permission.CREATE_LEASES,
  Permission.EDIT_LEASES,
  Permission.VIEW_PAYMENTS,
  Permission.CREATE_PAYMENTS,
  Permission.EDIT_PAYMENTS,
  Permission.VIEW_DAMAGES,
  Permission.CREATE_DAMAGES,
  Permission.EDIT_DAMAGES,
  Permission.VIEW_REPORTS,
  Permission.EXPORT_REPORTS,
  Permission.VIEW_USERS,
];

export const DEFAULT_AGENT_PERMISSIONS = [
  Permission.VIEW_DASHBOARD,
  Permission.VIEW_PROPERTIES,
  Permission.VIEW_TENANTS,
  Permission.VIEW_LEASES,
  Permission.VIEW_PAYMENTS,
  Permission.CREATE_PAYMENTS,
  Permission.VIEW_DAMAGES,
  Permission.CREATE_DAMAGES,
  Permission.VIEW_REPORTS,
];

export const DEFAULT_TENANT_PERMISSIONS = [
  Permission.VIEW_DASHBOARD,
  Permission.VIEW_LEASES,
  Permission.SIGN_LEASE,
  Permission.VIEW_PAYMENTS,
  Permission.VIEW_DAMAGES,
  Permission.CREATE_DAMAGES,
  Permission.CREATE_MAINTENANCE_REQUESTS,
  Permission.VIEW_MAINTENANCE_REQUESTS,
  Permission.EDIT_MAINTENANCE_REQUESTS,
];

@Schema({ timestamps: true })
export class RentiumUser extends BaseDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, default: '' })
  password: string;

  @Prop({ type: String, enum: RentiumUserRole, default: RentiumUserRole.AGENT })
  role: RentiumUserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  assignedPropertyIds: string[];

  @Prop({ type: [String], enum: Permission, default: DEFAULT_AGENT_PERMISSIONS })
  permissions: Permission[];

  @Prop({ required: false, default: '' })
  googleId: string;

  @Prop({ required: false, default: '' })
  avatar: string;

  @Prop({ required: false, default: '' })
  phone: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ required: false, default: '' })
  verificationToken: string;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ type: String, enum: ['credentials', 'google', 'local'], default: 'credentials' })
  authProvider: string;

  @Prop({ type: [String], default: [] })
  tenantIds: string[];

  @Prop({ required: false, default: '' })
  activeTenantId: string;
}

export const RentiumUserSchema = SchemaFactory.createForClass(RentiumUser);

// Support legacy records that still store authProvider as "local".
RentiumUserSchema.pre('save', function normalizeLegacyAuthProvider(next) {
  if (this.authProvider === 'local') {
    this.authProvider = 'credentials';
  }
  next();
});

RentiumUserSchema.index({ googleId: 1 }, { sparse: true });
