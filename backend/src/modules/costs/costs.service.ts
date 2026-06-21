import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CostsService {
  constructor(private prisma: PrismaService) {}

  async getCostsByTrip(tripId: string) {
    const costs = await this.prisma.tripCost.findMany({ where: { tripId }, orderBy: { fecha: 'desc' } });
    const total = costs.reduce((sum, c) => sum + c.monto, 0);
    const byCategory = costs.reduce((acc: any, c) => {
      acc[c.categoria] = (acc[c.categoria] || 0) + c.monto;
      return acc;
    }, {});
    return { costs, total, byCategory };
  }

  async getCostsByVehicle(vehicleId: string, from?: string, to?: string) {
    const where: any = { trip: { vehicleId } };
    if (from || to) { where.fecha = {}; if (from) where.fecha.gte = new Date(from); if (to) where.fecha.lte = new Date(to); }

    const costs = await this.prisma.tripCost.findMany({ where, include: { trip: { select: { numero: true } } } });
    const total = costs.reduce((sum, c) => sum + c.monto, 0);
    const byCategory = costs.reduce((acc: any, c) => { acc[c.categoria] = (acc[c.categoria] || 0) + c.monto; return acc; }, {});
    return { costs, total, byCategory };
  }

  async getMonthlyBreakdown(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const [tripCosts, fuelCosts, maintenanceCosts] = await Promise.all([
      this.prisma.tripCost.groupBy({ by: ['categoria'], where: { fecha: { gte: start, lte: end } }, _sum: { monto: true } }),
      this.prisma.fuelLog.aggregate({ where: { fecha: { gte: start, lte: end } }, _sum: { costoTotal: true, litros: true } }),
      this.prisma.maintenance.aggregate({ where: { fecha: { gte: start, lte: end }, status: 'COMPLETADO' as any }, _sum: { costoTotal: true } }),
    ]);

    return {
      tripCosts,
      fuelTotal: fuelCosts._sum.costoTotal || 0,
      fuelLiters: fuelCosts._sum.litros || 0,
      maintenanceTotal: maintenanceCosts._sum.costoTotal || 0,
    };
  }

  async getRealCostPerTrip(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        costs: true,
        fuelLogs: true,
      },
    });

    const tripCostsTotal = trip.costs.reduce((sum, c) => sum + c.monto, 0);
    const fuelTotal = trip.fuelLogs.reduce((sum, f) => sum + f.costoTotal, 0);
    const totalCost = tripCostsTotal + fuelTotal;
    const revenue = trip.tarifaAcordada || 0;
    const margin = revenue - totalCost;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

    return {
      tripId,
      numero: trip.numero,
      revenue,
      costs: { trip: tripCostsTotal, fuel: fuelTotal, total: totalCost },
      margin,
      marginPct: Math.round(marginPct * 10) / 10,
    };
  }
}
