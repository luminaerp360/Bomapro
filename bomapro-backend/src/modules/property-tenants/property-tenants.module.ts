import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyTenantsService } from './property-tenants.service';
import { PropertyTenantsController } from './property-tenants.controller';
import { PropertyTenant, PropertyTenantSchema } from './schemas/property-tenant.schema';
import { PropertyTenantRepository } from './repositories/property-tenant.repository';
import { TenantPortalModule } from '../tenant-portal/tenant-portal.module';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { Unit, UnitSchema } from '../units/schemas/unit.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
      { name: Lease.name, schema: LeaseSchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
    RentSchedulesModule,
    forwardRef(() => TenantPortalModule),
  ],
  controllers: [PropertyTenantsController],
  providers: [PropertyTenantsService, PropertyTenantRepository],
  exports: [PropertyTenantsService, PropertyTenantRepository],
})
export class PropertyTenantsModule {}
