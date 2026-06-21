import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  async findAll(vehicleId?: string, from?: string, to?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.fuelLog.findMany({
        where, skip, take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          vehicle: { select: { patente: true, marca: true, modelo: true } },
          trip: { select: { numero: true, origen: true, destino: true } },
        },
      }),
      this.prisma.fuelLog.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: any) {
    // Calculate efficiency
    if (dto.kmActual && dto.litros) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
      if (vehicle && vehicle.kilometraje && dto.kmActual > vehicle.kilometraje) {
        const kmRecorridos = dto.kmActual - vehicle.kilometraje;
        dto.rendimientoKmL = Math.round((kmRecorridos / dto.litros) * 100) / 100;
        // Detect anomaly: if rendimiento is 30% below average, flag it
        const avg = await this.getAverageEfficiency(dto.vehicleId);
        if (avg && dto.rendimientoKmL < avg * 0.7) {
          dto.esDesvio = true;
          if (!dto.notas) dto.notas = `ALERTA: Rendimiento ${dto.rendimientoKmL} km/L muy por debajo del promedio (${avg} km/L)`;
        }
        // Update vehicle km
        await this.prisma.vehicle.update({ where: { id: dto.vehicleId }, data: { kilometraje: dto.kmActual } });
      }
    }

    return this.prisma.fuelLog.create({ data: dto, include: { vehicle: true } });
  }

  async getAverageEfficiency(vehicleId: string): Promise<number | null> {
    const result = await this.prisma.fuelLog.aggregate({
      where: { vehicleId, rendimientoKmL: { not: null }, esDesvio: false },
      _avg: { rendimientoKmL: true },
    });
    return result._avg.rendimientoKmL;
  }

  async getStats(vehicleId?: string, from?: string, to?: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (from) where.fecha = { gte: new Date(from) };
    if (to) { where.fecha = { ...(where.fecha || {}), lte: new Date(to) }; }

    const [totals, anomalies, byVehicle] = await Promise.all([
      this.prisma.fuelLog.aggregate({ where, _sum: { litros: true, costoTotal: true }, _avg: { rendimientoKmL: true, precioPorLitro: true } }),
      this.prisma.fuelLog.count({ where: { ...where, esDesvio: true } }),
      this.prisma.fuelLog.groupBy({
        by: ['vehicleId'],
        where,
        _sum: { litros: true, costoTotal: true },
        _avg: { rendimientoKmL: true },
      }),
    ]);

    return { totals, anomalies, byVehicle };
  }

  async getDeviations() {
    return this.prisma.fuelLog.findMany({
      where: { esDesvio: true },
      include: { vehicle: { select: { patente: true, marca: true, modelo: true } } },
      orderBy: { fecha: 'desc' },
      take: 20,
    });
  }
}
