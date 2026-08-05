import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { runMasterSeed } from './master-seed';

// Native <input type="date"> always submits a bare "YYYY-MM-DD" string, but Prisma's
// DateTime columns require a full ISO-8601 datetime and throw PrismaClientValidationError
// ("premature end of input. Expected ISO-8601 DateTime") on a date-only string. Rather than
// fix this in every DTO/service across the app (25+ date fields, some behind unvalidated
// `body: any` controllers with no DTO at all), coerce it once here for every write.
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function coerceDateOnlyStrings(value: any): any {
  if (Array.isArray(value)) {
    for (const item of value) coerceDateOnlyStrings(item);
    return value;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const v = value[key];
      if (typeof v === 'string' && DATE_ONLY_RE.test(v)) {
        value[key] = new Date(v);
      } else if (v && typeof v === 'object') {
        coerceDateOnlyStrings(v);
      }
    }
  }
  return value;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      this.$use(async (params, next) => {
        if (params.args?.data) {
          coerceDateOnlyStrings(params.args.data);
        }
        return next(params);
      });

      await this.$connect();
      this.logger.log('Conectado a la base de datos.');

      if (process.env.AUTO_SEED_ON_BOOT === 'true') {
        const clientCount = await this.client.count();
        const driverCount = await this.driver.count();
        const carrierCount = await this.carrier.count();
        const vehicleCount = await this.vehicle.count();
        const tripCount = await this.trip.count();
        const alertCount = await this.alertRecord.count();

        if (clientCount < 50 || driverCount < 50 || carrierCount < 50 || vehicleCount < 50 || tripCount < 50 || alertCount < 50) {
          this.logger.log('🌱 [PrismaService] AUTO_SEED_ON_BOOT=true y base con menos de 50 registros por entidad. Ejecutando MasterSeed masivo...');
          await runMasterSeed(this);
        } else {
          this.logger.log(`✅ Base de datos completamente sembrada (${clientCount} clientes, ${driverCount} choferes, ${carrierCount} terceros, ${vehicleCount} vehículos, ${tripCount} viajes).`);
        }
      } else {
        this.logger.log('ℹ️ AUTO_SEED_ON_BOOT no está activo: se omite la siembra automática de datos de ejemplo.');
      }
    } catch (err: any) {
      this.logger.warn(`⚠️ No se pudo conectar a PostgreSQL (${err.message}). NestJS continuará en línea.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
