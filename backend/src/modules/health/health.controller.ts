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
}
