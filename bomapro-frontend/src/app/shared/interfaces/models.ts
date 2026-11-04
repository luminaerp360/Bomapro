// ─── Properties ─── //
export type PropertyType = 'apartment' | 'commercial' | 'plot' | 'house' | 'land';
export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export interface Property {
  _id: string;
  tenantId: string;
  name: string;
  propertyCode: string;
  description: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  owner: string;
  yearBuilt: number;
  floors?: number;
  amenities: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Property Tenants (Rental Occupants) ─── //
export interface PropertyTenant {
  _id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  kraPin: string;
  occupation: string;
  employer: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship?: string;
  avatar: string;
  notes?: string;
  currentPropertyId: string;
  currentLeaseId: string;
  isActive: boolean;
  documents: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Optional enriched fields from API
  propertyName?: string;
  unitNumber?: string;
  rentAmount?: number;
  currency?: string;
}

// ─── Leases ─── //
export type LeaseStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi_annually' | 'annually';

export interface Lease {
  _id: string;
  tenantId: string;
  propertyId: string;
  unitId?: string;
  propertyTenantId: string;
  leaseNumber: string;
  status: LeaseStatus;
  startDate: string;
  endDate?: string;
  rentAmount: number;
  currency: string;
  depositAmount: number;
  depositPaid: boolean;
  paymentFrequency: PaymentFrequency;
  paymentDueDay: number;
  lateFeeAmount: number;
  gracePeriodDays: number;
  terms: string;
  notes: string;
  documents: string[];
  terminatedAt: string;
  terminationReason: string;
  renewedFromLeaseId: string;
  propertyName: string;
  propertyTenantName: string;
  unitNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Payments ─── //
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
export type PaymentMethod = 'mpesa' | 'bank_transfer' | 'cash' | 'cheque' | 'card' | 'other';
export type PaymentType = 'rent' | 'deposit' | 'late_fee' | 'damage' | 'utility' | 'other';

export interface Payment {
  _id: string;
  tenantId: string;
  leaseId: string;
  propertyTenantId: string;
  propertyId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  mpesaTransactionId: string;
  mpesaPhoneNumber: string;
  bankReference: string;
  chequeNumber: string;
  receiptNumber: string;
  paymentPeriod: string;
  notes: string;
  propertyName: string;
  propertyTenantName: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Damages ─── //
export type DamageStatus = 'reported' | 'assessed' | 'in_repair' | 'repaired' | 'deducted' | 'closed';
export type DamageSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DamageType = 'structural' | 'plumbing' | 'electrical' | 'appliance' | 'cosmetic' | 'fixture' | 'flooring' | 'window_door' | 'other';

export interface Damage {
  _id: string;
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
  reportedDate: string;
  assessedDate: string;
  repairedDate: string;
  images: string[];
  location: string;
  notes: string;
  repairVendor: string;
  deductedFromDeposit: boolean;
  propertyName: string;
  propertyTenantName: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth & Users ─── //
export type BomoproPermission =
  | 'view_dashboard'
  | 'view_properties' | 'create_properties' | 'edit_properties' | 'delete_properties'
  | 'view_tenants' | 'create_tenants' | 'edit_tenants' | 'delete_tenants'
  | 'view_leases' | 'create_leases' | 'edit_leases' | 'delete_leases' | 'view_lease_details' | 'sign_leases'
  | 'view_payments' | 'create_payments' | 'edit_payments' | 'delete_payments'
  | 'view_damages' | 'create_damages' | 'edit_damages' | 'delete_damages'
  | 'view_reports'
  | 'view_users' | 'create_users' | 'edit_users' | 'delete_users'
  | 'view_maintenance_requests' | 'create_maintenance_requests' | 'edit_maintenance_requests' | 'delete_maintenance_requests';

export interface BomoproUser {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'agent' | 'tenant';
  isActive: boolean;
  assignedPropertyIds: string[];
  permissions: BomoproPermission[];
  phone: string;
  googleId?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  isApproved?: boolean;
  authProvider?: 'credentials' | 'google';
  tenantIds?: string[];
  activeTenantId?: string;
}

export interface PermissionsResponse {
  all: BomoproPermission[];
  defaults: {
    admin: BomoproPermission[];
    manager: BomoproPermission[];
    agent: BomoproPermission[];
  };
}

export interface AuthResponse {
  user: BomoproUser;
  token: string;
  tenants?: Tenant[];
  activeTenantId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── System Tenants (Organizations) ─── //
export type TenantPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface Tenant {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard / Reports ─── //
export interface DashboardStats {
  properties: { total: number; available: number; occupied: number; occupancyRate: number };
  tenants: { total: number; active: number };
  leases: { total: number; active: number; expiringSoonCount: number };
  payments: { total: number; completed: number; pending: number };
  revenue: { monthly: number; total: number };
  damages: { total: number; reported: number };
}
