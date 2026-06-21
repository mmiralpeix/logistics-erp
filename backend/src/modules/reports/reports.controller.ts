import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('trips/excel')
  @ApiOperation({ summary: 'Exportar reporte de viajes a Excel' })
  async tripsExcel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const toDate = to || new Date().toISOString();
    const buffer = await this.reportsService.generateTripsReport(fromDate, toDate);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-viajes-${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('fleet/excel')
  @ApiOperation({ summary: 'Exportar reporte de flota a Excel' })
  async fleetExcel(@Res() res: Response) {
    const buffer = await this.reportsService.generateFleetReport();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="reporte-flota.xlsx"',
    });
    res.end(buffer);
  }

  @Get('fuel/excel')
  @ApiOperation({ summary: 'Exportar reporte de combustible a Excel' })
  async fuelExcel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const toDate = to || new Date().toISOString();
    const buffer = await this.reportsService.generateFuelReport(fromDate, toDate);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="reporte-combustible.xlsx"',
    });
    res.end(buffer);
  }
}
