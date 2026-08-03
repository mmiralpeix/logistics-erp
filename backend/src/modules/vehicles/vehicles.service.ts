import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus, VehicleType } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, status?: VehicleStatus, category?: string, type?: VehicleType, page: any = 1, limit: any = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);
    const skip = (p - 1) * l;
    const where: any = { isActive: true };

    if (search) where.OR = [
      { patente: { contains: search, mode: 'insensitive' } },
      { marca: { contains: search, mode: 'insensitive' } },
      { modelo: { contains: search, mode: 'insensitive' } },
    ];
    if (status) where.status = status;
    if (type) where.tipo = type;

    if (category) {
      if (category === 'MOTRIZ') {
        where.tipo = { in: ['CAMION', 'TRACTOR', 'CAMIONETA', 'EQUIPO_ESPECIAL'] };
      } else if (category === 'REMOLCADO') {
        where.tipo = { in: ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'BATEA', 'BITREN', 'CISTERNA', 'VOLQUETE', 'ACOPLADO'] };
      } else if (category === 'CARRETON') {
        where.tipo = { in: ['CARRETON', 'EQUIPO_ESPECIAL'] };
      } else if (category === 'UTILITARIO') {
        where.tipo = { in: ['CAMIONETA'] };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: l,
        orderBy: { patente: 'asc' },
        include: {
          gpsDevice: true,
          _count: { select: { trips: true, maintenances: true } },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return { data, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        maintenances: { orderBy: { createdAt: 'desc' }, take: 5 },
        fuelLogs: { orderBy: { fecha: 'desc' }, take: 10 },
        trips: { orderBy: { createdAt: 'desc' }, take: 5, include: { driver: true, client: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        gpsDevice: true,
      },
    });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    return v;
  }

  async create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: dto });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: VehicleStatus) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: { isActive: false } });
  }

  async getExpiringDocuments() {
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.vehicle.findMany({
      where: {
        isActive: true,
        OR: [
          { vencimientoSeguro: { lte: in30 } },
          { vencimientoITV: { lte: in30 } },
          { vencimientoRUTA: { lte: in30 } },
          { vencimientoEstanqueidad: { lte: in30 } },
        ],
      },
    });
  }

  async getAvailableForTrip(date: Date) {
    const tripsOnDate = await this.prisma.trip.findMany({
      where: {
        status: { in: ['EN_CURSO', 'PROGRAMADO'] as any },
        fechaSalidaProgramada: { lte: date },
        fechaLlegadaEstimada: { gte: date },
      },
      select: { vehicleId: true },
    });
    const busyIds = tripsOnDate.map((t) => t.vehicleId);

    return this.prisma.vehicle.findMany({
      where: { isActive: true, status: VehicleStatus.DISPONIBLE, id: { notIn: busyIds } },
    });
  }

  // Actualizar Odómetro / Horómetro
  async updateOdometer(id: string, kilometraje: number, horasMotor?: number) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        kilometraje: Number(kilometraje),
        ...(horasMotor !== undefined ? { horasMotor: Number(horasMotor) } : {}),
      },
    });
  }

  // Expediente 360° Completo del Vehículo
  async getSummary360(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { createdAt: 'desc' } },
        maintenances: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { sparePart: true } } },
        },
        fuelLogs: {
          orderBy: { fecha: 'desc' },
          take: 15,
        },
        tires: {
          where: { status: 'INSTALADO' },
          include: { retreads: true, inspections: { orderBy: { fecha: 'desc' }, take: 1 } },
        },
        gpsDevice: true,
      },
    });

    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const trips = await this.prisma.trip.findMany({
      where: { vehicleId: id },
      orderBy: { fechaSalidaProgramada: 'desc' },
      take: 10,
      include: { driver: true, client: true, costs: true },
    });

    const totalKmsRecorridos = trips.reduce((sum, t) => sum + (t.distanciaKm || 150), 0) || 1;
    const totalGastoCombustible = vehicle.fuelLogs.reduce((sum, f) => sum + f.costoTotal, 0);
    const totalLitrosCombustible = vehicle.fuelLogs.reduce((sum, f) => sum + f.litros, 0);
    const totalGastoMantenimiento = vehicle.maintenances.reduce((sum, m) => sum + (m.costoTotal || 0), 0);

    const promedioKmL = totalLitrosCombustible > 0 ? (totalKmsRecorridos / totalLitrosCombustible).toFixed(2) : '3.20';
    const kmProximoService = Math.ceil(vehicle.kilometraje / 15000) * 15000 + 15000;
    const kmRestantesService = Math.max(0, kmProximoService - vehicle.kilometraje);

    return {
      vehicle,
      trips,
      metrics: {
        totalKmsRecorridos,
        totalGastoCombustible,
        totalGastoMantenimiento,
        promedioKmL: Number(promedioKmL),
        kmProximoService,
        kmRestantesService,
        serviceStatus: kmRestantesService <= 1000 ? 'CRITICO' : kmRestantesService <= 2500 ? 'ADVERTENCIA' : 'NORMAL',
      },
    };
  }
}
