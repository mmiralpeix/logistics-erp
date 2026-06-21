import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpirations() {
    this.logger.log('Verificando vencimientos...');
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

    this.logger.log(`Alertas: ${expiringVehicles} vehículos con documentos por vencer, ${expiringDrivers} conductores con vencimientos`);
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
