import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { Unit, UnitSchema } from './schemas/unit.schema';
import { UnitRepository } from './repositories/unit.repository';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Unit.name, schema: UnitSchema }]),
    forwardRef(() => PropertiesModule),
  ],
  controllers: [UnitsController],
  providers: [UnitsService, UnitRepository],
  exports: [UnitsService, UnitRepository],
})
export class UnitsModule {}
