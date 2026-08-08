import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceType, TaxCondition } from '@prisma/client';
import {
  AppliedTaxRule,
  CalculateTaxesInput,
  CalculateTaxesResult,
  ClienteCondicionIVARaw,
} from './fiscal-engine.types';

/**
 * Motor fiscal — etapa 2 del módulo de facturación (ver FACTURACION_FISCAL_DIAGNOSTICO.md).
 *
 * Alcance actual: SOLO IVA general (21%), sourced desde TaxRule en vez de estar hardcodeado
 * en billing.service.ts. Ingresos Brutos, percepciones y retenciones quedan para las etapas
 * 6/7 — `reglasAplicadas`/`advertencias` ya están pensados para acomodarlas sin romper esta firma.
 *
 * Principio de diseño (pedido explícitamente): si falta una regla fiscal o un dato (Company sin
 * cargar, condición IVA del cliente ausente), el motor NUNCA inventa un valor — cae a un default
 * conservador (0% IVA / Responsable Inscripto) y lo deja documentado en `advertencias`, para que
 * quede trazado en Invoice.taxRulesApplied en vez de pasar desapercibido.
 */
@Injectable()
export class FiscalEngineService {
  constructor(private prisma: PrismaService) {}

  async calculateTaxes(input: CalculateTaxesInput): Promise<CalculateTaxesResult> {
    const advertencias: string[] = [];

    const emisor = input.companyCondicionIVA ?? this.warnDefault(advertencias,
      'No hay Company cargada con datos fiscales reales todavía — se asumió Responsable Inscripto para el emisor. Cargar la empresa (etapa 5) antes de confiar en esto para facturación real.',
      TaxCondition.RESPONSABLE_INSCRIPTO);

    const receptor = this.normalizeClienteCondicion(input.clienteCondicionIVA, advertencias);

    const letraSugerida = this.determineLetra(emisor, receptor, advertencias);
    this.warnIfTipoMismatchesLetra(input.tipoComprobante, letraSugerida, advertencias);

    const neto = input.items.reduce((sum, item) => sum + item.cantidad * item.precioUnit, 0);

    // Comportamiento heredado de billing.service.ts (no lo cambiamos en esta etapa): solo
    // FACTURA_A discrimina IVA. La única corrección real es que un emisor MONOTRIBUTO nunca
    // puede cobrar IVA por ley, sin importar qué tipo de comprobante se haya elegido a mano.
    const correspondeDiscriminarIVA = emisor !== TaxCondition.MONOTRIBUTO && input.tipoComprobante === InvoiceType.FACTURA_A;

    if (!correspondeDiscriminarIVA) {
      return {
        letraSugerida,
        neto,
        netoGravado: 0,
        netoNoGravado: neto,
        ivaDiscriminado: [],
        perItem: input.items.map(() => ({ tasaIVA: 0, montoIVA: 0 })),
        iva: 0,
        total: neto,
        reglasAplicadas: [],
        advertencias,
      };
    }

    const generalRule = await this.findGeneralIVARule(input.transactionDate);
    const reglasAplicadas: AppliedTaxRule[] = [];
    let iva = 0;
    const ivaDiscriminado: { alicuota: number; base: number; monto: number }[] = [];
    const perItem: { tasaIVA: number; montoIVA: number }[] = [];

    if (!generalRule && input.items.some((i) => i.tasaIVA === undefined)) {
      advertencias.push(
        'No se encontró una regla de IVA general (TaxRule tipo=IVA, actividadCodigo=GENERAL) vigente para la fecha de la operación — se aplicó 0% por defecto en vez de inventar una alícuota. Revisar configuración fiscal.',
      );
    }

    for (const item of input.items) {
      const base = item.cantidad * item.precioUnit;
      const alicuota = item.tasaIVA ?? generalRule?.alicuota ?? 0;
      const monto = base * (alicuota / 100);
      iva += monto;
      perItem.push({ tasaIVA: alicuota, montoIVA: monto });
      if (alicuota > 0) ivaDiscriminado.push({ alicuota, base, monto });
    }

    if (generalRule) {
      reglasAplicadas.push({
        taxRuleId: generalRule.id,
        tipo: generalRule.tipo,
        alicuota: generalRule.alicuota,
        fuenteNormativa: generalRule.fuenteNormativa,
        validFrom: generalRule.validFrom,
        validTo: generalRule.validTo,
      });
    }

    return {
      letraSugerida,
      neto,
      netoGravado: neto,
      netoNoGravado: 0,
      ivaDiscriminado,
      perItem,
      iva,
      total: neto + iva,
      reglasAplicadas,
      advertencias,
    };
  }

  private async findGeneralIVARule(transactionDate: Date) {
    return this.prisma.taxRule.findFirst({
      where: {
        tipo: 'IVA',
        jurisdictionId: null,
        actividadCodigo: 'GENERAL',
        exento: false,
        status: 'ACTIVA',
        validFrom: { lte: transactionDate },
        OR: [{ validTo: null }, { validTo: { gte: transactionDate } }],
      },
      orderBy: { validFrom: 'desc' },
    });
  }

  /** RG general de comprobantes: A (RI→RI), B (RI→cualquier otra condición), C (Monotributo→cualquiera). */
  private determineLetra(
    emisor: TaxCondition,
    receptor: TaxCondition,
    advertencias: string[],
  ): 'A' | 'B' | 'C' | 'E' | null {
    if (emisor === TaxCondition.MONOTRIBUTO) return 'C';
    if (emisor === TaxCondition.EXENTO) {
      advertencias.push(
        'Condición EXENTO del emisor no está completamente modelada en esta etapa (requiere revisión contable de qué comprobante corresponde) — no se sugirió letra.',
      );
      return null;
    }
    if (emisor === TaxCondition.RESPONSABLE_INSCRIPTO) {
      return receptor === TaxCondition.RESPONSABLE_INSCRIPTO ? 'A' : 'B';
    }
    return null;
  }

  private warnIfTipoMismatchesLetra(tipo: InvoiceType, letra: string | null, advertencias: string[]) {
    if (!letra) return;
    const tipoLetra = tipo === InvoiceType.FACTURA_A ? 'A' : tipo === InvoiceType.FACTURA_B ? 'B' : tipo === InvoiceType.FACTURA_C ? 'C' : tipo === InvoiceType.FACTURA_E ? 'E' : null;
    if (tipoLetra && tipoLetra !== letra) {
      advertencias.push(
        `El comprobante elegido (${tipo}, letra ${tipoLetra}) no coincide con la letra sugerida por la condición fiscal de emisor/receptor (${letra}) — revisar antes de emitir.`,
      );
    }
  }

  private normalizeClienteCondicion(raw: ClienteCondicionIVARaw, advertencias: string[]): TaxCondition {
    if (!raw) {
      advertencias.push('El cliente no tiene condicionIVA cargada — se asumió Responsable Inscripto.');
      return TaxCondition.RESPONSABLE_INSCRIPTO;
    }
    const normalized = raw.toUpperCase().trim();
    if ((Object.values(TaxCondition) as string[]).includes(normalized)) {
      return normalized as TaxCondition;
    }
    advertencias.push(`Condición IVA del cliente ("${raw}") no reconocida — se asumió Responsable Inscripto.`);
    return TaxCondition.RESPONSABLE_INSCRIPTO;
  }

  private warnDefault<T>(advertencias: string[], message: string, fallback: T): T {
    advertencias.push(message);
    return fallback;
  }
}
