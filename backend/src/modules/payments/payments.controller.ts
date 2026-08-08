import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth('JWT')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  findByClient(@Query('clientId') clientId: string) {
    return this.paymentsService.findByClient(clientId);
  }

  @Get('client/:clientId/cuenta-corriente')
  @ApiOperation({ summary: 'Saldo real del cliente (facturado - cobrado), calculado en vivo' })
  getCuentaCorriente(@Param('clientId') clientId: string) {
    return this.paymentsService.getCuentaCorriente(clientId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Registrar un cobro de cliente, opcionalmente aplicado a una o varias facturas' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }
}
