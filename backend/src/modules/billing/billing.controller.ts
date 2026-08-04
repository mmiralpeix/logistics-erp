import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { InvoiceStatus, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateInvoiceFromTripDto } from './dto/create-invoice-from-trip.dto';

@ApiTags('Billing')
@ApiBearerAuth('JWT')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('invoices')
  findAll(@Query('clientId') c?: string, @Query('status') s?: InvoiceStatus, @Query('from') f?: string, @Query('to') t?: string, @Query('page') p?: number, @Query('limit') l?: number) {
    return this.billingService.findAll(c, s, f, t, p, l);
  }

  @Get('invoices/stats') getStats() { return this.billingService.getStats(); }
  @Get('invoices/overdue') getOverdue() { return this.billingService.getOverdue(); }
  @Get('invoices/:id') findOne(@Param('id') id: string) { return this.billingService.findOne(id); }

  @Post('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OPERATIONS_MANAGER)
  create(@Body() body: any) { return this.billingService.create(body); }

  @Patch('invoices/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OPERATIONS_MANAGER)
  updateStatus(@Param('id') id: string, @Body('status') status: InvoiceStatus) { return this.billingService.updateStatus(id, status); }

  @Post('invoices/from-trip')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Generar factura desde viaje' })
  createFromTrip(@Body() body: CreateInvoiceFromTripDto) {
    return this.billingService.createFromTrip(body.tripId, body.clientId, body.tipo);
  }
}

