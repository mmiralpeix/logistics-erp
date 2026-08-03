import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConsumablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(vehicleId?: string, tipoConsumible?: string, from?: string, to?: string, page = 1, limit = 20) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (tipoConsumible && tipoConsumible !== 'TODOS') {
      where.OR = [{ tipoConsumible }, { tipoCombustible: tipoConsumible }];
    }
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.fuelLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { fecha: 'desc' },
        include: {
          vehicle: { select: { patente: true, marca: true, modelo: true } },
          trip: { select: { numero: true, origen: true, destino: true } },
        },
      }),
      this.prisma.fuelLog.count({ where }),
    ]);

    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  }

  async create(dto: any) {
    const tipo = dto.tipoConsumible || 'DIESEL';
    dto.tipoConsumible = tipo;
    dto.tipoCombustible = tipo; // retrocompatibilidad

    if (dto.litros && dto.precioPorLitro && !dto.costoTotal) {
      dto.costoTotal = Number((dto.litros * dto.precioPorLitro).toFixed(2));
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });

    // Lógica para DIESEL
    if (tipo === 'DIESEL' && dto.kmActual && dto.litros) {
      if (vehicle && vehicle.kilometraje && dto.kmActual > vehicle.kilometraje) {
        const kmRecorridos = dto.kmActual - vehicle.kilometraje;
        dto.rendimientoKmL = Math.round((kmRecorridos / dto.litros) * 100) / 100;
        
        const avg = await this.getAverageEfficiency(dto.vehicleId);
        if (avg && dto.rendimientoKmL < avg * 0.7) {
          dto.esDesvio = true;
          if (!dto.notas) {
            dto.notas = `ALERTA: Rendimiento ${dto.rendimientoKmL} km/L muy por debajo del promedio (${avg} km/L)`;
          }
        }
      }
    }

    // Lógica para UREA
    if (tipo === 'UREA' && dto.vehicleId) {
      // Buscar la última carga de diésel para calcular el ratio Urea/Diésel
      const lastDiesel = await this.prisma.fuelLog.findFirst({
        where: { vehicleId: dto.vehicleId, tipoConsumible: 'DIESEL' },
        orderBy: { fecha: 'desc' },
      });

      if (lastDiesel && lastDiesel.litros > 0) {
        const ratio = Math.round((dto.litros / lastDiesel.litros) * 10000) / 100; // Porcentaje %
        dto.ratioUreaPorcentaje = ratio;

        // Rango normal estimado de Urea frente a diésel: 2.5% a 6%
        if (ratio > 8.0 || ratio < 1.5) {
          dto.esDesvio = true;
          if (!dto.notas) {
            dto.notas = `ALERTA: Consumo de Urea (${ratio}%) fuera del rango normal estimado (3% - 5% de diésel)`;
          }
        }
      }
    }

    // Actualizar kilometraje del vehículo si es mayor al registrado
    if (vehicle && dto.kmActual && dto.kmActual > vehicle.kilometraje) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: { kilometraje: dto.kmActual },
      });
    }

    return this.prisma.fuelLog.create({
      data: dto,
      include: { vehicle: true },
    });
  }

  async getAverageEfficiency(vehicleId: string): Promise<number | null> {
    const result = await this.prisma.fuelLog.aggregate({
      where: { vehicleId, tipoConsumible: 'DIESEL', rendimientoKmL: { not: null }, esDesvio: false },
      _avg: { rendimientoKmL: true },
    });
    return result._avg.rendimientoKmL;
  }

  async getStats(vehicleId?: string, from?: string, to?: string) {
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.fecha = {};
      if (from) where.fecha.gte = new Date(from);
      if (to) where.fecha.lte = new Date(to);
    }

    const [dieselTotals, ureaTotals, otherTotals, anomalies, byVehicle] = await Promise.all([
      // Métricas Diésel
      this.prisma.fuelLog.aggregate({
        where: { ...where, tipoConsumible: 'DIESEL' },
        _sum: { litros: true, costoTotal: true },
        _avg: { rendimientoKmL: true, precioPorLitro: true },
      }),
      // Métricas Urea
      this.prisma.fuelLog.aggregate({
        where: { ...where, tipoConsumible: 'UREA' },
        _sum: { litros: true, costoTotal: true },
        _avg: { ratioUreaPorcentaje: true, precioPorLitro: true },
      }),
      // Métricas Otros consumibles (aceites, lubricantes, etc.)
      this.prisma.fuelLog.aggregate({
        where: { ...where, tipoConsumible: { notIn: ['DIESEL', 'UREA'] } },
        _sum: { litros: true, costoTotal: true },
      }),
      // Desvíos totales
      this.prisma.fuelLog.count({ where: { ...where, esDesvio: true } }),
      // Desglose por Vehículo
      this.prisma.fuelLog.groupBy({
        by: ['vehicleId', 'tipoConsumible'],
        where,
        _sum: { litros: true, costoTotal: true },
        _avg: { rendimientoKmL: true, ratioUreaPorcentaje: true },
      }),
    ]);

    const totalLitros = (dieselTotals._sum.litros || 0) + (ureaTotals._sum.litros || 0) + (otherTotals._sum.litros || 0);
    const costoTotalGeneral = (dieselTotals._sum.costoTotal || 0) + (ureaTotals._sum.costoTotal || 0) + (otherTotals._sum.costoTotal || 0);

    return {
      totals: {
        totalLitros,
        costoTotalGeneral,
        _sum: { litros: totalLitros, costoTotal: costoTotalGeneral },
        _avg: { rendimientoKmL: dieselTotals._avg.rendimientoKmL },
      },
      diesel: {
        litros: dieselTotals._sum.litros || 0,
        costoTotal: dieselTotals._sum.costoTotal || 0,
        rendimientoKmL: dieselTotals._avg.rendimientoKmL || 0,
        precioMedio: dieselTotals._avg.precioPorLitro || 0,
      },
      urea: {
        litros: ureaTotals._sum.litros || 0,
        costoTotal: ureaTotals._sum.costoTotal || 0,
        ratioPromedio: ureaTotals._avg.ratioUreaPorcentaje || 0,
        precioMedio: ureaTotals._avg.precioPorLitro || 0,
      },
      otros: {
        litros: otherTotals._sum.litros || 0,
        costoTotal: otherTotals._sum.costoTotal || 0,
      },
      anomalies,
      byVehicle,
    };
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
