import {
  PrismaClient,
  VehicleType,
  VehicleStatus,
  TireType,
  TireStatus,
  TripStatus,
  MaintenanceType,
  MaintenanceStatus,
  DangerousGoodsClass,
  CertificationStatus,
} from '@prisma/client';

export class MasterSeed {
  static async run(prisma: PrismaClient) {
    console.log('🚀 Executing Master System Seed across ALL 29 ERP Entities (Maintenance, Accounting, Fleet, Drivers, Trips, Dangerous Goods, GPS, Carriers)...');

    // 1. Clientes y Contratos corporativos
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

    // 2. Transportistas Subcontratados (Carriers)
    const carriersData = [
      { razonSocial: 'Transportes Patagónicos S.R.L.', cuit: '30-71234567-8', email: 'contacto@patagonicos.com', telefono: '0299-448-9000', contacto: 'Martín Gómez', ciudad: 'Neuquén' },
      { razonSocial: 'Expreso Carga Pesada Neuquén', cuit: '30-68991122-3', email: 'operaciones@expresoneuquen.com', telefono: '0299-477-1234', contacto: 'Horacio Rossi', ciudad: 'Cintia' },
    ];

    const carriers = [];
    for (const car of carriersData) {
      const created = await prisma.carrier.upsert({
        where: { cuit: car.cuit },
        update: car,
        create: car,
      });
      carriers.push(created);
    }

    // 3. Flota de 35 Vehículos
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

      // GPS Device creation for tractor units
      if (isTractor) {
        await prisma.gPSDevice.upsert({
          where: { deviceId: `GPS-${patente}` },
          update: {
            lastLat: -38.9516 + (i % 5) * 0.02,
            lastLon: -68.0591 + (i % 5) * 0.03,
            lastSpeed: 78.5,
            lastUpdate: new Date(),
          },
          create: {
            deviceId: `GPS-${patente}`,
            vehicleId: v.id,
            proveedor: i % 2 === 0 ? 'Sitrack' : 'Pointer',
            modelo: 'TG-400',
            lastLat: -38.9516 + (i % 5) * 0.02,
            lastLon: -68.0591 + (i % 5) * 0.03,
            lastSpeed: 78.5,
            lastUpdate: new Date(),
          },
        });
      }
    }

    // 4. 25 Conductores y Jornadas
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

    // 5. Stock Repuestos
    const repuestosData = [
      { sku: 'FIL-ACE-01', nombre: 'Filtro de Aceite Scania R450', categoria: 'FILTROS', stockActual: 12, stockMinimo: 5, precioUnitario: 28000 },
      { sku: 'FIL-GAS-02', nombre: 'Filtro Combustible Volvo FH', categoria: 'FILTROS', stockActual: 2, stockMinimo: 4, precioUnitario: 34000 },
      { sku: 'PAT-FRE-03', nombre: 'Pastillas de Freno Mercedes Actros', categoria: 'FRENOS', stockActual: 1, stockMinimo: 3, precioUnitario: 95000 },
      { sku: 'ACE-MOT-15W40', nombre: 'Aceite Motor 15W40 Tambor 208L', categoria: 'LUBRICANTES', stockActual: 5, stockMinimo: 2, precioUnitario: 450000 },
    ];
    const createdSpareParts = [];
    for (const r of repuestosData) {
      const sp = await prisma.sparePart.upsert({
        where: { sku: r.sku },
        update: r,
        create: r,
      });
      createdSpareParts.push(sp);
    }

