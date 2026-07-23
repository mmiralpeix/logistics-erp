import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripStatus } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  private generateTripNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const rand = Math.floor(Math.random() * 9000) + 1000;
    return `VJ-${year}-${rand}`;
  }

  // Calcula el lead time total considerando ruta + esperas + descansos
  private calculateLeadTime(duracionEstimadaHoras: number, esperaEnDestinoHoras: number, descansosConductorHoras: number): number {
    return duracionEstimadaHoras + esperaEnDestinoHoras + descansosConductorHoras;
  }

  private calculateArrivalEstimate(departure: Date, leadTime: number): Date {
    return new Date(departure.getTime() + leadTime * 60 * 60 * 1000);
  }

  async findAll(filters?: {
    status?: TripStatus;
    vehicleId?: string;
    driverId?: string;
    clientId?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, vehicleId, driverId, clientId, from, to, search, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (clientId) where.clientId = clientId;
    if (from || to) {
      where.fechaSalidaProgramada = {};
      if (from) where.fechaSalidaProgramada.gte = new Date(from);
      if (to) where.fechaSalidaProgramada.lte = new Date(to);
    }
    if (search) where.OR = [
      { numero: { contains: search, mode: 'insensitive' } },
      { origen: { contains: search, mode: 'insensitive' } },
      { destino: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where, skip, take: limit,
        orderBy: { fechaSalidaProgramada: 'desc' },
        include: {
          client: { select: { razonSocial: true, cuit: true } },
          contract: { select: { numero: true, tarifaBase: true, pesoMinimoKg: true, tarifaExcedentePorTn: true } },
          vehicle: { select: { patente: true, marca: true, modelo: true, tipo: true } },
          trailer: { select: { patente: true, marca: true, modelo: true, tipo: true } },
          driver: { select: { firstName: true, lastName: true, telefono: true } },
          dangerousGoods: true,
          _count: { select: { costs: true, incidents: true } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        vehicle: true,
        trailer: true,
        driver: true,
        dispatcher: { select: { firstName: true, lastName: true, email: true } },
        dangerousGoods: true,
        costs: { orderBy: { fecha: 'desc' } },
        checkpoints: { orderBy: { orden: 'asc' } },
        documents: true,
        incidents: { orderBy: { fecha: 'desc' } },
        invoiceItems: { include: { invoice: true } },
        fuelLogs: { orderBy: { fecha: 'desc' } },
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
  }

  async create(dto: CreateTripDto, dispatcherId?: string) {
    // Validate: no other active trip for same vehicle on overlapping dates
    const duracion = dto.duracionEstimadaHoras || 12;
    const espera = dto.esperaEnDestinoHoras || 0;
    const descanso = dto.descansosConductorHoras || 0;
    const leadTime = this.calculateLeadTime(duracion, espera, descanso);
    const departure = new Date(dto.fechaSalidaProgramada);
    const estimatedArrival = dto.fechaLlegadaEstimada ? new Date(dto.fechaLlegadaEstimada) : this.calculateArrivalEstimate(departure, leadTime);

    const vehicleConflict = await this.prisma.trip.findFirst({
      where: {
        vehicleId: dto.vehicleId,
        status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
        fechaSalidaProgramada: { lte: estimatedArrival },
        fechaLlegadaEstimada: { gte: departure },
      },
    });
    if (vehicleConflict) throw new BadRequestException(`El vehículo ya tiene un viaje asignado en ese período (${vehicleConflict.numero})`);

    const driverConflict = await this.prisma.trip.findFirst({
      where: {
        driverId: dto.driverId,
        status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
        fechaSalidaProgramada: { lte: estimatedArrival },
        fechaLlegadaEstimada: { gte: departure },
      },
    });
    if (driverConflict) throw new BadRequestException(`El conductor ya tiene un viaje asignado en ese período (${driverConflict.numero})`);

    // Validate dangerous goods compliance
    if (dto.esCargaPeligrosa) {
      const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
      if (!driver?.habilitadoCargasPeligrosas) {
        throw new BadRequestException('El conductor no está habilitado para transportar cargas peligrosas');
      }
    }

    const { checkpoints, dangerousGoods, ...tripData } = dto;

    const trip = await this.prisma.trip.create({
      data: {
        ...tripData,
        numero: this.generateTripNumber(),
        dispatcherId,
        fechaSalidaProgramada: departure,
        fechaLlegadaEstimada: estimatedArrival,
        leadTimeTotal: leadTime,
        checkpoints: checkpoints?.length
          ? { create: checkpoints.map((cp, i) => ({ ...cp, orden: i + 1 })) }
          : undefined,
        dangerousGoods: dangerousGoods ? { create: dangerousGoods as any } : undefined,
      },
      include: { client: true, vehicle: true, driver: true, dangerousGoods: true, checkpoints: true },
    });

    // Update vehicle status
    await this.prisma.vehicle.update({
      where: { id: dto.vehicleId },
      data: { status: 'RESERVADO' as any },
    });

    return trip;
  }

  async update(id: string, dto: UpdateTripDto) {
    await this.findOne(id);
    const { checkpoints, dangerousGoods, ...data } = dto;
    return this.prisma.trip.update({ where: { id }, data, include: { client: true, vehicle: true, driver: true } });
  }

  async updateStatus(id: string, status: TripStatus, notes?: string) {
    const trip = await this.findOne(id);

    const updates: any = { status };
    if (status === TripStatus.EN_CURSO && !trip.fechaSalidaReal) updates.fechaSalidaReal = new Date();
    if (status === TripStatus.FINALIZADO && !trip.fechaLlegadaReal) updates.fechaLlegadaReal = new Date();
    if (notes) updates.notas = notes;

    const updated = await this.prisma.trip.update({ where: { id }, data: updates });

    // Free up vehicle if trip is done
    if (status === TripStatus.FINALIZADO || status === TripStatus.CANCELADO) {
      await this.prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'DISPONIBLE' as any } });
    }
    if (status === TripStatus.EN_CURSO) {
      await this.prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'EN_VIAJE' as any } });
    }

    return updated;
  }

  async addCost(tripId: string, data: any) {
    await this.findOne(tripId);
    const cost = await this.prisma.tripCost.create({ data: { ...data, tripId } });
    // Recalculate total
    const totalCosts = await this.prisma.tripCost.aggregate({ where: { tripId }, _sum: { monto: true } });
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    const costoTotal = totalCosts._sum.monto || 0;
    await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        costoTotal,
        margenBruto: trip.tarifaAcordada ? trip.tarifaAcordada - costoTotal : null,
      },
    });
    return cost;
  }

  async getGanttData(from: string, to: string) {
    return this.prisma.trip.findMany({
      where: {
        status: { notIn: [TripStatus.CANCELADO] },
        fechaSalidaProgramada: { gte: new Date(from) },
        fechaLlegadaEstimada: { lte: new Date(to) },
      },
      include: {
        vehicle: { select: { patente: true, marca: true, modelo: true } },
        driver: { select: { firstName: true, lastName: true } },
        client: { select: { razonSocial: true } },
      },
      orderBy: { fechaSalidaProgramada: 'asc' },
    });
  }

  async reschedule(tripId: string, newDeparture: Date, reason: string) {
    const trip = await this.findOne(tripId);
    const leadTime = trip.leadTimeTotal || 24;
    const newArrival = this.calculateArrivalEstimate(newDeparture, leadTime);

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        fechaSalidaProgramada: newDeparture,
        fechaLlegadaEstimada: newArrival,
        notas: `[REPROGRAMADO] ${reason}. ${trip.notas || ''}`.trim(),
      },
    });
  }
}
