import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTireDto } from './dto/create-tire.dto';
import { InstallTireDto, DismountTireDto } from './dto/install-tire.dto';
import { RotateTiresDto } from './dto/rotate-tires.dto';
import { SendToRetreadDto, ReceiveFromRetreadDto } from './dto/create-tire-retread.dto';
import { CreateTireInspectionDto } from './dto/create-tire-inspection.dto';
import { TireStatus } from '@prisma/client';

@Injectable()
export class TiresService {
  constructor(private prisma: PrismaService) {}

  calculateCPK(precioCompra: number, retreadsCost: number, kilometros: number): number {
    const totalCost = Number(precioCompra || 0) + Number(retreadsCost || 0);
    const km = Math.max(1, Number(kilometros || 0));
    return Number((totalCost / km).toFixed(4));
  }

  async findAll(query: any = {}) {
    const { search, status, tipo, vehicleId, minProfundidad, page = 1, limit = 50 } = query;
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 50);
    const skip = (p - 1) * l;

    const where: any = {};
    if (status && String(status).trim() !== '' && String(status) !== 'undefined') where.status = status;
    if (tipo && String(tipo).trim() !== '' && String(tipo) !== 'undefined') where.tipo = tipo;
    if (vehicleId && String(vehicleId).trim() !== '' && String(vehicleId) !== 'undefined') where.vehicleId = vehicleId;
    if (minProfundidad && String(minProfundidad).trim() !== '' && String(minProfundidad) !== 'undefined') {
      where.profundidadActualMm = { lte: Number(minProfundidad) };
    }

    if (search) {
      where.OR = [
        { codigoInterno: { contains: search, mode: 'insensitive' } },
        { codigoQR: { contains: search, mode: 'insensitive' } },
        { numeroSerie: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
        { medida: { contains: search, mode: 'insensitive' } },
        { proveedor: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tire.findMany({
        where,
        skip,
        take: l,
        orderBy: { codigoInterno: 'asc' },
        include: {
          vehicle: { select: { id: true, patente: true, marca: true, modelo: true } },
          retreads: { select: { costo: true } },
        },
      }),
      this.prisma.tire.count({ where }),
    ]);

    const enriched = data.map((t) => {
      const retreadsCost = t.retreads.reduce((sum, r) => sum + Number(r.costo || 0), 0);
      const cpk = this.calculateCPK(t.precioCompra, retreadsCost, t.kilometrosRecorridos);
      return {
        ...t,
        cpk,
        retreadsCost,
      };
    });

    return { data: enriched, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async getKPIs() {
    const tires = await this.prisma.tire.findMany({
      include: { retreads: { select: { costo: true } } },
    });

    let totalTires = tires.length;
    let installedCount = 0;
    let warehouseCount = 0;
    let retreadCount = 0;
    let retiredCount = 0;
    let lowDepthAlertCount = 0;
    let totalInvestment = 0;
    let totalKm = 0;
    let totalCpkSum = 0;
    let totalRetreadsCount = 0;

    tires.forEach((t) => {
      if (t.status === TireStatus.INSTALADO) installedCount++;
      if (t.status === TireStatus.EN_DEPOSITO) warehouseCount++;
      if (t.status === TireStatus.EN_RECAPADO) retreadCount++;
      if (t.status === TireStatus.DADO_DE_BAJA || t.status === TireStatus.FUERA_DE_SERVICIO) retiredCount++;
      if (t.profundidadActualMm <= 3.0 && t.status !== TireStatus.DADO_DE_BAJA) lowDepthAlertCount++;

      const retreadsCost = t.retreads.reduce((sum, r) => sum + Number(r.costo || 0), 0);
      const tireTotalCost = Number(t.precioCompra || 0) + retreadsCost;
      totalInvestment += tireTotalCost;
      totalKm += Number(t.kilometrosRecorridos || 0);
      totalRetreadsCount += t.cantidadRecapados || 0;

      const cpk = this.calculateCPK(t.precioCompra, retreadsCost, t.kilometrosRecorridos);
      totalCpkSum += cpk;
    });

    const averageCpk = totalTires > 0 ? Number((totalCpkSum / totalTires).toFixed(4)) : 0;

    return {
      totalTires,
      installedCount,
      warehouseCount,
      retreadCount,
      retiredCount,
      lowDepthAlertCount,
      totalInvestment: Math.round(totalInvestment),
      averageCpk,
      totalRetreadsCount,
      averageKmPerTire: totalTires > 0 ? Math.round(totalKm / totalTires) : 0,
    };
  }

  async getVehicleAxlePositions(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        tires: {
          include: { retreads: { select: { costo: true } } },
        },
      },
    });

    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    const standardPositions = [
      { id: 'E1_IZQ', label: 'Eje 1 Izquierda (Direccional)', axle: 1, side: 'IZQ' },
      { id: 'E1_DER', label: 'Eje 1 Derecha (Direccional)', axle: 1, side: 'DER' },
      { id: 'E2_IZQ_EXT', label: 'Eje 2 Izq Exterior (Tracción)', axle: 2, side: 'IZQ_EXT' },
      { id: 'E2_IZQ_INT', label: 'Eje 2 Izq Interior (Tracción)', axle: 2, side: 'IZQ_INT' },
      { id: 'E2_DER_INT', label: 'Eje 2 Der Interior (Tracción)', axle: 2, side: 'DER_INT' },
      { id: 'E2_DER_EXT', label: 'Eje 2 Der Exterior (Tracción)', axle: 2, side: 'DER_EXT' },
      { id: 'E3_IZQ_EXT', label: 'Eje 3 Izq Exterior (Tracción)', axle: 3, side: 'IZQ_EXT' },
      { id: 'E3_IZQ_INT', label: 'Eje 3 Izq Interior (Tracción)', axle: 3, side: 'IZQ_INT' },
      { id: 'E3_DER_INT', label: 'Eje 3 Der Interior (Tracción)', axle: 3, side: 'DER_INT' },
      { id: 'E3_DER_EXT', label: 'Eje 3 Der Exterior (Tracción)', axle: 3, side: 'DER_EXT' },
      { id: 'AUXILIAR_1', label: 'Rueda Auxiliar 1', axle: 0, side: 'AUX' },
      { id: 'AUXILIAR_2', label: 'Rueda Auxiliar 2', axle: 0, side: 'AUX' },
    ];

    const positionsMap = standardPositions.map((pos) => {
      const tire = vehicle.tires.find((t) => t.posicion === pos.id);
      let tireData = null;
      if (tire) {
        const retreadsCost = tire.retreads.reduce((sum, r) => sum + Number(r.costo || 0), 0);
        tireData = {
          ...tire,
          cpk: this.calculateCPK(tire.precioCompra, retreadsCost, tire.kilometrosRecorridos),
        };
      }
      return {
        ...pos,
        tire: tireData,
      };
    });

    return {
      vehicle,
      positionsMap,
    };
  }

