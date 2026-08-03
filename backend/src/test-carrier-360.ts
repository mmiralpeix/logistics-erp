import { PrismaClient } from '@prisma/client';
import { CarriersService } from './modules/carriers/carriers.service';
import { PrismaService } from './prisma/prisma.service';

async function testCarrier360Suite() {
  console.log('🧪 Iniciando prueba automatizada de la Suite Operadores 360° & Liquidación...');
  const prisma = new PrismaService();
  const carriersService = new CarriersService(prisma);

  // 1. Obtener primer operador registrado
  const carrier = await prisma.carrier.findFirst();
  if (!carrier) {
    console.error('❌ No hay operadores en BD');
    process.exit(1);
  }

  console.log(`🏢 Operador seleccionado: ${carrier.razonSocial} (CUIT ${carrier.cuit || 'S/D'})`);

  // 2. Probar Expediente 360°
  console.log('📋 2. Obteniendo Expediente 360° del operador...');
  const summary = await carriersService.getSummary360(carrier.id);

  console.log('✔ Expediente 360° generado exitosamente:');
  console.log(`   • Equipos Subcontratados: ${summary.stats.totalVehiculosActivos}`);
  console.log(`   • Choferes Habilitados: ${summary.stats.totalChoferesActivos}`);
  console.log(`   • Viajes Asignados: ${summary.stats.totalViajes}`);
  console.log(`   • Total Flete Pactado: $${summary.stats.totalFletePactado.toLocaleString()}`);

  // 3. Probar Liquidación de Fletes
  console.log('💰 3. Generando liquidación de fletes de prueba...');
  const trips = summary.trips.slice(0, 3);
  const tripIds = trips.map((t) => t.id);

  if (tripIds.length > 0) {
    const settlement = await carriersService.createSettlement(carrier.id, tripIds, 5);
    console.log(`✔ Orden de liquidación ${settlement.numeroLiquidacion} generada:`);
    console.log(`   • Cantidad viajes: ${settlement.resumen.cantidadViajes}`);
    console.log(`   • Subtotal: $${settlement.resumen.subtotalFlete.toLocaleString()}`);
    console.log(`   • Retención (5%): -$${settlement.resumen.montoRetencion.toLocaleString()}`);
    console.log(`   • Neto a Pagar: $${settlement.resumen.netoALiquidar.toLocaleString()}`);
  } else {
    console.log('ℹ No hay viajes para liquidar en la muestra de prueba.');
  }

  console.log('✅ Toda la Suite de Operadores 360° pasó la prueba sin ningún error.');
  await prisma.$disconnect();
}

testCarrier360Suite().catch((e) => {
  console.error('❌ Error testing Carrier 360:', e);
  process.exit(1);
});
