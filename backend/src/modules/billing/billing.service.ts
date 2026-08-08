import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus, InvoiceType } from '@prisma/client';
import { FiscalEngineService } from '../fiscal/fiscal-engine.service';
import { CalculateTaxesResult } from '../fiscal/fiscal-engine.types';
import { InvoiceNumberingService } from '../fiscal/invoice-numbering.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private fiscalEngine: FiscalEngineService,
    private numbering: InvoiceNumberingService,
  ) {}

  /** Numeración aleatoria original — se usa solo como fallback si todavía no hay una
   * Company con punto de venta habilitado (ver InvoiceNumberingService, etapa 3). */
  private generateLegacyInvoiceNumber(tipo: string) {
    const prefix = tipo === 'FACTURA_A' ? 'FA' : tipo === 'FACTURA_B' ? 'FB' : tipo === 'REMITO' ? 'R' : 'N';
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `${prefix}-0001-${String(num).padStart(8, '0')}`;
  }

  private async generateInvoiceNumber(tipo: InvoiceType) {
    return (await this.numbering.getNextNumber(tipo)) ?? this.generateLegacyInvoiceNumber(tipo);
  }

  /** Única empresa activa hoy (el sistema es single-tenant, ver diagnóstico sección A/§1). */
  private getActiveCompany() {
    return this.prisma.company.findFirst({ where: { isActive: true } });
  }

  private fiscalFieldsFor(result: CalculateTaxesResult, condicionIVACliente: string | null | undefined) {
    return {
      letra: result.letraSugerida,
      condicionIVACliente: condicionIVACliente ?? null,
      netoGravado: result.netoGravado,
      netoNoGravado: result.netoNoGravado,
      totalPercepciones: 0,
      totalRetenciones: 0,
      taxRulesApplied: { reglasAplicadas: result.reglasAplicadas, advertencias: result.advertencias } as any,
    };
  }

  async findAll(clientId?: string, status?: InvoiceStatus, from?: string, to?: string, page: any = 1, limit: any = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Math.min(100, Number(limit) || 20));
    const skip = (p - 1) * l;
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (from || to) {
      where.fechaEmision = {};
      if (from) where.fechaEmision.gte = new Date(from);
      if (to) where.fechaEmision.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { razonSocial: true, cuit: true } },
          items: { include: { trip: { select: { numero: true } } } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { trip: true } },
      },
    });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    return inv;
  }

  async create(dto: any) {
    const { items, ...invoiceData } = dto;
    const tipo: InvoiceType = invoiceData.tipo ?? InvoiceType.FACTURA_A;

    const [client, company] = await Promise.all([
      this.prisma.client.findUnique({ where: { id: invoiceData.clientId } }),
      this.getActiveCompany(),
    ]);
    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Etapa 4: si un ítem trae productId (catálogo), su tipoIVADefault se usa como tasaIVA
    // salvo que el ítem ya traiga una tasaIVA explícita. Sigue siendo 100% opcional — un ítem
    // de texto libre sin productId se comporta exactamente igual que antes.
    const productIds = [...new Set(items.map((i: any) => i.productId).filter(Boolean))] as string[];
    const products = productIds.length
      ? await this.prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    const itemsWithTasa = items.map((item: any) => ({
      ...item,
      tasaIVA: item.tasaIVA ?? (item.productId ? productById.get(item.productId)?.tipoIVADefault ?? undefined : undefined),
    }));

    const result = await this.fiscalEngine.calculateTaxes({
      companyCondicionIVA: company?.condicionIVA,
      clienteCondicionIVA: client.condicionIVA,
      tipoComprobante: tipo,
      items: itemsWithTasa.map((item: any) => ({ descripcion: item.descripcion, cantidad: item.cantidad, precioUnit: item.precioUnit, tasaIVA: item.tasaIVA })),
      transactionDate: invoiceData.fechaEmision ? new Date(invoiceData.fechaEmision) : new Date(),
    });

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        tipo,
        numero: await this.generateInvoiceNumber(tipo),
        subtotal: result.neto,
        iva: result.iva,
        total: result.total,
        ...this.fiscalFieldsFor(result, client.condicionIVA),
        items: {
          create: itemsWithTasa.map((item: any, i: number) => ({
            ...item,
            subtotal: item.precioUnit * item.cantidad,
            tasaIVA: result.perItem[i]?.tasaIVA || undefined,
            montoIVA: result.perItem[i]?.montoIVA || undefined,
          })),
        },
      },
      include: { client: true, items: true },
    });
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    await this.findOne(id);
    return this.prisma.invoice.update({ where: { id }, data: { status } });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthly, pending, overdue, total] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { status: InvoiceStatus.EMITIDA }, _sum: { total: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { status: InvoiceStatus.VENCIDA }, _sum: { total: true }, _count: true }),
      this.prisma.invoice.aggregate({ where: { status: InvoiceStatus.PAGADA }, _sum: { total: true }, _count: true }),
    ]);

    return { monthly, pending, overdue, collected: total };
  }

  async getOverdue() {
    const now = new Date();
    // Mark overdue
    await this.prisma.invoice.updateMany({
      where: { status: InvoiceStatus.EMITIDA, fechaVencimiento: { lt: now } },
      data: { status: InvoiceStatus.VENCIDA },
    });

    return this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.VENCIDA },
      include: { client: { select: { razonSocial: true, telefono: true, email: true } } },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async createFromTrip(tripId: string, clientId: string, tipo: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { client: true },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const tipoComprobante = (tipo as InvoiceType) ?? InvoiceType.FACTURA_A;
    const subtotal = trip.tarifaAcordada || 0;
    const company = await this.getActiveCompany();
    // Si vino un clientId explícito (distinto al del viaje), se prioriza para condición IVA;
    // en la práctica hoy siempre coinciden (ver diagnóstico sección A/§4).
    const client = clientId && clientId !== trip.clientId
      ? await this.prisma.client.findUnique({ where: { id: clientId } })
      : trip.client;

    const result = await this.fiscalEngine.calculateTaxes({
      companyCondicionIVA: company?.condicionIVA,
      clienteCondicionIVA: client?.condicionIVA,
      tipoComprobante,
      items: [{ descripcion: `Servicio de transporte ${trip.origen} → ${trip.destino} (${trip.numero})`, cantidad: 1, precioUnit: subtotal }],
      transactionDate: new Date(),
    });

    return this.prisma.invoice.create({
      data: {
        numero: await this.generateInvoiceNumber(tipoComprobante),
        clientId: clientId || trip.clientId,
        tipo: tipoComprobante,
        subtotal: result.neto,
        iva: result.iva,
        total: result.total,
        ...this.fiscalFieldsFor(result, client?.condicionIVA),
        // diasCredito real del cliente en vez del "30 días" fijo que había antes; si no está
        // cargado, 30 sigue siendo el fallback (comportamiento idéntico al anterior).
        fechaVencimiento: new Date(Date.now() + (client?.diasCredito ?? 30) * 24 * 60 * 60 * 1000),
        items: {
          create: [{
            tripId,
            descripcion: `Servicio de transporte ${trip.origen} → ${trip.destino} (${trip.numero})`,
            cantidad: 1,
            precioUnit: subtotal,
            subtotal,
          }],
        },
      },
      include: { client: true, items: true },
    });
  }
}
