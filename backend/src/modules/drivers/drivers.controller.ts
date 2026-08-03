import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { RecordShiftEventDto } from './dto/record-shift-event.dto';
import { UpdateDriverScheduleDto } from './dto/update-driver-schedule.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Drivers')
@ApiBearerAuth('JWT')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get()
  findAll(@Query('search') s?: string, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.driversService.findAll(s, p, l);
  }

  @Get('expiring-licenses')
  getExpiring() {
    return this.driversService.getExpiringLicenses();
  }

  @Get('available')
  getAvailable(@Query('date') date?: string) {
    return this.driversService.getAvailableForDate(date ? new Date(date) : new Date());
  }

  // --- Schedule Submodule Endpoints ---

  @Get('schedule/kpis')
  @ApiOperation({ summary: 'KPIs consolidados de jornadas de choferes' })
  getScheduleKpis() {
    return this.driversService.getScheduleKpis();
  }

  @Get('schedule/export')
  @ApiOperation({ summary: 'Exportar reporte de jornadas y excesos' })
  exportScheduleReport(@Query() query: any) {
    return this.driversService.exportScheduleReport(query);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Listar jornadas de choferes con filtros y cálculos en tiempo real' })
  getSchedule(@Query() query: any) {
    return this.driversService.getSchedule(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Get(':id/shift-history')
  @ApiOperation({ summary: 'Obtener historial de eventos de jornada de un conductor' })
  getShiftHistory(@Param('id') id: string) {
    return this.driversService.getShiftHistory(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  create(@Body() dto: CreateDriverDto) {
    return this.driversService.create(dto);
  }

  @Post(':id/shift-event')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Registrar evento de jornada (Inicio turno, regreso, descanso)' })
  recordShiftEvent(@Param('id') id: string, @Body() dto: RecordShiftEventDto) {
    return this.driversService.recordShiftEvent(id, dto);
  }

  @Patch(':id/schedule-config')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Actualizar configuración de modalidad de jornada' })
  updateScheduleConfig(@Param('id') id: string, @Body() dto: UpdateDriverScheduleDto) {
    return this.driversService.updateScheduleConfig(id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.driversService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  @Post(':id/trainings')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Agregar capacitación a conductor' })
  addTraining(@Param('id') id: string, @Body() body: any) {
    return this.driversService.addTraining(id, body);
  }
}
