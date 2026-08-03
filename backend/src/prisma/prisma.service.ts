import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL en Railway.');

    try {
      // 1. Check if users table exists in the database
      await this.$queryRawUnsafe('SELECT 1 FROM "public"."users" LIMIT 1;');
      this.logger.log('Esquema de base de datos verificado: Tabla "users" existe.');
    } catch (err: any) {
      this.logger.warn('La tabla "public.users" no existe en PostgreSQL. Ejecutando migración de esquema automática (npx prisma db push)...');
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        this.logger.log('✅ Esquema de base de datos migrado exitosamente con Prisma.');
      } catch (pushErr: any) {
        this.logger.error('❌ Error al ejecutar npx prisma db push:', pushErr?.message || pushErr);
      }
    }

    // 2. Check if database has records (e.g. vehicles count)
    try {
      const vehicleCount = await this.vehicle.count().catch(() => 0);
      if (vehicleCount === 0) {
        this.logger.warn('Base de datos sin registros detectada (0 vehículos). Restaurando datos completos desde import_railway.js...');
        try {
          const importScriptPath = path.join(process.cwd(), 'prisma', 'import_railway.js');
          execSync(`node "${importScriptPath}"`, { stdio: 'inherit' });
          this.logger.log('🎉 Restauración completa de datos demo ejecutada con éxito.');
        } catch (importErr: any) {
          this.logger.error('❌ Error al restaurar datos demo:', importErr?.message || importErr);
        }
      } else {
        this.logger.log(`Base de datos operativa con ${vehicleCount} vehículos registrados.`);
      }
    } catch (e: any) {
      this.logger.error('Error al verificar registros en la base de datos:', e?.message || e);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
