import { PrismaClient, VehicleType, VehicleStatus, TireType, TireStatus, AlertCategory, AlertSeverity, TripStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runStressSeed() {
  console.log('🚀 Iniciando Carga Masiva de Estrés & Auditoría de Datos E2E (Fases 1 a 6)...');

  // 1. Clientes
  console.log('📦 1. Creando Clientes y Contratos corporativos...');
  const clientsData = [
    { razonSocial: 'YPF S.A. - CUIT 30-54668997-9', cuit: '30-54668997-9', email: 'logistica@ypf.com', telefono: '011-4329-2000', domicilio: 'Macacha Güemes 515', ciudad: 'CABA', provincia: 'Buenos Aires' },
    { razonSocial: 'Pampa Energía S.A.', cuit: '30-70960533-9', email: 'transporte@pampaenergia.com', telefono: '011-4809-9500', domicilio: 'Maipú 1', ciudad: 'Neuquén', provincia: 'Neuquén' },
    { razonSocial: 'TGS - Transportadora de Gas del Sur', cuit: '30-65786432-1', email: 'despacho@tgs.com.ar', telefono: '011-4865-1200', domicilio: 'Don Bosco 367', ciudad: 'Bahía Blanca', provincia: 'Buenos Aires' },
    { razonSocial: 'Minera Alumbrera Catamarca', cuit: '30-68954231-5', email: 'operaciones@alumbrera.com', telefono: '0383-443-1200', domicilio: 'Ruta 40 Km 12', ciudad: 'Belén', provincia: 'Catamarca' },
  ];

  const clients = [];
  for (const c of clientsData) {
    const created = await prisma.client.upsert({
      where: { cuit: c.cuit },
      update: c,
      create: c,
    });
    clients.push(created);
  }

  // 2. Vehículos (Flota de 35 unidades)
  console.log('🚛 2. Cargando Flota de 35 Vehículos (Tractores, Semis, Chasis)...');
  const marcas = ['Scania', 'Volvo', 'Mercedes-Benz', 'Iveco', 'Randon', 'Helvetia'];
  const modelosTractor = ['R450 6x2', 'FH 540 6x4', 'Actros 2651', 'Stralis Hi-Way'];
  const modelosSemi = ['Tanque Combustible 37,000L', 'Sider 28 Pallets', 'Tolva Cerealera'];

  const vehicles = [];
  for (let i = 1; i <= 35; i++) {
    const isTractor = i <= 20;
    const patente = isTractor ? `AA${100 + i}XY` : `AB${200 + i}ZZ`;
    const vType = isTractor ? VehicleType.CAMION : VehicleType.SEMIRREMOLQUE;
    const marca = isTractor ? marcas[i % 4] : marcas[4 + (i % 2)];
    const modelo = isTractor ? modelosTractor[i % 4] : modelosSemi[i % 3];

    const vencimientoITV = i % 5 === 0 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : new Date(Date.now() + (10 + i) * 24 * 60 * 60 * 1000);
    const vencimientoSeguro = i % 7 === 0 ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : new Date(Date.now() + (15 + i) * 24 * 60 * 60 * 1000);

    const v = await prisma.vehicle.upsert({
      where: { patente },
      update: {
        kilometraje: 45000 + i * 8500,
        vencimientoITV,
        vencimientoSeguro,
        status: i % 6 === 0 ? VehicleStatus.EN_MANTENIMIENTO : VehicleStatus.DISPONIBLE,
      },
      create: {
        patente,
        marca,
        modelo,
        anio: 2021 + (i % 4),
        tipo: vType,
        kilometraje: 45000 + i * 8500,
        horasMotor: 1500 + i * 200,
        capacidadKg: isTractor ? 45000 : 35000,
        status: i % 6 === 0 ? VehicleStatus.EN_MANTENIMIENTO : VehicleStatus.DISPONIBLE,
        vencimientoITV,
        vencimientoSeguro,
        vencimientoRUTA: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      },
    });
    vehicles.push(v);
  }

  // 3. Conductores (25 Choferes y Jornadas Driver Schedule)
  console.log('👨‍✈️ 3. Cargando 25 Conductores y Configuración de Jornadas (Fase 1)...');
  const modalidades = ['21x7', '14x7', '28x14'];
  const drivers = [];

  for (let i = 1; i <= 25; i++) {
    const dni = `33${400000 + i}`;
    const mod = modalidades[i % 3];
    const diasTrabajo = parseInt(mod.split('x')[0]);
    const diasDescanso = parseInt(mod.split('x')[1]);

    let fechaInicioTurno = new Date(Date.now() - (i * 2) * 24 * 60 * 60 * 1000);
    let fechaInicioDescanso: Date | null = null;
    let fechaRegreso: Date | null = null;

    if (i % 4 === 0) {
      fechaInicioTurno = new Date(Date.now() - (diasTrabajo + 5) * 24 * 60 * 60 * 1000);
    } else if (i % 5 === 0) {
      fechaInicioDescanso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      fechaRegreso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    }

    const d = await prisma.driver.upsert({
      where: { dni },
      update: {
        modalidadLaboral: mod,
        diasTrabajo,
        diasDescanso,
        fechaInicioTurno,
        fechaInicioDescanso,
        fechaRegreso,
      },
      create: {
        dni,
        firstName: `Conductor_${i}`,
        lastName: `Pérez_${i}`,
        telefono: `011-15-5555-${1000 + i}`,
        licenciaNumero: `LIC-99${i}`,
        licenciaVencimiento: i % 6 === 0 ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        examenMedicoVencimiento: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        modalidadLaboral: mod,
        diasTrabajo,
        diasDescanso,
        fechaInicioTurno,
        fechaInicioDescanso,
        fechaRegreso,
      },
    });
    drivers.push(d);
  }

  // 4. Neumáticos (Fase 2: 50 Neumáticos como Activos Individuales)
  console.log('🛞 4. Cargando 50 Neumáticos (CPK, Recapados, Desgaste Crítico)...');
  const marcasNeumatico = ['Michelin', 'Bridgestone', 'Goodyear', 'Pirelli', 'Fate'];

  for (let i = 1; i <= 50; i++) {
    const codigoInterno = `T-STR-${1000 + i}`;
    const esCritico = i % 7 === 0;
    const profundidadActualMm = esCritico ? 2.4 : 14.0 - (i % 8);
    const kilometrosRecorridos = 12000 + i * 2500;
    const precioCompra = 450000 + (i % 3) * 50000;
    const cantidadRecapados = i % 3;
    const assignedVehicleId = esCritico ? vehicles[i % vehicles.length].id : null;

    const tire = await prisma.tire.upsert({
      where: { codigoInterno },
      update: {
        profundidadActualMm,
        kilometrosRecorridos,
        cantidadRecapados,
      },
      create: {
        codigoInterno,
        codigoQR: codigoInterno,
        fechaCompra: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        marca: marcasNeumatico[i % 5],
        modelo: 'X Multi Z',
        medida: '295/80 R22.5',
        tipo: TireType.DIRECCIONAL,
        numeroSerie: `SN-998877-${i}`,
        precioCompra,
        kilometrosRecorridos,
        profundidadInicialMm: 16.0,
        profundidadActualMm,
        cantidadRecapados,
        status: esCritico ? TireStatus.INSTALADO : TireStatus.EN_DEPOSITO,
        ...(assignedVehicleId ? { vehicle: { connect: { id: assignedVehicleId } } } : {}),
        posicion: esCritico ? 'E1_IZQ' : null,
      },
    });

    if (cantidadRecapados > 0) {
      await prisma.tireRetread.create({
        data: {
          tireId: tire.id,
          empresaRecapadora: 'Bandag Argentina S.A.',
          numeroRecapado: 1,
          fechaEnvio: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          fechaRecepcion: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          costo: 180000,
          profundidadNuevaMm: 14.5,
          observaciones: 'Recapado proceso frío Bandag BDR-HG',
        },
      });
    }
  }

  // 5. Repuestos e Inventario
  console.log('📦 5. Cargando Stock de Repuestos e Inventario...');
  const repuestosData = [
    { sku: 'FIL-ACE-01', nombre: 'Filtro de Aceite Scania R450', categoria: 'FILTROS', stockActual: 12, stockMinimo: 5, precioUnitario: 28000 },
    { sku: 'FIL-GAS-02', nombre: 'Filtro Combustible Volvo FH', categoria: 'FILTROS', stockActual: 2, stockMinimo: 4, precioUnitario: 34000 },
    { sku: 'PAT-FRE-03', nombre: 'Pastillas de Freno Mercedes Actros', categoria: 'FRENOS', stockActual: 1, stockMinimo: 3, precioUnitario: 95000 },
    { sku: 'ACE-MOT-15W40', nombre: 'Aceite Motor 15W40 Tambor 208L', categoria: 'LUBRICANTES', stockActual: 5, stockMinimo: 2, precioUnitario: 450000 },
  ];

  for (const r of repuestosData) {
    await prisma.sparePart.upsert({
      where: { sku: r.sku },
      update: r,
      create: r,
    });
  }

  // 6. Viajes Operativos (80 Viajes en varios estados)
  console.log('🗺️ 6. Cargando 80 Viajes y Costos de Operación...');
  for (let i = 1; i <= 80; i++) {
    const numero = `VIAJE-STR-${2000 + i}`;
    const v = vehicles[i % vehicles.length];
    const d = drivers[i % drivers.length];
    const c = clients[i % clients.length];

    const tarifaAcordada = 850000 + (i % 5) * 120000;
    const distanciaKm = 350 + i * 15;
    const fechaSalidaProgramada = new Date(Date.now() - (i % 25) * 24 * 60 * 60 * 1000);

    const trip = await prisma.trip.upsert({
      where: { numero },
      update: { tarifaAcordada, distanciaKm },
      create: {
        numero,
        clientId: c.id,
        vehicleId: v.id,
        driverId: d.id,
        origen: 'Buenos Aires (Base Central)',
        destino: i % 2 === 0 ? 'Añelo, Neuquén (Vaca Muerta)' : 'Rosario, Santa Fe',
        fechaSalidaProgramada,
        fechaLlegadaEstimada: new Date(fechaSalidaProgramada.getTime() + 24 * 60 * 60 * 1000),
        distanciaKm,
        tarifaAcordada,
        pesoCarga: 28000,
        tipoCarga: 'COMB_LIQUIDO',
        status: i % 4 === 0 ? TripStatus.FINALIZADO : i % 5 === 0 ? TripStatus.DEMORADO : TripStatus.EN_CURSO,
      },
    });

    await prisma.tripCost.create({
      data: {
        tripId: trip.id,
        categoria: 'PEAJES',
        descripcion: 'Peajes autopista nacional',
        monto: 25000,
      },
    });
  }

  // 7. Cargas de Combustible (FuelLogs)
  console.log('⛽ 7. Cargando Registros de Combustible Diésel & Urea...');
  for (let i = 1; i <= 40; i++) {
    const v = vehicles[i % vehicles.length];
    await prisma.fuelLog.create({
      data: {
        vehicleId: v.id,
        fecha: new Date(Date.now() - (i % 20) * 24 * 60 * 60 * 1000),
        litros: 350 + (i % 5) * 20,
        precioPorLitro: 1150,
        costoTotal: (350 + (i % 5) * 20) * 1150,
        kmActual: v.kilometraje - (i * 100),
        estacion: 'YPF Directo Vaca Muerta',
        tipoCombustible: 'DIESEL',
        rendimientoKmL: 3.15 + (i % 3) * 0.1,
      },
    });
  }

  // 8. Facturas (Billing)
  console.log('💰 8. Cargando Facturación y Certificaciones...');
  for (let i = 1; i <= 15; i++) {
    const numero = `FACT-A-0001-000${100 + i}`;
    const isOverdue = i % 4 === 0;
    const fechaVencimiento = isOverdue ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    await prisma.invoice.upsert({
      where: { numero },
      update: { fechaVencimiento },
      create: {
        numero,
        clientId: clients[i % clients.length].id,
        status: isOverdue ? ('EMITIDA' as any) : ('PAGADA' as any),
        fechaEmision: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        fechaVencimiento,
        subtotal: 1500000,
        iva: 315000,
        total: 1815000,
      },
    });
  }

  console.log('✅ Carga masiva de datos completada exitosamente.');
}

runStressSeed()
  .catch((e) => {
    console.error('❌ Error en script de estrés:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
