import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Trips')
@ApiBearerAuth('JWT')
@Controller('trips')
export class TripsController {
  constructor(private tripsService: TripsService) {}

  @Get()
  findAll(
    @Query('status') status?: TripStatus,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('clientId') clientId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tripsService.findAll({ status, vehicleId, driverId, clientId, from, to, search, page, limit });
  }

  @Get('gantt')
  @ApiOperation({ summary: 'Datos para vista Gantt semanal' })
  getGanttData(@Query('from') from: string, @Query('to') to: string) {
    const start = from || new Date().toISOString();
    const end = to || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    return this.tripsService.getGanttData(start, end);
  }

  @Get(':id') findOne(@Param('id') id: string) { return this.tripsService.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Crear viaje con validación de conflictos y cálculo de lead time' })
  create(@Body() dto: CreateTripDto, @CurrentUser('id') userId: string) {
    return this.tripsService.create(dto, userId);
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTripDto) { return this.tripsService.update(id, dto); }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado del viaje' })
  updateStatus(@Param('id') id: string, @Body('status') status: TripStatus, @Body('notes') notes?: string) {
    return this.tripsService.updateStatus(id, status, notes);
  }

  @Post(':id/costs')
  @ApiOperation({ summary: 'Agregar costo al viaje' })
  addCost(@Param('id') id: string, @Body() body: any) { return this.tripsService.addCost(id, body); }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reprogramar viaje con recálculo automático de llegada' })
  reschedule(@Param('id') id: string, @Body() body: { newDeparture: string; reason: string }) {
    return this.tripsService.reschedule(id, new Date(body.newDeparture), body.reason);
  }
}
