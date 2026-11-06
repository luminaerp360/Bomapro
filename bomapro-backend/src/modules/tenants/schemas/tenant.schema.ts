import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

@Schema({ timestamps: true })
export class Tenant extends BaseDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: false, default: '' })
  domain: string;

  @Prop({ required: false, default: '' })
  logoUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: TenantPlan, default: TenantPlan.FREE })
  plan: TenantPlan;

  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;

  @Prop({ required: true })
  ownerUserId: string;

  @Prop({ required: false, default: '' })
  contactEmail: string;

  @Prop({ required: false, default: '' })
  billingEmail: string;

  @Prop({ default: 0 })
  maxUsers: number;

  @Prop({ default: 0 })
  maxProperties: number;

  @Prop({ required: false, default: '' })
  mpesaClientId: string;

  @Prop({ required: false, default: '' })
  supportPhone: string;

  @Prop({ required: false, default: '' })
  companyAddress: string;

  @Prop({ type: [String], default: [] })
  notificationEmails: string[];

  @Prop({
    type: Object,
    default: () => ({
      useCustomSmtp: false,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: '',
      pass: '',
      fromEmail: '',
      fromName: '',
    }),
  })
  smtpConfig: {
    useCustomSmtp?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    fromEmail?: string;
    fromName?: string;
  };

  @Prop({
    type: Object,
    default: () => ({
      emailTenantOnPayment: true,
      emailAdminsOnPayment: true,
      emailTenantOnInvoiceDue: true,
      emailAdminsOnOverdue: true,
      publicPortalUrl: '',
    }),
  })
  notificationPreferences: {
    emailTenantOnPayment?: boolean;
    emailAdminsOnPayment?: boolean;
    emailTenantOnInvoiceDue?: boolean;
    emailAdminsOnOverdue?: boolean;
    publicPortalUrl?: string;
  };

  @Prop({
    type: Object,
    default: () => ({
      defaultCurrency: 'KES',
      defaultPaymentDueDay: 5,
      defaultGracePeriodDays: 5,
      defaultLeaseDurationMonths: 12,
      paybillOrTillNumber: '',
      bankAccountDetails: '',
      paymentInstructions: '',
    }),
  })
  billingSettings: {
    defaultCurrency?: string;
    defaultPaymentDueDay?: number;
    defaultGracePeriodDays?: number;
    defaultLeaseDurationMonths?: number;
    paybillOrTillNumber?: string;
    bankAccountDetails?: string;
    paymentInstructions?: string;
  };
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ ownerUserId: 1 });
TenantSchema.index({ isActive: 1 });
