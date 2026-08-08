import { Controller, Get, Post, Body, Patch, Param, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportTemplateDto } from './dto/create-report-template.dto';
import { SaveReportDto } from './dto/save-report.dto';
import { CreateReportScheduleDto } from './dto/create-report-schedule.dto';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Obtener plantillas de reportes disponibles' })
  getTemplates() {
    return this.reportsService.getTemplates();
  }

  @Post('templates')
  @ApiOperation({ summary: 'Crear una nueva plantilla de reporte' })
  createTemplate(@Body() dto: CreateReportTemplateDto) {
    return this.reportsService.createTemplate(dto);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Obtener biblioteca de reportes guardados' })
  getSavedReports() {
    return this.reportsService.getSavedReports();
  }

  @Post('saved')
  @ApiOperation({ summary: 'Guardar un reporte generado en la biblioteca' })
  saveReport(@Body() dto: SaveReportDto) {
    return this.reportsService.saveReport(dto);
  }

  @Patch('saved/:id/favorite')
  @ApiOperation({ summary: 'Marcar o desmarcar reporte como favorito' })
  toggleFavorite(@Param('id') id: string) {
    return this.reportsService.toggleFavoriteSavedReport(id);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Obtener envíos automáticos programados' })
  getSchedules() {
    return this.reportsService.getSchedules();
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Programar envío recurrente de reporte' })
  createSchedule(@Body() dto: CreateReportScheduleDto) {
    return this.reportsService.createSchedule(dto);
  }

  @Patch('schedules/:id/toggle')
  @ApiOperation({ summary: 'Activar / pausar envío programado' })
  toggleSchedule(@Param('id') id: string) {
    return this.reportsService.toggleScheduleActive(id);
  }

  @Get('executive-summary')
  @ApiOperation({ summary: 'Generar resumen ejecutivo analítico del período' })
  generateExecutiveSummary(@Query() query: any) {
    return this.reportsService.generateExecutiveSummary(query);
  }

  @Get('generate-data')
  @ApiOperation({ summary: 'Compilar datos de viajes, flota, diésel, mantenimiento y neumáticos para reporte' })
  generateReportData(@Query() query: any) {
    return this.reportsService.generateReportData(query);
  }

  @Get('trips/excel')
  @ApiOperation({ summary: 'Exportar reporte de viajes a Excel' })
  async downloadTripsExcel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const buffer = await this.reportsService.generateTripsReport(from, to);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Viajes_${from}_${to}.xlsx`);
    res.send(buffer);
  }

  @Get('fleet/excel')
  @ApiOperation({ summary: 'Exportar reporte de flota a Excel' })
  async downloadFleetExcel(@Res() res: Response) {
    const buffer = await this.reportsService.generateFleetReport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Reporte_Flota.xlsx');
    res.send(buffer);
  }

  @Get('fuel/excel')
  @ApiOperation({ summary: 'Exportar reporte de combustible a Excel' })
  async downloadFuelExcel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const buffer = await this.reportsService.generateFuelReport(from, to);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte_Combustible_${from}_${to}.xlsx`);
    res.send(buffer);
  }

  // Etapa 11 — reportes fiscales básicos, sobre Invoice/InvoiceItem reales.

  @Get('billing/iva-ventas')
  @ApiOperation({ summary: 'Libro IVA Ventas del período (neto, IVA y total por comprobante)' })
  getIvaVentas(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getIvaVentas(from, to);
  }

  @Get('billing/iva-ventas/excel')
  @ApiOperation({ summary: 'Exportar Libro IVA Ventas a Excel' })
  async downloadIvaVentasExcel(@Query('from') from: string, @Query('to') to: string, @Res() res: Response) {
    const buffer = await this.reportsService.generateIvaVentasExcel(from, to);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Libro_IVA_Ventas_${from}_${to}.xlsx`);
    res.send(buffer);
  }

  @Get('billing/por-cliente')
  @ApiOperation({ summary: 'Facturación total por cliente en el período' })
  getFacturacionPorCliente(@Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.getFacturacionPorCliente(from, to);
  }

  @Get('billing/cartera-aging')
  @ApiOperation({ summary: 'Cartera pendiente de cobro por antigüedad (corriente / 1-30 / 31-60 / 61-90 / 90+)' })
  getCarteraAging() {
    return this.reportsService.getCarteraAging();
  }
}
