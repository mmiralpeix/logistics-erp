import { PrismaClient } from '@prisma/client';
import { ClientsService } from './modules/clients/clients.service';
import { PrismaService } from './prisma/prisma.service';

async function testClient360Suite() {
  console.log('🧪 Iniciando prueba automatizada de la Suite Clientes 360°...');
  const prisma = new PrismaService();
  const clientsService = new ClientsService(prisma);

  // 1. Obtener primer cliente registrado
  const client = await prisma.client.findFirst({ where: { isActive: true } });
  if (!client) {
    console.error('❌ No hay clientes activos en BD');
    process.exit(1);
  }

  console.log(`🏢 Cliente seleccionado: ${client.razonSocial} (CUIT ${client.cuit})`);

  // 2. Probar Expediente 360°
  console.log('📋 2. Obteniendo resumen Expediente 360°...');
  const summary = await clientsService.getSummary360(client.id);

  console.log('✔ Resumen 360° generado exitosamente:');
  console.log(`   • Total Viajes: ${summary.stats.totalViajes}`);
  console.log(`   • Monto Acordado: $${summary.stats.totalMontoAcordado.toLocaleString()}`);
  console.log(`   • Facturado Cobrado: $${summary.stats.totalFacturado.toLocaleString()}`);
  console.log(`   • Pendiente Cobro: $${summary.stats.totalPendienteCobro.toLocaleString()}`);
  console.log(`   • Estado de Riesgo: ${summary.client.riesgoBloqueado ? 'BLOQUEADO' : 'HABILITADO'}`);

  // 3. Probar Matriz de Tarifarios
  console.log('🏷️ 3. Agregando nueva tarifa por tramo (Buenos Aires -> Vaca Muerta)...');
  const rate = await clientsService.addRate(client.id, {
    origen: 'Buenos Aires (Dock Sud)',
    destino: 'Añelo (Vaca Muerta Base YPF)',
    tipoCarga: 'EQUIPO_ESPECIAL',
    tarifaBase: 1250000,
    costoPorTnExcedente: 15000,
    horasEsperaLibres: 4,
  });

  console.log(`✔ Tarifa creada exitosamente con ID: ${rate.id}`);

  // 4. Listar tarifas del cliente
  const rates = await clientsService.getRates(client.id);
  console.log(`✔ Tarifas registradas para el cliente: ${rates.length} tramos`);

  // 5. Eliminar tarifa de prueba
  await clientsService.removeRate(rate.id);
  console.log('✔ Tarifa de prueba eliminada correctamente.');

  console.log('✅ Toda la Suite de Clientes 360° pasó la prueba sin ningún error.');
  await prisma.$disconnect();
}

testClient360Suite().catch((e) => {
  console.error('❌ Error testing Client 360:', e);
  process.exit(1);
});
