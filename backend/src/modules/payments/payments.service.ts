import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';

/**
 * Cobros de clientes y cuenta corriente real (etapa 8). Reemplaza, para todo lo nuevo,
 * el enfoque actual de "marcar la factura como PAGADA a mano" — sin tocar Client.saldoActual
 * (ese campo queda tal cual, ver diagnóstico sección A/§3: está desactualizado desde el seed
 * y no lo vamos a empezar a escribir a medias; getCuentaCorriente calcula el saldo real en vivo
 * a partir de Invoice + Payment, igual que ya hace clients.service.ts:getSummary360).
 */
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const allocations = dto.allocations ?? [];
    const allocatedTotal = allocations.reduce((sum, a) => sum + a.monto, 0);
    if (allocatedTotal > dto.monto) {
      throw new BadRequestException('La suma de lo asignado a facturas no puede superar el monto del pago');
    }

    if (allocations.length) {
      const invoices = await this.prisma.invoice.findMany({ where: { id: { in: allocations.map((a) => a.invoiceId) } } });
      const invoiceIds = new Set(invoices.map((i) => i.id));
      for (const a of allocations) {
        if (!invoiceIds.has(a.invoiceId)) throw new NotFoundException(`Factura ${a.invoiceId} no encontrada`);
      }
      const otherClient = invoices.find((i) => i.clientId !== dto.clientId);
      if (otherClient) throw new BadRequestException('No se puede aplicar un pago a una factura de otro cliente');
    }

    const payment = await this.prisma.payment.create({
      data: {
        clientId: dto.clientId,
        monto: dto.monto,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        medioPago: dto.medioPago,
        referencia: dto.referencia,
        notas: dto.notas,
        allocations: allocations.length ? { create: allocations } : undefined,
      },
      include: { allocations: true },
    });

    // Si con este pago (+ los anteriores) una factura queda cubierta, se marca PAGADA.
    for (const a of allocations) {
      await this.recomputeInvoiceStatus(a.invoiceId);
    }

    return payment;
  }

  private async recomputeInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { paymentAllocations: true } });
    if (!invoice || invoice.status === InvoiceStatus.ANULADA) return;
    const totalCobrado = invoice.paymentAllocations.reduce((sum, a) => sum + a.monto, 0);
    if (totalCobrado >= invoice.total && invoice.status !== InvoiceStatus.PAGADA) {
      await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: InvoiceStatus.PAGADA } });
    }
  }

  findByClient(clientId: string) {
    return this.prisma.payment.findMany({
      where: { clientId },
      include: { allocations: { include: { invoice: { select: { numero: true, total: true } } } } },
      orderBy: { fecha: 'desc' },
    });
  }

  async getCuentaCorriente(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const [facturas, pagos] = await Promise.all([
      this.prisma.invoice.findMany({ where: { clientId, status: { not: InvoiceStatus.ANULADA } }, orderBy: { fechaEmision: 'desc' } }),
      this.prisma.payment.findMany({ where: { clientId }, include: { allocations: true }, orderBy: { fecha: 'desc' } }),
    ]);

    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
    const totalCobrado = pagos.reduce((sum, p) => sum + p.monto, 0);

    return {
      clientId,
      totalFacturado,
      totalCobrado,
      saldo: totalFacturado - totalCobrado,
      facturasPendientes: facturas.filter((f) => f.status !== InvoiceStatus.PAGADA),
      facturas,
      pagos,
    };
  }
}
