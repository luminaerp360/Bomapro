import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { PropertyTenantsModule } from './modules/property-tenants/property-tenants.module';
import { LeasesModule } from './modules/leases/leases.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RentSchedulesModule } from './modules/rent-schedules/rent-schedules.module';
import { DamagesModule } from './modules/damages/damages.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TenantPortalModule } from './modules/tenant-portal/tenant-portal.module';
import { MaintenanceRequestsModule } from './modules/maintenance-requests/maintenance-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    TenantsModule,
    PropertiesModule,
    UnitsModule,
    PropertyTenantsModule,
    LeasesModule,
    PaymentsModule,
    RentSchedulesModule,
    DamagesModule,
    ReportsModule,
    TenantPortalModule,
    MaintenanceRequestsModule,
  ],
})
export class AppModule {}
