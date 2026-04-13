import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TenantPortalController } from './tenant-portal.controller';
import { TenantPortalService } from './tenant-portal.service';
import { MpesaService } from './mpesa.service';
import { TenantPortalJwtStrategy } from './strategies/tenant-portal-jwt.strategy';
import { PropertyTenant, PropertyTenantSchema } from '../property-tenants/schemas/property-tenant.schema';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { Unit, UnitSchema } from '../units/schemas/unit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
      { name: Lease.name, schema: LeaseSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.TENANT_PORTAL_JWT_SECRET || process.env.JWT_SECRET || 'bomapro-portal-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [TenantPortalController],
  providers: [TenantPortalService, MpesaService, TenantPortalJwtStrategy],
  exports: [TenantPortalService],
})
export class TenantPortalModule {}
