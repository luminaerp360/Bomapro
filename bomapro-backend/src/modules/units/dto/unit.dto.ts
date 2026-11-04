import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { UnitStatus, UnitType, RentCycle } from '../schemas/unit.schema';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  unitNumber: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(UnitType)
  @IsOptional()
  unitType?: UnitType;

  @IsOptional()
  floor?: number | string;

  @IsNumber()
  @IsNotEmpty()
  rentAmount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  securityDeposit?: number;

  @IsString()
  @IsOptional()
  electricityMeterNumber?: string;

  @IsString()
  @IsOptional()
  waterMeterNumber?: string;

  @IsEnum(RentCycle)
  @IsOptional()
  rentCycle?: RentCycle;

  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;
}

export class UpdateUnitDto extends PartialType(CreateUnitDto) {}

export class BulkImportUnitItemDto {
  @IsString()
  @IsNotEmpty()
  property: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  rentAmount?: number;
}

export class BulkImportUnitsDto {
  @IsArray()
  @IsOptional()
  units?: BulkImportUnitItemDto[];

  @IsString()
  @IsOptional()
  csvText?: string;
}
