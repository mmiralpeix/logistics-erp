import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateDriverScheduleStatus } from '../drivers/utils/schedule-calculator.util';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpirations() {
    this.logger.log('Verificando vencimientos, jornadas y neumáticos de la flota...');
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Mark expired documents
    await this.prisma.document.updateMany({
      where: { fechaVencimiento: { lt: now }, isExpired: false },
      data: { isExpired: true },
    });

    const expiringVehicles = await this.prisma.vehicle.count({
      where: { isActive: true, OR: [
        { vencimientoSeguro: { lte: in30 } },
        { vencimientoITV: { lte: in30 } },
        { vencimientoRUTA: { lte: in30 } },
      ]},
    });

    const expiringDrivers = await this.prisma.driver.count({
      where: { isActive: true, OR: [
        { licenciaVencimiento: { lte: in30 } },
        { examenMedicoVencimiento: { lte: in30 } },
      ]},
    });

    // Check Driver Shift Schedules
    const activeDrivers = await this.prisma.driver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        modalidadLaboral: true,
        diasTrabajo: true,
        diasDescanso: true,
        fechaInicioTurno: true,
        fechaRegreso: true,
        fechaInicioDescanso: true,
      },
    });

    let exceededCount = 0;
    let upcomingRestCount = 0;

    activeDrivers.forEach((driver) => {
      const metrics = calculateDriverScheduleStatus(driver, now);
      if (metrics.esExcedido) exceededCount++;
      if (metrics.status === 'PROXIMO_A_DESCANSO') upcomingRestCount++;
    });

    // Check Critical Tire Wear (<3.0 mm)
    const lowDepthTiresCount = await this.prisma.tire.count({
      where: {
        profundidadActualMm: { lte: 3.0 },
        status: { notIn: ['DADO_DE_BAJA', 'FUERA_DE_SERVICIO'] as any },
      },
    });

    this.logger.log(
      `Alertas ERP: ${expiringVehicles} vehículos por vencer, ${expiringDrivers} licencias por vencer, ` +
      `${exceededCount} choferes excedidos, ${upcomingRestCount} próximos a descanso, ${lowDepthTiresCount} neumáticos con desgaste crítico (<3mm)`
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDelayedTrips() {
    const now = new Date();
    const delayed = await this.prisma.trip.findMany({
      where: {
        status: 'EN_CURSO' as any,
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
}
