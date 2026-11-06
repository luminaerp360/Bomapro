import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PublicInvoicesController } from './public-invoices.controller';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentRepository } from './repositories/payment.repository';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';
import { PropertyTenant, PropertyTenantSchema } from '../property-tenants/schemas/property-tenant.schema';
import { Lease, LeaseSchema } from '../leases/schemas/lease.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Unit, UnitSchema } from '../units/schemas/unit.schema';
import { Tenant, TenantSchema } from '../tenants/schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
      { name: Lease.name, schema: LeaseSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Unit.name, schema: UnitSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    RentSchedulesModule,
  ],
  controllers: [PaymentsController, PublicInvoicesController],
  providers: [PaymentsService, PaymentRepository],
  exports: [PaymentsService, PaymentRepository],
})
export class PaymentsModule {}
