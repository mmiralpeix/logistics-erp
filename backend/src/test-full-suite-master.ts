import { PrismaClient, VehicleType, TripStatus, TireType, TireStatus } from '@prisma/client';
import { VehiclesService } from './modules/vehicles/vehicles.service';
import { ClientsService } from './modules/clients/clients.service';
import { CarriersService } from './modules/carriers/carriers.service';
import { TripsService } from './modules/trips/trips.service';
import { AnalyticsService } from './modules/analytics/analytics.service';
import { PrismaService } from './prisma/prisma.service';
import { SystemConfigService } from './modules/system-config/system-config.service';

async function runMasterStressSuite() {
  console.log('🚀 INICIANDO AUDITORÍA & ESTRESADO MASTER DE TODA LA PLATAFORMA LOGISTICSPRO...');
  const prisma = new PrismaService();
  const vehiclesService = new VehiclesService(prisma, new SystemConfigService(prisma));
  const clientsService = new ClientsService(prisma);
  const carriersService = new CarriersService(prisma);
  const tripsService = new TripsService(prisma);
  const analyticsService = new AnalyticsService(prisma);

  const errorsFound: Array<{ module: string; description: string; status: string }> = [];

  console.log('\n--- 1. AUDITORÍA SUITE VEHÍCULOS 360° & FLOTA ---');
  try {
    const vehicles = await prisma.vehicle.findMany({ take: 20 });
    console.log(`🚛 Verificando ${vehicles.length} vehículos en flota...`);
    for (const v of vehicles) {
      const summary = await vehiclesService.getSummary360(v.id);
      if (!summary || !summary.metrics) {
        errorsFound.push({ module: 'Vehicles', description: `Summary 360 nulo para vehículo ${v.patente}`, status: 'Pendiente' });
      } else {
        await vehiclesService.updateOdometer(v.id, v.kilometraje + 50);
      }
    }
    console.log('✔ Módulo Vehículos 360°: OK');
  } catch (e: any) {
    errorsFound.push({ module: 'Vehicles', description: e.message || String(e), status: 'Detectado' });
  }

  console.log('\n--- 2. AUDITORÍA SUITE CLIENTES 360° & MATRIZ TARIFARIA ---');
  try {
    const clients = await prisma.client.findMany({ take: 15 });
    console.log(`🏢 Verificando ${clients.length} clientes empresariales...`);
    for (const c of clients) {
      const summary = await clientsService.getSummary360(c.id);
      if (!summary || !summary.stats) {
        errorsFound.push({ module: 'Clients', description: `Summary 360 nulo para cliente ${c.razonSocial}`, status: 'Pendiente' });
      }
    }
    console.log('✔ Módulo Clientes 360°: OK');
  } catch (e: any) {
    errorsFound.push({ module: 'Clients', description: e.message || String(e), status: 'Detectado' });
  }

  console.log('\n--- 3. AUDITORÍA SUITE OPERADORES & LIQUIDACIÓN DE FLETES ---');
  try {
    const carriers = await prisma.carrier.findMany({ take: 10 });
    console.log(`🏢 Verificando ${carriers.length} operadores subcontratados...`);
    for (const car of carriers) {
      const summary = await carriersService.getSummary360(car.id);
      if (!summary || !summary.stats) {
        errorsFound.push({ module: 'Carriers', description: `Summary 360 nulo para operador ${car.razonSocial}`, status: 'Pendiente' });
      }
      if (summary.trips.length > 0) {
        const setRes = await carriersService.createSettlement(car.id, [summary.trips[0].id], 5);
        if (!setRes || setRes.resumen.netoALiquidar <= 0) {
          errorsFound.push({ module: 'Carriers', description: `Cálculo de liquidación erróneo para ${car.razonSocial}`, status: 'Pendiente' });
        }
      }
    }
    console.log('✔ Módulo Operadores 360°: OK');
  } catch (e: any) {
    errorsFound.push({ module: 'Carriers', description: e.message || String(e), status: 'Detectado' });
  }

  console.log('\n--- 4. AUDITORÍA SUITE VIAJES 360° & RENDICIÓN DE GASTOS ---');
  try {
    const trips = await prisma.trip.findMany({ take: 25 });
    console.log(`🗺️ Verificando ${trips.length} viajes operativos...`);
    for (const t of trips) {
      const summary = await tripsService.getSummary360(t.id);
      if (!summary || !summary.financials) {
        errorsFound.push({ module: 'Trips', description: `Summary 360 nulo para viaje ${t.numero}`, status: 'Pendiente' });
      }
      await tripsService.addTripCost(t.id, {
        categoria: 'PEAJES',
        descripcion: 'Audit Test Toll',
        monto: 1500,
      });
    }
    console.log('✔ Módulo Viajes 360°: OK');
  } catch (e: any) {
    errorsFound.push({ module: 'Trips', description: e.message || String(e), status: 'Detectado' });
  }

  console.log('\n--- 5. AUDITORÍA BUSINESS INTELLIGENCE & ANALÍTICA ---');
  try {
    const overview = await analyticsService.getKpis({});
    const predictive = await analyticsService.getPredictive();
    const rankings = await analyticsService.getVehicleRanking();

    if (!overview || !predictive || !rankings) {
      errorsFound.push({ module: 'Analytics', description: 'Metricas BI incompletas', status: 'Pendiente' });
    }
    console.log('✔ Módulo BI & Analytics: OK');
  } catch (e: any) {
    errorsFound.push({ module: 'Analytics', description: e.message || String(e), status: 'Detectado' });
  }

  console.log('\n====================================================');
  console.log('📋 INFORME FINAL DE LA AUDITORÍA MASTER DE ESTRESADO:');
  console.log(` • Total Errores/Inconsistencias Detectadas: ${errorsFound.length}`);

  if (errorsFound.length === 0) {
    console.log('🎉 EL SISTEMA LOGISTICSPRO SE ENCUENTRA AL 100% OPERATIVO LIBRE DE ERRORES.');
  } else {
    console.log('⚠️ Detalle de Incidencias:');
    console.table(errorsFound);
  }

  await prisma.$disconnect();
}

runMasterStressSuite().catch((e) => {
  console.error('❌ Error executing Master Stress Suite:', e);
  process.exit(1);
});
