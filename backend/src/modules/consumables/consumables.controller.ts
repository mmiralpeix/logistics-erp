import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsumablesService } from './consumables.service';

@ApiTags('Consumables')
@ApiBearerAuth('JWT')
@Controller('consumables')
export class ConsumablesController {
  constructor(private consumablesService: ConsumablesService) {}

  @Get()
  findAll(
    @Query('vehicleId') v?: string,
    @Query('tipoConsumible') t?: string,
    @Query('from') f?: string,
    @Query('to') to?: string,
    @Query('page') p?: number,
    @Query('limit') l?: number,
  ) {
    return this.consumablesService.findAll(v, t, f, to, p, l);
  }

  @Get('stats')
  getStats(
    @Query('vehicleId') v?: string,
    @Query('from') f?: string,
    @Query('to') to?: string,
  ) {
    return this.consumablesService.getStats(v, f, to);
  }

  @Get('deviations')
  getDeviations() {
    return this.consumablesService.getDeviations();
  }

  @Post()
  create(@Body() body: any) {
    return this.consumablesService.create(body);
  }
}
