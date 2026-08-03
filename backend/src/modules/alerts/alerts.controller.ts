import { Controller, Get, Post, Body, Patch, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertSeverity, AlertCategory } from '@prisma/client';

@ApiTags('Alerts')
@ApiBearerAuth('JWT')
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Obtener lista de alertas activas' })
  getActiveAlerts(
    @Query('categoria') categoria?: AlertCategory,
    @Query('severidad') severidad?: AlertSeverity,
    @Query('isResolved') isResolved?: boolean,
    @Query('search') search?: string,
  ) {
    return this.alertsService.getActiveAlerts({
      categoria,
      severidad,
      isResolved: isResolved !== undefined ? String(isResolved) === 'true' : false,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener resumen y KPIs de alertas' })
  getAlertStats() {
    return this.alertsService.getAlertStats();
  }

  @Post('evaluate-all')
  @ApiOperation({ summary: 'Forzar escaneo y reevaluación manual de reglas de alertas' })
  async evaluateAll() {
    await this.alertsService.evaluarReglasGlobales();
    return { success: true, message: 'Evaluación de reglas completada exitosamente' };
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolver y cerrar alerta con nota de auditoría' })
  resolveAlert(@Param('id') id: string, @Req() req: any, @Body('nota') nota?: string) {
    return this.alertsService.resolveAlert(id, req.user?.id || 'admin', nota);
  }

  @Patch(':id/silence')
  @ApiOperation({ summary: 'Silenciar alerta temporalmente por N días' })
  silenceAlert(@Param('id') id: string, @Body('dias') dias?: number) {
    return this.alertsService.silenceAlert(id, dias || 7);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Obtener preferencias de notificación de alertas del usuario' })
  getUserPreferences(@Req() req: any) {
    return this.alertsService.getUserPreferences(req.user?.id || 'admin');
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Actualizar preferencias de notificación de alertas' })
  updateUserPreferences(@Req() req: any, @Body() dto: any) {
    return this.alertsService.updateUserPreferences(req.user?.id || 'admin', dto);
  }
}
