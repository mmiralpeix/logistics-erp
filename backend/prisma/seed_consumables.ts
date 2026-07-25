import { PrismaClient, ConsumableType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vehicles = await prisma.vehicle.findMany({ take: 5 });
  if (vehicles.length === 0) {
    console.log('No vehicles found to associate consumables.');
    return;
  }

  const v1 = vehicles[0];
  const v2 = vehicles[1] || vehicles[0];

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  // 1. Cargas de Diésel para v1
  await prisma.fuelLog.create({
    data: {
      vehicleId: v1.id,
      tipoConsumible: ConsumableType.DIESEL,
      tipoCombustible: 'DIESEL',
      fecha: daysAgo(5),
      litros: 320,
      precioPorLitro: 1150,
      costoTotal: 368000,
      kmActual: 125400,
      rendimientoKmL: 2.45,
      proveedor: 'YPF Ruta',
      estacion: 'YPF Rosario Centro',
      notas: 'Carga completa tanque principal',
    },
  });

  // 2. Carga de Urea para v1 (Ratio ~ 4.6% respecto a los 320L de diésel)
  await prisma.fuelLog.create({
    data: {
      vehicleId: v1.id,
      tipoConsumible: ConsumableType.UREA,
      tipoCombustible: 'UREA',
      fecha: daysAgo(5),
      litros: 15,
      precioPorLitro: 1450,
      costoTotal: 21750,
      kmActual: 125400,
      ratioUreaPorcentaje: 4.68,
      proveedor: 'YPF Ruta',
      estacion: 'YPF Rosario Centro',
      notas: 'Carga de Urea ARLA 32 en bidón 15L',
    },
  });

  // 3. Carga de Aceite de Motor para v1
  await prisma.fuelLog.create({
    data: {
      vehicleId: v1.id,
      tipoConsumible: ConsumableType.ACEITE_MOTOR,
      tipoCombustible: 'ACEITE',
      fecha: daysAgo(3),
      litros: 4,
      precioPorLitro: 8500,
      costoTotal: 34000,
      kmActual: 125800,
      proveedor: 'Shell Rimula',
      notas: 'Reposición aceite sintético 15W40',
    },
  });

  // 4. Carga de Diésel para v2
  await prisma.fuelLog.create({
    data: {
      vehicleId: v2.id,
      tipoConsumible: ConsumableType.DIESEL,
      tipoCombustible: 'DIESEL',
      fecha: daysAgo(2),
      litros: 280,
      precioPorLitro: 1180,
      costoTotal: 330400,
      kmActual: 88500,
      rendimientoKmL: 2.6,
      proveedor: 'Axion Energy',
      notas: 'Carga de ruta',
    },
  });

  // 5. Carga de Urea para v2
  await prisma.fuelLog.create({
    data: {
      vehicleId: v2.id,
      tipoConsumible: ConsumableType.UREA,
      tipoCombustible: 'UREA',
      fecha: daysAgo(2),
      litros: 12,
      precioPorLitro: 1400,
      costoTotal: 16800,
      kmActual: 88500,
      ratioUreaPorcentaje: 4.28,
      proveedor: 'Axion Energy',
      notas: 'Carga ARLA 32',
    },
  });

  console.log('Seed de consumibles ejecutado correctamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
