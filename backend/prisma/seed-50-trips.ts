import { PrismaClient, TripStatus, VehicleStatus, VehicleType, DocumentType, InvoiceStatus, InvoiceType, MaintenanceType, MaintenanceStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function seedExhaustiveQAData() {
  console.log('🚀 Iniciando Generación de 50 Viajes, Mantenimientos y Facturas de Prueba Exhaustivas...');

  const clients = await prisma.client.findMany();
  const vehicles = await prisma.vehicle.findMany({ where: { tipo: { in: [VehicleType.CAMION, VehicleType.TRACTOR] } } });
  const trailers = await prisma.vehicle.findMany({ where: { tipo: { in: [VehicleType.SEMIRREMOLQUE, VehicleType.SEMI_CISTERNA, VehicleType.CARRETON, VehicleType.BATEA] } } });
  const drivers = await prisma.driver.findMany();
  const carriers = await prisma.carrier.findMany();

  if (clients.length === 0 || vehicles.length === 0 || drivers.length === 0) {
    console.error('❌ Falta información base en la base de datos.');
    return;
  }

  // Ensure at least 2 drivers are certified for dangerous goods
  await prisma.driver.updateMany({
    where: { id: { in: [drivers[0].id, drivers[1]?.id || drivers[0].id] } },
    data: { habilitadoCargasPeligrosas: true },
  });

  const routes = [
    { origen: 'Salta Capital', destino: 'Salar de Pocitos (Salar del Hombre Muerto)', dist: 380, dur: 7, carga: 'Salmuera Litio / Minería' },
    { origen: 'San Antonio de los Cobres', destino: 'Project Lithium One Camp', dist: 140, dur: 5, carga: 'Ácido Clorhídrico UN1789' },
    { origen: 'Puerto de Buenos Aires (Dock Sud)', destino: 'Mendoza Logistics Center', dist: 1050, dur: 14, carga: 'Contenedor 40HQ Carga General' },
    { origen: 'Rosario Terminal 6', destino: 'Córdoba Capital Hub', dist: 410, dur: 6, carga: 'Insumos Agrícolas' },
    { origen: 'Comodoro Rivadavia Base', destino: 'Yacimiento Manantiales Behr YPF', dist: 180, dur: 4, carga: 'Carretón Sobredimensionado' },
    { origen: 'Bahía Blanca Polo Petroquímico', destino: 'Añelo Base Logística Vaca Muerta', dist: 580, dur: 9, carga: 'Tubos de Perforación Casing' },
    { origen: 'San Juan Capital', destino: 'Mina Veladero (Alta Montaña)', dist: 320, dur: 8, carga: 'Cianuro de Sodio UN1689' },
    { origen: 'Neuquén Capital', destino: 'Rincón de los Sauces YPF', dist: 240, dur: 5, carga: 'Combustible Cisterna Diesel' },
  ];

  const statuses = [TripStatus.PROGRAMADO, TripStatus.EN_CURSO, TripStatus.FINALIZADO, TripStatus.PENDIENTE, TripStatus.CANCELADO];
  const operTypes = ['PROPIA', 'TRACCION_TERCERO_SEMI_PROPIO', 'SUBCONTRATADA_TOTAL'];

  const createdTripIds: string[] = [];

  for (let i = 1; i <= 50; i++) {
    const route = routes[(i - 1) % routes.length];
    const status = statuses[i % statuses.length];
    const operType = operTypes[i % operTypes.length];
    const client = clients[(i - 1) % clients.length];
    const vehicle = operType !== 'SUBCONTRATADA_TOTAL' ? vehicles[(i - 1) % vehicles.length] : null;
    const trailer = operType !== 'SUBCONTRATADA_TOTAL' && trailers.length > 0 ? trailers[(i - 1) % trailers.length] : null;
    const driver = operType !== 'SUBCONTRATADA_TOTAL' ? drivers[(i - 1) % drivers.length] : null;
    const carrier = operType !== 'PROPIA' && carriers.length > 0 ? carriers[(i - 1) % carriers.length] : null;

    const departure = new Date(Date.now() + (i - 25) * 24 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + route.dur * 60 * 60 * 1000);
    const isHazmat = route.carga.includes('Ácido') || route.carga.includes('Cianuro') || route.carga.includes('Combustible');

    const tarifa = 500000 + i * 15000;
    const costo = Math.round(tarifa * 0.62);
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
        pesoCarga: 26000 + (i % 10) * 800,
        numeroRemito: `REM-0002-${8000 + i}`,
        numeroOCCliente: `OC-MINERA-${1000 + i}`,
        esCargaPeligrosa: isHazmat,
        esMineria: route.carga.includes('Salmuera') || route.carga.includes('Ácido') || route.carga.includes('Mina'),
        tipoOperacion: operType,
        clientId: client.id,
        vehicleId: vehicle?.id || null,
        trailerId: trailer?.id || null,
        driverId: driver?.id || null,
        carrierId: carrier?.id || null,
        tarifaAcordada: tarifa,
        costoTotal: costo,
        margenBruto: margen,
        notas: `[EXHAUSTIVE QA TEST] Viaje #${i} - ${route.carga}`,
      },
    });

    createdTripIds.push(trip.id);

    // Hazmat declaration
    if (isHazmat) {
      const isCyanide = route.carga.includes('Cianuro');
      await prisma.dangerousGoodsDeclaration.create({
        data: {
          tripId: trip.id,
          numeroONU: isCyanide ? 'UN1689' : 'UN1789',
          clase: isCyanide ? 'CLASE_6_TOXICOS' : 'CLASE_8_CORROSIVOS',
          nombreTecnico: isCyanide ? 'CIANURO DE SODIO SÓLIDO' : 'ÁCIDO CLORHÍDRICO EN SOLUCIÓN',
          cantidadKg: 26000 + (i % 10) * 800,
          grupoEmbalaje: 'I',
          hojaSeguridad: true,
          equipoObligatorio: true,
          permisosCompletos: true,
          cumpleNormativa: true,
        },
      });
    }

    // Add extra costs for finished trips
    if (status === TripStatus.FINALIZADO) {
      await prisma.tripCost.createMany({
        data: [
          { tripId: trip.id, categoria: 'PEAJE', descripcion: 'Peajes Nacionales', monto: 18500 },
          { tripId: trip.id, categoria: 'VIATICOS', descripcion: 'Adicional Viáticos Chofer', monto: 35000 },
          { tripId: trip.id, categoria: 'MANTENIMIENTO', descripcion: 'Lavado Cisterna / Pañol', monto: 22000 },
        ],
      });
    }

    // Vehicle status update
    if (vehicle && status === TripStatus.EN_CURSO) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: VehicleStatus.EN_VIAJE },
      });
    }
  }

  // Create sample Invoices for finished trips
  const finishedTrips = await prisma.trip.findMany({ where: { status: TripStatus.FINALIZADO }, take: 10 });
  for (const fTrip of finishedTrips) {
    if (!fTrip.clientId) continue;
    const subtotal = Number(fTrip.tarifaAcordada) || 400000;
    const iva = Math.round(subtotal * 0.21);
    const total = subtotal + iva;

    await prisma.invoice.create({
      data: {
        numero: `A-0001-${Math.floor(10000000 + Math.random() * 89999999)}`,
        tipo: InvoiceType.FACTURA_A,
        status: InvoiceStatus.EMITIDA,
        clientId: fTrip.clientId,
        subtotal: subtotal,
        iva: iva,
        total: total,
        fechaEmision: new Date(),
        fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Create sample Maintenance logs
  if (vehicles.length > 0) {
    await prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id,
        tipo: MaintenanceType.PREVENTIVO,
        status: MaintenanceStatus.EN_CURSO,
        descripcion: 'Service preventivo 50.000 KM — Cambio de aceite, filtros de aire y combustible.',
        fecha: new Date(),
        costoTotal: 280000,
        taller: 'Pañol Central LogisticsPro',
      },
    });
  }

  console.log(`✅ 50 viajes, facturas de flete y mantenimientos sembrados exitosamente.`);
}

seedExhaustiveQAData()
  .catch((e) => console.error('❌ Error en seed de 50 viajes:', e))
  .finally(async () => await prisma.$disconnect());
