import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus, VehicleType, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

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

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  create(@Body() dto: CreateVehicleDto) { return this.vehiclesService.create(dto); }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) { return this.vehiclesService.update(id, dto); }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  updateStatus(@Param('id') id: string, @Body('status') status: VehicleStatus) {
    return this.vehiclesService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.vehiclesService.remove(id); }
}

