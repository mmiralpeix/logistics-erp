import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';
import { TiresController } from './tires.controller';
import { TiresService } from './tires.service';

@Module({
  controllers: [SparePartsController, MaintenanceController, TiresController],
  providers: [MaintenanceService, SparePartsService, TiresService],
  exports: [MaintenanceService, SparePartsService, TiresService],
})
export class MaintenanceModule {}
