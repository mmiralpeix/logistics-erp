import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FiscalAdminService } from './fiscal-admin.service';
import { CreateJurisdictionDto, UpdateJurisdictionDto } from './dto/jurisdiction.dto';
import { CreateTaxRuleDto, UpdateTaxRuleDto } from './dto/tax-rule.dto';

@ApiTags('Fiscal Admin')
@ApiBearerAuth('JWT')
@Controller('fiscal-admin')
export class FiscalAdminController {
  constructor(private fiscalAdminService: FiscalAdminService) {}

  @Get('jurisdictions')
  listJurisdictions() {
    return this.fiscalAdminService.listJurisdictions();
  }

  @Post('jurisdictions')
  @Roles(UserRole.SUPER_ADMIN)
  createJurisdiction(@Body() dto: CreateJurisdictionDto) {
    return this.fiscalAdminService.createJurisdiction(dto);
  }

  @Patch('jurisdictions/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateJurisdiction(@Param('id') id: string, @Body() dto: UpdateJurisdictionDto) {
    return this.fiscalAdminService.updateJurisdiction(id, dto);
  }

  @Get('tax-rules')
  @ApiOperation({ summary: 'Listar reglas fiscales (IVA/IIBB/percepciones/retenciones) con su vigencia' })
  listTaxRules(@Query('jurisdictionId') jurisdictionId?: string, @Query('tipo') tipo?: string, @Query('status') status?: string) {
    return this.fiscalAdminService.listTaxRules({ jurisdictionId, tipo, status });
  }

  @Post('tax-rules')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cargar una nueva regla fiscal — requiere cita de la fuente normativa' })
  createTaxRule(@Body() dto: CreateTaxRuleDto, @CurrentUser('id') userId: string) {
    return this.fiscalAdminService.createTaxRule(dto, userId);
  }

  @Patch('tax-rules/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateTaxRule(@Param('id') id: string, @Body() dto: UpdateTaxRuleDto, @CurrentUser('id') userId: string) {
    return this.fiscalAdminService.updateTaxRule(id, dto, userId);
  }

  @Patch('tax-rules/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cerrar la vigencia de una regla (no la borra — queda trazada para facturas pasadas)' })
  deactivateTaxRule(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.fiscalAdminService.deactivateTaxRule(id, userId);
  }

  @Get('audit-log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  getAuditLog(@Query('taxRuleId') taxRuleId?: string) {
    return this.fiscalAdminService.getAuditLog(taxRuleId);
  }
}
