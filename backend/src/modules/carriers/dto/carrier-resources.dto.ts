import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCarrierVehicleDto {
  @ApiProperty({ description: 'Patente/dominio del vehículo' })
  @IsString()
  patente: string;

  @ApiPropertyOptional() @IsOptional() @IsString() tipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() marca?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() modelo?: string;
}

export class CreateCarrierDriverDto {
  @ApiProperty({ description: 'Nombre del chofer' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Apellido del chofer' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional() @IsOptional() @IsString() dni?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
}
