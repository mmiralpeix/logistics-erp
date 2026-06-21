import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DangerousGoodsService } from './dangerous-goods.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dangerous Goods')
@ApiBearerAuth('JWT')
@Controller('dangerous-goods')
export class DangerousGoodsController {
  constructor(private service: DangerousGoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las declaraciones de cargas peligrosas' })
  @ApiQuery({ name: 'clase', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('clase') clase?: string, @Query('search') search?: string) {
    return this.service.findAll({ clase, search });
  }

  @Get('clases')
  @ApiOperation({ summary: 'Obtener listado de clases de riesgo ONU (1-9)' })
  getClases() {
    return this.service.getClases();
  }

  @Get('compliance-check/:tripId')
  @ApiOperation({ summary: 'Verificar cumplimiento normativo de un viaje con carga peligrosa' })
  checkCompliance(@Param('tripId') tripId: string) {
    return this.service.checkTripCompliance(tripId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener declaración de carga peligrosa por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.DISPATCHER)
  @ApiOperation({ summary: 'Actualizar declaración de carga peligrosa' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Aprobar declaración (marcar permisosCompletos=true)' })
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar declaración de carga peligrosa' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
