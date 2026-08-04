import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';
import { TiresController } from './tires.controller';
import { TiresService } from './tires.service';

import { ReserveFundsModule } from '../reserve-funds/reserve-funds.module';

@Module({
  imports: [ReserveFundsModule],
  controllers: [TiresController, SparePartsController, MaintenanceController],
  providers: [MaintenanceService, SparePartsService, TiresService],
  exports: [MaintenanceService, SparePartsService, TiresService],
})
export class MaintenanceModule {}
