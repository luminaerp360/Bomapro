import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, IsBoolean, IsNumber, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePropertyTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @ValidateIf((o) => !!o.email && typeof o.email === 'string' && o.email.trim().length > 0)
  @IsEmail()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsOptional()
  kraPin?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  emergencyContactRelationship?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  employer?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsOptional()
  documents?: string[];

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  leaseDurationMonths?: number;

  @IsNumber()
  @IsOptional()
  paymentDueDay?: number;

  @IsOptional()
  rentAmount?: number;

  @IsOptional()
  depositAmount?: number;
}

export class UpdatePropertyTenantDto extends PartialType(CreatePropertyTenantDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  currentPropertyId?: string;

  @IsString()
  @IsOptional()
  currentLeaseId?: string;
}
