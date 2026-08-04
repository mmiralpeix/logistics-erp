import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { RecordShiftEventDto } from './dto/record-shift-event.dto';
import { UpdateDriverScheduleDto } from './dto/update-driver-schedule.dto';
import { calculateDriverScheduleStatus } from './utils/schedule-calculator.util';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, page: any = 1, limit: any = 20) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 20);
    const skip = (p - 1) * l;
    const where: any = { isActive: true };
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search } },
      { telefono: { contains: search } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.driver.findMany({
        where, skip, take: l,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { _count: { select: { trips: true } } },
      }),
      this.prisma.driver.count({ where }),
    ]);

    const enrichedData = data.map((driver) => ({
      ...driver,
      scheduleMetrics: calculateDriverScheduleStatus(driver),
    }));

    return { data: enrichedData, total, page: p, totalPages: Math.ceil(total / l) };
  }

  async findOne(id: string) {
    const d = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        trips: { orderBy: { createdAt: 'desc' }, take: 10, include: { vehicle: true, client: true } },
        trainings: { orderBy: { fecha: 'desc' } },
        incidents: { orderBy: { fecha: 'desc' }, take: 10 },
        shiftLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        documents: true,
        _count: { select: { trips: true } },
      },
    });
    if (!d) throw new NotFoundException('Conductor no encontrado');
    return {
      ...d,
      scheduleMetrics: calculateDriverScheduleStatus(d),
    };
  }

  async create(dto: CreateDriverDto) {
    return this.prisma.driver.create({ data: dto });
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: { isActive: false } });
  }

  async getExpiringLicenses() {
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.driver.findMany({
      where: {
        isActive: true,
        OR: [
          { licenciaVencimiento: { lte: in30 } },
          { examenMedicoVencimiento: { lte: in30 } },
          { psicofisicoVencimiento: { lte: in30 } },
          { certificadoCargasPeligrosas: { lte: in30 } },
        ],
      },
    });
  }

  async getAvailableForDate(date: Date) {
    const safeDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    const tripsOnDate = await this.prisma.trip.findMany({
      where: {
        status: { in: ['EN_CURSO', 'PROGRAMADO'] as any },
        fechaSalidaProgramada: { lte: safeDate },
        fechaLlegadaEstimada: { gte: safeDate },
      },
      select: { driverId: true },
    });
    const busyIds = tripsOnDate.map((t) => t.driverId).filter(Boolean);
    return this.prisma.driver.findMany({
      where: { isActive: true, ...(busyIds.length > 0 ? { id: { notIn: busyIds } } : {}) },
    });
  }

  async addTraining(driverId: string, data: any) {
    await this.findOne(driverId);
    return this.prisma.driverTraining.create({ data: { ...data, driverId } });
  }

  // --- Driver Schedule Submodule Methods ---

  async getSchedule(query: any = {}) {
    const { status, modalidad, supervisor, search } = query;
    const where: any = { isActive: true };

    if (supervisor) {
      where.supervisor = { contains: supervisor, mode: 'insensitive' };
    }
    if (modalidad) {
      where.modalidadLaboral = modalidad;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { dni: { contains: search } },
      ];
    }

    const drivers = await this.prisma.driver.findMany({
      where,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        trips: { where: { status: 'EN_CURSO' as any }, select: { numero: true, destino: true } },
        _count: { select: { trips: true } },
      },
    });

    const now = new Date();
    let result = drivers.map((d) => {
      const metrics = calculateDriverScheduleStatus(d, now);
      return {
        ...d,
        scheduleMetrics: metrics,
      };
    });

    if (status) {
      result = result.filter((item) => item.scheduleMetrics.status === status);
    }

    return result;
  }

  async getScheduleKpis() {
    const drivers = await this.prisma.driver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        modalidadLaboral: true,
        diasTrabajo: true,
        diasDescanso: true,
        fechaInicioTurno: true,
        fechaRegreso: true,
        fechaInicioDescanso: true,
      },
    });

    const now = new Date();
    const metricsList = drivers.map((d) => ({
      driver: `${d.firstName} ${d.lastName}`,
      metrics: calculateDriverScheduleStatus(d, now),
    }));

    let enRutaCount = 0;
    let descansandoCount = 0;
    let proximoDescansoCount = 0;
    let excedidosCount = 0;
    let totalRutaDays = 0;
    let totalRestDays = 0;
    let rutaDriverCount = 0;
    let restDriverCount = 0;
    let topDriverEnRuta: { name: string; days: number } | null = null;

    metricsList.forEach(({ driver, metrics }) => {
      if (metrics.status === 'EN_RUTA') enRutaCount++;
      if (metrics.status === 'DESCANSANDO') descansandoCount++;
      if (metrics.status === 'PROXIMO_A_DESCANSO') proximoDescansoCount++;
      if (metrics.status === 'EXCEDIDO' || metrics.status === 'EXCEDIDO_DESCANSO') excedidosCount++;

      if (metrics.diasEnRuta > 0) {
        totalRutaDays += metrics.diasEnRuta;
        rutaDriverCount++;
        if (!topDriverEnRuta || metrics.diasEnRuta > topDriverEnRuta.days) {
          topDriverEnRuta = { name: driver, days: metrics.diasEnRuta };
        }
      }

      if (metrics.diasEnDescanso > 0) {
        totalRestDays += metrics.diasEnDescanso;
        restDriverCount++;
      }
    });

    return {
      totalDrivers: drivers.length,
      enRutaCount,
      descansandoCount,
      proximoDescansoCount,
      excedidosCount,
      promedioDiasRuta: rutaDriverCount > 0 ? Number((totalRutaDays / rutaDriverCount).toFixed(1)) : 0,
      promedioDiasDescanso: restDriverCount > 0 ? Number((totalRestDays / restDriverCount).toFixed(1)) : 0,
      topDriverEnRuta,
    };
  }

  async recordShiftEvent(driverId: string, dto: RecordShiftEventDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Conductor no encontrado');

    const eventDate = dto.fecha ? new Date(dto.fecha) : new Date();
    const currentMetrics = calculateDriverScheduleStatus(driver, eventDate);

    const updateData: any = {};
    let diasTrabajados: number | null = null;
    let diasDescansados: number | null = null;

    if (dto.tipoRegistro === 'INICIO_TURNO') {
      updateData.fechaInicioTurno = eventDate;
      updateData.fechaRegreso = null;
      updateData.fechaInicioDescanso = null;
    } else if (dto.tipoRegistro === 'REGRESO') {
      updateData.fechaRegreso = eventDate;
      diasTrabajados = currentMetrics.diasEnRuta;
    } else if (dto.tipoRegistro === 'INICIO_DESCANSO') {
      updateData.fechaInicioDescanso = eventDate;
      updateData.fechaInicioTurno = null;
      updateData.fechaRegreso = null;
      diasTrabajados = currentMetrics.diasEnRuta || null;
    } else if (dto.tipoRegistro === 'FIN_DESCANSO') {
      diasDescansados = currentMetrics.diasEnDescanso;
      updateData.fechaInicioDescanso = null;
    }

    const [updatedDriver, log] = await this.prisma.$transaction([
      this.prisma.driver.update({
        where: { id: driverId },
        data: updateData,
      }),
      this.prisma.driverShiftLog.create({
        data: {
          driverId,
          tipoRegistro: dto.tipoRegistro,
          fechaInicio: eventDate,
          diasTrabajados,
          diasDescansados,
          excedido: currentMetrics.esExcedido,
          notas: dto.notas || null,
        },
      }),
    ]);

    return {
      driver: updatedDriver,
      log,
      scheduleMetrics: calculateDriverScheduleStatus(updatedDriver),
    };
  }

  async getShiftHistory(driverId: string) {
    await this.findOne(driverId);
    return this.prisma.driverShiftLog.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateScheduleConfig(driverId: string, dto: UpdateDriverScheduleDto) {
    await this.findOne(driverId);
    const updated = await this.prisma.driver.update({
      where: { id: driverId },
      data: {
        modalidadLaboral: dto.modalidadLaboral,
        diasTrabajo: dto.diasTrabajo,
        diasDescanso: dto.diasDescanso,
        supervisor: dto.supervisor,
        fechaInicioTurno: dto.fechaInicioTurno ? new Date(dto.fechaInicioTurno) : undefined,
        fechaRegreso: dto.fechaRegreso ? new Date(dto.fechaRegreso) : undefined,
        fechaInicioDescanso: dto.fechaInicioDescanso ? new Date(dto.fechaInicioDescanso) : undefined,
      },
    });

    await this.prisma.driverShiftLog.create({
      data: {
        driverId,
        tipoRegistro: 'CAMBIO_MODALIDAD',
        fechaInicio: new Date(),
        notas: `Modalidad actualizada a ${dto.modalidadLaboral || updated.modalidadLaboral} (${updated.diasTrabajo}x${updated.diasDescanso})`,
      },
    });

    return {
      driver: updated,
      scheduleMetrics: calculateDriverScheduleStatus(updated),
    };
  }

  async exportScheduleReport(query: any = {}) {
    const drivers = await this.getSchedule(query);
    const rows = drivers.map((d: any) => {
      const m = d.scheduleMetrics;
      return {
        dni: d.dni,
        nombre: `${d.firstName} ${d.lastName}`,
        modalidad: m.modalidadLaboral,
        estado: m.statusLabel,
        diasEnRuta: m.diasEnRuta,
        diasTrabajoPermitidos: m.diasTrabajo,
        diasEnDescanso: m.diasEnDescanso,
        diasDescansoPermitidos: m.diasDescanso,
        excedido: m.esExcedido ? 'SÍ' : 'NO',
        proximoCambio: m.proximoCambioEstado ? m.proximoCambioEstado.toISOString().slice(0, 10) : '-',
        supervisor: d.supervisor || 'N/A',
      };
    });
    return rows;
  }
}
