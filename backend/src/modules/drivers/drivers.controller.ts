import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Drivers')
@ApiBearerAuth('JWT')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get() findAll(@Query('search') s?: string, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.driversService.findAll(s, p, l);
  }

  @Get('expiring-licenses') getExpiring() { return this.driversService.getExpiringLicenses(); }

  @Get('available') getAvailable(@Query('date') date?: string) {
    return this.driversService.getAvailableForDate(date ? new Date(date) : new Date());
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.driversService.findOne(id); }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  create(@Body() dto: CreateDriverDto) { return this.driversService.create(dto); }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) { return this.driversService.update(id, dto); }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.driversService.remove(id); }

  @Post(':id/trainings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Agregar capacitación a conductor' })
  addTraining(@Param('id') id: string, @Body() body: any) { return this.driversService.addTraining(id, body); }
}

