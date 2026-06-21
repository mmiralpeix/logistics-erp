import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(vehicleId?: string, status?: MaintenanceStatus, tipo?: MaintenanceType, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { patente: true, marca: true, modelo: true } } },
      }),
      this.prisma.maintenance.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true, documents: true },
    });
    if (!m) throw new NotFoundException('Mantenimiento no encontrado');
    return m;
  }

  async create(dto: any) {
    const maintenance = await this.prisma.maintenance.create({
      data: dto,
      include: { vehicle: true },
    });

    // Update vehicle status if starting maintenance
    if (dto.status === MaintenanceStatus.EN_CURSO) {
      await this.prisma.vehicle.update({ where: { id: dto.vehicleId }, data: { status: 'EN_MANTENIMIENTO' as any } });
    }

    return maintenance;
  }

  async update(id: string, dto: any) {
    const m = await this.findOne(id);
    const updated = await this.prisma.maintenance.update({ where: { id }, data: dto });

    // If completed, free the vehicle
    if (dto.status === MaintenanceStatus.COMPLETADO && m.status !== MaintenanceStatus.COMPLETADO) {
      const vehicle = await this.prisma.vehicle.findUnique({ where: { id: m.vehicleId } });
      if (vehicle?.status === 'EN_MANTENIMIENTO') {
        await this.prisma.vehicle.update({ where: { id: m.vehicleId }, data: { status: 'DISPONIBLE' as any } });
      }
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.maintenance.delete({ where: { id } });
  }

  async getUpcoming() {
    const in15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    return this.prisma.maintenance.findMany({
      where: {
        status: MaintenanceStatus.PENDIENTE,
        OR: [
          { fechaProxima: { lte: in15 } },
          { kmProximo: { lte: 5000 } },
        ],
      },
      include: { vehicle: { select: { patente: true, marca: true, modelo: true, kilometraje: true } } },
    });
  }

  async getCostsByVehicle() {
    const result = await this.prisma.maintenance.groupBy({
      by: ['vehicleId'],
      _sum: { costoTotal: true },
      where: { status: MaintenanceStatus.COMPLETADO },
    });

    const vehicleIds = result.map((r) => r.vehicleId);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, patente: true, marca: true, modelo: true },
    });

    return result.map((r) => ({
      ...r,
      vehicle: vehicles.find((v) => v.id === r.vehicleId),
    }));
  }
}
