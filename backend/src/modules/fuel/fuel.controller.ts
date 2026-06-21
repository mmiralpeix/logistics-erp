import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FuelService } from './fuel.service';

@ApiTags('Fuel')
@ApiBearerAuth('JWT')
@Controller('fuel')
export class FuelController {
  constructor(private fuelService: FuelService) {}

  @Get() findAll(@Query('vehicleId') v?: string, @Query('from') f?: string, @Query('to') t?: string, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.fuelService.findAll(v, f, t, p, l);
  }
  @Get('stats') getStats(@Query('vehicleId') v?: string, @Query('from') f?: string, @Query('to') t?: string) { return this.fuelService.getStats(v, f, t); }
  @Get('deviations') getDeviations() { return this.fuelService.getDeviations(); }
  @Post() create(@Body() body: any) { return this.fuelService.create(body); }
}
