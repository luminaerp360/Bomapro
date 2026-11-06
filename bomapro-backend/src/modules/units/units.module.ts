import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { Unit, UnitSchema } from './schemas/unit.schema';
import { UnitRepository } from './repositories/unit.repository';
import { PropertiesModule } from '../properties/properties.module';
import { PropertyTenant, PropertyTenantSchema } from '../property-tenants/schemas/property-tenant.schema';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Unit.name, schema: UnitSchema },
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
      { name: Lease.name, schema: LeaseSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
    forwardRef(() => PropertiesModule),
  ],
  controllers: [UnitsController],
  providers: [UnitsService, UnitRepository],
  exports: [UnitsService, UnitRepository],
})
export class UnitsModule {}
