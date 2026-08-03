import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL en Railway.');

    try {
      // Check if users table exists in the database
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
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
