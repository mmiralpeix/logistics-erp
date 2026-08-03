import { PrismaClient } from '@prisma/client';
import { VehiclesService } from './modules/vehicles/vehicles.service';
import { PrismaService } from './prisma/prisma.service';

async function testVehicle360Suite() {
  console.log('🧪 Iniciando prueba automatizada de la Suite Vehículos 360°...');
  const prisma = new PrismaService();
  const vehiclesService = new VehiclesService(prisma);

  // 1. Obtener primer vehículo registrado
  const vehicle = await prisma.vehicle.findFirst({ where: { isActive: true } });
  if (!vehicle) {
    console.error('❌ No hay vehículos activos en BD');
    process.exit(1);
  }

  console.log(`🚛 Vehículo seleccionado: Dominio ${vehicle.patente} (${vehicle.marca} ${vehicle.modelo})`);

  // 2. Probar Expediente 360°
  console.log('📋 2. Obteniendo Expediente 360° del vehículo...');
  const summary = await vehiclesService.getSummary360(vehicle.id);

  console.log('✔ Expediente 360° generado exitosamente:');
  console.log(`   • Kilometraje Actual: ${summary.vehicle.kilometraje.toLocaleString()} km`);
  console.log(`   • Próximo Service: en ~${summary.metrics.kmRestantesService.toLocaleString()} km`);
  console.log(`   • Rendimiento Diésel: ${summary.metrics.promedioKmL} km/l`);
  console.log(`   • Total Inversión en Mantenimiento: $${summary.metrics.totalGastoMantenimiento.toLocaleString()}`);
  console.log(`   • Neumáticos Montados: ${summary.vehicle.tires.length} unidades`);
  console.log(`   • Mantenimientos en Taller: ${summary.vehicle.maintenances.length} OTs`);

  // 3. Probar Actualización de Odómetro
  console.log('⚙️ 3. Actualizando odómetro del vehículo...');
  const newKm = vehicle.kilometraje + 500;
  await vehiclesService.updateOdometer(vehicle.id, newKm, (vehicle.horasMotor || 1000) + 15);
  console.log(`✔ Odómetro actualizado exitosamente a ${newKm.toLocaleString()} km.`);

  console.log('✅ Toda la Suite de Vehículos 360° pasó la prueba sin ningún error.');
  await prisma.$disconnect();
}

testVehicle360Suite().catch((e) => {
  console.error('❌ Error testing Vehicle 360:', e);
  process.exit(1);
});