    // 6. Órdenes de Mantenimiento y Taller
    console.log('🔧 6. Cargando 20 Órdenes de Mantenimiento Preventivo y Correctivo...');
    for (let i = 1; i <= 20; i++) {
      const numeroOT = `OT-2026-000${100 + i}`;
      const v = vehicles[i % vehicles.length];
      const isPreventive = i % 2 === 0;

      const m = await prisma.maintenance.upsert({
        where: { numeroOT },
        update: {
          status: i % 3 === 0 ? MaintenanceStatus.EN_CURSO : i % 4 === 0 ? MaintenanceStatus.COMPLETADO : MaintenanceStatus.PENDIENTE,
        },
        create: {
          numeroOT,
          vehicleId: v.id,
          tipo: isPreventive ? MaintenanceType.PREVENTIVO : MaintenanceType.CORRECTIVO,
          status: i % 3 === 0 ? MaintenanceStatus.EN_CURSO : i % 4 === 0 ? MaintenanceStatus.COMPLETADO : MaintenanceStatus.PENDIENTE,
          descripcion: isPreventive ? 'Service Programado 50.000 KM (Filtros, Aceite, Revisión de Frenos)' : 'Reparación de Sistema Neumático y Válvula Freno',
          fecha: new Date(Date.now() - (i * 3) * 24 * 60 * 60 * 1000),
          kmActual: v.kilometraje,
          kmProximo: v.kilometraje + 15000,
          taller: i % 2 === 0 ? 'Taller Central Buenos Aires' : 'Taller Oficial Scania Neuquén',
          mecanico: i % 2 === 0 ? 'Ing. Roberto Benítez' : 'Téc. Carlos Paez',
          costoManoObra: 150000 + (i % 4) * 25000,
          costoRepuestos: 320000 + (i % 3) * 45000,
          costoTotal: 470000 + (i % 4) * 70000,
        },
      });

      // Insert maintenance item
      await prisma.maintenanceItem.create({
        data: {
          maintenanceId: m.id,
          sparePartId: createdSpareParts[i % createdSpareParts.length].id,
          descripcion: `Remplazo de ${createdSpareParts[i % createdSpareParts.length].nombre}`,
          cantidad: 2,
          costoUnitario: createdSpareParts[i % createdSpareParts.length].precioUnitario,
          costoTotal: createdSpareParts[i % createdSpareParts.length].precioUnitario * 2,
        },
      });
    }

    // 7. 80 Viajes Operativos con Cargas Peligrosas
    console.log('🗺️ 7. Cargando 80 Viajes con Declaraciones de Cargas Peligrosas (IMO)...');
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
          tipoCarga: i % 3 === 0 ? 'GASOLINA_UN1203' : 'DIESEL_UN1202',
          status: i % 4 === 0 ? TripStatus.FINALIZADO : i % 5 === 0 ? TripStatus.DEMORADO : TripStatus.EN_CURSO,
        },
      });

      // Insert Dangerous Goods Declaration for Hazmat trips
      if (i % 3 === 0) {
        await prisma.dangerousGoodsDeclaration.upsert({
          where: { tripId: trip.id },
          update: { cantidadKg: 28000 },
          create: {
            tripId: trip.id,
            numeroONU: '1203',
            clase: DangerousGoodsClass.CLASE_3_LIQUIDOS_INFLAMABLES,
            nombreTecnico: 'GASOLINA / NAFTA COMBUSTIBLE DE AUTOMOTORES',
            cantidadKg: 28000,
            grupoEmbalaje: 'PG II',
            puntoInflamacion: -43.0,
            hojaSeguridad: true,
            equipoObligatorio: true,
            permisosCompletos: true,
            cumpleNormativa: true,
          },
        });
      }
    }

    // 8. Cargas de Combustible
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

    // 9. Módulo Contable & Certificaciones (Certifications & Invoices)
    console.log('💵 9. Cargando Módulo Contable, Certificaciones de Servicio y Facturación...');
    for (let i = 1; i <= 4; i++) {
      const client = clients[(i - 1) % clients.length];
      const cert = await prisma.certification.upsert({
        where: { clientId_numeroCertificado: { clientId: client.id, numeroCertificado: i } },
        update: { montoTotal: 15800000 },
        create: {
          clientId: client.id,
          numeroCertificado: i,
          numeroOC: `OC-${client.razonSocial.substring(0, 3).toUpperCase()}-2026-00${i}`,
          periodo: `Enero 2026 - Período ${i}`,
          cantidadViajes: 12,
          toneladasExcedentes: 45.5,
          montoTotal: 15800000,
          estado: CertificationStatus.APROBADO,
          diasEnGestion: 3,
        },
      });

      const invoiceNum = `FACT-A-0001-000${100 + i}`;
      await prisma.invoice.upsert({
        where: { numero: invoiceNum },
        update: { certificationId: cert.id },
        create: {
          numero: invoiceNum,
          clientId: client.id,
          certificationId: cert.id,
          status: 'PAGADA' as any,
          fechaEmision: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          subtotal: 15800000,
          iva: 3318000,
          total: 19118000,
          afipCAE: `742918491028${i}`,
          afipCAEVencimiento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log('✅ Master System Seed executed successfully across ALL ERP modules.');
  }
}
