import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus, VehicleType } from '@prisma/client';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT')
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Query('search') s?: string,
    @Query('status') st?: VehicleStatus,
    @Query('category') cat?: string,
    @Query('type') t?: VehicleType,
    @Query('page') p?: number,
    @Query('limit') l?: number,
  ) {
    return this.vehiclesService.findAll(s, st, cat, t, p, l);
  }

  @Get('expiring') getExpiring() { return this.vehiclesService.getExpiringDocuments(); }

  @Get('available') getAvailable(@Query('date') date?: string) {
    return this.vehiclesService.getAvailableForTrip(date ? new Date(date) : new Date());
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.vehiclesService.findOne(id); }

  @Post() create(@Body() dto: CreateVehicleDto) { return this.vehiclesService.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) { return this.vehiclesService.update(id, dto); }

  @Patch(':id/status') updateStatus(@Param('id') id: string, @Body('status') status: VehicleStatus) {
    return this.vehiclesService.updateStatus(id, status);
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.vehiclesService.remove(id); }
}
