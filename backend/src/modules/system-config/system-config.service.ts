import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AlertThresholds {
  documentos: number;
  revisiones: number;
  mantenimiento: number;
}

const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = { documentos: 30, revisiones: 15, mantenimiento: 7 };

/**
 * Config genérica key/value (tabla SystemConfig, ya existía pero sin ningún lector real —
 * ver commit del settings page). Cualquier módulo que necesite un valor configurable simple
 * lo guarda acá en vez de agregar una tabla dedicada.
 */
@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  get(key: string) {
    return this.prisma.systemConfig.findUnique({ where: { key } });
  }

  upsert(key: string, value: any, label?: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value, ...(label ? { label } : {}) },
      create: { key, value, label },
    });
  }

  /**
   * Umbrales de "días de anticipación" usados por las alertas de vencimiento (documentos,
   * revisiones/mantenimiento programado). Si nadie configuró nada todavía, devuelve los mismos
   * valores que ya estaban hardcodeados en cada servicio (30/15/7) — cero cambio de comportamiento
   * hasta que alguien los edite desde Configuración.
   */
  async getAlertThresholds(): Promise<AlertThresholds> {
    const row = await this.get('alertas_vencimiento');
    const value = (row?.value as Partial<AlertThresholds>) || {};
    return {
      documentos: value.documentos ?? DEFAULT_ALERT_THRESHOLDS.documentos,
      revisiones: value.revisiones ?? DEFAULT_ALERT_THRESHOLDS.revisiones,
      mantenimiento: value.mantenimiento ?? DEFAULT_ALERT_THRESHOLDS.mantenimiento,
    };
  }
}
