import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripStatus, VehicleStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(private prisma: PrismaService) {}

  private async generateTripNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    // Use crypto-safe random with 6 hex chars (16M possibilities) + uniqueness check
    for (let attempt = 0; attempt < 5; attempt++) {
      const rand = randomBytes(3).toString('hex').toUpperCase();
      const numero = `VJ-${year}-${rand}`;
      const exists = await this.prisma.trip.findFirst({ where: { numero }, select: { id: true } });
      if (!exists) return numero;
    }
    // Fallback: timestamp-based (virtually impossible to collide)
    return `VJ-${year}-${Date.now().toString(36).toUpperCase()}`;
  }

  // Calcula el lead time total considerando ruta + esperas + descansos
  private calculateLeadTime(duracionEstimadaHoras: number, esperaEnDestinoHoras: number, descansosConductorHoras: number): number {
    return duracionEstimadaHoras + esperaEnDestinoHoras + descansosConductorHoras;
  }

  private calculateArrivalEstimate(departure: Date, leadTime: number): Date {
    return new Date(departure.getTime() + leadTime * 60 * 60 * 1000);
  }

  async findAll(filters?: {
    status?: TripStatus;
    vehicleId?: string;
    driverId?: string;
    clientId?: string;
    tipoOperacion?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, vehicleId, driverId, clientId, tipoOperacion, from, to, search, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (clientId) where.clientId = clientId;
    if (tipoOperacion) where.tipoOperacion = tipoOperacion;
    if (from || to) {
      where.fechaSalidaProgramada = {};
      if (from) where.fechaSalidaProgramada.gte = new Date(from);
      if (to) where.fechaSalidaProgramada.lte = new Date(to);
    }
    if (search) where.OR = [
      { numero: { contains: search, mode: 'insensitive' } },
      { origen: { contains: search, mode: 'insensitive' } },
      { destino: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where, skip, take: limit,
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
      }),
      this.prisma.trip.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        vehicle: true,
        trailer: true,
        driver: true,
        dispatcher: { select: { firstName: true, lastName: true, email: true } },
        carrier: true,
        carrierDriver: true,
        carrierVehicle: true,
        carrierTrailer: true,
        dangerousGoods: true,
        costs: { orderBy: { fecha: 'desc' } },
        checkpoints: { orderBy: { orden: 'asc' } },
        documents: true,
        incidents: { orderBy: { fecha: 'desc' } },
        invoiceItems: { include: { invoice: true } },
        fuelLogs: { orderBy: { fecha: 'desc' } },
      },
    });
    if (!trip) throw new NotFoundException('Viaje no encontrado');
    return trip;
  }

  async create(dto: CreateTripDto, dispatcherId?: string) {
    // Validate: no other active trip for same vehicle on overlapping dates
    const duracion = dto.duracionEstimadaHoras || 12;
    const espera = dto.esperaEnDestinoHoras || 0;
    const descanso = dto.descansosConductorHoras || 0;
    const leadTime = this.calculateLeadTime(duracion, espera, descanso);
    const departure = new Date(dto.fechaSalidaProgramada);
    const estimatedArrival = dto.fechaLlegadaEstimada ? new Date(dto.fechaLlegadaEstimada) : this.calculateArrivalEstimate(departure, leadTime);

    if (dto.vehicleId && dto.vehicleId !== '') {
      const vehicleConflict = await this.prisma.trip.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
          fechaSalidaProgramada: { lte: estimatedArrival },
          fechaLlegadaEstimada: { gte: departure },
        },
      });
      if (vehicleConflict) throw new BadRequestException(`El vehículo ya tiene un viaje asignado en ese período (${vehicleConflict.numero})`);
    }

    if (dto.driverId && dto.driverId !== '') {
      const driverConflict = await this.prisma.trip.findFirst({
        where: {
          driverId: dto.driverId,
          status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
          fechaSalidaProgramada: { lte: estimatedArrival },
          fechaLlegadaEstimada: { gte: departure },
        },
      });
      if (driverConflict) throw new BadRequestException(`El conductor ya tiene un viaje asignado en ese período (${driverConflict.numero})`);

      // Validate dangerous goods compliance
      if (dto.esCargaPeligrosa) {
        const driver = await this.prisma.driver.findUnique({ where: { id: dto.driverId } });
        if (!driver?.habilitadoCargasPeligrosas) {
          throw new BadRequestException('El conductor no está habilitado para transportar cargas peligrosas');
        }
      }
    }

    const { checkpoints, dangerousGoods, ...tripData } = dto;
    const tarifa = Number(dto.tarifaAcordada) || 0;
    const costo = Number(dto.costoTotal) || 0;
    const margen = tarifa - costo;

    // Sanitize empty strings for foreign keys to null
    ['clientId', 'contractId', 'vehicleId', 'trailerId', 'driverId', 'carrierId', 'carrierDriverId', 'carrierVehicleId', 'carrierTrailerId'].forEach((fkKey) => {
      if ((tripData as any)[fkKey] === '' || (tripData as any)[fkKey] === undefined) {
        (tripData as any)[fkKey] = null;
      }
    });

    const trip = await this.prisma.trip.create({
      data: {
        ...tripData,
        costoTotal: dto.costoTotal !== undefined ? costo : undefined,
        margenBruto: margen,
        numero: await this.generateTripNumber(),
        dispatcherId: dispatcherId || null,
        fechaSalidaProgramada: departure,
        fechaLlegadaEstimada: estimatedArrival,
        leadTimeTotal: leadTime,
        checkpoints: checkpoints?.length
          ? { create: checkpoints.map((cp, i) => ({ ...cp, orden: i + 1 })) }
          : undefined,
        dangerousGoods: dangerousGoods ? { create: dangerousGoods as any } : undefined,
      },
      include: { client: true, vehicle: true, driver: true, carrier: true, carrierDriver: true, carrierVehicle: true, carrierTrailer: true, dangerousGoods: true, checkpoints: true },
    });

    // Update vehicle status (only if own vehicle assigned)
    if (dto.vehicleId) {
      await this.prisma.vehicle.update({
        where: { id: dto.vehicleId },
        data: { status: VehicleStatus.RESERVADO },
      });
    }

    this.logger.log(`Viaje ${trip.numero} creado — ${trip.origen} → ${trip.destino} [${dto.tipoOperacion || 'PROPIA'}]`);
    return trip;
  }

  async update(id: string, dto: UpdateTripDto) {
    const existing = await this.findOne(id);
    
    // Destructure non-scalar / relational properties and read-only audit fields
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      client: _client,
      contract: _contract,
      vehicle: _vehicle,
      trailer: _trailer,
      driver: _driver,
      dispatcher: _dispatcher,
      certification: _certification,
      costs: _costs,
      checkpoints,
      dangerousGoods,
      documents: _documents,
      incidents: _incidents,
      invoiceItems: _invoiceItems,
      fuelLogs: _fuelLogs,
      _count: __count,
      ...data
    } = dto as any;

    const sanitizedData: any = { ...data };

    // Clean foreign key relations (convert empty strings or 'null' strings or undefined to null)
    ['clientId', 'contractId', 'vehicleId', 'trailerId', 'driverId', 'carrierId', 'carrierDriverId', 'carrierVehicleId', 'carrierTrailerId', 'dispatcherId', 'certificationId'].forEach((fkKey) => {
      if (sanitizedData[fkKey] === '' || sanitizedData[fkKey] === 'null' || sanitizedData[fkKey] === undefined) {
        sanitizedData[fkKey] = null;
      }
    });

    // Clean dates
    ['fechaSalidaProgramada', 'fechaLlegadaEstimada', 'fechaSalidaReal', 'fechaLlegadaReal'].forEach((dateKey) => {
      if (sanitizedData[dateKey] !== undefined) {
        if (!sanitizedData[dateKey] || sanitizedData[dateKey] === '') {
          sanitizedData[dateKey] = null;
        } else {
          const parsedDate = new Date(sanitizedData[dateKey]);
          if (!isNaN(parsedDate.getTime())) {
            sanitizedData[dateKey] = parsedDate;
          } else {
            delete sanitizedData[dateKey];
          }
        }
      }
    });

    // Clean numbers
    ['distanciaKm', 'pesoCarga', 'volumenCarga', 'duracionEstimadaHoras', 'esperaEnDestinoHoras', 'descansosConductorHoras', 'tarifaAcordada', 'costoTotal', 'subcontractorFee', 'pesoExcedenteKg', 'montoExcedente'].forEach((numKey) => {
      if (sanitizedData[numKey] !== undefined) {
        if (sanitizedData[numKey] === '' || sanitizedData[numKey] === null) {
          sanitizedData[numKey] = null;
        } else {
          const num = Number(sanitizedData[numKey]);
          sanitizedData[numKey] = isNaN(num) ? null : num;
        }
      }
    });

    if (sanitizedData.pesoCarga && (sanitizedData.pesoExcedenteKg === undefined || sanitizedData.pesoExcedenteKg === null)) {
      sanitizedData.pesoExcedenteKg = Math.max(0, Number(sanitizedData.pesoCarga) - 30000);
    }

    const currentTarifa = Number(sanitizedData.tarifaAcordada ?? existing.tarifaAcordada ?? 0);
    const currentCosto = Number(sanitizedData.costoTotal ?? existing.costoTotal ?? 0);
    sanitizedData.margenBruto = currentTarifa - currentCosto;

    return this.prisma.trip.update({
      where: { id },
      data: sanitizedData,
      include: { client: true, vehicle: true, trailer: true, driver: true, carrier: true, carrierDriver: true, carrierVehicle: true, carrierTrailer: true, dangerousGoods: true, checkpoints: true },
    });
  }

  async updateStatus(id: string, status: TripStatus, notes?: string) {
    const trip = await this.findOne(id);
    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status,
        notas: notes ? `${trip.notas || ''}\n[${new Date().toLocaleString('es-AR')}] ${notes}` : trip.notas,
        fechaSalidaReal: status === TripStatus.EN_CURSO && !trip.fechaSalidaReal ? new Date() : trip.fechaSalidaReal,
        fechaLlegadaReal: status === TripStatus.FINALIZADO && !trip.fechaLlegadaReal ? new Date() : trip.fechaLlegadaReal,
      },
    });

    // Update vehicle status only if trip has an own-fleet vehicle assigned
    if (trip.vehicleId) {
      if (status === TripStatus.FINALIZADO || status === TripStatus.CANCELADO) {
        await this.prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.DISPONIBLE } });
      }
      if (status === TripStatus.EN_CURSO) {
        await this.prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.EN_VIAJE } });
      }
    }

    this.logger.log(`Viaje ${trip.numero} → estado: ${status}${trip.vehicleId ? '' : ' (sin vehículo propio)'}`);
    return updated;
  }

  async addCost(tripId: string, data: any) {
    await this.findOne(tripId);
    const cost = await this.prisma.tripCost.create({ data: { ...data, tripId } });
    const totalCosts = await this.prisma.tripCost.aggregate({ where: { tripId }, _sum: { monto: true } });
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    const costoTotal = Number(totalCosts._sum.monto) || 0;
    const tarifa = Number(trip.tarifaAcordada) || 0;
    await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        costoTotal,
        margenBruto: tarifa - costoTotal,
      },
    });
    return cost;
  }

  async getGanttData(from: string, to: string) {
    return this.prisma.trip.findMany({
      where: {
        status: { notIn: [TripStatus.CANCELADO] },
        fechaSalidaProgramada: { gte: new Date(from) },
        fechaLlegadaEstimada: { lte: new Date(to) },
      },
      include: {
        vehicle: { select: { patente: true, marca: true, modelo: true } },
        driver: { select: { firstName: true, lastName: true } },
        client: { select: { razonSocial: true } },
      },
      orderBy: { fechaSalidaProgramada: 'asc' },
    });
  }

  async reschedule(tripId: string, newDeparture: Date, reason: string) {
    const trip = await this.findOne(tripId);
    const leadTime = trip.leadTimeTotal || 24;
    const newArrival = this.calculateArrivalEstimate(newDeparture, leadTime);

    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        fechaSalidaProgramada: newDeparture,
        fechaLlegadaEstimada: newArrival,
        notas: `[REPROGRAMADO] ${reason}. ${trip.notas || ''}`.trim(),
      },
    });
  }

  async createBatch(dto: any, dispatcherId?: string) {
    const { assignments, ...commonData } = dto;
    if (!assignments || assignments.length === 0) {
      throw new BadRequestException('Debe incluir al menos 1 asignación para el convoy');
    }

    // Check for duplicate vehicle or driver within the batch (only for own fleet)
    const vehicleIds = assignments.map((a: any) => a.vehicleId).filter(Boolean);
    const driverIds = assignments.map((a: any) => a.driverId).filter(Boolean);
    if (new Set(vehicleIds).size !== vehicleIds.length) {
      throw new BadRequestException('Hay vehículos propios duplicados en el lote de asignaciones');
    }
    if (new Set(driverIds).size !== driverIds.length) {
      throw new BadRequestException('Hay conductores propios duplicados en el lote de asignaciones');
    }

    const duracion = commonData.duracionEstimadaHoras || 12;
    const espera = commonData.esperaEnDestinoHoras || 0;
    const descanso = commonData.descansosConductorHoras || 0;
    const leadTime = this.calculateLeadTime(duracion, espera, descanso);
    const departure = new Date(commonData.fechaSalidaProgramada);
    const estimatedArrival = this.calculateArrivalEstimate(departure, leadTime);

    // Batch query for vehicle conflicts (1 single query instead of N queries)
    if (vehicleIds.length > 0) {
      const vehicleConflicts = await this.prisma.trip.findMany({
        where: {
          vehicleId: { in: vehicleIds },
          status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
          fechaSalidaProgramada: { lte: estimatedArrival },
          fechaLlegadaEstimada: { gte: departure },
        },
        include: { vehicle: { select: { patente: true } } },
      });
      if (vehicleConflicts.length > 0) {
        const conflict = vehicleConflicts[0];
        throw new BadRequestException(`El vehículo ${conflict.vehicle?.patente || conflict.vehicleId} ya tiene un viaje asignado en ese horario (${conflict.numero})`);
      }
    }

    // Batch query for driver conflicts and dangerous goods check
    if (driverIds.length > 0) {
      const driverConflicts = await this.prisma.trip.findMany({
        where: {
          driverId: { in: driverIds },
          status: { in: [TripStatus.PROGRAMADO, TripStatus.EN_CURSO] },
          fechaSalidaProgramada: { lte: estimatedArrival },
          fechaLlegadaEstimada: { gte: departure },
        },
        include: { driver: { select: { firstName: true, lastName: true } } },
      });
      if (driverConflicts.length > 0) {
        const conflict = driverConflicts[0];
        throw new BadRequestException(`El conductor ${conflict.driver?.firstName} ${conflict.driver?.lastName} ya tiene un viaje asignado en ese horario (${conflict.numero})`);
      }

      if (commonData.esCargaPeligrosa) {
        const drivers = await this.prisma.driver.findMany({
          where: { id: { in: driverIds } },
          select: { id: true, firstName: true, lastName: true, habilitadoCargasPeligrosas: true },
        });
        const unpermitted = drivers.find((d) => !d.habilitadoCargasPeligrosas);
        if (unpermitted) {
          throw new BadRequestException(`El conductor ${unpermitted.firstName} ${unpermitted.lastName} no está habilitado para transporte de cargas peligrosas`);
        }
      }
    }

    // Validate own fleet requirements
    for (const item of assignments) {
      if (!item.tipoOperacion || item.tipoOperacion === 'PROPIA') {
        if (!item.vehicleId || !item.driverId) {
          throw new BadRequestException('Cada camión de Flota Propia debe tener un Vehículo y Conductor seleccionados');
        }
      }
    }

    const now = new Date();
    const convoyCode = `CNV-${now.getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Execute atomic transaction for all convoy trips
    const createdTrips = await this.prisma.$transaction(async (tx) => {
      const results = [];
      for (let i = 0; i < assignments.length; i++) {
        const item = assignments[i];
        const rand = randomBytes(3).toString('hex').toUpperCase();
        const tripNumber = `VJ-${now.getFullYear()}-${rand}`;

        const trip = await tx.trip.create({
          data: {
            numero: tripNumber,
            convoyCode,
            clientId: commonData.clientId || null,
            contractId: commonData.contractId || null,
            vehicleId: item.vehicleId || null,
            driverId: item.driverId || null,
            trailerId: item.trailerId || null,
            tipoOperacion: item.tipoOperacion || 'PROPIA',
            carrierId: item.carrierId || null,
            carrierDriverId: item.carrierDriverId || null,
            carrierVehicleId: item.carrierVehicleId || null,
            carrierTrailerId: item.carrierTrailerId || null,
            subcontractorName: item.subcontractorName || null,
            subcontractorFee: item.subcontractorFee ? Number(item.subcontractorFee) : null,
            dispatcherId: dispatcherId || null,
            origen: commonData.origen,
            destino: commonData.destino,
            origenLat: commonData.origenLat || null,
            origenLon: commonData.origenLon || null,
            destinoLat: commonData.destinoLat || null,
            destinoLon: commonData.destinoLon || null,
            fechaSalidaProgramada: departure,
            fechaLlegadaEstimada: estimatedArrival,
            duracionEstimadaHoras: duracion,
            esperaEnDestinoHoras: espera,
            descansosConductorHoras: descanso,
            leadTimeTotal: leadTime,
            distanciaKm: commonData.distanciaKm || null,
            status: TripStatus.PROGRAMADO,
            tipoCarga: commonData.tipoCarga || null,
            descripcionCarga: commonData.descripcionCarga || null,
            pesoCarga: item.pesoCargaKg || commonData.pesoCargaGenericoKg || null,
            numeroRemito: item.numeroRemito || null,
            numeroOCCliente: item.numeroOCCliente || null,
            esCargaPeligrosa: commonData.esCargaPeligrosa || false,
            esMineria: commonData.esMineria || false,
            esDistribucion: commonData.esDistribucion || false,
            tarifaAcordada: item.tarifaAcordada || commonData.tarifaGenerica || null,
            costoTotal: item.tipoOperacion === 'SUBCONTRATADA_TOTAL' || item.tipoOperacion === 'TRACCION_TERCERO_SEMI_PROPIO'
              ? (item.subcontractorFee ? Number(item.subcontractorFee) : null)
              : null,
            notas: commonData.notas ? `[CONVOY ${convoyCode}] ${commonData.notas}` : `[CONVOY ${convoyCode}]`,
          },
          include: {
            vehicle: { select: { patente: true, marca: true, modelo: true } },
            driver: { select: { firstName: true, lastName: true } },
            carrier: { select: { razonSocial: true } },
            carrierVehicle: { select: { patente: true } },
            carrierDriver: { select: { firstName: true, lastName: true } },
            client: { select: { razonSocial: true } },
          },
        });

        if (item.vehicleId) {
          await tx.vehicle.update({
            where: { id: item.vehicleId },
            data: { status: VehicleStatus.RESERVADO },
          });
        }

        // Add Dangerous Goods declaration if present
        if (commonData.esCargaPeligrosa && commonData.dangerousGoods) {
          await tx.dangerousGoodsDeclaration.create({
            data: {
              tripId: trip.id,
              numeroONU: commonData.dangerousGoods.numeroONU || '1202',
              clase: commonData.dangerousGoods.clase || 'CLASE_3_LIQUIDOS_INFLAMABLES',
              nombreTecnico: commonData.dangerousGoods.nombreTecnico || 'GASOIL / DIESEL',
              cantidadKg: item.pesoCargaKg || 30000,
              grupoEmbalaje: commonData.dangerousGoods.grupoEmbalaje || 'III',
              hojaSeguridad: true,
              equipoObligatorio: true,
              permisosCompletos: true,
              cumpleNormativa: true,
            },
          });
        }

        results.push(trip);
      }
      return results;
    });

    this.logger.log(`Convoy ${convoyCode} creado — ${createdTrips.length} viajes, ruta: ${commonData.origen} → ${commonData.destino}`);
    return {
      convoyCode,
      count: createdTrips.length,
      trips: createdTrips,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPEDIENTE 360° & RENDICIÓN DE GASTOS
  // ═══════════════════════════════════════════════════════════════

  async getSummary360(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        trailer: true,
        driver: true,
        client: true,
        contract: true,
        certification: true,
        costs: true,
        checkpoints: { orderBy: { orden: 'asc' } },
        dangerousGoods: true,
        carrier: true,
        carrierVehicle: true,
        carrierDriver: true,
        fuelLogs: { orderBy: { fecha: 'desc' } },
      },
    });

    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const costoPeajes = trip.costs.filter((c) => c.categoria === 'PEAJES').reduce((sum, c) => sum + c.monto, 0);
    const costoViaticos = trip.costs.filter((c) => c.categoria === 'VIATICOS').reduce((sum, c) => sum + c.monto, 0);
    const costoCombustible = trip.fuelLogs.reduce((sum, f) => sum + f.costoTotal, 0);
    const costoDirectoTotal = trip.costs.reduce((sum, c) => sum + c.monto, 0) + costoCombustible;

    const tarifa = trip.subcontractorFee || trip.tarifaAcordada || 0;
    const margenBruto = tarifa > 0 ? (((tarifa - costoDirectoTotal) / tarifa) * 100).toFixed(1) : '0';

    return {
      trip,
      financials: {
        tarifa,
        costoPeajes,
        costoViaticos,
        costoCombustible,
        costoDirectoTotal,
        margenBrutoPct: Number(margenBruto),
      },
    };
  }

  async addTripCost(tripId: string, dto: { categoria: string; descripcion: string; monto: number; comprobante?: string }) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Viaje no encontrado');

    const cost = await this.prisma.tripCost.create({
      data: {
        tripId,
        categoria: dto.categoria,
        descripcion: dto.descripcion,
        monto: Number(dto.monto),
        comprobante: dto.comprobante || null,
      },
    });

    // Recalcular costos del viaje
    const allCosts = await this.prisma.tripCost.findMany({ where: { tripId } });
    const totalCostos = allCosts.reduce((sum, c) => sum + c.monto, 0);
    const tarifa = trip.tarifaAcordada || 0;
    const margenBruto = tarifa > 0 ? (tarifa - totalCostos) / tarifa : 0;

    await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        costoTotal: totalCostos,
        margenBruto,
      },
    });

    return cost;
  }
}
