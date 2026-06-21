import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

@ApiTags('Maintenance')
@ApiBearerAuth('JWT')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get() findAll(@Query('vehicleId') v?: string, @Query('status') s?: MaintenanceStatus, @Query('tipo') t?: MaintenanceType, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.maintenanceService.findAll(v, s, t, p, l);
  }

  @Get('upcoming') getUpcoming() { return this.maintenanceService.getUpcoming(); }
  @Get('costs-by-vehicle') getCosts() { return this.maintenanceService.getCostsByVehicle(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.maintenanceService.findOne(id); }
  @Post() create(@Body() body: any) { return this.maintenanceService.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.maintenanceService.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.maintenanceService.remove(id); }
}
