import { IsString, IsEnum, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReserveFundType } from '@prisma/client';

export class ManualAdjustmentDto {
  @ApiProperty({ description: 'ID del Vehículo / Activo', example: 'cmrwtsz...' })
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ enum: ReserveFundType, description: 'Tipo de Fondo (MAINTENANCE o TIRES)', example: 'MAINTENANCE' })
  @IsEnum(ReserveFundType)
  fundType: ReserveFundType;

  @ApiProperty({ description: 'Monto del ajuste. Positivo (+) para ingreso, negativo (-) para egreso', example: 150000 })
  @IsNumber()
  monto: number;

  @ApiProperty({ description: 'Motivo o concepto del ajuste manual', example: 'Ajuste de saldo inicial por auditoría' })
  @IsString()
  @IsNotEmpty()
  concepto: string;
}
