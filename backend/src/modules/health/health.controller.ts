import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servicio y base de datos' })
  async check() {
    let dbStatus = 'ok';
    let counts = { vehicles: 0, drivers: 0, trips: 0, clients: 0 };
    try {
      const [vehicles, drivers, trips, clients] = await Promise.all([
        this.prisma.vehicle.count().catch(() => 0),
        this.prisma.driver.count().catch(() => 0),
        this.prisma.trip.count().catch(() => 0),
        this.prisma.client.count().catch(() => 0),
      ]);
      counts = { vehicles, drivers, trips, clients };
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      database: dbStatus,
      counts,
      timestamp: new Date().toISOString(),
      service: 'LogisticsPro ERP API',
      version: '1.0.0',
    };
  }

  @Public()
  @Get('import')
  @ApiOperation({ summary: 'Restaurar volcado completo de datos demo desde neon_dump.json' })
  async triggerImport() {
    try {
      const { execSync } = require('child_process');
      const path = require('path');
      const importScriptPath = path.join(process.cwd(), 'prisma', 'import_railway.js');
      execSync(`node "${importScriptPath}"`, { stdio: 'inherit' });
      return {
        status: 'ok',
        message: '🎉 Datos completos importados exitosamente en Railway PostgreSQL.',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `Error ejecutando restauración de datos: ${err?.message || String(err)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Public()
  @Get('seed')
  @ApiOperation({ summary: 'Generar datos masivos completos de prueba (MasterSeed)' })
  async triggerMasterSeed() {
    try {
      const { MasterSeed } = require('../../prisma/master-seed');
      await MasterSeed.run(this.prisma);
      return {
        status: 'ok',
        message: '🎉 Sembrado masivo de datos demo (Vehículos, Choferes, Viajes, Mantenimiento, Neumáticos, Facturas) completado exitosamente.',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `Error ejecutando sembrado masivo: ${err?.message || String(err)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
