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
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ ownerUserId: 1 });
TenantSchema.index({ isActive: 1 });
