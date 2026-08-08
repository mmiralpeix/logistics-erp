import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesPointDto {
  @ApiProperty({ description: 'Punto de venta habilitado en ARCA, ej. "0001".' }) @IsString() numero: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class UpdateSalesPointDto {
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() habilitado?: boolean;
}
