import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TenantPlan } from '../schemas/tenant.schema';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  billingEmail?: string;

  @IsNumber()
  @IsOptional()
  maxUsers?: number;

  @IsNumber()
  @IsOptional()
  maxProperties?: number;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  mpesaClientId?: string;

  @IsString()
  @IsOptional()
  supportPhone?: string;

  @IsString()
  @IsOptional()
  companyAddress?: string;

  @IsArray()
  @IsOptional()
  notificationEmails?: string[];

  @IsObject()
  @IsOptional()
  smtpConfig?: {
    useCustomSmtp?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    fromEmail?: string;
    fromName?: string;
  };

  @IsObject()
  @IsOptional()
  notificationPreferences?: {
    emailTenantOnPayment?: boolean;
    emailAdminsOnPayment?: boolean;
    emailTenantOnInvoiceDue?: boolean;
    emailAdminsOnOverdue?: boolean;
    publicPortalUrl?: string;
  };

  @IsObject()
  @IsOptional()
  billingSettings?: {
    defaultCurrency?: string;
    defaultPaymentDueDay?: number;
    defaultGracePeriodDays?: number;
    defaultLeaseDurationMonths?: number;
    paybillOrTillNumber?: string;
    bankAccountDetails?: string;
    paymentInstructions?: string;
  };

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
