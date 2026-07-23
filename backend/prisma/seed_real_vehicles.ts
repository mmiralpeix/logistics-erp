import { PrismaClient, ConsumableType, VehicleType, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DOMAIN_LIST = [
  'AH551ZH',
  'AH551ZF',
  'AH551ZI',
  'AH551ZJ',
  'AH551ZN',
  'AH551ZK',
  'AH712CI',
  'AH712CJ',
  'AH712CK',
];

async function main() {
  console.log('--- Limpiando datos anteriores ---');

  // 1. Borrar logs de combustible anteriores
  await prisma.fuelLog.deleteMany({});
  console.log('✔ Registros de combustible eliminados');

  // 2. Desvincular o eliminar viajes/mantenimientos/documentos anteriores
  await prisma.tripCost.deleteMany({});
  await prisma.dangerousGoodsDeclaration.deleteMany({});
  await prisma.tripCheckpoint.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.gPSDevice.deleteMany({});
  await prisma.vehicle.deleteMany({});
  console.log('✔ Vehículos anteriores eliminados');

  console.log('--- Creando los 9 camiones Scania G460 6x2 reales ---');

  const createdVehicles = [];
  const baseKms = [142000, 118500, 95400, 134200, 105800, 156000, 88400, 122900, 110300];

  for (let i = 0; i < DOMAIN_LIST.length; i++) {
    const patente = DOMAIN_LIST[i];
    const initialKm = baseKms[i] || 100000;

    const v = await prisma.vehicle.create({
      data: {
        patente,
        marca: 'Scania',
        modelo: 'G460 6x2',
        anio: 2023,
        tipo: VehicleType.CAMION,
        status: i % 3 === 0 ? VehicleStatus.EN_VIAJE : VehicleStatus.DISPONIBLE,
        kilometraje: initialKm,
        capacidadKg: 45000,
        color: 'Blanco',
        propietario: 'Flota Propia',
        isThirdParty: false,
        vencimientoSeguro: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        vencimientoITV: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
        vencimientoRUTA: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      },
    });
    createdVehicles.push(v);
    console.log(`+ Vehículo creado: ${v.patente} (${v.marca} ${v.modelo}) - KM: ${v.kilometraje}`);
  }

  console.log('--- Generando historial real de cargas de Combustible / Urea / Aceite ---');

  const ESTACIONES = ['YPF Ruta Rosario', 'Shell San Lorenzo', 'Axion Campana', 'YPF Yuto Jujuy', 'Puma Córdoba', 'YPF Dock Sud'];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const vehicle of createdVehicles) {
    let currentKm = vehicle.kilometraje - 4500; // Comenzar hace 4500 km

    // Generar entre 4 y 6 cargas consecutivas para cada camión
    const numLoads = 5;

    for (let c = 0; c < numLoads; c++) {
      const daysAgo = (numLoads - c) * 4;
      const loadDate = new Date(now - daysAgo * dayMs);

      // Carga Diésel (entre 360L y 480L)
      const litrosDiesel = Math.floor(Math.random() * (480 - 360 + 1)) + 360;
      const precioDiesel = 1180 + (c * 15);
      const kmRecorridos = Math.floor(litrosDiesel * (2.4 + Math.random() * 0.4)); // Rendimiento 2.4 - 2.8 km/L
      currentKm += kmRecorridos;

      const rendimiento = Math.round((kmRecorridos / litrosDiesel) * 100) / 100;
      const costoDiesel = Math.round(litrosDiesel * precioDiesel);
      const estacion = ESTACIONES[(c + vehicle.patente.charCodeAt(4)) % ESTACIONES.length];

      const isDeviated = rendimiento < 2.3;

      await prisma.fuelLog.create({
        data: {
          vehicleId: vehicle.id,
          tipoConsumible: ConsumableType.DIESEL,
          tipoCombustible: 'DIESEL',
          fecha: loadDate,
          litros: litrosDiesel,
          precioPorLitro: precioDiesel,
          costoTotal: costoDiesel,
          kmActual: currentKm,
          rendimientoKmL: rendimiento,
          esDesvio: isDeviated,
          proveedor: estacion,
          estacion,
          notas: isDeviated ? `ALERTA: Rendimiento diésel (${rendimiento} km/L) por debajo de norma` : `Carga diésel en tramo de ruta`,
        },
      });

      // Carga de Urea ARLA 32 (aprox 4.2% - 4.8% del diésel)
      if (c % 2 === 0) {
        const litrosUrea = Math.round(litrosDiesel * (0.042 + Math.random() * 0.006));
        const precioUrea = 1450;
        const ratioPct = Math.round((litrosUrea / litrosDiesel) * 10000) / 100;
        const costoUrea = Math.round(litrosUrea * precioUrea);

        await prisma.fuelLog.create({
          data: {
            vehicleId: vehicle.id,
            tipoConsumible: ConsumableType.UREA,
            tipoCombustible: 'UREA',
            fecha: new Date(loadDate.getTime() + 15 * 60 * 1000), // 15 min después de cargar diésel
            litros: litrosUrea,
            precioPorLitro: precioUrea,
            costoTotal: costoUrea,
            kmActual: currentKm,
            ratioUreaPorcentaje: ratioPct,
            proveedor: estacion,
            estacion,
            notas: `Carga de Urea ARLA 32 (${ratioPct}% vs diésel)`,
          },
        });
      }

      // Ocasionalmente agregar carga de Aceite Motor en la última carga
      if (c === numLoads - 1 && vehicle.patente.endsWith('K')) {
        await prisma.fuelLog.create({
          data: {
            vehicleId: vehicle.id,
            tipoConsumible: ConsumableType.ACEITE_MOTOR,
            tipoCombustible: 'ACEITE',
            fecha: loadDate,
            litros: 5,
            precioPorLitro: 8900,
            costoTotal: 44500,
            kmActual: currentKm,
            proveedor: 'Shell Rimula R6',
            notas: 'Reposición 5L lubricante sintético motor',
          },
        });
      }
    }

    // Actualizar odómetro final del vehículo
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { kilometraje: currentKm },
    });
  }

  console.log('✅ Base de datos actualizada exitosamente con los 9 camiones Scania G460 6x2 y cargas reales.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
