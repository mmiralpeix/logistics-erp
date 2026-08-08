import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateDriverScheduleStatus } from '../drivers/utils/schedule-calculator.util';
import { AlertSeverity, AlertCategory } from '@prisma/client';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private systemConfig: SystemConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpirationsCron() {
    this.logger.log('Ejecutando escaneo automático de reglas globales de alertas...');
    await this.evaluarReglasGlobales();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDelayedTripsCron() {
    const now = new Date();
    const delayed = await this.prisma.trip.findMany({
      where: {
        status: 'EN_TRANSITO' as any,
        fechaLlegadaEstimada: { lt: now },
      },
    });

    if (delayed.length > 0) {
      await this.prisma.trip.updateMany({
        where: { id: { in: delayed.map((t) => t.id) } },
        data: { status: 'DEMORADO' as any },
      });
      this.logger.warn(`${delayed.length} viajes marcados como DEMORADO`);
    }
  }

  // Motor Centralizado de Evaluación de Reglas Multimódulo
  async evaluarReglasGlobales() {
    const now = new Date();
    const { documentos } = await this.systemConfig.getAlertThresholds();
    const docThreshold = new Date(Date.now() + documentos * 24 * 60 * 60 * 1000);

    // 1. VEHICULOS & DOCUMENTACION
    const vehicles = await this.prisma.vehicle.findMany({
      where: { isActive: true },
    });

    for (const v of vehicles) {
      // VTV / ITV
      if (v.vencimientoITV) {
        if (v.vencimientoITV < now) {
          await this.upsertAlertRecord({
            codigo: `ALT-VTV-${v.id}`,
            categoria: AlertCategory.DOCUMENTACION,
            severidad: AlertSeverity.EMERGENCIA,
            titulo: `ITV/VTV Vencida — Vehículo ${v.patente}`,
            mensaje: `La inspección técnica del vehículo ${v.patente} (${v.marca} ${v.modelo}) venció el ${v.vencimientoITV.toLocaleDateString('es-AR')}. No puede circular.`,
            moduloOrigen: 'vehicles',
            entidadId: v.id,
          });
        } else if (v.vencimientoITV <= docThreshold) {
          await this.upsertAlertRecord({
            codigo: `ALT-VTV-${v.id}`,
            categoria: AlertCategory.DOCUMENTACION,
            severidad: AlertSeverity.ADVERTENCIA,
            titulo: `ITV/VTV Próxima a Vencer — Vehículo ${v.patente}`,
            mensaje: `La inspección técnica vencerá el ${v.vencimientoITV.toLocaleDateString('es-AR')}.`,
            moduloOrigen: 'vehicles',
            entidadId: v.id,
          });
        }
      }

      // Seguro
      if (v.vencimientoSeguro) {
        if (v.vencimientoSeguro < now) {
          await this.upsertAlertRecord({
            codigo: `ALT-SEG-${v.id}`,
            categoria: AlertCategory.DOCUMENTACION,
            severidad: AlertSeverity.EMERGENCIA,
            titulo: `Seguro Vencido — Vehículo ${v.patente}`,
            mensaje: `La póliza de seguro de la unidad ${v.patente} se encuentra vencida desde el ${v.vencimientoSeguro.toLocaleDateString('es-AR')}.`,
            moduloOrigen: 'vehicles',
            entidadId: v.id,
          });
        }
      }
    }

    // 2. CHOFERES & JORNADAS (DRIVER SCHEDULE)
    const drivers = await this.prisma.driver.findMany({
      where: { isActive: true },
    });

    for (const d of drivers) {
      // Licencia
      if (d.licenciaVencimiento) {
        if (d.licenciaVencimiento < now) {
          await this.upsertAlertRecord({
            codigo: `ALT-LIC-${d.id}`,
            categoria: AlertCategory.CHOFERES,
            severidad: AlertSeverity.EMERGENCIA,
            titulo: `Licencia de Conducir Vencida — ${d.firstName} ${d.lastName}`,
            mensaje: `La licencia de conducir del chofer DNI ${d.dni} venció el ${d.licenciaVencimiento.toLocaleDateString('es-AR')}.`,
            moduloOrigen: 'drivers',
            entidadId: d.id,
          });
        } else if (d.licenciaVencimiento <= docThreshold) {
          await this.upsertAlertRecord({
            codigo: `ALT-LIC-${d.id}`,
            categoria: AlertCategory.CHOFERES,
            severidad: AlertSeverity.ADVERTENCIA,
            titulo: `Licencia Próxima a Vencer — ${d.firstName} ${d.lastName}`,
            mensaje: `La licencia vencerá en menos de ${documentos} días (${d.licenciaVencimiento.toLocaleDateString('es-AR')}).`,
            moduloOrigen: 'drivers',
            entidadId: d.id,
          });
        }
      }

      // Driver Schedule Metrics
      const metrics = calculateDriverScheduleStatus(d, now);
      if (metrics.esExcedido) {
        await this.upsertAlertRecord({
          codigo: `ALT-SCHED-${d.id}`,
          categoria: AlertCategory.CHOFERES,
          severidad: AlertSeverity.CRITICA,
          titulo: `Jornada Excedida en Ruta — ${d.firstName} ${d.lastName}`,
          mensaje: `El chofer lleva ${metrics.diasEnRuta} días continuos en ruta (Régimen ${d.modalidadLaboral || '21x7'}). Superó el límite legal.`,
          moduloOrigen: 'drivers',
          entidadId: d.id,
        });
      }
    }

    // 3. GESTION DE NEUMATICOS (DESGASTE CRITICO <3.0mm)
    const criticalTires = await this.prisma.tire.findMany({
      where: {
        profundidadActualMm: { lte: 3.0 },
        status: { notIn: ['DADO_DE_BAJA', 'FUERA_DE_SERVICIO'] as any },
      },
      include: { vehicle: true },
    });

    for (const tire of criticalTires) {
      await this.upsertAlertRecord({
        codigo: `ALT-TIRE-${tire.id}`,
        categoria: AlertCategory.NEUMATICOS,
        severidad: AlertSeverity.CRITICA,
        titulo: `Neumático Desgaste Crítico (${tire.profundidadActualMm} mm) — ${tire.codigoInterno}`,
        mensaje: `El neumático ${tire.codigoInterno} (${tire.marca} ${tire.modelo}) presenta una profundidad de banda crítica de ${tire.profundidadActualMm} mm. Ubicación: ${tire.vehicle ? tire.vehicle.patente : 'Depósito'}.`,
        moduloOrigen: 'tires',
        entidadId: tire.id,
      });
    }

    // 4. INVENTARIO & REPUESTOS (STOCK MINIMO)
    const lowStockParts = await this.prisma.sparePart.findMany({
      where: {
        stockActual: { lte: this.prisma.sparePart.fields.stockMinimo },
      },
    });

    for (const part of lowStockParts) {
      await this.upsertAlertRecord({
        codigo: `ALT-PART-${part.id}`,
        categoria: AlertCategory.INVENTARIO,
        severidad: AlertSeverity.ADVERTENCIA,
        titulo: `Stock Mínimo Alcanzado — Repuesto ${part.sku}`,
        mensaje: `El repuesto ${part.nombre} (SKU: ${part.sku}) cuenta con un stock actual de ${part.stockActual} unidades (Mínimo: ${part.stockMinimo}).`,
        moduloOrigen: 'inventory',
        entidadId: part.id,
      });
    }

    // 5. FACTURACION (FACTURAS VENCIDAS)
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['EMITIDA'] as any },
        fechaVencimiento: { lt: now },
      },
      include: { client: true },
    });

    for (const inv of overdueInvoices) {
      await this.upsertAlertRecord({
        codigo: `ALT-INV-${inv.id}`,
        categoria: AlertCategory.FACTURACION,
        severidad: AlertSeverity.ADVERTENCIA,
        titulo: `Factura Vencida Impaga — N° ${inv.numero}`,
        mensaje: `La factura N° ${inv.numero} por $ ${inv.total.toLocaleString('es-AR')} emitida a ${inv.client?.razonSocial} venció el ${inv.fechaVencimiento?.toLocaleDateString('es-AR')}.`,
        moduloOrigen: 'billing',
        entidadId: inv.id,
      });
    }

    this.logger.log('Escaneo de reglas globales de alertas completado.');
  }

  private async upsertAlertRecord(data: {
    codigo: string;
    categoria: AlertCategory;
    severidad: AlertSeverity;
    titulo: string;
    mensaje: string;
    moduloOrigen: string;
    entidadId?: string;
  }) {
    const existing = await this.prisma.alertRecord.findUnique({
      where: { codigo: data.codigo },
    });

    if (existing) {
      if (!existing.isResolved) {
        await this.prisma.alertRecord.update({
          where: { codigo: data.codigo },
          data: {
            severidad: data.severidad,
            titulo: data.titulo,
            mensaje: data.mensaje,
          },
        });
      }
    } else {
      await this.prisma.alertRecord.create({
        data,
      });
    }
  }

  // API Methods
  async getActiveAlerts(params: {
    categoria?: AlertCategory;
    severidad?: AlertSeverity;
    isResolved?: boolean;
    search?: string;
  }) {
    const where: any = {};
    if (params.categoria) where.categoria = params.categoria;
    if (params.severidad) where.severidad = params.severidad;
    if (params.isResolved !== undefined) where.isResolved = params.isResolved === true;
    else where.isResolved = false;

    if (params.search) {
      where.OR = [
        { titulo: { contains: params.search, mode: 'insensitive' } },
        { mensaje: { contains: params.search, mode: 'insensitive' } },
        { codigo: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.alertRecord.findMany({
      where,
      orderBy: [{ severidad: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getAlertStats() {
    const [active, emergencias, criticas, advertencias, resueltasHoy] = await Promise.all([
      this.prisma.alertRecord.count({ where: { isResolved: false } }),
      this.prisma.alertRecord.count({ where: { isResolved: false, severidad: AlertSeverity.EMERGENCIA } }),
      this.prisma.alertRecord.count({ where: { isResolved: false, severidad: AlertSeverity.CRITICA } }),
      this.prisma.alertRecord.count({ where: { isResolved: false, severidad: AlertSeverity.ADVERTENCIA } }),
      this.prisma.alertRecord.count({
        where: {
          isResolved: true,
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      active,
      emergencias,
      criticas,
      advertencias,
      resueltasHoy,
    };
  }

  async resolveAlert(id: string, userId: string, nota?: string) {
    const alert = await this.prisma.alertRecord.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    return this.prisma.alertRecord.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolucionNota: nota || 'Marcada como resuelta por usuario',
      },
    });
  }

  async silenceAlert(id: string, dias: number = 7) {
    const alert = await this.prisma.alertRecord.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    const silencedUntil = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
    return this.prisma.alertRecord.update({
      where: { id },
      data: {
        isSilenced: true,
        silencedUntil,
      },
    });
  }

  async getUserPreferences(userId: string) {
    let pref = await this.prisma.userAlertPreference.findUnique({
      where: { userId },
    });

    if (!pref) {
      pref = await this.prisma.userAlertPreference.create({
        data: {
          userId,
          severidadMinima: AlertSeverity.INFORMACION,
          emailNotify: true,
          systemNotify: true,
        },
      });
    }

    return pref;
  }

  async updateUserPreferences(userId: string, dto: any) {
    return this.prisma.userAlertPreference.upsert({
      where: { userId },
      update: dto,
      create: { ...dto, userId },
    });
  }
}
