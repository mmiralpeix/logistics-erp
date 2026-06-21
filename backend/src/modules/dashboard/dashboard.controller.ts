import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas generales del dashboard' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-trips')
  @ApiOperation({ summary: 'Viajes recientes' })
  getRecentTrips(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentTrips(limit || 10);
  }

  @Get('monthly-chart')
  @ApiOperation({ summary: 'Gráfico de facturación y viajes mensual' })
  getMonthlyChart() {
    return this.dashboardService.getMonthlyChart();
  }

  @Get('expiring-alerts')
  @ApiOperation({ summary: 'Alertas de vencimientos próximos' })
  getExpiringAlerts() {
    return this.dashboardService.getExpiringAlerts();
  }

  @Get('trip-distribution')
  @ApiOperation({ summary: 'Distribución de estados de viajes' })
  getTripStatusDistribution() {
    return this.dashboardService.getTripStatusDistribution();
  }
}
