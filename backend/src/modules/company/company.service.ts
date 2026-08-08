import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertCompanyDto } from './dto/upsert-company.dto';
import { CreateSalesPointDto, UpdateSalesPointDto } from './dto/sales-point.dto';

/**
 * Identidad fiscal de la empresa emisora (etapa 5/10 del módulo de facturación).
 * Sistema single-tenant hoy (ver diagnóstico sección A) — se opera siempre sobre
 * la única Company activa, sin inventar datos: mientras nadie cargue esto, queda null.
 */
@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  getActive() {
    return this.prisma.company.findFirst({
      where: { isActive: true },
      include: { salesPoints: true, jurisdiction: true },
    });
  }

  async upsert(dto: UpsertCompanyDto) {
    const existing = await this.prisma.company.findFirst({ where: { isActive: true } });
    if (existing) {
      if (dto.cuit !== existing.cuit) {
        const cuitTaken = await this.prisma.company.findUnique({ where: { cuit: dto.cuit } });
        if (cuitTaken) throw new ConflictException('Ya existe una empresa con ese CUIT');
      }
      return this.prisma.company.update({ where: { id: existing.id }, data: dto, include: { salesPoints: true } });
    }
    return this.prisma.company.create({ data: dto, include: { salesPoints: true } });
  }

  async addSalesPoint(dto: CreateSalesPointDto) {
    const company = await this.prisma.company.findFirst({ where: { isActive: true } });
    if (!company) throw new NotFoundException('Todavía no hay una empresa cargada — cargar los datos fiscales primero (PATCH /company)');
    const existing = await this.prisma.companySalesPoint.findUnique({ where: { companyId_numero: { companyId: company.id, numero: dto.numero } } });
    if (existing) throw new ConflictException('Ya existe ese punto de venta para esta empresa');
    return this.prisma.companySalesPoint.create({ data: { ...dto, companyId: company.id } });
  }

  async updateSalesPoint(id: string, dto: UpdateSalesPointDto) {
    const salesPoint = await this.prisma.companySalesPoint.findUnique({ where: { id } });
    if (!salesPoint) throw new NotFoundException('Punto de venta no encontrado');
    return this.prisma.companySalesPoint.update({ where: { id }, data: dto });
  }
}
