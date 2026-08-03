import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { runMasterSeed } from './master-seed';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    try {
      const clientCount = await this.client.count();
      const driverCount = await this.driver.count();
      const carrierCount = await this.carrier.count();
      const tireCount = await this.tire.count();
      const alertCount = await this.alertRecord.count();

      if (clientCount < 5 || driverCount < 4 || carrierCount === 0 || tireCount === 0 || alertCount === 0) {
        this.logger.log('🌱 Base de datos incompleta o sin registros iniciales. Ejecutando MasterSeed automático...');
        await runMasterSeed(this);
      } else {
        this.logger.log(`✅ Base de datos activa y poblada (${clientCount} clientes, ${driverCount} choferes, ${carrierCount} terceros).`);
      }
    } catch (err) {
      this.logger.error('Error durante la verificación/sembrado automático:', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
