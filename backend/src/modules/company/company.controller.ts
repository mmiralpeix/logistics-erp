import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyService } from './company.service';
import { UpsertCompanyDto } from './dto/upsert-company.dto';
import { CreateSalesPointDto, UpdateSalesPointDto } from './dto/sales-point.dto';

/**
 * Identidad fiscal de la empresa (CUIT, condición IVA, puntos de venta ARCA).
 * Todo restringido a SUPER_ADMIN: es el dato más sensible de todo el módulo fiscal
 * (define bajo qué CUIT se emite cada comprobante), no un ajuste operativo cualquiera.
 */
@ApiTags('Company')
@ApiBearerAuth('JWT')
@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la empresa emisora activa (null si todavía no se cargó)' })
  getActive() {
    return this.companyService.getActive();
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar los datos fiscales de la empresa emisora' })
  upsert(@Body() dto: UpsertCompanyDto) {
    return this.companyService.upsert(dto);
  }

  @Post('sales-points')
  @Roles(UserRole.SUPER_ADMIN)
  addSalesPoint(@Body() dto: CreateSalesPointDto) {
    return this.companyService.addSalesPoint(dto);
  }

  @Patch('sales-points/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateSalesPoint(@Param('id') id: string, @Body() dto: UpdateSalesPointDto) {
    return this.companyService.updateSalesPoint(id, dto);
  }
}
