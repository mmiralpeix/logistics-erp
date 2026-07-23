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
          contracts: {
            where: { isActive: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { trips: true } } },
          },
          _count: { select: { trips: true, invoices: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    const formattedData = data.map((client: any) => ({
      ...client,
      contracts: client.contracts?.map((c: any) => ({
        ...c,
        viajesEjecutados: c._count?.trips || 0,
      })),
    }));

    return { data: formattedData, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        contacts: true,
        contracts: { orderBy: { createdAt: 'desc' }, include: { _count: { select: { trips: true } } } },
        trips: { orderBy: { createdAt: 'desc' }, take: 5, include: { vehicle: true, driver: true, contract: true } },
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
      this.prisma.trip.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' }, take: 20, include: { vehicle: true, driver: true, contract: true } }),
      this.prisma.invoice.findMany({ where: { clientId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { trips, invoices };
  }

  async getContracts(clientId: string) {
    const contracts = await this.prisma.contract.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const contractsWithStats = await Promise.all(
      contracts.map(async (c) => {
        const tripsCount = await this.prisma.trip.count({
          where: { contractId: c.id, status: { notIn: ['CANCELADO'] as any } },
        });
        const aggregate = await this.prisma.trip.aggregate({
          where: { contractId: c.id, status: { notIn: ['CANCELADO'] as any } },
          _sum: { tarifaAcordada: true, montoExcedente: true },
        });
        return {
          ...c,
          viajesEjecutados: tripsCount,
          viajesRestantes: c.cantidadViajes ? Math.max(0, c.cantidadViajes - tripsCount) : null,
          montoTotalEjecutado: aggregate._sum.tarifaAcordada || 0,
        };
      }),
    );

    return contractsWithStats;
  }

  async createContract(clientId: string, dto: any) {
    const { id, viajesEjecutados, viajesRestantes, montoTotalEjecutado, _count, createdAt, updatedAt, ...cleanData } = dto;

    const dataToSave = {
      numero: cleanData.numero,
      descripcion: cleanData.descripcion || null,
      cantidadViajes: cleanData.cantidadViajes !== undefined && cleanData.cantidadViajes !== '' && cleanData.cantidadViajes !== null ? Number(cleanData.cantidadViajes) : null,
      pesoMinimoKg: cleanData.pesoMinimoKg !== undefined && cleanData.pesoMinimoKg !== '' && cleanData.pesoMinimoKg !== null ? Number(cleanData.pesoMinimoKg) : null,
      tarifaBase: cleanData.tarifaBase !== undefined && cleanData.tarifaBase !== '' && cleanData.tarifaBase !== null ? Number(cleanData.tarifaBase) : null,
      tarifaExcedentePorTn: cleanData.tarifaExcedentePorTn !== undefined && cleanData.tarifaExcedentePorTn !== '' && cleanData.tarifaExcedentePorTn !== null ? Number(cleanData.tarifaExcedentePorTn) : null,
      status: cleanData.status || 'ACTIVA',
      condiciones: cleanData.condiciones || null,
      fechaInicio: cleanData.fechaInicio ? new Date(cleanData.fechaInicio) : new Date(),
      fechaFin: cleanData.fechaFin ? new Date(cleanData.fechaFin) : undefined,
    };

    if (id) {
      return this.prisma.contract.update({
        where: { id },
        data: dataToSave,
      });
    }

    return this.prisma.contract.upsert({
      where: { numero: cleanData.numero },
      update: dataToSave,
      create: {
        ...dataToSave,
        clientId,
      },
    });
  }
}
