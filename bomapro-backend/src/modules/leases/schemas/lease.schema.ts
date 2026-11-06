import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum LeaseStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  RENEWED = 'renewed',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
}

@Schema({ timestamps: true })
export class Lease extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: false, default: '' })
  propertyId: string; // Backward compatibility - can be derived from unit

  @Prop({ required: false, default: '' })
  unitId: string; // New: Direct unit reference

  @Prop({ required: true })
  propertyTenantId: string; // Rental tenant

  @Prop({ required: false, default: '' })
  leaseNumber: string;

  @Prop({ type: String, enum: LeaseStatus, default: LeaseStatus.DRAFT })
  status: LeaseStatus;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: false })
  endDate?: Date;

  @Prop({ required: true })
  rentAmount: number;

  @Prop({ required: false, default: 'KES' })
  currency: string;

  @Prop({ required: false, default: 0 })
  depositAmount: number;

  @Prop({ default: false })
  depositPaid: boolean;

  @Prop({ type: String, enum: PaymentFrequency, default: PaymentFrequency.MONTHLY })
  paymentFrequency: PaymentFrequency;

  @Prop({ required: false, default: 5 })
  paymentDueDay: number; // Day of month rent is due

  @Prop({ required: false, default: 0 })
  lateFeeAmount: number;

  @Prop({ required: false, default: 5 })
  gracePeriodDays: number;

  @Prop({ required: false, default: '' })
  terms: string;

  @Prop({ type: [String], default: [] })
  documents: string[];

  @Prop({ required: false })
  terminatedAt: Date;

  @Prop({ required: false, default: '' })
  terminationReason: string;

  @Prop({ required: false, default: '' })
  renewedFromLeaseId: string;

  @Prop({ required: false, default: '' })
  propertyName: string;

  @Prop({ required: false, default: '' })
  propertyTenantName: string;

  @Prop({ required: false, default: '' })
  unitNumber: string;

  // ─── Lease Signing ────────────────────────────────────────────────────────
  @Prop({ default: false })
  isSigned: boolean;

  @Prop({ required: false })
  signedAt: Date;

  @Prop({ required: false, default: '' })
  signedByPropertyTenantId: string;

  // ─── Schedule Generation ───────────────────────────────────────────────────
  @Prop({ default: false })
  scheduleGenerated: boolean; // Flag to track if 12-month schedule has been generated

  @Prop({ required: false })
  scheduleGeneratedAt?: Date;
}

export const LeaseSchema = SchemaFactory.createForClass(Lease);
LeaseSchema.index({ tenantId: 1 });
LeaseSchema.index({ propertyId: 1 });
LeaseSchema.index({ unitId: 1 });
LeaseSchema.index({ propertyTenantId: 1 });
LeaseSchema.index({ status: 1 });
LeaseSchema.index({ endDate: 1 });
