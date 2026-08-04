import { PrismaClient, UserRole, VehicleType, VehicleStatus, TripStatus, MaintenanceType, MaintenanceStatus, DocumentType, InvoiceStatus, InvoiceType, DangerousGoodsClass, TireType, TireStatus, CertificationStatus, AlertCategory, AlertSeverity, ConsumableType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function runMasterSeed(prisma: PrismaClient) {
  console.log('🌱 [MasterSeed] Iniciando generación masiva de 50+ registros por entidad con casos de borde...');

  const future = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d;
  };
  const past = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d;
  };
  const now = new Date();
  const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
  const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

  // 1. USUARIOS (50+ Registros)
  const defaultPass = await bcrypt.hash('Admin123!', 10);
  const roles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.DISPATCHER, UserRole.DRIVER, UserRole.ACCOUNTANT, UserRole.VIEWER];
  
  const coreEmails = ['admin@logistics.com', 'ops@logistics.com', 'despacho@logistics.com', 'chofer@logistics.com', 'contaduria@logistics.com'];
  for (const email of coreEmails) {
    const role = email.includes('admin') ? UserRole.SUPER_ADMIN : email.includes('ops') ? UserRole.OPERATIONS_MANAGER : email.includes('despacho') ? UserRole.DISPATCHER : email.includes('chofer') ? UserRole.DRIVER : UserRole.ACCOUNTANT;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: defaultPass, firstName: 'Usuario', lastName: email.split('@')[0].toUpperCase(), role, phone: '011-4567-8901', isActive: true },
    });
  }

  const specialChars = ['ñ', 'á', 'é', 'í', 'ó', 'ú', 'Ü', '🚛', '🚚', '⚙️', '⚠️'];
  for (let i = 6; i <= 55; i++) {
    const email = `usuario_${i}@logistics-erp.com`;
    const role = roles[i % roles.length];
    const char = specialChars[i % specialChars.length];
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: defaultPass,
        firstName: `Nombre_${i}_${char}`,
        lastName: `Apellido_${i}_Excesivamente_Largo_${char}`,
        role,
        phone: `011-${1000 + i}-${5000 + i}`,
        isActive: i % 10 !== 0,
      },
    });
  }
  console.log('✅ 50+ Usuarios creados');

  // 2. CLIENTES & CONTACTOS (50+ Registros)
  const clientCategories = ['PREMIUM', 'STANDARD', 'VIP', 'INICIAL', 'RIESGO_ALTO'];
  const ivaconditions = ['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO'];
  for (let i = 1; i <= 52; i++) {
    const cuit = `30-${70000000 + i}-${i % 9}`;
    const char = specialChars[i % specialChars.length];
    const cat = clientCategories[i % clientCategories.length];
    const client = await prisma.client.upsert({
      where: { cuit },
      update: {},
      create: {
        razonSocial: `Cliente Corporativo Minero ${i} S.A. ${char} - Operación Patagónica & Puna`,
        cuit,
        domicilio: `Av. San Martín ${1000 + i * 15} ${i % 2 === 0 ? 'Piso 4 Dpto B' : ''}`,
        ciudad: i % 3 === 0 ? 'Comodoro Rivadavia' : i % 3 === 1 ? 'Neuquén' : 'Salta',
        provincia: i % 3 === 0 ? 'Chubut' : i % 3 === 1 ? 'Neuquén' : 'Salta',
        codigoPostal: `${9000 + i}`,
        telefono: `0297-${400 + i}-${5000 + i}`,
        email: `contacto_cliente_${i}@empresa${i}.com.ar`,
        contactoPrincipal: `Ing. Nombre ${i} ${char}`,
        condicionIVA: ivaconditions[i % ivaconditions.length],
        categoriaCliente: cat,
        limiteCredito: 500000 + i * 100000,
        diasCredito: i % 2 === 0 ? 30 : 60,
        saldoActual: i % 5 === 0 ? 150000 * i : 0,
        bloqueadoPorRiesgo: i % 12 === 0,
        scoring: i % 4 === 0 ? 'A' : i % 4 === 1 ? 'B' : i % 4 === 2 ? 'C' : 'D',
        notas: `Notas de cliente ${i} con caracteres especiales: ${char} y límite de prueba $${500000 + i * 100000}`,
      },
    });

    // Contacto primario
    await prisma.clientContact.create({
      data: {
        clientId: client.id,
        nombre: `Contacto Principal ${i} ${char}`,
        cargo: i % 2 === 0 ? 'Jefe de Logística' : 'Gerente de Operaciones',
        telefono: `0297-15-${4000 + i}`,
        email: `contacto${i}@empresa${i}.com.ar`,
        isPrimary: true,
      },
    });

    // Tarifa por cliente
    await prisma.clientRate.create({
      data: {
        clientId: client.id,
        origen: 'Comodoro Rivadavia',
        destino: i % 2 === 0 ? 'Añelo' : 'Cerro Negro',
        tipoCarga: 'Carga General / Minería',
        tarifaBase: 150000 + i * 5000,
        costoPorTnExcedente: 12000,
        horasEsperaLibres: 2,
      },
    });
  }
  console.log('✅ 50+ Clientes, Contactos y Tarifarios creados');

  // 3. CONTRATOS (50+ Registros)
  const allClients = await prisma.client.findMany({ take: 52 });
  for (let i = 1; i <= 50; i++) {
    const numero = `OC-LMA-2026-${String(i).padStart(3, '0')}`;
    const client = allClients[(i - 1) % allClients.length];
    await prisma.contract.upsert({
      where: { numero },
      update: {},
      create: {
        numero,
        clientId: client.id,
        descripcion: `Contrato marco de transporte ${i} - ${client.razonSocial}`,
        cantidadViajes: 20 + i * 2,
        pesoMinimoKg: 30000,
        tarifaBase: 250000 + i * 10000,
        tarifaExcedentePorTn: 14000,
        fechaInicio: past(i % 12),
        fechaFin: future(i % 12 + 1),
        status: i % 5 === 0 ? 'FINALIZADO' : 'ACTIVA',
        condiciones: `Mínimo garantizado 30 Tn por viaje. Cláusula de ajuste por índice de combustible diésel.`,
      },
    });
  }
  console.log('✅ 50+ Contratos creados');

  // 4. VEHÍCULOS (50+ Registros)
  const vehicleTypes = [VehicleType.CAMION, VehicleType.TRACTOR, VehicleType.SEMIRREMOLQUE, VehicleType.SEMI_CISTERNA, VehicleType.CARRETON, VehicleType.BATEA, VehicleType.BITREN, VehicleType.CAMIONETA, VehicleType.EQUIPO_ESPECIAL, VehicleType.CISTERNA];
  const vehicleStatuses = [VehicleStatus.DISPONIBLE, VehicleStatus.EN_VIAJE, VehicleStatus.EN_MANTENIMIENTO, VehicleStatus.FUERA_DE_SERVICIO, VehicleStatus.RESERVADO];
  const marcas = ['Scania', 'Mercedes-Benz', 'Volvo', 'Iveco', 'Ford', 'Vulcano', 'Cormetal', 'Randon', 'Liebherr'];

  for (let i = 1; i <= 55; i++) {
    const letters = String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 1) % 26));
    const patente = `${letters} ${String(100 + i).padStart(3, '0')} ${String.fromCharCode(65 + ((i + 2) % 26))}${String.fromCharCode(65 + ((i + 3) % 26))}`;
    const tipo = vehicleTypes[i % vehicleTypes.length];
    const status = vehicleStatuses[i % vehicleStatuses.length];
    const marca = marcas[i % marcas.length];
    const char = specialChars[i % specialChars.length];

    const v = await prisma.vehicle.upsert({
      where: { patente },
      update: {},
      create: {
        patente,
        marca,
        modelo: `${marca} Series ${i * 100}`,
        anio: 2018 + (i % 7),
        tipo,
        capacidadKg: 35000 + (i % 5) * 5000,
        capacidadM3: 40 + (i % 5) * 10,
        tipoCarga: i % 2 === 0 ? 'General / Minería' : 'Cargas Peligrosas / Hidrocarburos',
        status,
        color: i % 2 === 0 ? 'Blanco' : 'Azul',
        numeroChasis: `YS2R6X2000${500000 + i}`,
        numeroMotor: `DC13${100 + i}`,
        kilometraje: 45000 + i * 8500,
        vencimientoSeguro: i % 6 === 0 ? past(1) : future(i % 12 + 1), // Algunos vencidos para alertas
        vencimientoITV: i % 5 === 0 ? past(1) : future(i % 10 + 1),
        vencimientoRUTA: future(11),
        numeroSeguro: `POL-2026-${1000 + i}`,
        aseguradora: i % 2 === 0 ? 'La Segunda' : 'Sancor Seguros',
        propietario: 'PROPIA',
        isThirdParty: false,
        empresa: 'Transportes del Sur S.A.',
        notas: `Vehículo ${i} con equipamiento GPS Teltonika ${char}`,
      },
    });

    // Dispositivo GPS para cada vehículo
    if (i <= 50) {
      await prisma.gPSDevice.upsert({
        where: { deviceId: `TELTONIKA-${String(i).padStart(3, '0')}-${patente.replace(/\s+/g, '')}` },
        update: {},
        create: {
          vehicleId: v.id,
          deviceId: `TELTONIKA-${String(i).padStart(3, '0')}-${patente.replace(/\s+/g, '')}`,
          proveedor: i % 2 === 0 ? 'Teltonika' : 'Garmin',
          modelo: 'FMB920',
          imei: `35689012345${1000 + i}`,
          isActive: true,
          lastLat: -45.8645 + (i % 10) * 0.05,
          lastLon: -67.4915 + (i % 10) * 0.05,
          lastUpdate: new Date(),
          lastSpeed: i % 2 === 0 ? 82.5 : 0,
        },
      });
    }
  }
  console.log('✅ 55+ Vehículos y 50 Dispositivos GPS creados');

  // 5. CONDUCTORES (50+ Registros)
  for (let i = 1; i <= 52; i++) {
    const dni = `${25000000 + i * 23456}`;
    const char = specialChars[i % specialChars.length];

    // Distribuir estados de jornada realistas: EN_RUTA, PROXIMO_A_DESCANSO, DESCANSANDO, EXCEDIDO, SIN_TURNO
    const bucket = i % 5;
    let fechaInicioTurno: Date | null = null;
    let fechaInicioDescanso: Date | null = null;
    if (bucket === 1) fechaInicioTurno = addDays(now, -(3 + (i % 15))); // EN_RUTA
    else if (bucket === 2) fechaInicioTurno = addDays(now, -(19 + (i % 2))); // PROXIMO_A_DESCANSO
    else if (bucket === 3) fechaInicioDescanso = addDays(now, -(1 + (i % 6))); // DESCANSANDO
    else if (bucket === 4) fechaInicioTurno = addDays(now, -(22 + (i % 5))); // EXCEDIDO
    // bucket === 0 => SIN_TURNO (ambos null)

    const driver = await prisma.driver.upsert({
      where: { dni },
      update: {},
      create: {
        dni,
        firstName: `NombreConductor_${i}_${char}`,
        lastName: `ApellidoConductor_${i}`,
        telefono: `011-15-${2000 + i}-${7000 + i}`,
        email: `chofer${i}@logistics.com`,
        domicilio: `Calle Conductor ${i * 10}`,
        ciudad: i % 2 === 0 ? 'Comodoro Rivadavia' : 'Trelew',
        provincia: 'Chubut',
        cuil: `20-${dni}-${i % 9}`,
        cbu: `123456789012345678${String(i).padStart(4, '0')}`,
        fechaNacimiento: new Date(`198${i % 10}-05-15`),
        fechaIngreso: new Date('2018-03-01'),
        licenciaTipo: i % 2 === 0 ? 'E' : 'D',
        licenciaNumero: `CHU-${dni}`,
        licenciaVencimiento: i % 7 === 0 ? past(1) : future(i % 12 + 2),
        habilitadoCargasPeligrosas: i % 2 === 0,
        certificadoCargasPeligrosas: i % 2 === 0 ? future(10) : null,
        examenMedicoVencimiento: future(8),
        psicofisicoVencimiento: i % 4 === 0 ? past(1) : future(6),
        modalidadLaboral: '21x7',
        diasTrabajo: 21,
        diasDescanso: 7,
        fechaInicioTurno,
        fechaInicioDescanso,
        notas: `Conductor habilitado para cargas peligrosas y minería ${char}`,
      },
    });

    // Registro de turno actual, consistente con el estado en vivo del conductor
    if (fechaInicioTurno) {
      await prisma.driverShiftLog.create({
        data: {
          driverId: driver.id,
          tipoRegistro: 'INICIO_TURNO',
          fechaInicio: fechaInicioTurno,
          excedido: bucket === 4,
          notas: `Inicio de turno automatizado para chofer ${i}`,
        },
      });
    } else if (fechaInicioDescanso) {
      await prisma.driverShiftLog.create({
        data: {
          driverId: driver.id,
          tipoRegistro: 'INICIO_DESCANSO',
          fechaInicio: fechaInicioDescanso,
          diasTrabajados: 21,
          notas: `Inicio de descanso automatizado para chofer ${i}`,
        },
      });
    } else {
      await prisma.driverShiftLog.create({
        data: {
          driverId: driver.id,
          tipoRegistro: 'REGRESO',
          fechaInicio: past(1),
          fechaFin: past(1),
          diasTrabajados: 21,
          diasDescansados: 7,
          notas: `Regreso de última jornada, chofer ${i} sin turno asignado actualmente`,
        },
      });
    }

    await prisma.driverTraining.create({
      data: {
        driverId: driver.id,
        tipo: i % 2 === 0 ? 'Manejo Defensivo en Alta Montaña' : 'Inducción Minera Cerro Negro',
        fecha: past(i % 6 + 1),
        vencimiento: future(12),
        entidad: 'CESVI Argentina',
        aprobado: true,
      },
    });
  }
  console.log('✅ 52+ Conductores, Turnos 21x7 y Capacitaciones creados');

  // 6. TRANSPORTISTAS TERCEROS / CARRIERS (50+ Registros)
  for (let i = 1; i <= 50; i++) {
    const cuit = `30-${71000000 + i}-${i % 9}`;
    const carrier = await prisma.carrier.upsert({
      where: { cuit },
      update: {},
      create: {
        razonSocial: `Subcontratista Logístico ${i} S.R.L.`,
        cuit,
        telefono: `0297-${488 + i}-${1000 + i}`,
        email: `contacto@carrier${i}.com.ar`,
        contacto: `Sr. Operador ${i}`,
        domicilio: `Ruta 3 Km ${1100 + i}`,
        ciudad: 'Comodoro Rivadavia',
        provincia: 'Chubut',
        isActive: true,
        notas: `Empresa transportista homologada para operaciones de soporte`,
      },
    });

    await prisma.carrierVehicle.upsert({
      where: { patente: `TC ${100 + i} XX` },
      update: {},
      create: {
        carrierId: carrier.id,
        patente: `TC ${100 + i} XX`,
        tipo: VehicleType.CAMION,
        marca: 'Scania',
        modelo: 'R450',
      },
    });

    const driverDni = `${30000000 + i * 11111}`;
    const existingDriver = await prisma.carrierDriver.findFirst({ where: { dni: driverDni } });
    if (!existingDriver) {
      await prisma.carrierDriver.create({
        data: {
          carrierId: carrier.id,
          firstName: `ChoferTercero_${i}`,
          lastName: `Apellido_${i}`,
          dni: driverDni,
          telefono: `0297-154-${1000 + i}`,
        },
      });
    }
  }
  console.log('✅ 50+ Carriers, Vehículos de Terceros y Choferes de Terceros creados');

  // 7. VIAJES OPERATIVOS (50+ Registros)
  const allVehicles = await prisma.vehicle.findMany({ take: 50 });
  const allDrivers = await prisma.driver.findMany({ take: 50 });
  const allClientsList = await prisma.client.findMany({ take: 50 });
  const allCarriersList = await prisma.carrier.findMany({ take: 50 });
  const allCarrierVehiclesList = await prisma.carrierVehicle.findMany({ take: 50 });
  const allCarrierDriversList = await prisma.carrierDriver.findMany({ take: 50 });
  const dispatcherUser = await prisma.user.findFirst({ where: { role: UserRole.DISPATCHER } });
  const tripStatuses = [TripStatus.PENDIENTE, TripStatus.PROGRAMADO, TripStatus.EN_CURSO, TripStatus.FINALIZADO, TripStatus.CANCELADO, TripStatus.DEMORADO];

  for (let i = 1; i <= 55; i++) {
    const numero = `VJ-2026-${String(i).padStart(6, '0')}`;
    const client = allClientsList[(i - 1) % allClientsList.length];
    const status = tripStatuses[(i - 1) % tripStatuses.length];
    const isHazmat = i % 4 === 0;
    const isMining = i % 3 === 0;
    const tarifa = 220000 + i * 6000;
    const costo = 110000 + i * 3500;

    // ~1 de cada 5 viajes se asigna a un operador tercerizado (Carrier) en vez de flota propia
    const isTercerizado = allCarriersList.length > 0 && i % 5 === 0;
    const carrier = isTercerizado ? allCarriersList[(i - 1) % allCarriersList.length] : null;
    const carrierVehicle = isTercerizado ? allCarrierVehiclesList[(i - 1) % allCarrierVehiclesList.length] : null;
    const carrierDriver = isTercerizado ? allCarrierDriversList[(i - 1) % allCarrierDriversList.length] : null;
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const driver = allDrivers[(i - 1) % allDrivers.length];

    const trip = await prisma.trip.upsert({
      where: { numero },
      update: {},
      create: {
        numero,
        clientId: client.id,
        vehicleId: isTercerizado ? null : vehicle.id,
        driverId: isTercerizado ? null : driver.id,
        carrierId: carrier?.id || null,
        carrierVehicleId: carrierVehicle?.id || null,
        carrierDriverId: carrierDriver?.id || null,
        dispatcherId: dispatcherUser?.id || null,
        origen: i % 2 === 0 ? 'Comodoro Rivadavia, Chubut' : 'Plaza Huincul, Neuquén',
        destino: i % 2 === 0 ? 'Cerro Negro, Chubut' : 'Añelo, Neuquén',
        fechaSalidaProgramada: addDays(now, i - 15),
        fechaLlegadaEstimada: addDays(now, i - 14),
        fechaSalidaReal: status === TripStatus.EN_CURSO || status === TripStatus.FINALIZADO ? addDays(now, i - 15) : null,
        fechaLlegadaReal: status === TripStatus.FINALIZADO ? addDays(now, i - 14) : null,
        duracionEstimadaHoras: 12,
        distanciaKm: 420 + i * 10,
        status,
        tipoCarga: isHazmat ? 'Combustible / Hidrocarburos' : 'Materiales de Minería',
        pesoCarga: 31000 + (i % 5) * 1000,
        descripcionCarga: `Carga de prueba auditada ${i} - ${isHazmat ? 'UN1203 Clase 3' : 'Equipamiento Pesado'}`,
        numeroRemito: `R-0001-${String(10000 + i)}`,
        numeroOCCliente: `OC-CLIENTE-${2000 + i}`,
        tipoOperacion: isTercerizado ? 'TERCERIZADO' : 'PROPIA',
        esCargaPeligrosa: isHazmat,
        esMineria: isMining,
        tarifaAcordada: tarifa,
        costoTotal: costo,
        margenBruto: tarifa - costo,
        notas: `Viaje auditado ${i} con seguimiento de checkpoints GPS`,
      },
    });

    // Checkpoint
    await prisma.tripCheckpoint.create({
      data: {
        tripId: trip.id,
        nombre: 'Check-in Playa Carga',
        ubicacion: 'Comodoro Rivadavia',
        estimado: addDays(now, i - 15),
        real: addDays(now, i - 15),
        orden: 1,
      },
    });

    // Costo del viaje
    await prisma.tripCost.create({
      data: {
        tripId: trip.id,
        categoria: 'COMBUSTIBLE',
        descripcion: 'Carga de diésel YPF estación Yrigoyen',
        monto: 45000 + i * 500,
      },
    });

    // Hazmat si aplica
    if (isHazmat) {
      await prisma.dangerousGoodsDeclaration.upsert({
        where: { tripId: trip.id },
        update: {},
        create: {
          tripId: trip.id,
          numeroONU: 'UN1203',
          clase: DangerousGoodsClass.CLASE_3_LIQUIDOS_INFLAMABLES,
          nombreTecnico: 'Gasolina / Nafta Virgen',
          cantidadKg: 31000,
          grupoEmbalaje: 'II',
          puntoInflamacion: -43,
          hojaSeguridad: true,
          equipoObligatorio: true,
          permisosCompletos: true,
          cumpleNormativa: true,
        },
      });
    }
  }
  console.log('✅ 55+ Viajes Operativos, Checkpoints, Costos y Hazmat creados');

  // 7b. VIAJES GARANTIZADOS POR OPERADOR TERCERIZADO (evita fichas 360° de Carrier sin historial)
  const carrierTripStatuses = [TripStatus.FINALIZADO, TripStatus.EN_CURSO, TripStatus.PROGRAMADO];
  let carrierTripSeq = 1;
  for (const carrier of allCarriersList) {
    const cVehicle = allCarrierVehiclesList.find((v) => v.carrierId === carrier.id);
    const cDriver = allCarrierDriversList.find((d) => d.carrierId === carrier.id);
    if (!cVehicle || !cDriver) continue;

    for (let j = 0; j < 2; j++) {
      const idx = carrierTripSeq++;
      const numero = `VJ-2026-TER-${String(idx).padStart(5, '0')}`;
      const client = allClientsList[idx % allClientsList.length];
      const status = carrierTripStatuses[idx % carrierTripStatuses.length];
      const tarifa = 210000 + idx * 4500;
      const flete = Math.round(tarifa * 0.82);

      await prisma.trip.upsert({
        where: { numero },
        update: {},
        create: {
          numero,
          clientId: client.id,
          carrierId: carrier.id,
          carrierVehicleId: cVehicle.id,
          carrierDriverId: cDriver.id,
          dispatcherId: dispatcherUser?.id || null,
          origen: idx % 2 === 0 ? 'Comodoro Rivadavia, Chubut' : 'Neuquén Capital',
          destino: idx % 2 === 0 ? 'Cerro Dragón, Chubut' : 'Rincón de los Sauces, Neuquén',
          fechaSalidaProgramada: addDays(now, -(idx % 20)),
          fechaLlegadaEstimada: addDays(now, -(idx % 20) + 1),
          fechaSalidaReal: status !== TripStatus.PROGRAMADO ? addDays(now, -(idx % 20)) : null,
          fechaLlegadaReal: status === TripStatus.FINALIZADO ? addDays(now, -(idx % 20) + 1) : null,
          duracionEstimadaHoras: 14,
          distanciaKm: 380 + idx * 8,
          status,
          tipoCarga: 'Carga General / Soporte Operativo',
          pesoCarga: 28000,
          descripcionCarga: `Flete tercerizado ${idx} operado por ${carrier.razonSocial}`,
          tipoOperacion: 'TERCERIZADO',
          subcontractorName: carrier.razonSocial,
          subcontractorFee: flete,
          tarifaAcordada: tarifa,
          costoTotal: flete,
          margenBruto: tarifa - flete,
          notas: `Viaje de flete tercerizado, operador ${carrier.razonSocial}`,
        },
      });
    }
  }
  console.log(`✅ ${carrierTripSeq - 1} Viajes de Flete Tercerizado creados (2 por operador logístico)`);

  // 8. PAÑOL DE REPUESTOS & MANTENIMIENTO (50+ Registros)
  const categoriasSpare = ['FILTROS', 'FRENOS', 'VALVULAS_CISTERNA', 'NEUMATICOS', 'VARIOS'];
  for (let i = 1; i <= 52; i++) {
    const sku = `SKU-AUDIT-${String(i).padStart(3, '0')}`;
    const cat = categoriasSpare[i % categoriasSpare.length];
    const char = specialChars[i % specialChars.length];

    await prisma.sparePart.upsert({
      where: { sku },
      update: {},
      create: {
        sku,
        nombre: `Repuesto ${cat} Modelo ERP-${100 + i} ${char}`,
        categoria: cat,
        ambito: i % 2 === 0 ? 'TRACCION' : 'ARRASTRE',
        stockActual: 5 + (i % 15),
        stockMinimo: 3,
        precioUnitario: 15000 + i * 2500,
        ubicacion: `Estante ${String.fromCharCode(65 + (i % 6))}-${(i % 5) + 1}`,
        marcasCompatibles: 'Scania,Volvo,Mercedes-Benz',
        notas: `Repuesto original auditado para taller central`,
      },
    });
  }

  const allParts = await prisma.sparePart.findMany({ take: 50 });
  for (let i = 1; i <= 52; i++) {
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const part = allParts[(i - 1) % allParts.length];
    const ot = `OT-2026-${String(i).padStart(4, '0')}`;

    await prisma.maintenance.upsert({
      where: { numeroOT: ot },
      update: {},
      create: {
        vehicleId: vehicle.id,
        numeroOT: ot,
        tipo: i % 2 === 0 ? MaintenanceType.PREVENTIVO : MaintenanceType.CORRECTIVO,
        status: i % 3 === 0 ? MaintenanceStatus.PENDIENTE : i % 3 === 1 ? MaintenanceStatus.EN_CURSO : MaintenanceStatus.COMPLETADO,
        descripcion: `Mantenimiento de flota ${i} - Revisión general e instalación de repuestos`,
        fecha: past(i % 10),
        kmActual: 120000 + i * 3000,
        taller: i % 2 === 0 ? 'Scania Service CRV' : 'Taller Central ERP',
        costoManoObra: 25000 + i * 1000,
        costoRepuestos: 40000 + i * 1500,
        costoTotal: 65000 + i * 2500,
        items: {
          create: [{ sparePartId: part.id, descripcion: part.nombre, repuestoCodigo: part.sku, cantidad: 2, costoUnitario: part.precioUnitario, costoTotal: part.precioUnitario * 2 }],
        },
      },
    });
  }
  console.log('✅ 52+ Repuestos de Pañol y 52+ Mantenimientos creados');

  // 9. COMBUSTIBLE & CONSUMIBLES (70+ Registros variados: Diésel, Urea, Aceite, Lubricantes)
  const types = [ConsumableType.DIESEL, ConsumableType.UREA, ConsumableType.ACEITE_MOTOR, ConsumableType.LUBRICANTE, ConsumableType.ADITIVO, ConsumableType.OTRO];
  for (let i = 1; i <= 70; i++) {
    const vehicle = allVehicles[(i - 1) % allVehicles.length];
    const tipo = types[(i - 1) % types.length];
    const litros = tipo === ConsumableType.DIESEL ? 250 + (i % 8) * 20 : tipo === ConsumableType.UREA ? 20 + (i % 5) * 5 : 8 + (i % 5) * 3;
    const precio = tipo === ConsumableType.DIESEL ? 1180 : tipo === ConsumableType.UREA ? 850 : 4500;

    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        fecha: addDays(now, -i),
        litros,
        precioPorLitro: precio,
        costoTotal: litros * precio,
        kmActual: 100000 + i * 1200,
        proveedor: i % 2 === 0 ? 'YPF Serviclub' : 'Shell Flotas',
        tipoConsumible: tipo,
        tipoCombustible: String(tipo),
        rendimientoKmL: tipo === ConsumableType.DIESEL ? (i % 7 === 0 ? 0.92 : 1.35) : null,
        ratioUreaPorcentaje: tipo === ConsumableType.UREA ? (i % 6 === 0 ? 9.5 : 4.2) : null,
        esDesvio: i % 7 === 0,
        notas: i % 7 === 0 ? `Alerta de consumo de ${tipo} fuera del rango estandar` : `Carga regular de ${tipo}`,
      },
    });
  }
  console.log('✅ 70+ Registros de Carga de Consumibles (Diésel, Urea, Aceite, Lubricantes) creados');

  // 10. NEUMÁTICOS, MOVIMIENTOS & RECAPES (50+ Registros)
  for (let i = 1; i <= 50; i++) {
    const codigoInterno = `NEU-AUDIT-${String(i).padStart(4, '0')}`;
    const vehicle = allVehicles[(i - 1) % allVehicles.length];

    const tire = await prisma.tire.upsert({
      where: { codigoInterno },
      update: {},
      create: {
        codigoInterno,
        codigoQR: `QR-${codigoInterno}`,
        numeroSerie: `SN-MICH-${9000 + i}`,
        marca: i % 3 === 0 ? 'Michelin' : i % 3 === 1 ? 'Bridgestone' : 'Goodyear',
        modelo: 'X Multi Z 295/80',
        medida: '295/80 R22.5',
        tipo: i % 2 === 0 ? TireType.DIRECCIONAL : TireType.TRACCION,
        status: i % 4 === 0 ? TireStatus.EN_DEPOSITO : i % 4 === 1 ? TireStatus.EN_RECAPADO : TireStatus.INSTALADO,
        fechaCompra: past(i % 12 + 1),
        precioCompra: 380000 + i * 2000,
        profundidadInicialMm: 16.0,
        profundidadActualMm: i % 4 === 1 ? 3.5 : 12.0,
        presionRecomendadaPsi: 110,
        presionActualPsi: 108,
        kilometrosRecorridos: i * 2500,
        vehicleId: i % 4 === 0 ? null : vehicle.id,
        posicion: i % 4 === 0 ? null : '1-DIRECCIONAL-IZQ',
      },
    });

    await prisma.tireMovement.create({
      data: {
        tireId: tire.id,
        vehicleId: vehicle.id,
        tipoMovimiento: 'MONTAJE',
        posicionDestino: '1-DIRECCIONAL-IZQ',
        kilometrajeVehiculo: 100000,
        profundidadMm: 16.0,
        presionPsi: 110,
        motivo: 'Instalación neumático en flota',
        costo: 4000,
      },
    });

    await prisma.tireInspection.create({
      data: {
        tireId: tire.id,
        vehicleId: vehicle.id,
        fecha: past(1),
        inspector: 'Técnico de Neumáticos ERP',
        profundidadMm: tire.profundidadActualMm,
        presionPsi: 108,
        estadoVisual: 'BUENO',
        resultado: 'APROBADO',
      },
    });
  }
  console.log('✅ 50+ Neumáticos, Movimientos e Inspecciones creados');

  // 11. CERTIFICACIONES Y FACTURACIÓN (50+ Registros)
  for (let i = 1; i <= 50; i++) {
    const client = allClientsList[(i - 1) % allClientsList.length];
    const cert = await prisma.certification.upsert({
      where: { clientId_numeroCertificado: { clientId: client.id, numeroCertificado: 2000 + i } },
      update: {},
      create: {
        numeroCertificado: 2000 + i,
        clientId: client.id,
        numeroOC: `OC-CERT-${3000 + i}`,
        periodo: 'Julio 2026',
        fechaEmision: addDays(now, -i),
        cantidadViajes: 10 + (i % 5),
        toneladasExcedentes: (i % 3) * 12.5,
        montoTotal: 1500000 + i * 100000,
        estado: i % 2 === 0 ? CertificationStatus.APROBADO : CertificationStatus.EN_REVISION,
        diasEnGestion: (i % 5) + 1,
        observaciones: `Certificación mensual auditada N° ${2000 + i}`,
      },
    });

    const invoiceNum = `FA-0001-${String(1000 + i).padStart(8, '0')}`;
    await prisma.invoice.upsert({
      where: { numero: invoiceNum },
      update: {},
      create: {
        numero: invoiceNum,
        clientId: client.id,
        tipo: InvoiceType.FACTURA_A,
        status: i % 2 === 0 ? InvoiceStatus.PAGADA : InvoiceStatus.EMITIDA,
        subtotal: 1000000 + i * 50000,
        iva: (1000000 + i * 50000) * 0.21,
        total: (1000000 + i * 50000) * 1.21,
        certificationId: cert.id,
        items: {
          create: [{ descripcion: `Servicio de transporte y logística certificado N° ${cert.numeroCertificado}`, cantidad: 1, precioUnit: 1000000 + i * 50000, subtotal: 1000000 + i * 50000 }],
        },
      },
    });
  }
  console.log('✅ 50+ Certificaciones de Clientes y 50+ Facturas creadas');

  // 12. ALERTAS & GEOCERCAS (50+ Registros)
  const alertCategories = [AlertCategory.DOCUMENTACION, AlertCategory.CHOFERES, AlertCategory.COMBUSTIBLE, AlertCategory.NEUMATICOS, AlertCategory.MANTENIMIENTO];
  const alertSeverities = [AlertSeverity.INFORMACION, AlertSeverity.ADVERTENCIA, AlertSeverity.CRITICA, AlertSeverity.EMERGENCIA];

  for (let i = 1; i <= 52; i++) {
    const codigo = `ALT-AUDIT-${String(i).padStart(4, '0')}`;
    const cat = alertCategories[i % alertCategories.length];
    const sev = alertSeverities[i % alertSeverities.length];

    await prisma.alertRecord.upsert({
      where: { codigo },
      update: {},
      create: {
        codigo,
        categoria: cat,
        severidad: sev,
        titulo: `Alerta Auditada ${cat} N° ${i}`,
        mensaje: `Detalle de alerta de control en módulo ${cat}. Inspección requerida.`,
        moduloOrigen: cat,
        isResolved: i % 3 === 0,
        resolvedAt: i % 3 === 0 ? addDays(now, -1) : null,
        resolvedBy: i % 3 === 0 ? 'Sistema Auditor' : null,
      },
    });
  }

  for (let i = 1; i <= 50; i++) {
    await prisma.geofence.create({
      data: {
        nombre: `Geocerca Base / Yacimiento ${i}`,
        descripcion: `Punto GPS monitoreado en zona operativa ${i}`,
        coordinates: { lat: -45.8645 + i * 0.01, lon: -67.4915 + i * 0.01 },
        radio: 500 + i * 50,
        isActive: true,
      },
    });
  }
  console.log('✅ 52+ Alertas de Sistema y 50+ Geocercas GPS creadas');

  // 13. CONFIGURACIÓN DEL SISTEMA
  await prisma.systemConfig.upsert({
    where: { key: 'empresa' },
    update: {},
    create: {
      key: 'empresa',
      label: 'Datos de la empresa',
      value: { razonSocial: 'Transportes del Sur Patagónico S.A.', cuit: '30-71234500-1', domicilio: 'Av. Hipólito Yrigoyen 1234', ciudad: 'Comodoro Rivadavia', provincia: 'Chubut', telefono: '0297-444-1234', email: 'info@transportesdelsur.com.ar', logo: null },
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'alertas_vencimiento' },
    update: {},
    create: { key: 'alertas_vencimiento', label: 'Días de anticipación para alertas', value: { documentos: 30, revisiones: 15, mantenimiento: 7 } },
  });

  // 14. DOCUMENTOS, INCIDENTES, RECAPES, REPORTES GUARDADOS/PROGRAMADOS Y PREFERENCIAS DE ALERTA
  const docCount = await prisma.document.count();
  if (docCount === 0) {
    const docTypes = Object.values(DocumentType);
    for (let i = 1; i <= 50; i++) {
      const tipo = docTypes[i % docTypes.length];
      const vehicle = allVehicles[i % allVehicles.length];
      const driver = allDrivers[i % allDrivers.length];
      await prisma.document.create({
        data: {
          tipo,
          nombre: `${tipo} - Documento ${i}`,
          descripcion: `Documento generado automáticamente, tipo ${tipo}`,
          fileName: `doc_${tipo.toLowerCase()}_${i}.pdf`,
          filePath: `uploads/seed/doc_${tipo.toLowerCase()}_${i}.pdf`,
          fileSize: 102400 + i * 512,
          mimeType: 'application/pdf',
          vehicleId: i % 2 === 0 ? vehicle.id : null,
          driverId: i % 2 !== 0 ? driver.id : null,
          fechaEmision: past(i % 12 + 1),
          fechaVencimiento: i % 6 === 0 ? past(1) : future(i % 12 + 1),
          isExpired: i % 6 === 0,
        },
      });
    }
  }

  const incidentCount = await prisma.incident.count();
  if (incidentCount === 0) {
    const incidentTypes = ['Accidente Menor', 'Retraso en Ruta', 'Falla Mecánica', 'Robo/Hurto', 'Multa de Tránsito', 'Reclamo de Cliente'];
    const allTrips = await prisma.trip.findMany({ take: 30 });
    for (let i = 1; i <= 30; i++) {
      const trip = allTrips[i % allTrips.length];
      const driver = allDrivers[i % allDrivers.length];
      await prisma.incident.create({
        data: {
          tripId: i % 4 !== 0 ? trip?.id : null,
          driverId: driver.id,
          tipo: incidentTypes[i % incidentTypes.length],
          descripcion: `Incidente ${i}: ${incidentTypes[i % incidentTypes.length]} reportado en ruta.`,
          fecha: past(i % 6),
          lugar: i % 2 === 0 ? `Ruta 3, Km ${1000 + i}` : 'Playa de Carga Central',
          costoEstimado: i % 3 === 0 ? 15000 + i * 500 : null,
          resolucion: i % 2 === 0 ? 'Resuelto sin novedades adicionales, parte policial adjunto.' : null,
        },
      });
    }
  }

  const retreadCount = await prisma.tireRetread.count();
  if (retreadCount === 0) {
    const allTires = await prisma.tire.findMany({ take: 15 });
    for (let i = 0; i < allTires.length; i++) {
      const recibido = i % 3 === 0 ? null : past(i % 3);
      await prisma.tireRetread.create({
        data: {
          tireId: allTires[i].id,
          empresaRecapadora: i % 2 === 0 ? 'Recauchutadora Patagónica S.A.' : 'Bandag Comodoro',
          numeroRecapado: (i % 3) + 1,
          fechaEnvio: past((i % 6) + 1),
          fechaRecepcion: recibido,
          costo: 85000 + i * 3000,
          profundidadNuevaMm: 16.0,
          garantiaMeses: 6,
          observaciones: `Recapado N° ${i + 1}`,
          status: recibido ? 'COMPLETADO' : 'EN_PROCESO',
        },
      });
    }
  }

  const reportSavedCount = await prisma.reportSaved.count();
  if (reportSavedCount === 0) {
    const templates = await prisma.reportTemplate.findMany();
    for (let i = 1; i <= 20; i++) {
      const template = templates[i % templates.length];
      await prisma.reportSaved.create({
        data: {
          templateId: template?.id,
          titulo: `Reporte Guardado ${i}`,
          categoria: template?.categoria || 'OPERACIONES',
          periodoFrom: past(i % 6 + 1),
          periodoTo: past(i % 3),
          filtrosJson: { clienteId: null, vehiculoTipo: null },
          resumenIA: `Resumen ejecutivo generado automáticamente para el reporte ${i}.`,
          favorito: i % 5 === 0,
          creadoPor: 'admin@logistics.com',
        },
      });
    }
  }

  const reportScheduleCount = await prisma.reportSchedule.count();
  if (reportScheduleCount === 0) {
    const frecuencias = ['DIARIO', 'SEMANAL', 'MENSUAL'];
    const formatos = ['PDF', 'EXCEL'];
    for (let i = 1; i <= 15; i++) {
      await prisma.reportSchedule.create({
        data: {
          titulo: `Envío Programado ${i}`,
          categoria: i % 2 === 0 ? 'FLOTA' : 'OPERACIONES',
          frecuencia: frecuencias[i % frecuencias.length],
          destinatarios: `reportes${i}@logistics.com,supervision@logistics.com`,
          formato: formatos[i % formatos.length],
          isActive: i % 4 !== 0,
          ultimoEnvio: past(1),
          proximoEnvio: future(1),
        },
      });
    }
  }

  const allUsersForPrefs = await prisma.user.findMany({ take: 50 });
  for (const user of allUsersForPrefs) {
    await prisma.userAlertPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        severidadMinima: AlertSeverity.ADVERTENCIA,
        emailNotify: true,
        systemNotify: true,
        categoriasMuted: [],
      },
    });
  }
  console.log('✅ Documentos, Incidentes, Recapes, Reportes Guardados/Programados y Preferencias de Alerta creados');

  console.log('🎉 [MasterSeed] ¡Generación masiva completada con éxito para las 44 entidades relacionales!');
}
