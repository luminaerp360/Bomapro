import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentSchedulesService } from './rent-schedules.service';
import { RentSchedulesController } from './rent-schedules.controller';
import { RentSchedule, RentScheduleSchema } from './schemas/rent-schedule.schema';
import { RentScheduleRepository } from './repositories/rent-schedule.repository';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Unit, UnitSchema } from '../units/schemas/unit.schema';
import { PropertyTenant, PropertyTenantSchema } from '../property-tenants/schemas/property-tenant.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RentSchedule.name, schema: RentScheduleSchema },
      { name: Lease.name, schema: LeaseSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [RentSchedulesController],
  providers: [RentSchedulesService, RentScheduleRepository],
  exports: [RentSchedulesService, RentScheduleRepository],
})
export class RentSchedulesModule {}
