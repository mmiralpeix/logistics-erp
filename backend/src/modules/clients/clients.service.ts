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

    const contractIds = contracts.map((c) => c.id);
    const grouped = contractIds.length
      ? await this.prisma.trip.groupBy({
          by: ['contractId'],
          where: { contractId: { in: contractIds }, status: { notIn: ['CANCELADO'] as any } },
          _count: { _all: true },
          _sum: { tarifaAcordada: true, montoExcedente: true },
        })
      : [];
    const statsByContract = new Map(grouped.map((g) => [g.contractId, g]));

    return contracts.map((c) => {
      const stats = statsByContract.get(c.id);
      const tripsCount = stats?._count._all || 0;
      return {
        ...c,
        viajesEjecutados: tripsCount,
        viajesRestantes: c.cantidadViajes ? Math.max(0, c.cantidadViajes - tripsCount) : null,
        montoTotalEjecutado: stats?._sum.tarifaAcordada || 0,
      };
    });
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

  // Rate Matrix
  async getRates(clientId: string) {
    return this.prisma.clientRate.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addRate(clientId: string, dto: any) {
    return this.prisma.clientRate.create({
      data: {
        clientId,
        origen: dto.origen,
        destino: dto.destino,
        tipoCarga: dto.tipoCarga || 'GENERAL',
        tarifaBase: Number(dto.tarifaBase || 0),
        costoPorTnExcedente: Number(dto.costoPorTnExcedente || 0),
        horasEsperaLibres: Number(dto.horasEsperaLibres || 2),
      },
    });
  }

  async removeRate(rateId: string) {
    return this.prisma.clientRate.delete({ where: { id: rateId } });
  }

  // Expediente 360° Completo
  async getSummary360(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: {
        contacts: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { trips: true } } },
        },
        rates: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) throw new NotFoundException('Cliente no encontrado');

    const [trips, invoices, aggTrips] = await Promise.all([
      this.prisma.trip.findMany({
        where: { clientId },
        orderBy: { fechaSalidaProgramada: 'desc' },
        take: 10,
        include: { vehicle: true, driver: true, contract: true, costs: true },
      }),
      this.prisma.invoice.findMany({
        where: { clientId },
        orderBy: { fechaEmision: 'desc' },
        take: 10,
      }),
      this.prisma.trip.aggregate({
        where: { clientId, status: { notIn: ['CANCELADO'] as any } },
        _sum: { tarifaAcordada: true, pesoCarga: true },
        _count: true,
      }),
    ]);

    const totalFacturado = invoices.reduce((sum, inv) => sum + (inv.status === 'PAGADA' ? inv.total : 0), 0);
    const totalPendienteCobro = invoices.reduce((sum, inv) => sum + (inv.status === 'EMITIDA' ? inv.total : 0), 0);

    const facturasVencidas = invoices.filter((inv) => inv.status === 'EMITIDA' && inv.fechaVencimiento && new Date(inv.fechaVencimiento) < new Date());
    const riesgoBloqueado = client.bloqueadoPorRiesgo || (client.limiteCredito > 0 && totalPendienteCobro > client.limiteCredito) || facturasVencidas.length > 0;

    return {
      client: {
        ...client,
        riesgoBloqueado,
        facturasVencidasCantidad: facturasVencidas.length,
      },
      stats: {
        totalViajes: aggTrips._count || 0,
        totalMontoAcordado: aggTrips._sum.tarifaAcordada || 0,
        totalPesoKg: aggTrips._sum.pesoCarga || 0,
        totalFacturado,
        totalPendienteCobro,
      },
      trips,
      invoices,
    };
  }
}
