import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNumber(tipo: string) {
    const prefix = tipo === 'FACTURA_A' ? 'FA' : tipo === 'FACTURA_B' ? 'FB' : tipo === 'REMITO' ? 'R' : 'N';
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `${prefix}-0001-${String(num).padStart(8, '0')}`;
  }

  async findAll(clientId?: string, status?: InvoiceStatus, from?: string, to?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
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
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { razonSocial: true, cuit: true } },
          items: { include: { trip: { select: { numero: true } } } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
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

    const subtotal = items.reduce((sum: number, item: any) => sum + item.precioUnit * item.cantidad, 0);
    const iva = invoiceData.tipo === 'FACTURA_A' ? subtotal * 0.21 : 0;
    const total = subtotal + iva;

    return this.prisma.invoice.create({
      data: {
        ...invoiceData,
        numero: this.generateInvoiceNumber(invoiceData.tipo),
        subtotal,
        iva,
        total,
        items: { create: items.map((item: any) => ({ ...item, subtotal: item.precioUnit * item.cantidad })) },
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

    const subtotal = trip.tarifaAcordada || 0;
    const iva = tipo === 'FACTURA_A' ? subtotal * 0.21 : 0;
    const total = subtotal + iva;

    return this.prisma.invoice.create({
      data: {
        numero: this.generateInvoiceNumber(tipo),
        clientId: clientId || trip.clientId,
        tipo: tipo as any,
        subtotal,
        iva,
        total,
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