  async findOne(id: string) {
    const tire = await this.prisma.tire.findUnique({
      where: { id },
      include: {
        vehicle: true,
        movements: { orderBy: { createdAt: 'desc' } },
        retreads: { orderBy: { createdAt: 'desc' } },
        inspections: { orderBy: { fecha: 'desc' } },
      },
    });

    if (!tire) throw new NotFoundException('Neumático no encontrado');

    const retreadsCost = tire.retreads.reduce((sum, r) => sum + Number(r.costo || 0), 0);
    const cpk = this.calculateCPK(tire.precioCompra, retreadsCost, tire.kilometrosRecorridos);

    return {
      ...tire,
      cpk,
      retreadsCost,
    };
  }

  async create(dto: CreateTireDto) {
    const qrCode = dto.codigoQR || `QR-${dto.codigoInterno}-${Date.now().toString().slice(-6)}`;
    const profundidadActualMm = dto.profundidadActualMm ?? dto.profundidadInicialMm;

    const tire = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tire.create({
        data: {
          ...dto,
          codigoQR: qrCode,
          profundidadActualMm,
          fechaCompra: new Date(dto.fechaCompra),
          status: dto.status || TireStatus.EN_DEPOSITO,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: created.id,
          tipoMovimiento: 'COMPRA',
          posicionDestino: 'DEPÓSITO CENTRAL',
          profundidadMm: created.profundidadInicialMm,
          presionPsi: created.presionRecomendadaPsi,
          costo: created.precioCompra,
          motivo: 'Alta inicial por compra de neumático',
        },
      });

      return created;
    });

    return this.findOne(tire.id);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    if (dto.fechaCompra) dto.fechaCompra = new Date(dto.fechaCompra);
    return this.prisma.tire.update({
      where: { id },
      data: dto,
    });
  }

  async install(id: string, dto: InstallTireDto) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    if (tire.status === TireStatus.INSTALADO) {
      throw new BadRequestException(`El neumático ya está instalado en el vehículo ${tire.vehicleId}`);
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');

    // Check if position is occupied
    const occupied = await this.prisma.tire.findFirst({
      where: { vehicleId: dto.vehicleId, posicion: dto.posicion, status: TireStatus.INSTALADO },
    });
    if (occupied) {
      throw new BadRequestException(`La posición ${dto.posicion} ya está ocupada por el neumático ${occupied.codigoInterno}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.tire.update({
        where: { id },
        data: {
          status: TireStatus.INSTALADO,
          vehicleId: dto.vehicleId,
          posicion: dto.posicion,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: id,
          vehicleId: dto.vehicleId,
          tipoMovimiento: 'INSTALACION',
          posicionOrigen: 'DEPÓSITO',
          posicionDestino: `${vehicle.patente} (${dto.posicion})`,
          kilometrajeVehiculo: dto.kilometrajeVehiculo || vehicle.kilometraje || 0,
          profundidadMm: tire.profundidadActualMm,
          presionPsi: tire.presionActualPsi || tire.presionRecomendadaPsi,
          motivo: dto.motivo || `Montado en posición ${dto.posicion} de ${vehicle.patente}`,
          usuario: dto.usuario || 'OPERADOR',
        },
      });

      return res;
    });

    return this.findOne(updated.id);
  }

  async dismount(id: string, dto: DismountTireDto) {
    const tire = await this.prisma.tire.findUnique({ where: { id }, include: { vehicle: true } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    const oldPos = tire.posicion;
    const oldVehicle = tire.vehicle?.patente || 'Vehículo';

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.tire.update({
        where: { id },
        data: {
          status: TireStatus.EN_DEPOSITO,
          vehicleId: null,
          posicion: null,
          profundidadActualMm: dto.profundidadMm ?? tire.profundidadActualMm,
          presionActualPsi: dto.presionPsi ?? tire.presionActualPsi,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: id,
          tipoMovimiento: 'DESMONTE',
          posicionOrigen: `${oldVehicle} (${oldPos || 'DESCONOCIDO'})`,
          posicionDestino: 'DEPÓSITO CENTRAL',
          profundidadMm: dto.profundidadMm ?? tire.profundidadActualMm,
          presionPsi: dto.presionPsi ?? tire.presionActualPsi,
          motivo: dto.motivo || 'Desmonte a depósito',
          usuario: dto.usuario || 'OPERADOR',
        },
      });

      return res;
    });

    return this.findOne(updated.id);
  }

  async rotate(dto: RotateTiresDto) {
    const t1 = await this.prisma.tire.findUnique({ where: { id: dto.tireId1 }, include: { vehicle: true } });
    const t2 = await this.prisma.tire.findUnique({ where: { id: dto.tireId2 }, include: { vehicle: true } });

    if (!t1 || !t2) throw new NotFoundException('Uno o ambos neumáticos no fueron encontrados');

    const pos1 = t1.posicion;
    const pos2 = t2.posicion;
    const v1 = t1.vehicleId;
    const v2 = t2.vehicleId;

    await this.prisma.$transaction([
      this.prisma.tire.update({
        where: { id: t1.id },
        data: { vehicleId: v2, posicion: pos2 },
      }),
      this.prisma.tire.update({
        where: { id: t2.id },
        data: { vehicleId: v1, posicion: pos1 },
      }),
      this.prisma.tireMovement.create({
        data: {
          tireId: t1.id,
          vehicleId: v2 || undefined,
          tipoMovimiento: 'ROTACION',
          posicionOrigen: `${t1.vehicle?.patente || 'Depósito'} (${pos1 || '-'})`,
          posicionDestino: `${t2.vehicle?.patente || 'Depósito'} (${pos2 || '-'})`,
          motivo: dto.motivo || 'Rotación de neumáticos',
          usuario: dto.usuario || 'OPERADOR',
        },
      }),
      this.prisma.tireMovement.create({
        data: {
          tireId: t2.id,
          vehicleId: v1 || undefined,
          tipoMovimiento: 'ROTACION',
          posicionOrigen: `${t2.vehicle?.patente || 'Depósito'} (${pos2 || '-'})`,
          posicionDestino: `${t1.vehicle?.patente || 'Depósito'} (${pos1 || '-'})`,
          motivo: dto.motivo || 'Rotación de neumáticos',
          usuario: dto.usuario || 'OPERADOR',
        },
      }),
    ]);

    return { message: 'Rotación realizada exitosamente' };
  }

  async sendToRetread(id: string, dto: SendToRetreadDto) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    if (tire.cantidadRecapados >= tire.maxRecapadosPermitidos) {
      throw new BadRequestException(`El neumático ya alcanzó el límite máximo de ${tire.maxRecapadosPermitidos} recapados permitidos`);
    }

    const nextRetreadNum = tire.cantidadRecapados + 1;

    const [updated, retread] = await this.prisma.$transaction([
      this.prisma.tire.update({
        where: { id },
        data: {
          status: TireStatus.EN_RECAPADO,
          vehicleId: null,
          posicion: null,
        },
      }),
      this.prisma.tireRetread.create({
        data: {
          tireId: id,
          empresaRecapadora: dto.empresaRecapadora,
          numeroRecapado: nextRetreadNum,
          fechaEnvio: new Date(dto.fechaEnvio),
          costo: dto.costo,
          profundidadNuevaMm: 14.0,
          observaciones: dto.observaciones,
          status: 'EN_PROCESO',
        },
      }),
      this.prisma.tireMovement.create({
        data: {
          tireId: id,
          tipoMovimiento: 'ENVIO_RECAPADO',
          posicionOrigen: tire.posicion ? `Vehículo (${tire.posicion})` : 'DEPÓSITO',
          posicionDestino: `RECAPADORA: ${dto.empresaRecapadora}`,
          costo: dto.costo,
          motivo: `Envío a recapado #${nextRetreadNum}`,
        },
      }),
    ]);

    return { tire: updated, retread };
  }

  async receiveFromRetread(id: string, dto: ReceiveFromRetreadDto) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    const pendingRetread = await this.prisma.tireRetread.findFirst({
      where: { tireId: id, status: 'EN_PROCESO' },
      orderBy: { createdAt: 'desc' },
    });

    await this.prisma.$transaction(async (tx) => {
      if (pendingRetread) {
        await tx.tireRetread.update({
          where: { id: pendingRetread.id },
          data: {
            fechaRecepcion: new Date(dto.fechaRecepcion),
            profundidadNuevaMm: dto.profundidadNuevaMm,
            costo: dto.costo ?? pendingRetread.costo,
            status: 'COMPLETADO',
            observaciones: dto.observaciones || pendingRetread.observaciones,
          },
        });
      }

      await tx.tire.update({
        where: { id },
        data: {
          status: TireStatus.EN_DEPOSITO,
          cantidadRecapados: tire.cantidadRecapados + 1,
          profundidadActualMm: dto.profundidadNuevaMm,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: id,
          tipoMovimiento: 'RECEPCION_RECAPADO',
          posicionOrigen: pendingRetread ? `RECAPADORA: ${pendingRetread.empresaRecapadora}` : 'RECAPADORA',
          posicionDestino: 'DEPÓSITO CENTRAL',
          profundidadMm: dto.profundidadNuevaMm,
          costo: dto.costo || 0,
          motivo: `Recepción post-recapado #${tire.cantidadRecapados + 1}`,
        },
      });
    });

    return this.findOne(id);
  }

  async recordInspection(id: string, dto: CreateTireInspectionDto) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    const inspection = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tireInspection.create({
        data: {
          tireId: id,
          vehicleId: tire.vehicleId,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
          inspector: dto.inspector,
          profundidadMm: dto.profundidadMm,
          presionPsi: dto.presionPsi,
          estadoVisual: dto.estadoVisual,
          resultado: dto.resultado,
          fotografiaUrl: dto.fotografiaUrl,
          observaciones: dto.observaciones,
        },
      });

      await tx.tire.update({
        where: { id },
        data: {
          profundidadActualMm: dto.profundidadMm,
          presionActualPsi: dto.presionPsi,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: id,
          vehicleId: tire.vehicleId || undefined,
          tipoMovimiento: 'INSPECCION',
          profundidadMm: dto.profundidadMm,
          presionPsi: dto.presionPsi,
          motivo: `Inspección de rutina - Resultado: ${dto.resultado}`,
          usuario: dto.inspector,
        },
      });

      return created;
    });

    return inspection;
  }

  async retire(id: string, motivo: string) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.tire.update({
        where: { id },
        data: {
          status: TireStatus.DADO_DE_BAJA,
          vehicleId: null,
          posicion: null,
        },
      });

      await tx.tireMovement.create({
        data: {
          tireId: id,
          tipoMovimiento: 'BAJA',
          posicionOrigen: tire.posicion || 'DEPÓSITO',
          posicionDestino: 'FUERA_DE_SERVICIO',
          motivo: motivo || 'Baja definitiva del activo',
        },
      });

      return res;
    });

    return updated;
  }

  async remove(id: string) {
    const tire = await this.prisma.tire.findUnique({ where: { id } });
    if (!tire) throw new NotFoundException('Neumático no encontrado');
    return this.prisma.tire.delete({ where: { id } });
  }

  async exportReport(query: any = {}) {
    const res = await this.findAll({ ...query, limit: 1000 });
    return res.data.map((t: any) => ({
      codigoInterno: t.codigoInterno,
      codigoQR: t.codigoQR,
      numeroSerie: t.numeroSerie,
      marca: t.marca,
      modelo: t.modelo,
      medida: t.medida,
      tipo: t.tipo,
      status: t.status,
      vehiculo: t.vehicle ? t.vehicle.patente : 'DEPÓSITO',
      posicion: t.posicion || '-',
      profundidadActualMm: t.profundidadActualMm,
      presionActualPsi: t.presionActualPsi || '-',
      kilometrosRecorridos: t.kilometrosRecorridos,
      cantidadRecapados: t.cantidadRecapados,
      precioCompra: t.precioCompra,
      costoRecapados: t.retreadsCost,
      cpk: t.cpk,
    }));
  }
}
