import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Clients')
@ApiBearerAuth('JWT')
@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.clientsService.findAll(search, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear cliente' })
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Actualizar cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Historial del cliente' })
  getHistory(@Param('id') id: string) {
    return this.clientsService.getHistory(id);
  }

  @Get(':id/contracts')
  @ApiOperation({ summary: 'Listar Órdenes de Compra / Contratos del cliente' })
  getContracts(@Param('id') id: string) {
    return this.clientsService.getContracts(id);
  }

  @Post(':id/contracts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear o actualizar Orden de Compra / Contrato' })
  createContract(@Param('id') id: string, @Body() dto: any) {
    return this.clientsService.createContract(id, dto);
  }

  @Get(':id/summary-360')
  @ApiOperation({ summary: 'Obtener expediente 360° completo del cliente' })
  getSummary360(@Param('id') id: string) {
    return this.clientsService.getSummary360(id);
  }

  @Get(':id/rates')
  @ApiOperation({ summary: 'Listar tarifario acordado por tramo del cliente' })
  getRates(@Param('id') id: string) {
    return this.clientsService.getRates(id);
  }

  @Post(':id/rates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Agregar tarifa por tramo al cliente' })
  addRate(@Param('id') id: string, @Body() dto: any) {
    return this.clientsService.addRate(id, dto);
  }

  @Delete('rates/:rateId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Eliminar tarifa por tramo' })
  removeRate(@Param('rateId') rateId: string) {
    return this.clientsService.removeRate(rateId);
  }
}
