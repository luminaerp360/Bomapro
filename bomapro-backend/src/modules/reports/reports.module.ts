import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PropertiesModule } from '../properties/properties.module';
import { UnitsModule } from '../units/units.module';
import { PropertyTenantsModule } from '../property-tenants/property-tenants.module';
import { LeasesModule } from '../leases/leases.module';
import { PaymentsModule } from '../payments/payments.module';
import { DamagesModule } from '../damages/damages.module';

@Module({
  imports: [
    PropertiesModule,
    UnitsModule,
    PropertyTenantsModule,
    LeasesModule,
    PaymentsModule,
    DamagesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
