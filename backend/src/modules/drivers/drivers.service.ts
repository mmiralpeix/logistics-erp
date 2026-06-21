import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: any = 1, limit: any = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);
    const skip = (p - 1) * l;
    const where: any = { isActive: true };
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search } },
      { telefono: { contains: search } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.driver.findMany({
        where, skip, take: l,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { _count: { select: { trips: true } } },
      }),
      this.prisma.driver.count({ where }),
    ]);
    return { data, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const d = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        trips: { orderBy: { createdAt: 'desc' }, take: 10, include: { vehicle: true, client: true } },
        trainings: { orderBy: { fecha: 'desc' } },
        incidents: { orderBy: { fecha: 'desc' }, take: 10 },
        documents: true,
        _count: { select: { trips: true } },
      },
    });
    if (!d) throw new NotFoundException('Conductor no encontrado');
    return d;
  }

  async create(dto: CreateDriverDto) {
    return this.prisma.driver.create({ data: dto });
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: { isActive: false } });
  }

  async getExpiringLicenses() {
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.driver.findMany({
      where: {
        isActive: true,
        OR: [
          { licenciaVencimiento: { lte: in30 } },
          { examenMedicoVencimiento: { lte: in30 } },
          { psicofisicoVencimiento: { lte: in30 } },
          { certificadoCargasPeligrosas: { lte: in30 } },
        ],
      },
    });
  }

  async getAvailableForDate(date: Date) {
    const tripsOnDate = await this.prisma.trip.findMany({
      where: {
        status: { in: ['EN_CURSO', 'PROGRAMADO'] as any },
        fechaSalidaProgramada: { lte: date },
        fechaLlegadaEstimada: { gte: date },
      },
      select: { driverId: true },
    });
    const busyIds = tripsOnDate.map((t) => t.driverId);
    return this.prisma.driver.findMany({ where: { isActive: true, id: { notIn: busyIds } } });
  }

  async addTraining(driverId: string, data: any) {
    await this.findOne(driverId);
    return this.prisma.driverTraining.create({ data: { ...data, driverId } });
  }
}
