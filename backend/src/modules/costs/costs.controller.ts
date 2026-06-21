import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CostsService } from './costs.service';

@ApiTags('Costs')
@ApiBearerAuth('JWT')
@Controller('costs')
export class CostsController {
  constructor(private costsService: CostsService) {}

  @Get('trip/:tripId') getCostsByTrip(@Param('tripId') id: string) { return this.costsService.getCostsByTrip(id); }
  @Get('vehicle/:vehicleId') getCostsByVehicle(@Param('vehicleId') id: string, @Query('from') f?: string, @Query('to') t?: string) { return this.costsService.getCostsByVehicle(id, f, t); }
  @Get('monthly') getMonthly(@Query('year') year: number, @Query('month') month: number) { return this.costsService.getMonthlyBreakdown(year, month); }
  @Get('trip/:tripId/real') getRealCost(@Param('tripId') id: string) { return this.costsService.getRealCostPerTrip(id); }
}
