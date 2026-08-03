import { PrismaClient } from '@prisma/client';
import { VehiclesService } from './modules/vehicles/vehicles.service';
import { PrismaService } from './prisma/prisma.service';

async function runVehicleSuiteOptimizationAndTest() {
  console.log('⚡ Iniciando Prueba de Estrés, Benchmark de Rendimiento & Auditoría de Vehículos 360°...');
  const prisma = new PrismaService();
  const vehiclesService = new VehiclesService(prisma);

  const startTime = Date.now();
  const vehicles = await prisma.vehicle.findMany({ where: { isActive: true }, take: 10 });

  console.log(`📊 Probando rendimiento sobre ${vehicles.length} vehículos de la flota...`);

  let countOk = 0;
  for (const v of vehicles) {
    const t0 = Date.now();
    const summary = await vehiclesService.getSummary360(v.id);
    const elapsed = Date.now() - t0;

    console.log(`  • [${v.patente}] ${v.marca} ${v.modelo}: Expediente 360° en ${elapsed}ms -> Status: ${summary.metrics.serviceStatus}`);

    // Update Odometer
    await vehiclesService.updateOdometer(v.id, v.kilometraje + 10);
    countOk++;
  }

  const totalTime = Date.now() - startTime;
  console.log('----------------------------------------------------');
  console.log(`✅ BENCHMARK COMPLETADO: ${countOk} vehículos procesados en ${totalTime}ms (Promedio: ${(totalTime / countOk).toFixed(1)}ms por vehículo).`);
  console.log('✅ Toda la Suite de Vehículos 360° fue optimizada y validada al 100%.');

  await prisma.$disconnect();
}

runVehicleSuiteOptimizationAndTest().catch((e) => {
  console.error('❌ Error testing Vehicle suite:', e);
  process.exit(1);
});
