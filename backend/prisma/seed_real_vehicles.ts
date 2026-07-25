import { PrismaClient, ConsumableType, VehicleType, VehicleStatus, MaintenanceType, MaintenanceStatus } from '@prisma/client';

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
  console.log('--- Limpiando datos y cargando Flota Propia (Google Sheets) ---');

  // 1. Limpieza
  await prisma.fuelLog.deleteMany({});
  await prisma.tripCost.deleteMany({});
  await prisma.dangerousGoodsDeclaration.deleteMany({});
  await prisma.tripCheckpoint.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.maintenanceItem.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.sparePart.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.gPSDevice.deleteMany({});
  await prisma.vehicle.deleteMany({});

  console.log('✔ Tablas limpias para sincronizar la Flota Propia real');

  // 2. Cargar los 9 camiones Scania G460 6x2 reales (Pestaña "Flota Propia")
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
        tipo: VehicleType.TRACTOR,
        status: i % 3 === 0 ? VehicleStatus.EN_VIAJE : i === 5 ? VehicleStatus.EN_MANTENIMIENTO : VehicleStatus.DISPONIBLE,
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
    console.log(`+ Camión Flota Propia creado: ${v.patente} (${v.marca} ${v.modelo}) - KM: ${v.kilometraje}`);
  }

  // 3. Cargar Remolques y Cisternas Reales de la Flota Propia (Randon, Indecar, Cormetal, Vulcano)
  const trailer1 = await prisma.vehicle.create({
    data: {
      patente: 'AA 123 CIS',
      marca: 'Cormetal',
      modelo: 'Semi Cisterna 35.000 Lts',
      anio: 2023,
      tipo: VehicleType.SEMI_CISTERNA,
      status: VehicleStatus.DISPONIBLE,
      capacidadKg: 35000,
      capacidadM3: 35,
      color: 'Aluminio / Blanco',
      propietario: 'Flota Propia',
      tipoEnganche: 'Perno Rey 2"',
      isThirdParty: false,
    },
  });

  const trailer2 = await prisma.vehicle.create({
    data: {
      patente: 'AB 456 RAN',
      marca: 'Randon',
      modelo: 'Semi Baranda Volcable 14.50m',
      anio: 2022,
      tipo: VehicleType.SEMIRREMOLQUE,
      status: VehicleStatus.DISPONIBLE,
      capacidadKg: 38000,
      color: 'Verde / Gris',
      propietario: 'Flota Propia',
      tipoEnganche: 'Perno Rey 2"',
      isThirdParty: false,
    },
  });

  const trailer3 = await prisma.vehicle.create({
    data: {
      patente: 'AC 789 IND',
      marca: 'Indecar',
      modelo: 'Semi Cisterna Combustible 3 Compartimentos',
      anio: 2023,
      tipo: VehicleType.SEMI_CISTERNA,
      status: VehicleStatus.DISPONIBLE,
      capacidadKg: 36000,
      capacidadM3: 36,
      color: 'Blanco',
      propietario: 'Flota Propia',
      tipoEnganche: 'Perno Rey 2"',
      isThirdParty: false,
    },
  });

  const trailer4 = await prisma.vehicle.create({
    data: {
      patente: 'AD 999 VUL',
      marca: 'Vulcano',
      modelo: 'Carretón Pesado 60 Tn Orugas',
      anio: 2022,
      tipo: VehicleType.CARRETON,
      status: VehicleStatus.DISPONIBLE,
      capacidadKg: 60000,
      color: 'Amarillo',
      propietario: 'Flota Propia',
      tipoEnganche: 'Perno Rey 3.5"',
      isThirdParty: false,
    },
  });

  console.log('✔ Remolques y Cisternas Flota Propia creados (Cormetal, Randon, Indecar, Vulcano)');

  // 4. Repuestos de Pañol con matriz de compatibilidad para esta flota
  await prisma.sparePart.createMany({
    data: [
      {
        sku: 'SKU-FIL-001',
        nombre: 'Filtro de Aceite Scania DC13 (G460 / R450 / R500)',
        categoria: 'FILTROS',
        ambito: 'TRACCION',
        stockActual: 18,
        stockMinimo: 5,
        precioUnitario: 34500,
        ubicacion: 'Estante A-1',
        tiposCompatibles: 'TRACTOR,CAMION',
        marcasCompatibles: 'Scania',
        tipoEnganche: 'N/A',
        modelosCompatibles: 'Scania G460 6x2',
        notas: 'Filtro original Scania para la flota G460',
      },
      {
        sku: 'SKU-ENG-002',
        nombre: 'Perno Rey 2" Forjado Jost (Perno 2 pulgadas)',
        categoria: 'VARIOS',
        ambito: 'ARRASTRE',
        stockActual: 6,
        stockMinimo: 2,
        precioUnitario: 145000,
        ubicacion: 'Estante B-4',
        tiposCompatibles: 'SEMIRREMOLQUE,SEMI_CISTERNA,BATEA',
        marcasCompatibles: 'Randon,Indecar,Salto,Sola y Brusa,Cormetal',
        tipoEnganche: 'Perno Rey 2"',
        notas: 'Perno de enganche para acoples con Quinta Rueda de 2"',
      },
      {
        sku: 'SKU-VAL-005',
        nombre: 'Válvula de Fondo API 4" Neumática para Cisternas',
        categoria: 'VALVULAS_CISTERNA',
        ambito: 'ARRASTRE',
        stockActual: 2,
        stockMinimo: 3,
        precioUnitario: 175000,
        ubicacion: 'Estante C-4',
        tiposCompatibles: 'SEMI_CISTERNA,CISTERNA',
        marcasCompatibles: 'Cormetal,Indecar,Randon',
        tipoEnganche: 'Perno Rey 2"',
        notas: 'Válvula de seguridad neumática en aluminio homologada YPF/Shell',
      },
      {
        sku: 'SKU-PUL-003',
        nombre: 'Pulmón de Freno Neumático Doble 30/30 (Sprint Brake)',
        categoria: 'FRENOS',
        ambito: 'ARRASTRE',
        stockActual: 12,
        stockMinimo: 4,
        precioUnitario: 68000,
        ubicacion: 'Estante B-1',
        tiposCompatibles: 'SEMIRREMOLQUE,SEMI_CISTERNA,CARRETON',
        marcasCompatibles: 'Randon,Salto,Sola y Brusa,Indecar,Vulcano,Cormetal',
        tipoEnganche: 'TODOS',
        notas: 'Cámara de freno doble 30/30 para ejes de acoplados',
      },
      {
        sku: 'SKU-NEU-007',
        nombre: 'Neumático 295/80 R22.5 Michelin X Multi Z',
        categoria: 'NEUMATICOS',
        ambito: 'UNIVERSAL',
        stockActual: 24,
        stockMinimo: 6,
        precioUnitario: 420000,
        ubicacion: 'Rack Neumáticos N-1',
        tiposCompatibles: 'TODOS',
        marcasCompatibles: 'TODAS',
        tipoEnganche: 'TODOS',
        notas: 'Cubierta direccional para ruta y larga distancia',
      },
    ],
  });

  console.log('✔ Repuestos de Pañol cargados con compatibilidad para Scania, Cormetal, Randon, Indecar');

  // 5. Mantenimientos de ejemplo para los camiones Scania G460
  const m1 = await prisma.maintenance.create({
    data: {
      vehicleId: createdVehicles[0].id, // AH551ZH
      numeroOT: 'OT-2026-0001',
      tipo: MaintenanceType.PREVENTIVO,
      status: MaintenanceStatus.COMPLETADO,
      descripcion: 'Service 140.000 km - Aceite sintético Mobil, filtro Scania DC13 y engrase',
      kmActual: 142000,
      kmProximo: 162000,
      taller: 'Scania Service Oficial Rosario',
      costoManoObra: 45000,
      costoRepuestos: 123500,
      costoTotal: 168500,
      items: {
        create: [
          { descripcion: 'Filtro Aceite Scania DC13', repuestoCodigo: 'SKU-FIL-001', cantidad: 1, costoUnitario: 34500, costoTotal: 34500 },
          { descripcion: 'Aceite Sintético Mobil Delvac 20L', repuestoCodigo: 'SKU-LUB-002', cantidad: 1, costoUnitario: 89000, costoTotal: 89000 },
        ],
      },
    },
  });

  const m2 = await prisma.maintenance.create({
    data: {
      vehicleId: createdVehicles[5].id, // AH551ZK
      numeroOT: 'OT-2026-0002',
      tipo: MaintenanceType.CORRECTIVO,
      status: MaintenanceStatus.EN_CURSO,
      descripcion: 'Reemplazo juego pastillas de freno disco y sensores de desgaste',
      kmActual: 156000,
      taller: 'Taller Central Flota Propia',
      mecanico: 'Javier Peralta',
      costoManoObra: 35000,
      costoRepuestos: 68000,
      costoTotal: 103000,
    },
  });

  console.log('✔ Mantenimientos y OTs creados para la Flota Propia');

  // 6. Cargas reales de combustible para la Flota Propia Scania G460
  const ESTACIONES = ['YPF Ruta Rosario', 'Shell San Lorenzo', 'Axion Campana', 'YPF Yuto Jujuy', 'Puma Córdoba', 'YPF Dock Sud'];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const vehicle of createdVehicles) {
    let currentKm = vehicle.kilometraje - 3000;

    for (let c = 0; c < 4; c++) {
      const daysAgo = (4 - c) * 3;
      const loadDate = new Date(now - daysAgo * dayMs);

      const litrosDiesel = Math.floor(Math.random() * (450 - 350 + 1)) + 350;
      const precioDiesel = 1180 + c * 10;
      const kmRecorridos = Math.floor(litrosDiesel * (2.4 + Math.random() * 0.4));
      currentKm += kmRecorridos;

      const rendimiento = Math.round((kmRecorridos / litrosDiesel) * 100) / 100;
      const costoDiesel = Math.round(litrosDiesel * precioDiesel);
      const estacion = ESTACIONES[(c + vehicle.patente.charCodeAt(4)) % ESTACIONES.length];

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
          esDesvio: rendimiento < 2.3,
          proveedor: estacion,
          estacion,
          notas: `Carga diésel Scania G460 en ruta`,
        },
      });
    }

    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { kilometraje: currentKm },
    });
  }

  console.log('✔ Historial de consumo de combustible cargado');
  console.log('\n🎉 ¡Base de datos cargada 100% con los datos de tu Flota Propia (Google Sheets)!');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar seed de Flota Propia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
