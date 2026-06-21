import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { vehicleId?: string; driverId?: string; tripId?: string; tipo?: string }) {
    const { vehicleId, driverId, tripId, tipo } = filters;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (tripId) where.tripId = tripId;
    if (tipo) where.tipo = tipo as DocumentType;
    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async create(file: Express.Multer.File, body: any) {
    const isExpired = body.fechaVencimiento ? new Date(body.fechaVencimiento) < new Date() : false;
    return this.prisma.document.create({
      data: {
        ...body,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        isExpired,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({ where: { id } });
  }

  async getExpiringSoon() {
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.document.findMany({
      where: { fechaVencimiento: { lte: in30, gte: new Date() } },
      include: {
        vehicle: { select: { patente: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async getFileStream(id: string) {
    const doc = await this.findOne(id);
    const filePath = path.resolve(doc.filePath);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado en el servidor');
    const stream = fs.createReadStream(filePath);
    return { stream, doc };
  }
}
