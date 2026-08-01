import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTripCostDto {
  @ApiProperty({ description: 'Concepto del costo', example: 'Peaje Ruta 7' })
  @IsString()
  @IsNotEmpty()
  concepto: string;

  @ApiProperty({ description: 'Monto del costo', example: 15000 })
  @IsNumber()
  monto: number;

  @ApiPropertyOptional({ description: 'Categoría del costo', example: 'PEAJE' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Fecha del costo' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notas?: string;
}
