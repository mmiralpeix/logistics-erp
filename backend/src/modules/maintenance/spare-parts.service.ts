import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SparePartsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; categoria?: string; tipoVehiculo?: string }) {
    const where: any = {};

    if (query?.categoria) {
      where.categoria = query.categoria;
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { nombre: { contains: q, mode: 'insensitive' } },
        { ubicacion: { contains: q, mode: 'insensitive' } },
      ];
    }

    const parts = await this.prisma.sparePart.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });

    if (query?.tipoVehiculo) {
      const targetType = query.tipoVehiculo.toUpperCase();
      return parts.filter((p) => {
        if (!p.tiposCompatibles || p.tiposCompatibles === 'TODOS') return true;
        const types = p.tiposCompatibles.split(',').map((t) => t.trim().toUpperCase());
        return types.includes(targetType) || types.includes('TODOS');
      });
    }

    return parts;
  }

  async findOne(id: string) {
    const part = await this.prisma.sparePart.findUnique({ where: { id } });
    if (!part) throw new NotFoundException('Repuesto no encontrado');
    return part;
  }

  async create(dto: any) {
    if (!dto.sku) {
      dto.sku = `SKU-${Date.now().toString().slice(-6)}`;
    }

    const existing = await this.prisma.sparePart.findUnique({ where: { sku: dto.sku } });
    if (existing) {
      throw new BadRequestException(`El SKU ${dto.sku} ya se encuentra registrado`);
    }

    return this.prisma.sparePart.create({
      data: {
        sku: dto.sku,
        nombre: dto.nombre,
        categoria: dto.categoria || 'FILTROS',
        ambito: dto.ambito || 'UNIVERSAL',
        stockActual: Number(dto.stockActual) || 0,
        stockMinimo: Number(dto.stockMinimo) || 1,
        precioUnitario: Number(dto.precioUnitario) || 0,
        ubicacion: dto.ubicacion || null,
        tiposCompatibles: dto.tiposCompatibles || 'TODOS',
        marcasCompatibles: dto.marcasCompatibles || 'TODAS',
        tipoEnganche: dto.tipoEnganche || 'TODOS',
        modelosCompatibles: dto.modelosCompatibles || null,
        notas: dto.notas || null,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.sparePart.update({
      where: { id },
      data: {
        ...dto,
        stockActual: dto.stockActual !== undefined ? Number(dto.stockActual) : undefined,
        stockMinimo: dto.stockMinimo !== undefined ? Number(dto.stockMinimo) : undefined,
        precioUnitario: dto.precioUnitario !== undefined ? Number(dto.precioUnitario) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sparePart.delete({ where: { id } });
  }

  async adjustStock(id: string, delta: number) {
    const part = await this.findOne(id);
    const newStock = Math.max(0, part.stockActual + delta);
    return this.prisma.sparePart.update({
      where: { id },
      data: { stockActual: newStock },
    });
  }
}
