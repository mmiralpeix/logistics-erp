import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { runMasterSeed } from './master-seed';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conectado a la base de datos.');

      const clientCount = await this.client.count();
      const driverCount = await this.driver.count();
      const carrierCount = await this.carrier.count();
      const vehicleCount = await this.vehicle.count();
      const tripCount = await this.trip.count();
      const alertCount = await this.alertRecord.count();

      if (clientCount < 50 || driverCount < 50 || carrierCount < 50 || vehicleCount < 50 || tripCount < 50 || alertCount < 50) {
        this.logger.log('🌱 [PrismaService] Base de datos con menos de 50 registros por entidad. Ejecutando MasterSeed masivo...');
        await runMasterSeed(this);
      } else {
        this.logger.log(`✅ Base de datos completamente sembrada (${clientCount} clientes, ${driverCount} choferes, ${carrierCount} terceros, ${vehicleCount} vehículos, ${tripCount} viajes).`);
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ No se pudo conectar a PostgreSQL (${err.message}). NestJS continuará en línea.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
