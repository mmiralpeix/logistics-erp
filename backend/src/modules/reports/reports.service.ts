import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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

    // Header styling
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
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } } };
    });
    sheet.getRow(2).height = 22;

    const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('es-AR') : '-';
    const formatMoney = (n: number | null) => n ? `$ ${n.toLocaleString('es-AR')}` : '-';

    trips.forEach((trip, idx) => {
      const totalCost = trip.costs.reduce((sum, c) => sum + c.monto, 0);
      const margin = trip.tarifaAcordada && totalCost ? trip.tarifaAcordada - totalCost : null;

      const row = sheet.addRow([
        trip.numero, trip.status,
        trip.client?.razonSocial || '-',
        trip.origen, trip.destino,
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

      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
        });
      }
    });

    // Auto-width
    sheet.columns.forEach((col) => {
      let max = 10;
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > max) max = len;
      });
      col.width = Math.min(max + 2, 40);
    });

    // Totals row
    const totalRevenue = trips.reduce((sum, t) => sum + (t.tarifaAcordada || 0), 0);
    const totalCostAll = trips.reduce((sum, t) => sum + t.costs.reduce((s, c) => s + c.monto, 0), 0);
    const totalsRow = sheet.addRow(['', '', '', '', '', '', 'TOTALES →', '', '', '', '', formatMoney(totalRevenue), formatMoney(totalCostAll), formatMoney(totalRevenue - totalCostAll)]);
    totalsRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateFleetReport(): Promise<Buffer> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        maintenances: { where: { status: 'COMPLETADO' as any }, select: { costoTotal: true } },
        fuelLogs: { select: { litros: true, costoTotal: true } },
        _count: { select: { trips: true } },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte de Flota');

    sheet.addRow(['REPORTE DE FLOTA - LogisticsPro ERP']).font = { bold: true, size: 14 };
    sheet.addRow([]);

    const headers = ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Estado', 'Km', 'Viajes', 'Costo Mantenim.', 'Costo Combustible', 'Vcto. Seguro', 'Vcto. ITV', 'Vcto. RUTA'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };

    const formatDate = (d: Date | null) => d ? new Date(d).toLocaleDateString('es-AR') : 'N/A';

    vehicles.forEach((v) => {
      const maintenanceCost = v.maintenances.reduce((s, m) => s + (m.costoTotal || 0), 0);
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.costoTotal, 0);
      sheet.addRow([
        v.patente, v.marca, v.modelo, v.anio, v.tipo, v.status,
        v.kilometraje, v._count.trips,
        maintenanceCost, fuelCost,
        formatDate(v.vencimientoSeguro), formatDate(v.vencimientoITV), formatDate(v.vencimientoRUTA),
      ]);
    });

    sheet.columns.forEach((col) => { col.width = 15; });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateFuelReport(from: string, to: string): Promise<Buffer> {
    const logs = await this.prisma.fuelLog.findMany({
      where: { fecha: { gte: new Date(from), lte: new Date(to) } },
      include: { vehicle: { select: { patente: true, marca: true, modelo: true } } },
      orderBy: { fecha: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Control de Combustible');
    sheet.addRow(['REPORTE DE COMBUSTIBLE']).font = { bold: true, size: 13 };
    sheet.addRow([]);
    const headers = ['Fecha', 'Vehículo', 'Litros', 'Precio/L', 'Costo Total', 'KM Actual', 'Rendimiento (km/L)', 'Proveedor', 'Desvío'];
    sheet.addRow(headers).font = { bold: true };

    logs.forEach((l) => {
      sheet.addRow([
        new Date(l.fecha).toLocaleDateString('es-AR'),
        `${l.vehicle.patente} - ${l.vehicle.marca}`,
        l.litros,
        `$ ${l.precioPorLitro}`,
        `$ ${l.costoTotal}`,
        l.kmActual || '-',
        l.rendimientoKmL || '-',
        l.proveedor || '-',
        l.esDesvio ? '⚠️ SÍ' : 'No',
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
