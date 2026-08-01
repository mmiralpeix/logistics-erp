import { PrismaClient, TripStatus, VehicleStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function seed20Trips() {
  console.log('🚚 Generando 20 viajes de prueba variados para QA...');

  const clients = await prisma.client.findMany();
  const vehicles = await prisma.vehicle.findMany({ where: { tipo: { in: ['CAMION', 'TRACTOR'] } } });
  const trailers = await prisma.vehicle.findMany({ where: { tipo: { in: ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA'] } } });
  const drivers = await prisma.driver.findMany();
  const carriers = await prisma.carrier.findMany();

  if (clients.length === 0 || vehicles.length === 0 || drivers.length === 0) {
    console.error('❌ Falta información base de clientes, vehículos o conductores.');
    return;
  }

  const sampleRoutes = [
    { origen: 'Salta Capital', destino: 'Salar de Pocitos', dist: 380, dur: 7, carga: 'Salmuera / Minería' },
    { origen: 'San Antonio de los Cobres', destino: 'Lithium One Camp', dist: 120, dur: 4, carga: 'Ácido Clorhídrico' },
    { origen: 'Buenos Aires (Puerto)', destino: 'Mendoza Plaza', dist: 1050, dur: 14, carga: 'Carga General' },
    { origen: 'Rosario (Terminal 6)', destino: 'Córdoba Capital', dist: 410, dur: 6, carga: 'Maquinaria Pesada' },
    { origen: 'Comodoro Rivadavia', destino: 'YPF Yacimiento Manantiales', dist: 180, dur: 4, carga: 'Carretón / Sobredimensionada' },
    { origen: 'Bahía Blanca', destino: 'Añelo (Vaca Muerta)', dist: 580, dur: 9, carga: 'Insumos Industriales' },
  ];

  const statuses = [TripStatus.PROGRAMADO, TripStatus.EN_CURSO, TripStatus.FINALIZADO, TripStatus.PENDIENTE];
  const operTypes = ['PROPIA', 'TRACCION_TERCERO_SEMI_PROPIO', 'SUBCONTRATADA_TOTAL'];

  const now = new Date();

  for (let i = 1; i <= 20; i++) {
    const route = sampleRoutes[(i - 1) % sampleRoutes.length];
    const status = statuses[i % statuses.length];
    const operType = operTypes[i % operTypes.length];
    const client = clients[(i - 1) % clients.length];
    const vehicle = operType !== 'SUBCONTRATADA_TOTAL' ? vehicles[(i - 1) % vehicles.length] : null;
    const trailer = operType !== 'SUBCONTRATADA_TOTAL' && trailers.length > 0 ? trailers[(i - 1) % trailers.length] : null;
    const driver = operType !== 'SUBCONTRATADA_TOTAL' ? drivers[(i - 1) % drivers.length] : null;
    const carrier = operType !== 'PROPIA' && carriers.length > 0 ? carriers[(i - 1) % carriers.length] : null;

    const departure = new Date(now.getTime() + (i - 10) * 24 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + route.dur * 60 * 60 * 1000);
    const isHazmat = route.carga.includes('Ácido') || i % 4 === 0;

    const tarifa = 450000 + i * 25000;
    const costo = Math.round(tarifa * 0.65);
    const margen = tarifa - costo;

    const randHex = randomBytes(3).toString('hex').toUpperCase();

    const trip = await prisma.trip.create({
      data: {
        numero: `VJ-2026-${randHex}`,
        origen: route.origen,
        destino: route.destino,
        fechaSalidaProgramada: departure,
        fechaLlegadaEstimada: arrival,
        fechaSalidaReal: status === TripStatus.EN_CURSO || status === TripStatus.FINALIZADO ? departure : null,
        fechaLlegadaReal: status === TripStatus.FINALIZADO ? arrival : null,
        duracionEstimadaHoras: route.dur,
        esperaEnDestinoHoras: 2,
        descansosConductorHoras: 1,
        leadTimeTotal: route.dur + 3,
        distanciaKm: route.dist,
        status: status,
        tipoCarga: route.carga,
        pesoCarga: 28000 + i * 500,
        numeroRemito: `REM-0001-${7000 + i}`,
        numeroOCCliente: `OC-99000${i}`,
        esCargaPeligrosa: isHazmat,
        esMineria: route.carga.includes('Salmuera') || route.carga.includes('Ácido'),
        tipoOperacion: operType,
        clientId: client.id,
        vehicleId: vehicle?.id || null,
        trailerId: trailer?.id || null,
        driverId: driver?.id || null,
        carrierId: carrier?.id || null,
        tarifaAcordada: tarifa,
        costoTotal: costo,
        margenBruto: margen,
        notas: `[QA SAMPLE DATA] Viaje de prueba #${i} — ${operType}`,
      },
    });

    if (isHazmat) {
      await prisma.dangerousGoodsDeclaration.create({
        data: {
          tripId: trip.id,
          numeroONU: 'UN1789',
          clase: 'CLASE_8_CORROSIVOS',
          nombreTecnico: 'ÁCIDO CLORHÍDRICO EN SOLUCIÓN',
          cantidadKg: 28000 + i * 500,
          grupoEmbalaje: 'II',
          hojaSeguridad: true,
          equipoObligatorio: true,
          permisosCompletos: true,
          cumpleNormativa: true,
        },
      });
    }

    if (vehicle && status === TripStatus.EN_CURSO) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.EN_VIAJE },
      });
    }

    console.log(`  ✓ Viaje ${i}/20 creado: ${trip.numero} [${status}] - ${route.origen} → ${route.destino}`);
  }

  console.log('🎉 20 viajes cargados exitosamente en la base de datos!');
}

seed20Trips()
  .catch((e) => console.error('❌ Error creando viajes QA:', e))
  .finally(async () => await prisma.$disconnect());
