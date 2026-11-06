import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { Lease, LeaseSchema } from './schemas/lease.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { LeaseRepository } from './repositories/lease.repository';
import { UnitsModule } from '../units/units.module';
import { PropertyTenantsModule } from '../property-tenants/property-tenants.module';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lease.name, schema: LeaseSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
    forwardRef(() => UnitsModule),
    PropertyTenantsModule,
    RentSchedulesModule,
  ],
  controllers: [LeasesController],
  providers: [LeasesService, LeaseRepository],
  exports: [LeasesService, LeaseRepository],
})
export class LeasesModule {}
