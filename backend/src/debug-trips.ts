import { PrismaClient } from '@prisma/client';

async function debugTrips() {
  const prisma = new PrismaClient();
  console.log('🔍 Diagnosticando consulta de viajes...');

  try {
    const totalCount = await prisma.trip.count();
    console.log(`📊 Total de Viajes en Base de Datos: ${totalCount}`);

    const trips = await prisma.trip.findMany({
      take: 5,
      orderBy: { fechaSalidaProgramada: 'desc' },
      include: {
        client: { select: { razonSocial: true, cuit: true } },
        contract: { select: { numero: true, tarifaBase: true, pesoMinimoKg: true, tarifaExcedentePorTn: true } },
        vehicle: { select: { patente: true, marca: true, modelo: true, tipo: true } },
        trailer: { select: { patente: true, marca: true, modelo: true, tipo: true } },
        driver: { select: { firstName: true, lastName: true, telefono: true } },
        carrier: { select: { id: true, razonSocial: true } },
        carrierDriver: { select: { firstName: true, lastName: true } },
        carrierVehicle: { select: { patente: true, tipo: true, marca: true } },
        carrierTrailer: { select: { patente: true, tipo: true, marca: true } },
        dangerousGoods: true,
        _count: { select: { costs: true, incidents: true } },
      },
    });

    console.log(`✅ Viajes obtenidos correctamente: ${trips.length}`);
    if (trips.length > 0) {
      console.log('📌 Ejemplo primer viaje:', {
        id: trips[0].id,
        numero: trips[0].numero,
        origen: trips[0].origen,
        destino: trips[0].destino,
        status: trips[0].status,
        vehiculo: trips[0].vehicle?.patente,
        pctMaintenanceOverride: trips[0].pctMaintenanceOverride,
        pctTiresOverride: trips[0].pctTiresOverride,
      });
    }

  } catch (err: any) {
    console.error('❌ Error ejecutando consulta de viajes:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debugTrips();
