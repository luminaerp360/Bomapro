import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

@Schema({ timestamps: true })
export class PropertyTenant extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: true })
  name: string;

  @Prop({ required: false, default: '' })
  email: string;

  @Prop({ required: false, default: '' })
  phone: string;

  @Prop({ required: false, default: '' })
  idNumber: string; // Kenyan National ID

  @Prop({ required: false, default: '' })
  kraPin: string; // KRA PIN

  @Prop({ required: false, default: '' })
  address: string;

  @Prop({ required: false, default: '' })
  emergencyContactName: string;

  @Prop({ required: false, default: '' })
  emergencyContactPhone: string;

  @Prop({ required: false, default: '' })
  emergencyContactRelationship: string;

  @Prop({ required: false, default: '' })
  occupation: string;

  @Prop({ required: false, default: '' })
  employer: string;

  @Prop({ required: false, default: '' })
  notes: string;

  @Prop({ required: false, default: '' })
  avatar: string;

  @Prop({ required: false, default: '' })
  currentPropertyId: string;

  @Prop({ required: false, default: '' })
  currentLeaseId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  documents: string[]; // Uploaded document URLs

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // ─── Tenant Portal Auth ───────────────────────────────────────────────────
  @Prop({ required: false, default: '' })
  portalPassword: string;

  @Prop({ default: false })
  portalPasswordSet: boolean;

  @Prop({ required: false, default: '' })
  portalInviteToken: string;

  @Prop({ required: false })
  portalInviteTokenExpiry: Date;

  @Prop({ default: false })
  portalInviteTokenUsed: boolean;
}

export const PropertyTenantSchema = SchemaFactory.createForClass(PropertyTenant);
PropertyTenantSchema.index({ tenantId: 1 });
PropertyTenantSchema.index({ email: 1 });
PropertyTenantSchema.index({ phone: 1 });
PropertyTenantSchema.index({ idNumber: 1 });
PropertyTenantSchema.index({ portalInviteToken: 1 });
