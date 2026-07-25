import { Injectable } from '@nestjs/common';
import { ConsumablesService } from '../consumables/consumables.service';

@Injectable()
export class FuelService {
  constructor(private consumablesService: ConsumablesService) {}

  findAll(vehicleId?: string, from?: string, to?: string, page = 1, limit = 20) {
    return this.consumablesService.findAll(vehicleId, undefined, from, to, page, limit);
  }

  create(dto: any) {
    return this.consumablesService.create(dto);
  }

  getAverageEfficiency(vehicleId: string) {
    return this.consumablesService.getAverageEfficiency(vehicleId);
  }

  getStats(vehicleId?: string, from?: string, to?: string) {
    return this.consumablesService.getStats(vehicleId, from, to);
  }

  getDeviations() {
    return this.consumablesService.getDeviations();
  }
}
