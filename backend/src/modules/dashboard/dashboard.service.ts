import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TripStatus, VehicleStatus, MaintenanceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalVehicles, availableVehicles, inTripVehicles, maintenanceVehicles,
      totalDrivers, activeTrips, pendingTrips, completedThisMonth,
      cancelledThisMonth, totalClients,
      monthlyRevenue, monthlyCosts, monthlyFuel,
      expiringDocs, pendingMaintenances,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.DISPONIBLE } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.EN_VIAJE } }),
      this.prisma.vehicle.count({ where: { isActive: true, status: VehicleStatus.EN_MANTENIMIENTO } }),
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
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0);
      const label = start.toLocaleString('es-AR', { month: 'short', year: 'numeric' });

      const [revenue, trips, fuel] = await Promise.all([
        this.prisma.invoice.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { total: true } }),
        this.prisma.trip.count({ where: { status: TripStatus.FINALIZADO, fechaSalidaReal: { gte: start, lte: end } } }),
        this.prisma.fuelLog.aggregate({ where: { fecha: { gte: start, lte: end } }, _sum: { costoTotal: true } }),
      ]);

      data.push({
        mes: label,
        facturacion: revenue._sum.total || 0,
        viajes: trips,
        combustible: fuel._sum.costoTotal || 0,
      });
    }
    return data;
  }

  async getExpiringAlerts() {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
}
