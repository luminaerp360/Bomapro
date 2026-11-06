import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  CHEQUE = 'cheque',
  CARD = 'card',
  OTHER = 'other',
}

export enum PaymentType {
  RENT = 'rent',
  DEPOSIT = 'deposit',
  LATE_FEE = 'late_fee',
  DAMAGE = 'damage',
  UTILITY = 'utility',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Payment extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: true })
  leaseId: string;

  @Prop({ required: true })
  propertyTenantId: string; // Rental tenant

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: false, default: 'KES' })
  currency: string;

  @Prop({ required: true })
  paymentDate: Date;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PaymentType, default: PaymentType.RENT })
  paymentType: PaymentType;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: false, default: '' })
  mpesaTransactionId: string;

  @Prop({ required: false, default: '' })
  mpesaPhoneNumber: string;

  @Prop({ required: false, default: '' })
  bankReference: string;

  @Prop({ required: false, default: '' })
  chequeNumber: string;

  @Prop({ required: false, default: '' })
  receiptNumber: string;

  @Prop({ required: false, default: '' })
  referenceNumber: string; // Generic reference number for all payment methods

  @Prop({ required: false, default: '' })
  paymentPeriod: string; // e.g. "January 2025"

  @Prop({ required: false, default: '' })
  notes: string;

  @Prop({ required: false, default: '' })
  propertyName: string;

  @Prop({ required: false, default: '' })
  propertyTenantName: string;

  @Prop({ required: false, default: '' })
  unitId: string;

  @Prop({ required: false, default: '' })
  unitNumber: string;

  @Prop({ required: false, default: '' })
  leaseNumber: string;

  @Prop({ required: false, default: '' })
  scheduleId: string;

  @Prop({ required: false, default: '' })
  recordedBy: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ tenantId: 1 });
PaymentSchema.index({ leaseId: 1 });
PaymentSchema.index({ propertyId: 1 });
PaymentSchema.index({ propertyTenantId: 1 });
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ status: 1 });
