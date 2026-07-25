import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(vehicleId?: string, status?: MaintenanceStatus, tipo?: MaintenanceType, page = 1, limit = 20) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { patente: true, marca: true, modelo: true, kilometraje: true, status: true } },
          items: true,
        },
      }),
      this.prisma.maintenance.count({ where }),
    ]);
    return { data, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findOne(id: string) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      include: { vehicle: true, documents: true, items: true },
    });
    if (!m) throw new NotFoundException('Mantenimiento no encontrado');
    return m;
  }

  async create(dto: any) {
    const { items, ...data } = dto;
    if (!data.numeroOT) {
      data.numeroOT = `OT-${Date.now().toString().slice(-6)}`;
    }

    if (data.fecha) data.fecha = new Date(data.fecha);
    if (data.fechaProxima) data.fechaProxima = new Date(data.fechaProxima);
    if (data.garantiaHasta) data.garantiaHasta = new Date(data.garantiaHasta);
    if (data.kmActual !== undefined && data.kmActual !== null && data.kmActual !== '') data.kmActual = Number(data.kmActual);
    if (data.kmProximo !== undefined && data.kmProximo !== null && data.kmProximo !== '') data.kmProximo = Number(data.kmProximo);
    if (data.costoManoObra !== undefined && data.costoManoObra !== null && data.costoManoObra !== '') data.costoManoObra = Number(data.costoManoObra);

    let itemsCreate = undefined;
    if (items && Array.isArray(items) && items.length > 0) {
      itemsCreate = {
        create: items.map((i: any) => ({
          descripcion: i.descripcion,
          repuestoCodigo: i.repuestoCodigo || null,
          sparePartId: i.sparePartId || null,
          cantidad: Number(i.cantidad) || 1,
          costoUnitario: Number(i.costoUnitario) || 0,
          costoTotal: (Number(i.cantidad) || 1) * (Number(i.costoUnitario) || 0),
        })),
      };

      const itemsSum = items.reduce((acc: number, item: any) => acc + (Number(item.cantidad) || 1) * (Number(item.costoUnitario) || 0), 0);
      data.costoRepuestos = itemsSum;
      data.costoTotal = (Number(data.costoManoObra) || 0) + itemsSum;

      // Deduct stock from SparePart
      for (const item of items) {
        if (item.sparePartId) {
          const part = await this.prisma.sparePart.findUnique({ where: { id: item.sparePartId } });
          if (part) {
            const qty = Number(item.cantidad) || 1;
            const newStock = Math.max(0, part.stockActual - qty);
            await this.prisma.sparePart.update({ where: { id: item.sparePartId }, data: { stockActual: newStock } });
          }
        }
      }
    }

    const maintenance = await this.prisma.maintenance.create({
      data: {
        ...data,
        items: itemsCreate,
      },
      include: { vehicle: true, items: true },
    });

    // Update vehicle status if starting maintenance
    if (dto.status === MaintenanceStatus.EN_CURSO) {
      await this.prisma.vehicle.update({ where: { id: dto.vehicleId }, data: { status: 'EN_MANTENIMIENTO' as any } });
    }

    return maintenance;
  }

  async update(id: string, dto: any) {
    const m = await this.findOne(id);
    const { items, ...data } = dto;

    if (data.fecha) data.fecha = new Date(data.fecha);
    if (data.fechaProxima) data.fechaProxima = new Date(data.fechaProxima);
    if (data.garantiaHasta) data.garantiaHasta = new Date(data.garantiaHasta);
    if (data.kmActual !== undefined && data.kmActual !== null && data.kmActual !== '') data.kmActual = Number(data.kmActual);
    if (data.kmProximo !== undefined && data.kmProximo !== null && data.kmProximo !== '') data.kmProximo = Number(data.kmProximo);
    if (data.costoManoObra !== undefined && data.costoManoObra !== null && data.costoManoObra !== '') data.costoManoObra = Number(data.costoManoObra);

    if (items && Array.isArray(items)) {
      // Recreate items if provided
      await this.prisma.maintenanceItem.deleteMany({ where: { maintenanceId: id } });
      const itemsSum = items.reduce((acc: number, item: any) => acc + (Number(item.cantidad) || 1) * (Number(item.costoUnitario) || 0), 0);
      data.costoRepuestos = itemsSum;
      data.costoTotal = (Number(data.costoManoObra) || Number(m.costoManoObra) || 0) + itemsSum;
      
      await this.prisma.maintenanceItem.createMany({
        data: items.map((i: any) => ({
          maintenanceId: id,
          descripcion: i.descripcion,
          repuestoCodigo: i.repuestoCodigo || null,
          sparePartId: i.sparePartId || null,
          cantidad: Number(i.cantidad) || 1,
          costoUnitario: Number(i.costoUnitario) || 0,
          costoTotal: (Number(i.cantidad) || 1) * (Number(i.costoUnitario) || 0),
        })),
      });

      // Deduct stock for spare parts
      for (const item of items) {
        if (item.sparePartId) {
          const part = await this.prisma.sparePart.findUnique({ where: { id: item.sparePartId } });
          if (part) {
            const qty = Number(item.cantidad) || 1;
            const newStock = Math.max(0, part.stockActual - qty);
            await this.prisma.sparePart.update({ where: { id: item.sparePartId }, data: { stockActual: newStock } });
          }
        }
      }
    }

    const updated = await this.prisma.maintenance.update({
      where: { id },
      data,
      include: { vehicle: true, items: true },
    });

    // Handle vehicle status transitions
    if (dto.status === MaintenanceStatus.EN_CURSO && m.status !== MaintenanceStatus.EN_CURSO) {
      await this.prisma.vehicle.update({ where: { id: m.vehicleId }, data: { status: 'EN_MANTENIMIENTO' as any } });
    } else if (
      (dto.status === MaintenanceStatus.COMPLETADO || dto.status === MaintenanceStatus.CANCELADO) &&
      m.status === MaintenanceStatus.EN_CURSO
    ) {
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

  async getHealthStats() {
    const [totalVehicles, inMaintenance, pendingMaintenances, completedMaintenances] = await Promise.all([
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.count({ where: { status: 'EN_MANTENIMIENTO', isActive: true } }),
      this.prisma.maintenance.count({ where: { status: MaintenanceStatus.PENDIENTE } }),
      this.prisma.maintenance.aggregate({
        where: { status: MaintenanceStatus.COMPLETADO },
        _sum: { costoTotal: true },
      }),
    ]);

    const totalCost = completedMaintenances._sum.costoTotal || 0;

    return {
      totalVehicles,
      inMaintenance,
      operational: totalVehicles - inMaintenance,
      pendingMaintenances,
      totalCost,
    };
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
      select: { id: true, patente: true, marca: true, modelo: true, kilometraje: true },
    });

    return result.map((r) => {
      const v = vehicles.find((veh) => veh.id === r.vehicleId);
      const totalCost = r._sum.costoTotal || 0;
      const km = v?.kilometraje || 1;
      return {
        ...r,
        vehicle: v,
        costPerKm: km > 0 ? (totalCost / km).toFixed(2) : 0,
      };
    });
  }
}
