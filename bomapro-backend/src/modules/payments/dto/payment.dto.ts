import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PaymentStatus, PaymentMethod, PaymentType } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  leaseId: string;

  @IsString()
  @IsNotEmpty()
  propertyTenantId: string;

  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsString()
  @IsOptional()
  mpesaTransactionId?: string;

  @IsString()
  @IsOptional()
  mpesaPhoneNumber?: string;

  @IsString()
  @IsOptional()
  bankReference?: string;

  @IsString()
  @IsOptional()
  referenceNumber?: string; // Generic reference number for all payment methods

  @IsString()
  @IsOptional()
  chequeNumber?: string;

  @IsString()
  @IsOptional()
  paymentPeriod?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  propertyName?: string;

  @IsString()
  @IsOptional()
  propertyTenantName?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  unitNumber?: string;

  @IsString()
  @IsOptional()
  leaseNumber?: string;

  @IsString()
  @IsOptional()
  scheduleId?: string;

  @IsArray()
  @IsOptional()
  selectedMonths?: string[];
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @IsString()
  @IsOptional()
  receiptNumber?: string;
}
