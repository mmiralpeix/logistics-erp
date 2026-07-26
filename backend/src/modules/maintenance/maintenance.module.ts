import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';

@Module({
  controllers: [SparePartsController, MaintenanceController],
  providers: [MaintenanceService, SparePartsService],
  exports: [MaintenanceService, SparePartsService],
})
export class MaintenanceModule {}
