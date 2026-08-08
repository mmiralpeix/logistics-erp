import { InvoiceType, TaxCondition } from '@prisma/client';

/**
 * Condición fiscal de un cliente tal como se guarda hoy en `Client.condicionIVA`
 * (string libre, sin enum en el schema todavía — ver diagnóstico FACTURACION_FISCAL_DIAGNOSTICO.md
 * sección F). Se normaliza acá para no forzar una migración de Client en esta etapa.
 */
export type ClienteCondicionIVARaw = string | null | undefined;

export interface FiscalItemInput {
  descripcion: string;
  cantidad: number;
  precioUnit: number;
  /** Si se especifica (ej. viene de un Product en una etapa futura), se usa tal cual y no se consulta TaxRule. */
  tasaIVA?: number;
}

export interface CalculateTaxesInput {
  /** Condición IVA de la empresa emisora. null/undefined = Company todavía no está cargada (ver etapa 5). */
  companyCondicionIVA?: TaxCondition | null;
  /** Condición IVA del cliente, tal como está en Client.condicionIVA hoy. */
  clienteCondicionIVA?: ClienteCondicionIVARaw;
  /** Tipo de comprobante ya elegido por quien factura (hoy sigue siendo una decisión manual en la UI). */
  tipoComprobante: InvoiceType;
  items: FiscalItemInput[];
  transactionDate: Date;
  /** Reservado para la etapa 6/7 (Ingresos Brutos, percepciones/retenciones) — no usado todavía. */
  jurisdictionId?: string | null;
  operationType?: 'VENTA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
}

export interface AppliedTaxRule {
  taxRuleId: string;
  tipo: string;
  alicuota: number;
  fuenteNormativa: string | null;
  validFrom: Date;
  validTo: Date | null;
}

export interface CalculateTaxesResult {
  /** Letra que corresponde según la condición fiscal de emisor/receptor (RG general de comprobantes). */
  letraSugerida: 'A' | 'B' | 'C' | 'E' | null;
  neto: number;
  netoGravado: number;
  netoNoGravado: number;
  ivaDiscriminado: { alicuota: number; base: number; monto: number }[];
  /** Un elemento por cada ítem de entrada, en el mismo orden — para persistir tasaIVA/montoIVA por línea. */
  perItem: { tasaIVA: number; montoIVA: number }[];
  iva: number;
  total: number;
  reglasAplicadas: AppliedTaxRule[];
  /**
   * Cualquier supuesto o dato faltante que el motor tuvo que asumir (ej. Company no cargada,
   * condición fiscal del cliente ausente, comprobante elegido no coincide con la letra sugerida).
   * No bloquean la emisión en esta etapa — quedan guardados en Invoice.taxRulesApplied para trazabilidad.
   */
  advertencias: string[];
}
