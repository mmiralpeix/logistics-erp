import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: any = 1, limit: any = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);
    const skip = (p - 1) * l;
    const where = search
      ? { OR: [{ razonSocial: { contains: search, mode: 'insensitive' as any } }, { cuit: { contains: search } }, { email: { contains: search, mode: 'insensitive' as any } }], isActive: true }
      : { isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take: l,
        orderBy: { razonSocial: 'asc' },
        include: {
          contacts: { where: { isPrimary: true } },
          _count: { select: { trips: true, invoices: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { data, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 5 },
        trips: { orderBy: { createdAt: 'desc' }, take: 5, include: { vehicle: true, driver: true } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { trips: true, invoices: true } },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async create(dto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({ where: { cuit: dto.cuit } });
    if (existing) throw new ConflictException('Ya existe un cliente con ese CUIT');
    const { contacts, ...data } = dto;
    return this.prisma.client.create({
      data: {
        ...data,
        contacts: contacts?.length ? { create: contacts } : undefined,
      },
      include: { contacts: true },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    const { contacts, ...data } = dto;
    return this.prisma.client.update({
      where: { id },
      data,
      include: { contacts: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: { isActive: false } });
  }

  async getHistory(id: string) {
    const [trips, invoices] = await Promise.all([
      this.prisma.trip.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' }, take: 20, include: { vehicle: true, driver: true } }),
      this.prisma.invoice.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { trips, invoices };
  }
}
