import { IsString, IsInt, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty() @IsString() patente: string;
  @ApiProperty() @IsString() marca: string;
  @ApiProperty() @IsString() modelo: string;
  @ApiProperty() @IsInt() anio: number;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) tipo: VehicleType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacidadKg?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacidadM3?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoCarga?: string;
  @ApiPropertyOptional({ enum: VehicleStatus }) @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroChasis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroMotor?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() kilometraje?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() vencimientoSeguro?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() vencimientoITV?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() vencimientoRUTA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroSeguro?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() aseguradora?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propietario?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isThirdParty?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() empresa?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}
