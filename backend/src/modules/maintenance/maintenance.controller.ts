import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatus, MaintenanceType, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Maintenance')
@ApiBearerAuth('JWT')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  @Get() findAll(@Query('vehicleId') v?: string, @Query('status') s?: MaintenanceStatus, @Query('tipo') t?: MaintenanceType, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.maintenanceService.findAll(v, s, t, p, l);
  }

  @Get('health-stats') getHealthStats() { return this.maintenanceService.getHealthStats(); }
  @Get('upcoming') getUpcoming() { return this.maintenanceService.getUpcoming(); }
  @Get('costs-by-vehicle') getCosts() { return this.maintenanceService.getCostsByVehicle(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.maintenanceService.findOne(id); }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  create(@Body() body: any) { return this.maintenanceService.create(body); }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  update(@Param('id') id: string, @Body() body: any) { return this.maintenanceService.update(id, body); }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.maintenanceService.remove(id); }
}

