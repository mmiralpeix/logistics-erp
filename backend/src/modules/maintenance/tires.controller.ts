import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TiresService } from './tires.service';
import { CreateTireDto } from './dto/create-tire.dto';
import { InstallTireDto, DismountTireDto } from './dto/install-tire.dto';
import { RotateTiresDto } from './dto/rotate-tires.dto';
import { SendToRetreadDto, ReceiveFromRetreadDto } from './dto/create-tire-retread.dto';
import { CreateTireInspectionDto } from './dto/create-tire-inspection.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Maintenance — Tires')
@ApiBearerAuth('JWT')
@Controller(['maintenance/tires', 'tires'])
export class TiresController {
  constructor(private tiresService: TiresService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Métricas consolidadas de neumáticos (KPIS & CPK)' })
  getKPIs() {
    return this.tiresService.getKPIs();
  }

  @Get('vehicle/:vehicleId/positions')
  @ApiOperation({ summary: 'Obtener mapa visual de ejes y posiciones de neumáticos en un vehículo' })
  getVehicleAxlePositions(@Param('vehicleId') vehicleId: string) {
    return this.tiresService.getVehicleAxlePositions(vehicleId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar reporte de inventario de neumáticos a CSV' })
  exportReport(@Query() query: any) {
    return this.tiresService.exportReport(query);
  }

  @Get()
  @ApiOperation({ summary: 'Listar neumáticos con filtros de búsqueda y estado' })
  findAll(@Query() query: any) {
    return this.tiresService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de neumático con su historial completo' })
  findOne(@Param('id') id: string) {
    return this.tiresService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Alta de nuevo neumático activo' })
  create(@Body() dto: CreateTireDto) {
    return this.tiresService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Actualizar especificaciones del neumático' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.tiresService.update(id, dto);
  }

  @Post(':id/install')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Instalar neumático en vehículo y posición' })
  install(@Param('id') id: string, @Body() dto: InstallTireDto) {
    return this.tiresService.install(id, dto);
  }

  @Post(':id/dismount')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Desmontar neumático a depósito' })
  dismount(@Param('id') id: string, @Body() dto: DismountTireDto) {
    return this.tiresService.dismount(id, dto);
  }

  @Post('rotate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Rotar posiciones entre dos neumáticos' })
  rotate(@Body() dto: RotateTiresDto) {
    return this.tiresService.rotate(dto);
  }

  @Post(':id/retread')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Enviar neumático a recapado' })
  sendToRetread(@Param('id') id: string, @Body() dto: SendToRetreadDto) {
    return this.tiresService.sendToRetread(id, dto);
  }

  @Post(':id/retread/receive')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Registrar recepción de neumático recapado' })
  receiveFromRetread(@Param('id') id: string, @Body() dto: ReceiveFromRetreadDto) {
    return this.tiresService.receiveFromRetread(id, dto);
  }

  @Post(':id/inspection')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Registrar inspección periódica de profundidad y presión' })
  recordInspection(@Param('id') id: string, @Body() dto: CreateTireInspectionDto) {
    return this.tiresService.recordInspection(id, dto);
  }

  @Post(':id/retire')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Dar de baja definitiva al neumático' })
  retire(@Param('id') id: string, @Body('motivo') motivo: string) {
    return this.tiresService.retire(id, motivo);
  }
}
