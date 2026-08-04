import { Controller, Get, Post, Put, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReserveFundsService } from './reserve-funds.service';
import { UpdateReserveFundConfigDto } from './dto/update-config.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';

@ApiTags('Reserve Funds')
@ApiBearerAuth()
@Controller('reserve-funds')
export class ReserveFundsController {
  constructor(private readonly reserveFundsService: ReserveFundsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener métricas y rankings del Dashboard Global de Fondos de Reserva' })
  async getDashboard() {
    return this.reserveFundsService.getGlobalDashboardMetrics();
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración de porcentajes y pesos de reparto' })
  async getConfig() {
    return this.reserveFundsService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Actualizar porcentajes y pesos de reparto por tipo de activo' })
  async updateConfig(@Body() dto: UpdateReserveFundConfigDto) {
    return this.reserveFundsService.updateConfig(dto);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Obtener resumen de saldos e historial de cuenta corriente para un activo' })
  async getAssetSummary(@Param('vehicleId') vehicleId: string) {
    return this.reserveFundsService.getAssetFundSummary(vehicleId);
  }

  @Post('manual-adjustment')
  @ApiOperation({ summary: 'Registrar un ajuste manual auditable en la cuenta corriente del activo' })
  async manualAdjustment(@Body() dto: ManualAdjustmentDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.reserveFundsService.manualAdjustment(dto, userId);
  }

  @Post('trigger-trip-accrual/:tripId')
  @ApiOperation({ summary: 'Disparar manualmente la acreditación por viaje (Pruebas / Debug)' })
  async triggerTripAccrual(@Param('tripId') tripId: string) {
    return this.reserveFundsService.processTripAccrual(tripId);
  }

  @Post('trigger-ot-debit/:maintenanceId')
  @ApiOperation({ summary: 'Disparar manualmente el débito por OT (Pruebas / Debug)' })
  async triggerOtDebit(@Param('maintenanceId') maintenanceId: string) {
    return this.reserveFundsService.processMaintenanceDebit(maintenanceId);
  }
}
