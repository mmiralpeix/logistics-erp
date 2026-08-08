import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PaymentAllocationInputDto {
  @ApiProperty() @IsString() invoiceId: string;
  @ApiProperty() @IsNumber() @Min(0.01) monto: number;
}

export class CreatePaymentDto {
  @ApiProperty() @IsString() clientId: string;
  @ApiProperty() @IsNumber() @Min(0.01) monto: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fecha?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() medioPago?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referencia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional({
    type: [PaymentAllocationInputDto],
    description: 'A qué factura(s) se aplica el pago, total o parcialmente. Si se omite, el pago queda sin aplicar (saldo a favor del cliente).',
  })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PaymentAllocationInputDto)
  allocations?: PaymentAllocationInputDto[];
}
