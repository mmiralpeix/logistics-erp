import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs gerenciales agregados' })
  getKpis(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getKpis({ from, to });
  }

  @Get('comparative')
  @ApiOperation({ summary: 'Obtener series comparativas temporales' })
  getComparative(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getComparative({ from, to });
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Obtener proyecciones predictivas de mantenimiento, diésel y neumáticos' })
  getPredictive() {
    return this.analyticsService.getPredictive();
  }

  @Get('vehicle-ranking')
  @ApiOperation({ summary: 'Obtener ranking de vehículos por eficiencia operativa' })
  getVehicleRanking() {
    return this.analyticsService.getVehicleRanking();
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar tablero BI completo a Excel' })
  async exportAnalyticsExcel(@Res() res: Response) {
    const buffer = await this.analyticsService.exportAnalyticsExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Tablero_BI_Analytics.xlsx');
    res.send(buffer);
  }
}
