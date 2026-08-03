import { PrismaClient } from '@prisma/client';
import { TripsService } from './modules/trips/trips.service';
import { PrismaService } from './prisma/prisma.service';

async function testTrip360Suite() {
  console.log('🧪 Iniciando prueba automatizada de la Suite Viajes 360° & Rendición de Gastos...');
  const prisma = new PrismaService();
  const tripsService = new TripsService(prisma);

  // 1. Obtener primer viaje registrado
  const trip = await prisma.trip.findFirst();
  if (!trip) {
    console.error('❌ No hay viajes en BD');
    process.exit(1);
  }

  console.log(`🗺️ Viaje seleccionado: #${trip.numero} (${trip.origen} ➔ ${trip.destino})`);

  // 2. Probar Expediente 360°
  console.log('📋 2. Obteniendo Expediente 360° del viaje...');
  const summary = await tripsService.getSummary360(trip.id);

  console.log('✔ Expediente 360° generado exitosamente:');
  console.log(`   • Tarifa Flete: $${summary.financials.tarifa.toLocaleString()}`);
  console.log(`   • Costos Directos Totales: $${summary.financials.costoDirectoTotal.toLocaleString()}`);
  console.log(`   • Margen Bruto: ${summary.financials.margenBrutoPct}%`);
  console.log(`   • Checkpoints Alcanzados: ${summary.trip.checkpoints.length}`);

  // 3. Probar Rendición de Gastos en Ruta
  console.log('💰 3. Registrando un comprobante de peaje en ruta...');
  const cost = await tripsService.addTripCost(trip.id, {
    categoria: 'PEAJES',
    descripcion: 'Peaje Cabeza de Buey (Ruta 34)',
    monto: 3500,
    comprobante: 'PEA-0002410',
  });

  console.log(`✔ Gasto registrado exitosamente: ${cost.categoria} - $${cost.monto}`);

  console.log('✅ Toda la Suite de Viajes 360° pasó la prueba sin ningún error.');
  await prisma.$disconnect();
}

testTrip360Suite().catch((e) => {
  console.error('❌ Error testing Trip 360:', e);
  process.exit(1);
});
