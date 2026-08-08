import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiscalAuditAction } from '@prisma/client';
import { CreateJurisdictionDto, UpdateJurisdictionDto } from './dto/jurisdiction.dto';
import { CreateTaxRuleDto, UpdateTaxRuleDto } from './dto/tax-rule.dto';

/**
 * Administración de jurisdicciones y reglas fiscales (etapa 12). Todo cambio a una TaxRule
 * queda en FiscalRuleAuditLog — sección 19 del pedido original ("no permitir que un usuario
 * común modifique reglas fiscales críticas... registrar auditoría de cada cambio").
 *
 * Las reglas nunca se borran físicamente: una regla vieja pudo haber sido la vigente al
 * momento de emitir una factura pasada (Invoice.taxRulesApplied la referencia por id) —
 * "desactivar" le cierra la vigencia (validTo) en vez de eliminarla.
 */
@Injectable()
export class FiscalAdminService {
  constructor(private prisma: PrismaService) {}

  listJurisdictions() {
    return this.prisma.taxJurisdiction.findMany({ orderBy: { nombre: 'asc' } });
  }

  async createJurisdiction(dto: CreateJurisdictionDto) {
    const existing = await this.prisma.taxJurisdiction.findFirst({ where: { OR: [{ nombre: dto.nombre }, { codigo: dto.codigo }] } });
    if (existing) throw new ConflictException('Ya existe una jurisdicción con ese nombre o código');
    return this.prisma.taxJurisdiction.create({ data: dto });
  }

  async updateJurisdiction(id: string, dto: UpdateJurisdictionDto) {
    await this.getJurisdiction(id);
    return this.prisma.taxJurisdiction.update({ where: { id }, data: dto });
  }

  private async getJurisdiction(id: string) {
    const j = await this.prisma.taxJurisdiction.findUnique({ where: { id } });
    if (!j) throw new NotFoundException('Jurisdicción no encontrada');
    return j;
  }

  listTaxRules(filters: { jurisdictionId?: string; tipo?: string; status?: string }) {
    const where: any = {};
    if (filters.jurisdictionId) where.jurisdictionId = filters.jurisdictionId;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.status) where.status = filters.status;
    return this.prisma.taxRule.findMany({ where, include: { jurisdiction: true }, orderBy: { validFrom: 'desc' } });
  }

  private async getTaxRule(id: string) {
    const r = await this.prisma.taxRule.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Regla fiscal no encontrada');
    return r;
  }

  async createTaxRule(dto: CreateTaxRuleDto, userId: string) {
    const rule = await this.prisma.taxRule.create({
      data: { ...dto, validFrom: new Date(dto.validFrom), validTo: dto.validTo ? new Date(dto.validTo) : null },
    });
    await this.prisma.fiscalRuleAuditLog.create({
      data: { taxRuleId: rule.id, userId, accion: FiscalAuditAction.CREATED, valorNuevo: rule as any },
    });
    return rule;
  }

  async updateTaxRule(id: string, dto: UpdateTaxRuleDto, userId: string) {
    const before = await this.getTaxRule(id);
    const rule = await this.prisma.taxRule.update({
      where: { id },
      data: {
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo !== undefined ? (dto.validTo ? new Date(dto.validTo) : null) : undefined,
      },
    });
    await this.prisma.fiscalRuleAuditLog.create({
      data: { taxRuleId: id, userId, accion: FiscalAuditAction.UPDATED, valorAnterior: before as any, valorNuevo: rule as any },
    });
    return rule;
  }

  async deactivateTaxRule(id: string, userId: string) {
    const before = await this.getTaxRule(id);
    const rule = await this.prisma.taxRule.update({
      where: { id },
      data: { status: 'INACTIVA', validTo: before.validTo ?? new Date() },
    });
    await this.prisma.fiscalRuleAuditLog.create({
      data: { taxRuleId: id, userId, accion: FiscalAuditAction.DEACTIVATED, valorAnterior: before as any, valorNuevo: rule as any },
    });
    return rule;
  }

  getAuditLog(taxRuleId?: string) {
    return this.prisma.fiscalRuleAuditLog.findMany({
      where: taxRuleId ? { taxRuleId } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
