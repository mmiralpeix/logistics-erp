import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TripStatus, VehicleStatus, MaintenanceStatus } from '@prisma/client';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const { documentos } = await this.systemConfig.getAlertThresholds();
    const thirtyDaysLater = new Date(now.getTime() + documentos * 24 * 60 * 60 * 1000);

    const [
      totalVehicles, availableVehicles, inTripVehicles, maintenanceVehicles,
      motrizVehicles, remolcadoVehicles,
      totalDrivers, activeTrips, pendingTrips, completedThisMonth,
      cancelledThisMonth, totalClients,
      monthlyRevenue, monthlyCosts, monthlyFuel,
      expiringDocs, pendingMaintenances, activeAlertsTotal,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.DISPONIBLE } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.EN_VIAJE } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.EN_MANTENIMIENTO } }),
      this.prisma.vehicle.count({ where: { isActive: true, tipo: { in: ['CAMION', 'TRACTOR', 'CAMIONETA', 'EQUIPO_ESPECIAL'] } } }),
      this.prisma.vehicle.count({ where: { isActive: true, tipo: { notIn: ['CAMION', 'TRACTOR', 'CAMIONETA', 'EQUIPO_ESPECIAL'] } } }),
      this.prisma.driver.count({ where: { isActive: true } }),
      this.prisma.trip.count({ where: { status: TripStatus.EN_CURSO } }),
      this.prisma.trip.count({ where: { status: { in: [TripStatus.PENDIENTE, TripStatus.PROGRAMADO] } } }),
      this.prisma.trip.count({ where: { status: TripStatus.FINALIZADO, fechaSalidaReal: { gte: startOfMonth, lte: endOfMonth } } }),
      this.prisma.trip.count({ where: { status: TripStatus.CANCELADO, createdAt: { gte: startOfMonth } } }),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.invoice.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
      this.prisma.tripCost.aggregate({ where: { fecha: { gte: startOfMonth } }, _sum: { monto: true } }),
      this.prisma.fuelLog.aggregate({ where: { fecha: { gte: startOfMonth } }, _sum: { costoTotal: true, litros: true } }),
      this.prisma.vehicle.count({
        where: {
          isActive: true,
          OR: [
            { vencimientoSeguro: { lte: thirtyDaysLater } },
            { vencimientoITV: { lte: thirtyDaysLater } },
            { vencimientoRUTA: { lte: thirtyDaysLater } },
          ],
        },
      }),
      this.prisma.maintenance.count({ where: { status: { in: [MaintenanceStatus.PENDIENTE, MaintenanceStatus.EN_CURSO] } } }),
      this.prisma.alertRecord.count({ where: { isResolved: false } }),
    ]);

    const revenue = monthlyRevenue._sum.total || 0;
    const costs = (monthlyCosts._sum.monto || 0) + (monthlyFuel._sum.costoTotal || 0);
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;

    return {
      fleet: {
        total: totalVehicles,
        available: availableVehicles,
        inTrip: inTripVehicles,
        inMaintenance: maintenanceVehicles,
        motriz: motrizVehicles,
        remolcado: remolcadoVehicles,
        utilizationRate: totalVehicles > 0 ? Math.round((inTripVehicles / totalVehicles) * 100) : 0,
      },
      drivers: { total: totalDrivers },
      trips: {
        active: activeTrips,
        pending: pendingTrips,
        completedThisMonth,
        cancelledThisMonth,
      },
      clients: { total: totalClients },
      financial: {
        monthlyRevenue: revenue,
        monthlyCosts: costs,
        monthlyFuelCost: monthlyFuel._sum.costoTotal || 0,
        monthlyFuelLiters: monthlyFuel._sum.litros || 0,
        grossMarginPct: Math.round(margin * 10) / 10,
      },
      alerts: {
        total: activeAlertsTotal,
        expiringDocuments: expiringDocs,
        pendingMaintenances,
      },
    };
  }

  async getRecentTrips(limit = 10) {
    return this.prisma.trip.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { razonSocial: true } },
        vehicle: { select: { patente: true, marca: true, modelo: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getMonthlyChart() {
    const months = 6;
    const monthsPromises = Array.from({ length: months }, (_, idx) => {
      const i = months - 1 - idx;
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleString('es-AR', { month: 'short', year: 'numeric' });

      return Promise.all([
        this.prisma.invoice.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { total: true } }),
        this.prisma.trip.count({ where: { status: TripStatus.FINALIZADO, fechaSalidaReal: { gte: start, lte: end } } }),
        this.prisma.fuelLog.aggregate({ where: { fecha: { gte: start, lte: end } }, _sum: { costoTotal: true } }),
      ]).then(([revenue, trips, fuel]) => ({
        mes: label,
        facturacion: revenue._sum.total || 0,
        viajes: trips,
        combustible: fuel._sum.costoTotal || 0,
      }));
    });

    return Promise.all(monthsPromises);
  }

  async getExpiringAlerts() {
    const now = new Date();
    const { documentos } = await this.systemConfig.getAlertThresholds();
    const in30 = new Date(now.getTime() + documentos * 24 * 60 * 60 * 1000);

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        OR: [
          { vencimientoSeguro: { lte: in30 } },
          { vencimientoITV: { lte: in30 } },
          { vencimientoRUTA: { lte: in30 } },
        ],
      },
      select: { id: true, patente: true, marca: true, modelo: true, vencimientoSeguro: true, vencimientoITV: true, vencimientoRUTA: true },
    });

    const drivers = await this.prisma.driver.findMany({
      where: {
        isActive: true,
        OR: [
          { licenciaVencimiento: { lte: in30 } },
          { examenMedicoVencimiento: { lte: in30 } },
          { psicofisicoVencimiento: { lte: in30 } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, licenciaVencimiento: true, examenMedicoVencimiento: true, psicofisicoVencimiento: true },
    });

    return { vehicles, drivers };
  }

  async getTripStatusDistribution() {
    const statuses = Object.values(TripStatus);
    const counts = await Promise.all(
      statuses.map(async (status) => ({
        status,
        count: await this.prisma.trip.count({ where: { status } }),
      })),
    );
    return counts;
  }

  async getVehicleConsumptionChart() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { isActive: true },
      select: { id: true, patente: true, marca: true, modelo: true },
    });

    const logs = await this.prisma.fuelLog.findMany({
      select: {
        vehicleId: true,
        tipoConsumible: true,
        litros: true,
        costoTotal: true,
        rendimientoKmL: true,
      },
    });

    const map = new Map<string, { patente: string; marcaModelo: string; dieselLitros: number; ureaLitros: number; costoTotal: number; rendimientos: number[] }>();

    vehicles.forEach((v) => {
      map.set(v.id, {
        patente: v.patente,
        marcaModelo: `${v.marca} ${v.modelo}`,
        dieselLitros: 0,
        ureaLitros: 0,
        costoTotal: 0,
        rendimientos: [],
      });
    });

    logs.forEach((log) => {
      const entry = map.get(log.vehicleId);
      if (entry) {
        if (log.tipoConsumible === 'UREA') {
          entry.ureaLitros += log.litros || 0;
        } else {
          entry.dieselLitros += log.litros || 0;
        }
        entry.costoTotal += log.costoTotal || 0;
        if (log.rendimientoKmL && log.rendimientoKmL > 0) {
          entry.rendimientos.push(log.rendimientoKmL);
        }
      }
    });

    return Array.from(map.values())
      .map((item) => {
        const avgRendimiento = item.rendimientos.length > 0
          ? Math.round((item.rendimientos.reduce((a, b) => a + b, 0) / item.rendimientos.length) * 100) / 100
          : 0;
        const consumoL100Km = avgRendimiento > 0 ? Math.round((100 / avgRendimiento) * 10) / 10 : 0;
        return {
          patente: item.patente,
          marcaModelo: item.marcaModelo,
          dieselLitros: Math.round(item.dieselLitros),
          ureaLitros: Math.round(item.ureaLitros),
          costoTotal: Math.round(item.costoTotal),
          rendimientoKmL: avgRendimiento,
          consumoL100Km,
        };
      })
      .filter((item) => item.dieselLitros > 0 || item.ureaLitros > 0);
  }
}
