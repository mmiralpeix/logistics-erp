import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';

@Module({
  controllers: [MaintenanceController, SparePartsController],
  providers: [MaintenanceService, SparePartsService],
  exports: [MaintenanceService, SparePartsService],
})
export class MaintenanceModule {}
