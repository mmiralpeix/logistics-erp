import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    const where = search
      ? { OR: [{ codigo: { contains: search, mode: 'insensitive' as any } }, { descripcion: { contains: search, mode: 'insensitive' as any } }] }
      : {};
    return this.prisma.product.findMany({ where, orderBy: { descripcion: 'asc' } });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Producto/servicio no encontrado');
    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { codigo: dto.codigo } });
    if (existing) throw new ConflictException('Ya existe un producto/servicio con ese código');
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
