"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de base de datos...');
    // ============================
    // USUARIOS
    // ============================
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const opsPassword = await bcrypt.hash('Ops123!', 10);
    const driverPassword = await bcrypt.hash('Driver123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@logistics.com' },
        update: {},
        create: {
            email: 'admin@logistics.com',
            password: adminPassword,
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            role: client_1.UserRole.SUPER_ADMIN,
            phone: '011-4567-8901',
            isActive: true,
        },
    });
    const opsUser = await prisma.user.upsert({
        where: { email: 'ops@logistics.com' },
        update: {},
        create: {
            email: 'ops@logistics.com',
            password: opsPassword,
            firstName: 'María',
            lastName: 'González',
            role: client_1.UserRole.OPERATIONS_MANAGER,
            phone: '011-4567-8902',
            isActive: true,
        },
    });
    const dispatcher = await prisma.user.upsert({
        where: { email: 'despacho@logistics.com' },
        update: {},
        create: {
            email: 'despacho@logistics.com',
            password: opsPassword,
            firstName: 'Roberto',
            lastName: 'López',
            role: client_1.UserRole.DISPATCHER,
            phone: '011-4567-8903',
            isActive: true,
        },
    });
    await prisma.user.upsert({
        where: { email: 'chofer@logistics.com' },
        update: {},
        create: {
            email: 'chofer@logistics.com',
            password: driverPassword,
            firstName: 'Juan',
            lastName: 'Martínez',
            role: client_1.UserRole.DRIVER,
            phone: '011-4567-8904',
            isActive: true,
        },
    });
    await prisma.user.upsert({
        where: { email: 'contaduria@logistics.com' },
        update: {},
        create: {
            email: 'contaduria@logistics.com',
            password: opsPassword,
            firstName: 'Laura',
            lastName: 'Sánchez',
            role: client_1.UserRole.ACCOUNTANT,
            phone: '011-4567-8905',
            isActive: true,
        },
    });
    console.log('✅ Usuarios creados');
    // ============================
    // CLIENTES
    // ============================
    const client1 = await prisma.client.upsert({
        where: { cuit: '30-71234567-9' },
        update: {},
        create: {
            razonSocial: 'Minera Patagónica S.A.',
            cuit: '30-71234567-9',
            domicilio: 'Av. San Martín 1250',
            ciudad: 'Comodoro Rivadavia',
            provincia: 'Chubut',
            codigoPostal: '9000',
            telefono: '0297-444-5678',
            email: 'operaciones@minerapatagonica.com.ar',
            contactoPrincipal: 'Ing. Pablo Ferreyra',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'PREMIUM',
            notas: 'Cliente de minería - Opera en Cerro Negro y Yacimiento El Pato',
            contacts: {
                create: [
                    { nombre: 'Ing. Pablo Ferreyra', cargo: 'Jefe de Operaciones', telefono: '0297-444-5679', email: 'pferreyra@minerapatagonica.com.ar', isPrimary: true },
                    { nombre: 'Lic. Andrea Torres', cargo: 'Logística', telefono: '0297-444-5680', email: 'atorres@minerapatagonica.com.ar', isPrimary: false },
                ],
            },
        },
    });
    const client2 = await prisma.client.upsert({
        where: { cuit: '30-68901234-5' },
        update: {},
        create: {
            razonSocial: 'Distribuidora Del Sur S.R.L.',
            cuit: '30-68901234-5',
            domicilio: 'Ruta Nacional 3 Km 1250',
            ciudad: 'Trelew',
            provincia: 'Chubut',
            codigoPostal: '9100',
            telefono: '0280-445-6789',
            email: 'logistica@delsur.com.ar',
            contactoPrincipal: 'Sr. Miguel Ángel Ruiz',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'STANDARD',
            contacts: {
                create: [
                    { nombre: 'Sr. Miguel Ángel Ruiz', cargo: 'Gerente Comercial', telefono: '0280-445-6790', email: 'mruiz@delsur.com.ar', isPrimary: true },
                ],
            },
        },
    });
    const client3 = await prisma.client.upsert({
        where: { cuit: '30-59876543-2' },
        update: {},
        create: {
            razonSocial: 'Petroquímica Norpatagónica S.A.',
            cuit: '30-59876543-2',
            domicilio: 'Parque Industrial Lot. 45',
            ciudad: 'Plaza Huincul',
            provincia: 'Neuquén',
            codigoPostal: '8318',
            telefono: '0299-496-1234',
            email: 'transporte@petroq.com.ar',
            contactoPrincipal: 'Dra. Claudia Vega',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'PREMIUM',
            notas: 'Transporte de productos químicos y cargas peligrosas',
        },
    });
    const clientLitio = await prisma.client.upsert({
        where: { cuit: '30-71889900-3' },
        update: {},
        create: {
            razonSocial: 'Litio Minera Argentina S.A.',
            cuit: '30-71889900-3',
            domicilio: 'Ruta Provincial 70 s/n - Salar de Olaroz',
            ciudad: 'Susques',
            provincia: 'Jujuy',
            codigoPostal: '4640',
            telefono: '0388-424-9900',
            email: 'logistica@litiominera.com.ar',
            contactoPrincipal: 'Ing. Gustavo Albarracín',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'VIP',
            notas: 'Operación de Litio en Puna Jujueña/Salta. Contrato por Órdenes de Compra con 30 Tn mínimo por viaje + excedente.',
            contacts: {
                create: [
                    { nombre: 'Ing. Gustavo Albarracín', cargo: 'Gerente de Logística Minera', telefono: '0388-424-9901', email: 'galbarracin@litiominera.com.ar', isPrimary: true },
                ],
            },
        },
    });
    const clientBBC = await prisma.client.upsert({
        where: { cuit: '30-71998811-4' },
        update: {},
        create: {
            razonSocial: 'BBC Construcciones S.A.',
            cuit: '30-71998811-4',
            domicilio: 'Av. Industrial 1200',
            ciudad: 'Salta',
            provincia: 'Salta',
            codigoPostal: '4400',
            telefono: '0387-432-1100',
            email: 'compras@bbcconstrucciones.com.ar',
            contactoPrincipal: 'Ing. Esteban Moreno',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'PREMIUM',
        },
    });
    const clientNortrading = await prisma.client.upsert({
        where: { cuit: '30-68112233-5' },
        update: {},
        create: {
            razonSocial: 'Nortrading S.R.L.',
            cuit: '30-68112233-5',
            domicilio: 'Ruta 9 Km 1550',
            ciudad: 'General Güemes',
            provincia: 'Salta',
            codigoPostal: '4430',
            telefono: '0387-491-2233',
            email: 'operaciones@nortrading.com',
            contactoPrincipal: 'Lic. Martin Zalazar',
            condicionIVA: 'RESPONSABLE_INSCRIPTO',
            categoriaCliente: 'STANDARD',
        },
    });
    const contractLitio = await prisma.contract.upsert({
        where: { numero: 'OC-LMA-2024-089' },
        update: {},
        create: {
            numero: 'OC-LMA-2024-089',
            clientId: clientLitio.id,
            descripcion: 'Transporte de Carbonato de Litio y Materiales de Explotación (Salar Olaroz - Puerto Rosario)',
            cantidadViajes: 50,
            pesoMinimoKg: 30000,
            tarifaBase: 380000,
            tarifaExcedentePorTn: 14500,
            fechaInicio: new Date('2024-01-01'),
            fechaFin: new Date('2024-12-31'),
            status: 'ACTIVA',
            condiciones: 'Mínimo garantizado 30 Tn por viaje. Excedente se liquida a $14.500/Tn adicional.',
        },
    });
    console.log('✅ Clientes creados');
    // ============================
    // VEHICULOS
    // ============================
    const future = (months) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d;
    };
    const past = (months) => {
        const d = new Date();
        d.setMonth(d.getMonth() - months);
        return d;
    };
    const vehicle1 = await prisma.vehicle.upsert({
        where: { patente: 'AB 123 CD' },
        update: { status: client_1.VehicleStatus.EN_VIAJE },
        create: {
            patente: 'AB 123 CD',
            marca: 'Scania',
            modelo: 'R 450 A6x2NA',
            anio: 2021,
            tipo: client_1.VehicleType.CAMION,
            capacidadKg: 40000,
            capacidadM3: 80,
            tipoCarga: 'General / Granel',
            status: client_1.VehicleStatus.EN_VIAJE,
            color: 'Blanco',
            numeroChasis: 'YS2R6X20005392145',
            numeroMotor: 'DC1301',
            kilometraje: 145230,
            vencimientoSeguro: future(8),
            vencimientoITV: future(4),
            vencimientoRUTA: future(11),
            numeroSeguro: 'POL-2024-003456',
            aseguradora: 'La Segunda',
            propietario: 'PROPIA',
            isThirdParty: false,
            empresa: 'Transportes del Sur S.A.',
        },
    });
    const vehicle2 = await prisma.vehicle.upsert({
        where: { patente: 'EF 456 GH' },
        update: {},
        create: {
            patente: 'EF 456 GH',
            marca: 'Mercedes-Benz',
            modelo: 'Actros 2651 S 6x4',
            anio: 2020,
            tipo: client_1.VehicleType.CAMION,
            capacidadKg: 45000,
            capacidadM3: 90,
            tipoCarga: 'General / Contenedores',
            status: client_1.VehicleStatus.EN_VIAJE,
            color: 'Gris Metalizado',
            kilometraje: 287450,
            vencimientoSeguro: future(3),
            vencimientoITV: future(1),
            vencimientoRUTA: future(6),
            numeroSeguro: 'POL-2024-007821',
            aseguradora: 'Sancor Seguros',
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicle3 = await prisma.vehicle.upsert({
        where: { patente: 'IJ 789 KL' },
        update: {},
        create: {
            patente: 'IJ 789 KL',
            marca: 'Volvo',
            modelo: 'FH 540 6x4',
            anio: 2022,
            tipo: client_1.VehicleType.CAMION,
            capacidadKg: 50000,
            tipoCarga: 'Cargas Peligrosas / Minería',
            status: client_1.VehicleStatus.DISPONIBLE,
            color: 'Azul',
            kilometraje: 89320,
            vencimientoSeguro: future(10),
            vencimientoITV: future(7),
            vencimientoRUTA: future(10),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicle4 = await prisma.vehicle.upsert({
        where: { patente: 'MN 012 OP' },
        update: {},
        create: {
            patente: 'MN 012 OP',
            marca: 'Ford',
            modelo: 'F-4000',
            anio: 2019,
            tipo: client_1.VehicleType.CAMIONETA,
            capacidadKg: 3500,
            tipoCarga: 'Mensajería / Pequeñas cargas',
            status: client_1.VehicleStatus.DISPONIBLE,
            color: 'Blanco',
            kilometraje: 198750,
            vencimientoSeguro: future(5),
            vencimientoITV: past(1),
            vencimientoRUTA: future(3),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicle5 = await prisma.vehicle.upsert({
        where: { patente: 'QR 345 ST' },
        update: {},
        create: {
            patente: 'QR 345 ST',
            marca: 'Liebherr',
            modelo: 'LTM 1060-3.1',
            anio: 2018,
            tipo: client_1.VehicleType.EQUIPO_ESPECIAL,
            capacidadKg: 60000,
            tipoCarga: 'Izaje / Construcción',
            status: client_1.VehicleStatus.DISPONIBLE,
            color: 'Amarillo',
            kilometraje: 45200,
            vencimientoSeguro: future(6),
            vencimientoITV: future(2),
            vencimientoRUTA: future(9),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicle6 = await prisma.vehicle.upsert({
        where: { patente: 'UV 678 WX' },
        update: {},
        create: {
            patente: 'UV 678 WX',
            marca: 'Iveco',
            modelo: 'Stralis 570S',
            anio: 2023,
            tipo: client_1.VehicleType.CISTERNA,
            capacidadKg: 35000,
            capacidadM3: 35,
            tipoCarga: 'Líquidos / Cargas Peligrosas',
            status: client_1.VehicleStatus.EN_MANTENIMIENTO,
            color: 'Blanco / Naranja',
            kilometraje: 42100,
            vencimientoSeguro: future(11),
            vencimientoITV: future(9),
            vencimientoRUTA: future(12),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicleCarreton = await prisma.vehicle.upsert({
        where: { patente: 'AA 999 XX' },
        update: {},
        create: {
            patente: 'AA 999 XX',
            marca: 'Vulcano',
            modelo: 'Carretón Pesado 60 Tn',
            anio: 2022,
            tipo: client_1.VehicleType.CARRETON,
            capacidadKg: 60000,
            tipoCarga: 'Maquinaria Pesada / Orugas / Minería',
            status: client_1.VehicleStatus.DISPONIBLE,
            color: 'Amarillo',
            cantidadEjes: 4,
            tipoEnganche: 'Perno Rey 3.5"',
            vencimientoSeguro: future(10),
            vencimientoITV: future(6),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicleCisterna = await prisma.vehicle.upsert({
        where: { patente: 'BB 888 YY' },
        update: {},
        create: {
            patente: 'BB 888 YY',
            marca: 'Cormetal',
            modelo: 'Semi Cisterna 35.000 Lts',
            anio: 2023,
            tipo: client_1.VehicleType.SEMI_CISTERNA,
            capacidadKg: 35000,
            capacidadM3: 35,
            cantidadCompartimentos: 3,
            cantidadEjes: 3,
            tipoCarga: 'Combustible / Hidrocarburos (UN1203)',
            status: client_1.VehicleStatus.DISPONIBLE,
            color: 'Aluminio / Blanco',
            vencimientoSeguro: future(12),
            vencimientoITV: future(8),
            vencimientoEstanqueidad: future(6),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    const vehicleTractor = await prisma.vehicle.upsert({
        where: { patente: 'CC 777 ZZ' },
        update: {},
        create: {
            patente: 'CC 777 ZZ',
            marca: 'Scania',
            modelo: 'R 500 V8 6x4 Heavy Duty',
            anio: 2022,
            tipo: client_1.VehicleType.TRACTOR,
            capacidadKg: 65000,
            kilometraje: 98400,
            tipoCarga: 'Tracción Pesada / Minería',
            status: client_1.VehicleStatus.EN_VIAJE,
            color: 'Rojo',
            vencimientoSeguro: future(9),
            vencimientoITV: future(5),
            vencimientoRUTA: future(11),
            propietario: 'PROPIA',
            isThirdParty: false,
        },
    });
    console.log('✅ Vehículos y Equipos Creados');
    // ============================
    // CONDUCTORES
    // ============================
    const driver1 = await prisma.driver.upsert({
        where: { dni: '28456789' },
        update: {},
        create: {
            dni: '28456789',
            firstName: 'Héctor',
            lastName: 'Morales',
            telefono: '011-15-4567-8901',
            email: 'hmorales@logistics.com',
            domicilio: 'Calle Las Flores 456',
            ciudad: 'Comodoro Rivadavia',
            provincia: 'Chubut',
            cuil: '20-28456789-4',
            cbu: '1234567890123456789012',
            fechaNacimiento: new Date('1978-03-15'),
            fechaIngreso: new Date('2015-06-01'),
            licenciaTipo: 'E',
            licenciaNumero: 'CHU-28456789',
            licenciaVencimiento: future(18),
            habilitadoCargasPeligrosas: true,
            certificadoCargasPeligrosas: future(12),
            examenMedicoVencimiento: future(10),
            psicofisicoVencimiento: future(8),
            notas: 'Conductor senior - 15 años de experiencia en rutas patagónicas',
        },
    });
    const driver2 = await prisma.driver.upsert({
        where: { dni: '32987654' },
        update: {},
        create: {
            dni: '32987654',
            firstName: 'Eduardo',
            lastName: 'Campos',
            telefono: '011-15-3456-7890',
            email: 'ecampos@logistics.com',
            domicilio: 'Av. Los Pinos 789',
            ciudad: 'Trelew',
            provincia: 'Chubut',
            cuil: '20-32987654-7',
            fechaNacimiento: new Date('1985-07-22'),
            fechaIngreso: new Date('2018-03-01'),
            licenciaTipo: 'E',
            licenciaNumero: 'CHU-32987654',
            licenciaVencimiento: future(6),
            habilitadoCargasPeligrosas: false,
            examenMedicoVencimiento: future(4),
            psicofisicoVencimiento: past(1),
        },
    });
    const driver3 = await prisma.driver.upsert({
        where: { dni: '35123456' },
        update: {},
        create: {
            dni: '35123456',
            firstName: 'Marcelo',
            lastName: 'Ibáñez',
            telefono: '011-15-2345-6789',
            email: 'mibanez@logistics.com',
            domicilio: 'Ruta 22 Km 1289',
            ciudad: 'Neuquén',
            provincia: 'Neuquén',
            cuil: '20-35123456-9',
            fechaNacimiento: new Date('1990-11-08'),
            fechaIngreso: new Date('2020-09-15'),
            licenciaTipo: 'D',
            licenciaNumero: 'NQN-35123456',
            licenciaVencimiento: future(24),
            habilitadoCargasPeligrosas: true,
            certificadoCargasPeligrosas: future(6),
            examenMedicoVencimiento: future(11),
            psicofisicoVencimiento: future(9),
        },
    });
    const driver4 = await prisma.driver.upsert({
        where: { dni: '38765432' },
        update: {},
        create: {
            dni: '38765432',
            firstName: 'Sebastián',
            lastName: 'Ponce',
            telefono: '011-15-1234-5678',
            email: 'sponce@logistics.com',
            domicilio: 'Bv. Independencia 321',
            ciudad: 'Rawson',
            provincia: 'Chubut',
            cuil: '20-38765432-1',
            fechaNacimiento: new Date('1993-05-30'),
            fechaIngreso: new Date('2022-01-10'),
            licenciaTipo: 'D',
            licenciaNumero: 'CHU-38765432',
            licenciaVencimiento: future(30),
            habilitadoCargasPeligrosas: false,
            examenMedicoVencimiento: future(7),
            psicofisicoVencimiento: future(5),
        },
    });
    console.log('✅ Conductores creados');
    // ============================
    // VIAJES
    // ============================
    await prisma.tripCheckpoint.deleteMany({});
    await prisma.dangerousGoodsDeclaration.deleteMany({});
    await prisma.tripCost.deleteMany({});
    await prisma.trip.deleteMany({});
    const now = new Date();
    const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const trip1 = await prisma.trip.create({
        data: {
            numero: 'VJ-2024-000001',
            clientId: client1.id,
            vehicleId: vehicle1.id,
            driverId: driver1.id,
            dispatcherId: dispatcher.id,
            origen: 'Comodoro Rivadavia, Chubut',
            destino: 'Cerro Negro, Chubut',
            origenLat: -45.8645,
            origenLon: -67.4915,
            destinoLat: -45.2167,
            destinoLon: -68.1167,
            fechaSalidaProgramada: addDays(now, -2),
            fechaLlegadaEstimada: addDays(now, -1),
            fechaSalidaReal: addDays(now, -2),
            duracionEstimadaHoras: 8,
            esperaEnDestinoHoras: 4,
            descansosConductorHoras: 2,
            leadTimeTotal: 14,
            distanciaKm: 380,
            status: client_1.TripStatus.EN_CURSO,
            tipoCarga: 'Materiales de Minería',
            pesoCarga: 32000,
            descripcionCarga: 'Equipamiento pesado para yacimiento',
            numeroRemito: 'R-0001-00014892',
            numeroOCCliente: 'OC-BBC-4091',
            esMineria: true,
            tarifaAcordada: 185000,
            costoTotal: 57300,
            margenBruto: 127700,
            notas: 'Viaje prioritario - coordinar con supervisor de planta',
        },
    });
    await prisma.tripCheckpoint.createMany({
        data: [
            { tripId: trip1.id, nombre: 'Salida Playa de Carga CRV', ubicacion: 'Comodoro Rivadavia', estimado: addDays(now, -2), real: addDays(now, -2), orden: 1 },
            { tripId: trip1.id, nombre: 'Control Ruta 26 Km 145', ubicacion: 'Pampa del Castillo', estimado: addHours(addDays(now, -2), 3), orden: 2 },
            { tripId: trip1.id, nombre: 'Llegada Cerro Negro', ubicacion: 'Cerro Negro', estimado: addDays(now, -1), orden: 3 },
        ],
    });
    await prisma.tripCost.createMany({
        data: [
            { tripId: trip1.id, categoria: 'COMBUSTIBLE', descripcion: 'Diesel ruta CRV-Cerro Negro', monto: 45600 },
            { tripId: trip1.id, categoria: 'PEAJE', descripcion: 'Peajes autopista', monto: 3200 },
            { tripId: trip1.id, categoria: 'VIATICO', descripcion: 'Viático conductor', monto: 8500 },
        ],
    });
    const trip2 = await prisma.trip.create({
        data: {
            numero: 'VJ-2024-000002',
            clientId: client3.id,
            vehicleId: vehicle3.id,
            driverId: driver3.id,
            dispatcherId: dispatcher.id,
            origen: 'Plaza Huincul, Neuquén',
            destino: 'Buenos Aires, CABA',
            origenLat: -38.9333,
            origenLon: -69.2167,
            destinoLat: -34.6037,
            destinoLon: -58.3816,
            fechaSalidaProgramada: addDays(now, 1),
            fechaLlegadaEstimada: addDays(now, 3),
            duracionEstimadaHoras: 18,
            esperaEnDestinoHoras: 8,
            descansosConductorHoras: 10,
            leadTimeTotal: 36,
            distanciaKm: 1350,
            status: client_1.TripStatus.PROGRAMADO,
            tipoCarga: 'Productos Petroquímicos',
            pesoCarga: 28000,
            descripcionCarga: 'Nafta virgen - Clase 3 Líquidos Inflamables',
            esCargaPeligrosa: true,
            tarifaAcordada: 420000,
            costoTotal: 250000,
            margenBruto: 170000,
            notas: 'Carga peligrosa - requiere documentación completa',
        },
    });
    await prisma.dangerousGoodsDeclaration.create({
        data: {
            tripId: trip2.id,
            numeroONU: 'UN1203',
            clase: client_1.DangerousGoodsClass.CLASE_3_LIQUIDOS_INFLAMABLES,
            nombreTecnico: 'Gasolina (nafta)',
            cantidadKg: 28000,
            grupoEmbalaje: 'II',
            puntoInflamacion: -43,
            hojaSeguridad: true,
            equipoObligatorio: true,
            permisosCompletos: true,
            cumpleNormativa: true,
            notas: 'Transporte bajo norma Decreto 779/95 y Resolución ST 195/97',
        },
    });
    const trip3 = await prisma.trip.create({
        data: {
            numero: 'VJ-2024-000003',
            clientId: client2.id,
            vehicleId: vehicle2.id,
            driverId: driver2.id,
            dispatcherId: dispatcher.id,
            origen: 'Trelew, Chubut',
            destino: 'Puerto Madryn, Chubut',
            origenLat: -43.2489,
            origenLon: -65.3067,
            destinoLat: -42.7682,
            destinoLon: -65.0371,
            fechaSalidaProgramada: addDays(now, -5),
            fechaLlegadaEstimada: addDays(now, -5),
            fechaSalidaReal: addDays(now, -5),
            fechaLlegadaReal: addDays(now, -5),
            duracionEstimadaHoras: 1.5,
            esperaEnDestinoHoras: 1,
            leadTimeTotal: 2.5,
            distanciaKm: 67,
            status: client_1.TripStatus.FINALIZADO,
            tipoCarga: 'Mercadería General',
            pesoCarga: 18000,
            descripcionCarga: 'Electrodomésticos y materiales de construcción',
            tarifaAcordada: 65000,
            costoTotal: 38500,
            margenBruto: 26500,
        },
    });
    const trip4 = await prisma.trip.create({
        data: {
            numero: 'VJ-2024-000004',
            clientId: clientLitio.id,
            contractId: contractLitio.id,
            vehicleId: vehicleTractor.id,
            trailerId: vehicleCisterna.id,
            driverId: driver4.id,
            dispatcherId: dispatcher.id,
            origen: 'Salar de Olaroz, Jujuy',
            destino: 'Puerto Rosario, Santa Fe',
            fechaSalidaProgramada: addDays(now, -1),
            fechaLlegadaEstimada: addDays(now, 1),
            fechaSalidaReal: addDays(now, -1),
            duracionEstimadaHoras: 28,
            esperaEnDestinoHoras: 4,
            descansosConductorHoras: 16,
            leadTimeTotal: 48,
            distanciaKm: 1420,
            status: client_1.TripStatus.EN_CURSO,
            tipoCarga: 'SALMUERA',
            pesoCarga: 34500,
            pesoExcedenteKg: 4500,
            montoExcedente: 65250,
            tarifaAcordada: 445250,
            costoTotal: 220000,
            margenBruto: 225250,
            numeroRemito: 'R-0002-00045123',
            numeroOCCliente: 'OC-LMA-2024-089',
            descripcionCarga: 'Salmuera Concentrada de Litio (34,5 Tn Balanza)',
            esMineria: true,
            notas: 'Mínimo 30 Tn -> 4.5 Tn excedente liquidado a $14.500/Tn extra',
        },
    });
    const trip5 = await prisma.trip.create({
        data: {
            numero: 'VJ-2024-000005',
            clientId: clientBBC.id,
            vehicleId: vehicleTractor.id,
            trailerId: vehicleCarreton.id,
            driverId: driver2.id,
            dispatcherId: dispatcher.id,
            origen: 'Salta Capital',
            destino: 'Yacimiento Cauchari, Jujuy',
            fechaSalidaProgramada: addDays(now, -3),
            fechaLlegadaEstimada: addDays(now, -2),
            fechaSalidaReal: addDays(now, -3),
            fechaLlegadaReal: addDays(now, -2),
            duracionEstimadaHoras: 10,
            esperaEnDestinoHoras: 2,
            leadTimeTotal: 12,
            distanciaKm: 340,
            status: client_1.TripStatus.FINALIZADO,
            tipoCarga: 'CARRETON',
            pesoCarga: 48000,
            tarifaAcordada: 380000,
            costoTotal: 195000,
            margenBruto: 185000,
            numeroRemito: 'R-0001-00099120',
            numeroOCCliente: 'OC-BBC-4091',
            descripcionCarga: 'Excavadora CAT 336 en Carretón 60 Tn',
            esMineria: true,
        },
    });
    // Generar 45 viajes adicionales para QA audit y stress test (Total 50)
    const opTypes = ['PROPIA', 'TRACCION_TERCERO_SEMI_PROPIO', 'SUBCONTRATADA_TOTAL'];
    const statuses = [client_1.TripStatus.PENDIENTE, client_1.TripStatus.PROGRAMADO, client_1.TripStatus.EN_CURSO, client_1.TripStatus.FINALIZADO];
    for (let i = 6; i <= 50; i++) {
        const padded = String(i).padStart(6, '0');
        const opType = opTypes[(i - 6) % opTypes.length];
        const status = statuses[(i - 6) % statuses.length];
        const isSubcontracted = opType === 'SUBCONTRATADA_TOTAL';
        const tarifa = 200000 + i * 5000;
        const costo = 120000 + i * 3000;
        const margen = tarifa - costo;
        await prisma.trip.create({
            data: {
                numero: `VJ-2024-${padded}`,
                clientId: (i % 2 === 0) ? client1.id : client2.id,
                vehicleId: isSubcontracted ? null : vehicle1.id,
                driverId: isSubcontracted ? null : (i % 2 === 0 ? driver1.id : driver2.id),
                dispatcherId: dispatcher.id,
                origen: 'Comodoro Rivadavia, Chubut',
                destino: 'Añelo, Neuquén',
                fechaSalidaProgramada: addDays(now, i - 10),
                fechaLlegadaEstimada: addDays(now, i - 9),
                status,
                tipoOperacion: opType,
                subcontractorName: isSubcontracted ? 'Logística Express S.A.' : null,
                subcontractorFee: isSubcontracted ? 150000 : null,
                tipoCarga: 'Carga General',
                pesoCarga: 25000,
                tarifaAcordada: tarifa,
                costoTotal: costo,
                margenBruto: margen,
            },
        });
    }
    console.log('✅ Viajes creados');
    // ============================
    // MANTENIMIENTOS
    // ============================
    await prisma.maintenance.createMany({
        data: [
            {
                vehicleId: vehicle1.id,
                tipo: client_1.MaintenanceType.PREVENTIVO,
                status: client_1.MaintenanceStatus.COMPLETADO,
                descripcion: 'Service 150.000 km - Aceite, filtros y revisión general',
                fecha: past(2),
                kmActual: 140000,
                kmProximo: 165000,
                fechaProxima: future(4),
                taller: 'Scania Service Oficial CRV',
                costoManoObra: 28000,
                costoRepuestos: 45000,
                costoTotal: 73000,
            },
            {
                vehicleId: vehicle2.id,
                tipo: client_1.MaintenanceType.CORRECTIVO,
                status: client_1.MaintenanceStatus.COMPLETADO,
                descripcion: 'Reemplazo neumático trasero derecho - Pinchadura',
                fecha: past(1),
                kmActual: 285000,
                taller: 'Neumáticos del Sur',
                costoRepuestos: 42000,
                costoTotal: 42000,
            },
            {
                vehicleId: vehicle6.id,
                tipo: client_1.MaintenanceType.PREVENTIVO,
                status: client_1.MaintenanceStatus.EN_CURSO,
                descripcion: 'Revisión sistema hidráulico cisterna - Reemplazo sellos',
                fecha: new Date(),
                kmActual: 42100,
                fechaProxima: future(6),
                taller: 'Hidráulica Patagónica S.R.L.',
                costoManoObra: 15000,
                costoRepuestos: 22000,
                costoTotal: 37000,
                notas: 'Vehículo retenido en taller - estimado 3 días',
            },
            {
                vehicleId: vehicle4.id,
                tipo: client_1.MaintenanceType.PREVENTIVO,
                status: client_1.MaintenanceStatus.PENDIENTE,
                descripcion: 'Service 200.000 km programado',
                kmActual: 198750,
                kmProximo: 200000,
                fechaProxima: addDays(now, 5),
            },
        ],
    });
    console.log('✅ Mantenimientos creados');
    // ============================
    // CARGAS DE COMBUSTIBLE
    // ============================
    await prisma.fuelLog.createMany({
        data: [
            { vehicleId: vehicle1.id, tripId: trip1.id, fecha: addDays(now, -2), litros: 280, precioPorLitro: 1180, costoTotal: 330400, kmActual: 144950, proveedor: 'YPF', rendimientoKmL: 1.36 },
            { vehicleId: vehicle2.id, fecha: addDays(now, -3), litros: 320, precioPorLitro: 1180, costoTotal: 377600, kmActual: 287100, proveedor: 'Shell', rendimientoKmL: 1.28 },
            { vehicleId: vehicle3.id, fecha: addDays(now, -1), litros: 180, precioPorLitro: 1180, costoTotal: 212400, kmActual: 89200, proveedor: 'YPF', rendimientoKmL: 1.45 },
            { vehicleId: vehicle1.id, fecha: past(1), litros: 310, precioPorLitro: 1120, costoTotal: 347200, kmActual: 144200, proveedor: 'Axion', rendimientoKmL: 1.38 },
            { vehicleId: vehicle2.id, fecha: addDays(now, -7), litros: 450, precioPorLitro: 1120, costoTotal: 504000, kmActual: 286500, proveedor: 'YPF', rendimientoKmL: 0.95, esDesvio: true, notas: 'Desvío detectado - rendimiento 25% inferior al promedio' },
        ],
    });
    console.log('✅ Cargas de combustible creadas');
    // ============================
    // FACTURAS
    // ============================
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    const invoice1 = await prisma.invoice.create({
        data: {
            numero: 'FA-0001-00000001',
            clientId: client2.id,
            tipo: client_1.InvoiceType.FACTURA_A,
            status: client_1.InvoiceStatus.PAGADA,
            fechaEmision: addDays(now, -5),
            fechaVencimiento: addDays(now, 25),
            subtotal: 53719,
            iva: 11281,
            total: 65000,
            items: {
                create: [
                    { tripId: trip3.id, descripcion: 'Servicio de transporte Trelew - Puerto Madryn (VJ-2024-003)', cantidad: 1, precioUnit: 65000, subtotal: 65000 },
                ],
            },
        },
    });
    const invoice2 = await prisma.invoice.create({
        data: {
            numero: 'FA-0001-00000002',
            clientId: client1.id,
            tipo: client_1.InvoiceType.FACTURA_A,
            status: client_1.InvoiceStatus.EMITIDA,
            fechaEmision: new Date(),
            fechaVencimiento: addDays(now, 30),
            subtotal: 152893,
            iva: 32107,
            total: 185000,
            items: {
                create: [
                    { tripId: trip1.id, descripcion: 'Servicio de transporte CRV - Cerro Negro - Materiales minería (VJ-2024-001)', cantidad: 1, precioUnit: 185000, subtotal: 185000 },
                ],
            },
        },
    });
    console.log('✅ Facturas creadas');
    // ============================
    // DISPOSITIVOS GPS
    // ============================
    await prisma.gPSDevice.deleteMany({});
    await prisma.gPSDevice.createMany({
        data: [
            { vehicleId: vehicle1.id, deviceId: 'TELTONIKA-001-AB123CD', proveedor: 'Teltonika', modelo: 'FMB920', isActive: true, lastLat: -45.2500, lastLon: -68.0000, lastUpdate: new Date(), lastSpeed: 85 },
            { vehicleId: vehicle2.id, deviceId: 'TELTONIKA-002-EF456GH', proveedor: 'Teltonika', modelo: 'FMB920', isActive: true, lastLat: -44.1800, lastLon: -67.2000, lastUpdate: addHours(now, -1), lastSpeed: 0 },
            { vehicleId: vehicle3.id, deviceId: 'GARMIN-003-IJ789KL', proveedor: 'Garmin', modelo: 'dezl OTR800', isActive: true, lastLat: -38.9500, lastLon: -69.1800, lastUpdate: addHours(now, -2), lastSpeed: 110 },
        ],
    });
    console.log('✅ Dispositivos GPS registrados');
    // ============================
    // REPUESTOS Y PAÑOL
    // ============================
    await prisma.sparePart.deleteMany({});
    await prisma.sparePart.createMany({
        data: [
            {
                sku: 'SKU-FIL-001',
                nombre: 'Filtro de Aceite Scania DC13 (R450 / R500)',
                categoria: 'FILTROS',
                ambito: 'TRACCION',
                stockActual: 8,
                stockMinimo: 3,
                precioUnitario: 34500,
                ubicacion: 'Estante A-1',
                tiposCompatibles: 'TRACTOR,CAMION',
                marcasCompatibles: 'Scania',
                tipoEnganche: 'N/A',
                modelosCompatibles: 'Scania R450, Scania R500',
                notas: 'Repuesto original Scania con junta de goma',
            },
            {
                sku: 'SKU-ENG-002',
                nombre: 'Perno Rey 2" Forjado Heavy Duty Jost (Perno 2 pulgadas)',
                categoria: 'VARIOS',
                ambito: 'ARRASTRE',
                stockActual: 5,
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
                nombre: 'Válvula de Fondo API 4" para Cisterna de Combustibles',
                categoria: 'VALVULAS_CISTERNA',
                ambito: 'ARRASTRE',
                stockActual: 1,
                stockMinimo: 2,
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
                stockActual: 10,
                stockMinimo: 4,
                precioUnitario: 68000,
                ubicacion: 'Estante B-1',
                tiposCompatibles: 'SEMIRREMOLQUE,SEMI_CISTERNA,CARRETON,BATEA',
                marcasCompatibles: 'Randon,Salto,Sola y Brusa,Indecar,Vulcano',
                tipoEnganche: 'TODOS',
                notas: 'Cámara de freno doble 30/30 para ejes de acoplados',
            },
            {
                sku: 'SKU-QUI-004',
                nombre: 'Quinta Rueda Jost JSK 37 C (Para Perno 2")',
                categoria: 'VARIOS',
                ambito: 'TRACCION',
                stockActual: 3,
                stockMinimo: 1,
                precioUnitario: 980000,
                ubicacion: 'Depósito Central D-1',
                tiposCompatibles: 'TRACTOR',
                marcasCompatibles: 'Scania,Volvo,Mercedes-Benz,Iveco',
                tipoEnganche: 'Perno Rey 2"',
                notas: 'Quinta rueda tracción pesada para acople de semis',
            },
            {
                sku: 'SKU-NEU-007',
                nombre: 'Neumático 295/80 R22.5 Michelin X Multi Z',
                categoria: 'NEUMATICOS',
                ambito: 'UNIVERSAL',
                stockActual: 12,
                stockMinimo: 4,
                precioUnitario: 420000,
                ubicacion: 'Rack Neumáticos N-1',
                tiposCompatibles: 'TODOS',
                marcasCompatibles: 'TODAS',
                tipoEnganche: 'TODOS',
                notas: 'Cubierta direccional y tracción para larga distancia',
            },
        ],
    });
    console.log('✅ Repuestos de Pañol creados');
    // ============================
    // INCIDENTES
    // ============================
    await prisma.incident.createMany({
        data: [
            { tripId: trip3.id, driverId: driver2.id, tipo: 'DEMORA', descripcion: 'Demora por tránsito pesado en entrada a Puerto Madryn', fecha: addDays(now, -5), lugar: 'Ruta 3 Km 1415', costoEstimado: 0, resolucion: 'Se llegó con 2 horas de retraso, cliente notificado' },
            { driverId: driver2.id, tipo: 'SANCION', descripcion: 'Infracción de tránsito - exceso de velocidad', fecha: addDays(now, -15), lugar: 'Ruta 3 Km 1320', costoEstimado: 15000, resolucion: 'Multa pagada por la empresa - descuento en próximo sueldo' },
        ],
    });
    // ============================
    // CERTIFICACIONES (CERTIFICATIONS)
    // ============================
    await prisma.certification.deleteMany({});
    const cert1 = await prisma.certification.create({
        data: {
            numeroCertificado: 1001,
            clientId: clientLitio.id,
            contractId: contractLitio.id,
            numeroOC: 'OC-LMA-2024-089',
            periodo: 'Julio 2026',
            fechaEmision: addDays(now, -10),
            fechaAprobacion: addDays(now, -5),
            cantidadViajes: 12,
            toneladasExcedentes: 24.5,
            montoTotal: 4850000,
            estado: client_1.CertificationStatus.APROBADO,
            diasEnGestion: 5,
            observaciones: 'Certificación de servicios de transporte de Litio correspondiente a la primera quincena de Julio.',
        },
    });
    const cert2 = await prisma.certification.create({
        data: {
            numeroCertificado: 1002,
            clientId: client1.id,
            periodo: 'Julio 2026',
            fechaEmision: addDays(now, -2),
            cantidadViajes: 8,
            toneladasExcedentes: 0,
            montoTotal: 1480000,
            estado: client_1.CertificationStatus.EN_REVISION,
            diasEnGestion: 2,
            observaciones: 'Certificación pendiente de validación por jefe de balanza Cerro Negro.',
        },
    });
    console.log('✅ Certificaciones de Clientes creadas');
    // ============================
    // TERCEROS / CARRIERS
    // ============================
    await prisma.carrierDriver.deleteMany({});
    await prisma.carrierVehicle.deleteMany({});
    await prisma.carrier.deleteMany({});
    const carrier1 = await prisma.carrier.create({
        data: {
            razonSocial: 'Logística Express Patagónica S.A.',
            cuit: '30-71554433-2',
            telefono: '0297-448-9000',
            email: 'despacho@logisticaexpress.com.ar',
            contacto: 'Roberto Gómez',
            domicilio: 'Ruta 3 Km 1200',
            ciudad: 'Comodoro Rivadavia',
            provincia: 'Chubut',
            isActive: true,
            notas: 'Subcontratista homologado para cargas generales y minería',
            vehicles: {
                create: [
                    { patente: 'AA 123 BB', tipo: client_1.VehicleType.CAMION, marca: 'Scania', modelo: 'R450' },
                    { patente: 'CC 456 DD', tipo: client_1.VehicleType.SEMIRREMOLQUE, marca: 'Randon', modelo: 'Sider 14.5m' },
                ],
            },
            drivers: {
                create: [
                    { firstName: 'Oscar', lastName: 'Gutiérrez', dni: '25112233', telefono: '0297-154-112233' },
                    { firstName: 'Facundo', lastName: 'Ríos', dni: '31445566', telefono: '0297-154-445566' },
                ],
            },
        },
    });
    const carrier2 = await prisma.carrier.create({
        data: {
            razonSocial: 'TransAndina Minera S.R.L.',
            cuit: '30-69887766-1',
            telefono: '0387-422-5500',
            email: 'operaciones@transandina.com',
            contacto: 'Ing. Marcos Paz',
            domicilio: 'Av. Chile 550',
            ciudad: 'Salta',
            provincia: 'Salta',
            isActive: true,
            vehicles: {
                create: [
                    { patente: 'EE 789 FF', tipo: client_1.VehicleType.TRACTOR, marca: 'Volvo', modelo: 'FH 540' },
                    { patente: 'GG 012 HH', tipo: client_1.VehicleType.CARRETON, marca: 'Vulcano', modelo: 'Carretón 80 Tn' },
                ],
            },
            drivers: {
                create: [
                    { firstName: 'Gonzalo', lastName: 'Mendoza', dni: '29887766', telefono: '0387-154-887766' },
                ],
            },
        },
    });
    console.log('✅ Transportistas Terceros creados');
    // ============================
    // NEUMÁTICOS Y MOVIMIENTOS
    // ============================
    await prisma.tireInspection.deleteMany({});
    await prisma.tireRetread.deleteMany({});
    await prisma.tireMovement.deleteMany({});
    await prisma.tire.deleteMany({});
    const tire1 = await prisma.tire.create({
        data: {
            codigoInterno: 'NEU-0001',
            codigoQR: 'QR-NEU-0001',
            numeroSerie: 'SN-MICH-9901',
            marca: 'Michelin',
            modelo: 'X Multi Z',
            medida: '295/80 R22.5',
            tipo: client_1.TireType.DIRECCIONAL,
            status: client_1.TireStatus.INSTALADO,
            fechaCompra: past(6),
            precioCompra: 420000,
            profundidadInicialMm: 16.0,
            profundidadActualMm: 12.5,
            presionRecomendadaPsi: 110,
            presionActualPsi: 108,
            kilometrosRecorridos: 34500,
            vehicleId: vehicle1.id,
            posicion: '1-DIRECCIONAL-IZQ',
        },
    });
    const tire2 = await prisma.tire.create({
        data: {
            codigoInterno: 'NEU-0002',
            codigoQR: 'QR-NEU-0002',
            numeroSerie: 'SN-MICH-9902',
            marca: 'Michelin',
            modelo: 'X Multi Z',
            medida: '295/80 R22.5',
            tipo: client_1.TireType.DIRECCIONAL,
            status: client_1.TireStatus.INSTALADO,
            fechaCompra: past(6),
            precioCompra: 420000,
            profundidadInicialMm: 16.0,
            profundidadActualMm: 12.8,
            presionRecomendadaPsi: 110,
            presionActualPsi: 110,
            kilometrosRecorridos: 34500,
            vehicleId: vehicle1.id,
            posicion: '1-DIRECCIONAL-DER',
        },
    });
    const tire3 = await prisma.tire.create({
        data: {
            codigoInterno: 'NEU-0003',
            codigoQR: 'QR-NEU-0003',
            numeroSerie: 'SN-BS-5501',
            marca: 'Bridgestone',
            modelo: 'M729',
            medida: '295/80 R22.5',
            tipo: client_1.TireType.TRACCION,
            status: client_1.TireStatus.EN_DEPOSITO,
            fechaCompra: past(3),
            precioCompra: 390000,
            profundidadInicialMm: 18.0,
            profundidadActualMm: 18.0,
            presionRecomendadaPsi: 110,
            presionActualPsi: 110,
            kilometrosRecorridos: 0,
        },
    });
    const tire4 = await prisma.tire.create({
        data: {
            codigoInterno: 'NEU-0004',
            codigoQR: 'QR-NEU-0004',
            numeroSerie: 'SN-GOO-3311',
            marca: 'Goodyear',
            modelo: 'KMAX S',
            medida: '295/80 R22.5',
            tipo: client_1.TireType.TRACCION,
            status: client_1.TireStatus.EN_RECAPADO,
            fechaCompra: past(18),
            precioCompra: 360000,
            profundidadInicialMm: 16.0,
            profundidadActualMm: 3.5,
            presionRecomendadaPsi: 110,
            kilometrosRecorridos: 115000,
            cantidadRecapados: 1,
        },
    });
    await prisma.tireMovement.create({
        data: {
            tireId: tire1.id,
            vehicleId: vehicle1.id,
            tipoMovimiento: 'MONTAJE',
            posicionDestino: '1-DIRECCIONAL-IZQ',
            kilometrajeVehiculo: 110730,
            profundidadMm: 16.0,
            presionPsi: 110,
            motivo: 'Montaje de neumático nuevo en eje direccional',
            costo: 5000,
            usuario: 'Taller Central',
        },
    });
    await prisma.tireInspection.create({
        data: {
            tireId: tire1.id,
            vehicleId: vehicle1.id,
            fecha: past(1),
            inspector: 'Técnico Juan Pérez',
            profundidadMm: 12.5,
            presionPsi: 108,
            estadoVisual: 'BUENO',
            resultado: 'APROBADO',
            observaciones: 'Desgaste parejo y correcto inflado',
        },
    });
    await prisma.tireRetread.create({
        data: {
            tireId: tire4.id,
            empresaRecapadora: 'Bandag Patagónica S.A.',
            numeroRecapado: 2,
            fechaEnvio: addDays(now, -10),
            costo: 125000,
            profundidadNuevaMm: 16.5,
            garantiaMeses: 6,
            status: 'EN_PROCESO',
            observaciones: 'Envío para segundo recape banda tracción',
        },
    });
    console.log('✅ Neumáticos e Inspecciones creados');
    // ============================
    // REGISTRO DE TURNOS Y CAPACITACIONES CHOFERES
    // ============================
    await prisma.driverShiftLog.deleteMany({});
    await prisma.driverTraining.deleteMany({});
    await prisma.driverShiftLog.createMany({
        data: [
            {
                driverId: driver1.id,
                tipoRegistro: 'TURNO_TRABAJO',
                fechaInicio: past(1),
                diasTrabajados: 14,
                diasDescansados: 0,
                excedido: false,
                notas: 'En turno activo 21x7 en yacimiento Cerro Negro',
            },
            {
                driverId: driver2.id,
                tipoRegistro: 'DESCANSO',
                fechaInicio: addDays(now, -5),
                fechaFin: addDays(now, 2),
                diasTrabajados: 21,
                diasDescansados: 7,
                excedido: false,
                notas: 'Franco en domicilio Trelew',
            },
        ],
    });
    await prisma.driverTraining.createMany({
        data: [
            {
                driverId: driver1.id,
                tipo: 'Manejo Defensivo en Alta Montaña y Nieve',
                fecha: past(4),
                vencimiento: future(8),
                entidad: 'CESVI Argentina',
                aprobado: true,
                notas: 'Habilitación requerida para tramos Puna y Paso Jama',
            },
            {
                driverId: driver1.id,
                tipo: 'Inducción de Seguridad Yacimiento Cerro Negro',
                fecha: past(2),
                vencimiento: future(10),
                entidad: 'Goldcorp / Minera Santa Cruz',
                aprobado: true,
            },
        ],
    });
    console.log('✅ Turnos y Capacitaciones de Choferes creados');
    // ============================
    // GEOCERCAS GPS
    // ============================
    await prisma.geofence.deleteMany({});
    await prisma.geofence.createMany({
        data: [
            {
                nombre: 'Base Operativa Comodoro Rivadavia',
                descripcion: 'Playa principal de estacionamiento, taller y depósito central',
                coordinates: { lat: -45.8645, lon: -67.4915 },
                radio: 500,
                isActive: true,
            },
            {
                nombre: 'Yacimiento Cerro Negro',
                descripcion: 'Balanza de recepción y zona de descarga mina',
                coordinates: { lat: -45.2167, lon: -68.1167 },
                radio: 1500,
                isActive: true,
            },
            {
                nombre: 'Salar de Olaroz - Planta Jujuy',
                descripcion: 'Zona de carga de carbonato y salmuera de litio',
                coordinates: { lat: -23.4000, lon: -66.7000 },
                radio: 2000,
                isActive: true,
            },
        ],
    });
    console.log('✅ Geocercas GPS creadas');
    // ============================
    // PLANTILLAS Y REGISTROS DE REPORTES
    // ============================
    await prisma.reportSchedule.deleteMany({});
    await prisma.reportSaved.deleteMany({});
    await prisma.reportTemplate.deleteMany({});
    const tpl1 = await prisma.reportTemplate.create({
        data: {
            nombre: 'Resumen Ejecutivo Semanal de Operaciones',
            descripcion: 'Informe de KPIs de viajes, toneladas movilizadas, consumo diésel y margen bruto',
            categoria: 'OPERACIONES',
            configJson: { theme: 'blue', showKpiSummary: true, showFleetChart: true, showFuelChart: true },
            isDefault: true,
        },
    });
    const tpl2 = await prisma.reportTemplate.create({
        data: {
            nombre: 'Reporte Financiero y Margen por Cliente',
            descripcion: 'Detalle de tarifas, costos operativos, excedentes y rentabilidad por cuenta',
            categoria: 'FINANZAS',
            configJson: { theme: 'emerald', showFinancialChart: true, showKpiSummary: true },
            isDefault: false,
        },
    });
    await prisma.reportSaved.create({
        data: {
            templateId: tpl1.id,
            titulo: 'Informe Operativo Cierre Quincenal Julio 2026',
            categoria: 'OPERACIONES',
            periodoFrom: past(1),
            periodoTo: new Date(),
            resumenIA: 'Operación con cumplimiento del 98.4% en entregas. Consumo promedio de 1.34 km/l.',
            favorito: true,
            creadoPor: 'Carlos Rodríguez',
        },
    });
    await prisma.reportSchedule.create({
        data: {
            titulo: 'Envío Automático Lunes - KPIs Operativos',
            categoria: 'OPERACIONES',
            frecuencia: 'SEMANAL',
            destinatarios: 'gerencia@logistics.com, operaciones@logistics.com',
            formato: 'PDF',
            isActive: true,
            proximoEnvio: addDays(now, 3),
        },
    });
    console.log('✅ Plantillas y Reportes creados');
    // ============================
    // CENTRO DE ALERTAS
    // ============================
    await prisma.alertRecord.deleteMany({});
    await prisma.alertRecord.createMany({
        data: [
            {
                codigo: 'ALT-DOC-001',
                categoria: client_1.AlertCategory.DOCUMENTACION,
                severidad: client_1.AlertSeverity.ADVERTENCIA,
                titulo: 'Vencimiento de VTV Próximo - Vehículo MN 012 OP',
                mensaje: 'La Inspección Técnica Vehicular de la camioneta Ford F-4000 vence en 15 días.',
                moduloOrigen: 'VEHICULOS',
                entidadId: vehicle4.id,
                isResolved: false,
            },
            {
                codigo: 'ALT-CHO-002',
                categoria: client_1.AlertCategory.CHOFERES,
                severidad: client_1.AlertSeverity.CRITICA,
                titulo: 'Examen Psicofísico Vencido - Chofer Eduardo Campos',
                mensaje: 'El certificado psicofísico del conductor venció hace 5 días. Requiere renovación urgente.',
                moduloOrigen: 'CHOFERES',
                entidadId: driver2.id,
                isResolved: false,
            },
            {
                codigo: 'ALT-FLT-003',
                categoria: client_1.AlertCategory.COMBUSTIBLE,
                severidad: client_1.AlertSeverity.ADVERTENCIA,
                titulo: 'Desvío Anómalo de Consumo Diésel - Patente EF 456 GH',
                mensaje: 'Consumo de 0.95 km/l en ruta Trelew detectado (25% inferior a la media histórica).',
                moduloOrigen: 'COMBUSTIBLE',
                entidadId: vehicle2.id,
                isResolved: false,
            },
            {
                codigo: 'ALT-NEU-004',
                categoria: client_1.AlertCategory.NEUMATICOS,
                severidad: client_1.AlertSeverity.CRITICA,
                titulo: 'Neumático con Profundidad Límite (3.5mm) - NEU-0004',
                mensaje: 'Neumático enviado a recape Bandag por llegar al mínimo legal de seguridad.',
                moduloOrigen: 'NEUMATICOS',
                entidadId: tire4.id,
                isResolved: true,
                resolvedAt: addDays(now, -2),
                resolvedBy: 'Taller Central',
                resolucionNota: 'Neumático retirado de vehículo y enviado a recapadora Bandag.',
            },
        ],
    });
    console.log('✅ Alertas del Sistema creadas');
    // ============================
    // CONFIGURACIÓN DEL SISTEMA
    // ============================
    await prisma.systemConfig.upsert({
        where: { key: 'empresa' },
        update: {},
        create: {
            key: 'empresa',
            label: 'Datos de la empresa',
            value: {
                razonSocial: 'Transportes del Sur Patagónico S.A.',
                cuit: '30-71234500-1',
                domicilio: 'Av. Hipólito Yrigoyen 1234',
                ciudad: 'Comodoro Rivadavia',
                provincia: 'Chubut',
                telefono: '0297-444-1234',
                email: 'info@transportesdelsur.com.ar',
                logo: null,
            },
        },
    });
    await prisma.systemConfig.upsert({
        where: { key: 'alertas_vencimiento' },
        update: {},
        create: {
            key: 'alertas_vencimiento',
            label: 'Días de anticipación para alertas',
            value: { documentos: 30, revisiones: 15, mantenimiento: 7 },
        },
    });
    console.log('✅ Configuración del sistema creada');
    console.log('\n🎉 Seed completado exitosamente!');
    console.log('');
    console.log('Credenciales de acceso:');
    console.log('  Admin:       admin@logistics.com / Admin123!');
    console.log('  Operaciones: ops@logistics.com / Ops123!');
    console.log('  Despacho:    despacho@logistics.com / Ops123!');
    console.log('  Chofer:      chofer@logistics.com / Driver123!');
    console.log('  Contaduría:  contaduria@logistics.com / Ops123!');
}
main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
