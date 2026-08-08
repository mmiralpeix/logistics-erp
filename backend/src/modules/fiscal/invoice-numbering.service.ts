import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceType } from '@prisma/client';

/**
 * Numeración secuencial real por punto de venta + tipo de comprobante (etapa 3).
 *
 * Si todavía no hay una Company con un CompanySalesPoint habilitado (el caso de hoy, ver
 * diagnóstico sección A), devuelve null y quien llama sigue usando la numeración aleatoria
 * anterior — así esto no rompe la facturación actual mientras la empresa no esté cargada
 * (etapa 5), y empieza a funcionar solo automáticamente en cuanto se cargue.
 */
@Injectable()
export class InvoiceNumberingService {
  constructor(private prisma: PrismaService) {}

  async getNextNumber(tipo: InvoiceType): Promise<string | null> {
    const company = await this.prisma.company.findFirst({
      where: { isActive: true },
      include: { salesPoints: { where: { habilitado: true }, take: 1, orderBy: { createdAt: 'asc' } } },
    });
    const salesPoint = company?.salesPoints[0];
    if (!salesPoint) return null;

    const counter = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.salesPointCounter.findUnique({
        where: { salesPointId_comprobanteTipo: { salesPointId: salesPoint.id, comprobanteTipo: tipo } },
      });
      if (existing) {
        return tx.salesPointCounter.update({ where: { id: existing.id }, data: { ultimoNumero: { increment: 1 } } });
      }
      return tx.salesPointCounter.create({ data: { salesPointId: salesPoint.id, comprobanteTipo: tipo, ultimoNumero: 1 } });
    });

    const puntoVenta = salesPoint.numero.padStart(4, '0');
    const numero = String(counter.ultimoNumero).padStart(8, '0');
    return `${this.prefixFor(tipo)}-${puntoVenta}-${numero}`;
  }

  private prefixFor(tipo: InvoiceType): string {
    switch (tipo) {
      case InvoiceType.FACTURA_A: return 'FA';
      case InvoiceType.FACTURA_B: return 'FB';
      case InvoiceType.FACTURA_C: return 'FC';
      case InvoiceType.FACTURA_E: return 'FE';
      case InvoiceType.NOTA_CREDITO: return 'NC';
      case InvoiceType.NOTA_DEBITO: return 'ND';
      case InvoiceType.REMITO: return 'R';
      default: return 'X';
    }
  }
}
