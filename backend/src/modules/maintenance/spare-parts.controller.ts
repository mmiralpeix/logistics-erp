import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SparePartsService } from './spare-parts.service';

@ApiTags('Maintenance')
@ApiBearerAuth('JWT')
@Controller('maintenance/spare-parts')
export class SparePartsController {
  constructor(private sparePartsService: SparePartsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('tipoVehiculo') tipoVehiculo?: string
  ) {
    return this.sparePartsService.findAll({ search, categoria, tipoVehiculo });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sparePartsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.sparePartsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.sparePartsService.update(id, body);
  }

  @Patch(':id/stock')
  adjustStock(@Param('id') id: string, @Body('delta') delta: number) {
    return this.sparePartsService.adjustStock(id, Number(delta) || 0);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sparePartsService.remove(id);
  }
}
