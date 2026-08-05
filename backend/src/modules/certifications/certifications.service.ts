import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@Injectable()
export class CertificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCertificationDto) {
    const { clientId, contractId, numeroOC, periodo, tripIds, estado, diasEnGestion, observaciones } = dto;

    if (!tripIds || tripIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un viaje para certificar');
    }

    // Get client
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    // Calculate next sequential certificate number for this client
    const lastCert = await this.prisma.certification.findFirst({
      where: { clientId },
      orderBy: { numeroCertificado: 'desc' },
    });
    const nextNum = (lastCert?.numeroCertificado || 0) + 1;

    // Fetch trips to include
    const trips = await this.prisma.trip.findMany({
      where: { id: { in: tripIds }, clientId },
    });

    if (trips.length === 0) {
      throw new BadRequestException('No se encontraron viajes válidos para certificar');
    }

    // Calculate totals
    let totalTnExcedente = 0;
    let montoTotal = 0;

    trips.forEach((t) => {
      let excessKg = t.pesoExcedenteKg || 0;
      if (!excessKg && t.pesoCarga && t.pesoCarga > 30000) {
        excessKg = t.pesoCarga - 30000;
      }
      totalTnExcedente += excessKg / 1000;
      // tarifaAcordada is already the full total (base + excess-per-ton, see TripModal's
      // calculatedTotalRate) - adding montoExcedente again here double-counts the excess.
      montoTotal += t.tarifaAcordada || 0;
    });

    const numCertStr = nextNum.toString();

    // Create certification in a transaction
    return this.prisma.$transaction(async (tx) => {
      const cert = await tx.certification.create({
        data: {
          numeroCertificado: nextNum,
          clientId,
          contractId,
          numeroOC: numeroOC || (trips[0]?.numeroOCCliente ?? null),
          periodo: periodo || `Certificación #${nextNum}`,
          cantidadViajes: trips.length,
          toneladasExcedentes: Math.round(totalTnExcedente * 100) / 100,
          montoTotal: Math.round(montoTotal * 100) / 100,
          estado: estado || 'EN_REVISION',
          diasEnGestion: diasEnGestion || 0,
          observaciones,
        },
      });

      // Update trips to link to certification
      await tx.trip.updateMany({
        where: { id: { in: tripIds } },
        data: {
          certificationId: cert.id,
          numeroCertificado: numCertStr,
          estadoCertificacion: 'CERTIFICADO',
        },
      });

      return tx.certification.findUnique({
        where: { id: cert.id },
        include: {
          client: { select: { id: true, razonSocial: true, cuit: true } },
          contract: true,
          trips: {
            include: {
              driver: { select: { firstName: true, lastName: true } },
              vehicle: { select: { patente: true } },
            },
          },
        },
      });
    });
  }

  async findAll(query: { clientId?: string; contractId?: string; estado?: string; page?: number; limit?: number }) {
    const { clientId, contractId, estado } = query;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (contractId) where.contractId = contractId;
    if (estado) where.estado = estado;

    const [items, total] = await Promise.all([
      this.prisma.certification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { numeroCertificado: 'desc' },
        include: {
          client: { select: { id: true, razonSocial: true, cuit: true } },
          contract: { select: { id: true, numero: true, descripcion: true } },
          invoices: { select: { id: true, numero: true, status: true, total: true } },
          _count: { select: { trips: true } },
        },
      }),
      this.prisma.certification.count({ where }),
    ]);

    return {
      data: items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUncertifiedTrips(clientId?: string) {
    const where: any = {
      estadoCertificacion: 'SIN_CERTIFICAR',
      status: 'FINALIZADO',
    };
    if (clientId) where.clientId = clientId;

    return this.prisma.trip.findMany({
      where,
      orderBy: { fechaSalidaProgramada: 'desc' },
      include: {
        client: { select: { id: true, razonSocial: true } },
        vehicle: { select: { patente: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findOne(id: string) {
    const cert = await this.prisma.certification.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        trips: {
          include: {
            vehicle: { select: { id: true, patente: true, tipo: true } },
            trailer: { select: { id: true, patente: true } },
            driver: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        invoices: true,
      },
    });

    if (!cert) throw new NotFoundException('Certificación no encontrada');
    return cert;
  }

  async update(id: string, dto: UpdateCertificationDto) {
    await this.findOne(id);
    const { estado, observaciones, diasEnGestion, periodo, numeroOC } = dto;

    const dataToUpdate: any = {};
    if (estado !== undefined) {
      dataToUpdate.estado = estado;
      if (estado === 'APROBADO') dataToUpdate.fechaAprobacion = new Date();
    }
    if (observaciones !== undefined) dataToUpdate.observaciones = observaciones;
    if (diasEnGestion !== undefined) dataToUpdate.diasEnGestion = diasEnGestion;
    if (periodo !== undefined) dataToUpdate.periodo = periodo;
    if (numeroOC !== undefined) dataToUpdate.numeroOC = numeroOC;

    return this.prisma.certification.update({
      where: { id },
      data: dataToUpdate,
      include: {
        client: { select: { id: true, razonSocial: true } },
        contract: true,
      },
    });
  }

  async remove(id: string) {
    const cert = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Unlink trips
      await tx.trip.updateMany({
        where: { certificationId: id },
        data: {
          certificationId: null,
          numeroCertificado: null,
          estadoCertificacion: 'SIN_CERTIFICAR',
        },
      });

      // Delete certification
      await tx.certification.delete({ where: { id } });

      return { message: `Certificación #${cert.numeroCertificado} eliminada y viajes liberados` };
    });
  }
}
