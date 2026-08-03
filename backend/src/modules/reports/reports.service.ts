import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { CreateReportTemplateDto } from './dto/create-report-template.dto';
import { SaveReportDto } from './dto/save-report.dto';
import { CreateReportScheduleDto } from './dto/create-report-schedule.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // 1. Plantillas
  async getTemplates() {
    const list = await this.prisma.reportTemplate.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (list.length === 0) {
      // Seed default templates
      const defaults = [
        {
          nombre: 'Informe Gerencial de Flota & Costos',
          descripcion: 'Resumen ejecutivo mensual de costos, viajes y rendimiento de combustible',
          categoria: 'GERENCIA',
          isDefault: true,
          configJson: {
            showLogo: true,
            showSummary: true,
            showKPIs: true,
            showTripChart: true,
            showCostTable: true,
            showSignatures: true,
          },
        },
        {
          nombre: 'Reporte Operativo de Viajes & Cargas',
          descripcion: 'Detalle de viajes completados, demorados y margen por cliente',
          categoria: 'OPERACIONES',
          isDefault: true,
          configJson: {
            showLogo: true,
            showSummary: true,
            showKPIs: true,
            showTripTable: true,
            showSignatures: false,
          },
        },
        {
          nombre: 'Auditoría de Mantenimiento & Repuestos',
          descripcion: 'Órdenes de trabajo, estado de vehículos en taller y consumo de repuestos',
          categoria: 'MANTENIMIENTO',
          isDefault: true,
          configJson: {
            showLogo: true,
            showSummary: true,
            showKPIs: true,
            showMaintenanceTable: true,
            showSignatures: true,
          },
        },
        {
          nombre: 'Gestión Integral de Neumáticos (CPK)',
          descripcion: 'Inventario de neumáticos, alertas de desgaste crítico, recapados y CPK',
          categoria: 'FLOTA',
          isDefault: true,
          configJson: {
            showLogo: true,
            showSummary: true,
            showKPIs: true,
            showTireTable: true,
            showSignatures: false,
          },
        },
        {
          nombre: 'Control de Jornadas de Choferes & RRHH',
          descripcion: 'Cumplimiento de régimen laboral (21x7, 14x7), días en ruta y descansos',
          categoria: 'RRHH',
          isDefault: true,
          configJson: {
            showLogo: true,
            showSummary: true,
            showKPIs: true,
            showDriverTable: true,
            showSignatures: true,
          },
        },
      ];

      for (const d of defaults) {
        await this.prisma.reportTemplate.create({ data: d });
      }
      return this.prisma.reportTemplate.findMany({ orderBy: { createdAt: 'asc' } });
    }

    return list;
  }

  async createTemplate(dto: CreateReportTemplateDto) {
    return this.prisma.reportTemplate.create({
      data: dto,
    });
  }

  // 2. Reportes Guardados / Biblioteca
  async getSavedReports() {
    return this.prisma.reportSaved.findMany({
      orderBy: [{ favorito: 'desc' }, { createdAt: 'desc' }],
      include: { template: true },
    });
  }

  async saveReport(dto: SaveReportDto) {
    return this.prisma.reportSaved.create({
      data: {
        ...dto,
        periodoFrom: new Date(dto.periodoFrom),
        periodoTo: new Date(dto.periodoTo),
      },
    });
  }

  async toggleFavoriteSavedReport(id: string) {
    const report = await this.prisma.reportSaved.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    return this.prisma.reportSaved.update({
      where: { id },
      data: { favorito: !report.favorito },
    });
  }

  // 3. Envíos Programados
  async getSchedules() {
    return this.prisma.reportSchedule.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSchedule(dto: CreateReportScheduleDto) {
    const proximoEnvio = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días por defecto
    return this.prisma.reportSchedule.create({
      data: {
        ...dto,
        proximoEnvio,
      },
    });
  }

  async toggleScheduleActive(id: string) {
    const item = await this.prisma.reportSchedule.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Programación no encontrada');
    return this.prisma.reportSchedule.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
  }

  // 4. Síntesis Ejecutiva por IA (Basada estrictamente en métricas reales de la BD)
  async generateExecutiveSummary(query: { from?: string; to?: string; categoria?: string }) {
    const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = query.to ? new Date(query.to) : new Date();

    const [trips, maintenances, tires, fuelLogs, driversCount] = await Promise.all([
      this.prisma.trip.findMany({
        where: { fechaSalidaProgramada: { gte: fromDate, lte: toDate } },
        include: { costs: true },
      }),
      this.prisma.maintenance.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.tire.findMany({
        include: { retreads: true },
      }),
      this.prisma.fuelLog.findMany({
        where: { fecha: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.driver.count({ where: { isActive: true } }),
    ]);

    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === 'FINALIZADO').length;
    const delayedTrips = trips.filter((t) => t.status === 'DEMORADO').length;
    const tripSuccessRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : '100';

    const totalRevenue = trips.reduce((sum, t) => sum + (t.tarifaAcordada || 0), 0);
    const tripCosts = trips.reduce((sum, t) => sum + t.costs.reduce((cSum, c) => cSum + c.monto, 0), 0);
    const maintenanceCosts = maintenances.reduce((sum, m) => sum + (m.costoTotal || 0), 0);
    const fuelLiters = fuelLogs.reduce((sum, f) => sum + (f.litros || 0), 0);
    const totalOperatingCosts = tripCosts + maintenanceCosts;
    const grossProfit = totalRevenue - totalOperatingCosts;
    const marginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

    const criticalTiresCount = tires.filter((t) => t.profundidadActualMm <= 3.0).length;
    const totalRetreads = tires.reduce((sum, t) => sum + t.cantidadRecapados, 0);

    const summaryText =
      `Durante el período analizado (${fromDate.toLocaleDateString('es-AR')} al ${toDate.toLocaleDateString('es-AR')}), ` +
      `se operaron un total de ${totalTrips} viajes con una tasa de cumplimiento del ${tripSuccessRate}% (${completedTrips} completados a tiempo, ${delayedTrips} demorados).\n\n` +
      `En el ámbito financiero, la facturación bruta alcanzó $ ${totalRevenue.toLocaleString('es-AR')}, con un costo operativo acumulado de $ ${totalOperatingCosts.toLocaleString('es-AR')} ` +
      `(incluyendo $ ${maintenanceCosts.toLocaleString('es-AR')} en mantenimiento de taller). Esto representó un margen bruto operativo del ${marginPct}%.\n\n` +
      `En materia de flota y seguridad, se consumieron ${fuelLiters.toLocaleString('es-AR')} litros de diésel. En la gestión de neumáticos, se registraron ${criticalTiresCount} unidades con desgaste crítico (<3.0 mm) que requieren atención preventiva, ` +
      `habiéndose optimizado el costo por kilómetro mediante ${totalRetreads} recapados activos en la flota de ${driversCount} choferes operativos.`;

    return {
      periodo: { from: fromDate, to: toDate },
      summary: summaryText,
      metrics: {
        totalTrips,
        completedTrips,
        delayedTrips,
        tripSuccessRate: `${tripSuccessRate}%`,
        totalRevenue,
        totalOperatingCosts,
        grossProfit,
        marginPct: `${marginPct}%`,
        fuelLiters,
        criticalTiresCount,
        totalRetreads,
      },
    };
  }

  // 5. Compilación de Datos Estructurados para el Diseñador Visual
  async generateReportData(query: { from?: string; to?: string; categoria?: string }) {
    const fromDate = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = query.to ? new Date(query.to) : new Date();

    const [summaryRes, trips, vehicles, maintenances, tires, drivers] = await Promise.all([
      this.generateExecutiveSummary(query),
      this.prisma.trip.findMany({
        where: { fechaSalidaProgramada: { gte: fromDate, lte: toDate } },
        include: { client: true, vehicle: true, driver: true, costs: true },
        take: 20,
        orderBy: { fechaSalidaProgramada: 'desc' },
      }),
      this.prisma.vehicle.findMany({ take: 20 }),
      this.prisma.maintenance.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        include: { vehicle: true },
        take: 15,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tire.findMany({
        include: { vehicle: true, retreads: true },
        take: 20,
      }),
      this.prisma.driver.findMany({ take: 20 }),
    ]);

    return {
      periodo: { from: fromDate, to: toDate },
      resumenIA: summaryRes.summary,
      metrics: summaryRes.metrics,
      trips,
      vehicles,
      maintenances,
      tires,
      drivers,
    };
  }

  // 6. Reportes Excel existentes
  async generateTripsReport(from: string, to: string): Promise<Buffer> {
    const trips = await this.prisma.trip.findMany({
      where: { fechaSalidaProgramada: { gte: new Date(from), lte: new Date(to) } },
      include: {
        client: { select: { razonSocial: true } },
        vehicle: { select: { patente: true, marca: true, modelo: true } },
        driver: { select: { firstName: true, lastName: true } },
        costs: true,
      },
      orderBy: { fechaSalidaProgramada: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LogisticsPro ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Reporte de Viajes', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    sheet.mergeCells('A1:N1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `REPORTE DE VIAJES - ${new Date(from).toLocaleDateString('es-AR')} al ${new Date(to).toLocaleDateString('es-AR')}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    const headers = ['N° Viaje', 'Estado', 'Cliente', 'Origen', 'Destino', 'Vehículo', 'Conductor', 'Salida Prog.', 'Llegada Est.', 'Salida Real', 'Llegada Real', 'Tarifa', 'Costo', 'Margen'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const formatDate = (d: Date | null) => (d ? new Date(d).toLocaleDateString('es-AR') : '-');
    const formatMoney = (n: number | null) => (n ? `$ ${n.toLocaleString('es-AR')}` : '-');

    trips.forEach((trip) => {
      const totalCost = trip.costs.reduce((sum, c) => sum + c.monto, 0);
      const margin = trip.tarifaAcordada && totalCost ? trip.tarifaAcordada - totalCost : null;

      sheet.addRow([
        trip.numero,
        trip.status,
        trip.client?.razonSocial || '-',
        trip.origen,
        trip.destino,
        `${trip.vehicle?.patente} - ${trip.vehicle?.marca}`,
        `${trip.driver?.firstName} ${trip.driver?.lastName}`,
        formatDate(trip.fechaSalidaProgramada),
        formatDate(trip.fechaLlegadaEstimada),
        formatDate(trip.fechaSalidaReal),
        formatDate(trip.fechaLlegadaReal),
        formatMoney(trip.tarifaAcordada),
        formatMoney(totalCost),
        formatMoney(margin),
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateFleetReport(): Promise<Buffer> {
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        maintenances: { where: { status: 'EN_CURSO' } },
        documents: { where: { isExpired: true } },
      },
      orderBy: { patente: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Estado de Flota');

    sheet.mergeCells('A1:I1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'REPORTE DE ESTADO DE FLOTA';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    const headers = ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Km', 'Estado', 'Documentos Vencidos', 'En Mantenimiento'];
    sheet.addRow(headers);

    vehicles.forEach((v) => {
      sheet.addRow([
        v.patente,
        v.marca,
        v.modelo,
        v.anio,
        v.tipo,
        v.kilometraje,
        v.status,
        v.documents.length,
        v.maintenances.length > 0 ? 'SÍ' : 'NO',
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateFuelReport(from: string, to: string): Promise<Buffer> {
    const fuelLogs = await this.prisma.fuelLog.findMany({
      where: { fecha: { gte: new Date(from), lte: new Date(to) } },
      include: {
        vehicle: { select: { patente: true, marca: true, modelo: true } },
        trip: { select: { driver: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { fecha: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Control de Combustible');

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `CONTROL DE COMBUSTIBLE - ${from} al ${to}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };

    const headers = ['Fecha', 'Vehículo', 'Conductor', 'Litros', 'Costo Total', 'Km Horómetro', 'Estación', 'Rendimiento (km/l)'];
    sheet.addRow(headers);

    fuelLogs.forEach((f) => {
      const driverName = f.trip?.driver ? `${f.trip.driver.firstName} ${f.trip.driver.lastName}` : 'Chofer Flota';
      sheet.addRow([
        new Date(f.fecha).toLocaleDateString('es-AR'),
        f.vehicle?.patente,
        driverName,
        f.litros,
        `$ ${f.costoTotal.toLocaleString('es-AR')}`,
        f.kmActual || 0,
        f.estacion || '-',
        f.rendimientoKmL ? `${f.rendimientoKmL.toFixed(2)} km/l` : '-',
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
