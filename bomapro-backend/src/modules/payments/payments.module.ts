import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentRepository } from './repositories/payment.repository';
import { RentSchedulesModule } from '../rent-schedules/rent-schedules.module';
import { PropertyTenant, PropertyTenantSchema } from '../property-tenants/schemas/property-tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PropertyTenant.name, schema: PropertyTenantSchema },
    ]),
    RentSchedulesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentRepository],
  exports: [PaymentsService, PaymentRepository],
})
export class PaymentsModule {}
