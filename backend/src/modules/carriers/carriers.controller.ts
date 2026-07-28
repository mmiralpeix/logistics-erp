import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CarriersService } from './carriers.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { CreateCarrierVehicleDto, CreateCarrierDriverDto } from './dto/carrier-resources.dto';

@ApiTags('Carriers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  // ═══════════════════════════════════════════════════════════════
  // CARRIER CRUD
  // ═══════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Listar operadores logísticos' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.carriersService.findAll({
      search,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener operador logístico por ID' })
  findOne(@Param('id') id: string) {
    return this.carriersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear operador logístico' })
  create(@Body() dto: CreateCarrierDto) {
    return this.carriersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar operador logístico' })
  update(@Param('id') id: string, @Body() dto: UpdateCarrierDto) {
    return this.carriersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar operador logístico' })
  remove(@Param('id') id: string) {
    return this.carriersService.remove(id);
  }

  // ═══════════════════════════════════════════════════════════════
  // CARRIER VEHICLES
  // ═══════════════════════════════════════════════════════════════

  @Get(':carrierId/vehicles')
  @ApiOperation({ summary: 'Listar vehículos de un operador' })
  findVehicles(@Param('carrierId') carrierId: string) {
    return this.carriersService.findVehicles(carrierId);
  }

  @Post(':carrierId/vehicles')
  @ApiOperation({ summary: 'Agregar vehículo a un operador' })
  createVehicle(
    @Param('carrierId') carrierId: string,
    @Body() dto: CreateCarrierVehicleDto,
  ) {
    return this.carriersService.createVehicle(carrierId, dto);
  }

  @Patch('vehicles/:vehicleId')
  @ApiOperation({ summary: 'Actualizar vehículo de operador' })
  updateVehicle(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateCarrierVehicleDto,
  ) {
    return this.carriersService.updateVehicle(vehicleId, dto);
  }

  @Delete('vehicles/:vehicleId')
  @ApiOperation({ summary: 'Desactivar vehículo de operador' })
  removeVehicle(@Param('vehicleId') vehicleId: string) {
    return this.carriersService.removeVehicle(vehicleId);
  }

  // ═══════════════════════════════════════════════════════════════
  // CARRIER DRIVERS
  // ═══════════════════════════════════════════════════════════════

  @Get(':carrierId/drivers')
  @ApiOperation({ summary: 'Listar choferes de un operador' })
  findDrivers(@Param('carrierId') carrierId: string) {
    return this.carriersService.findDrivers(carrierId);
  }

  @Post(':carrierId/drivers')
  @ApiOperation({ summary: 'Agregar chofer a un operador' })
  createDriver(
    @Param('carrierId') carrierId: string,
    @Body() dto: CreateCarrierDriverDto,
  ) {
    return this.carriersService.createDriver(carrierId, dto);
  }

  @Patch('drivers/:driverId')
  @ApiOperation({ summary: 'Actualizar chofer de operador' })
  updateDriver(
    @Param('driverId') driverId: string,
    @Body() dto: CreateCarrierDriverDto,
  ) {
    return this.carriersService.updateDriver(driverId, dto);
  }

  @Delete('drivers/:driverId')
  @ApiOperation({ summary: 'Desactivar chofer de operador' })
  removeDriver(@Param('driverId') driverId: string) {
    return this.carriersService.removeDriver(driverId);
  }
}
