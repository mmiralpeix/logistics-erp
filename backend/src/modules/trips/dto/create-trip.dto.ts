import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';

class CreateCheckpointDto {
  @IsString() nombre: string;
  @IsString() ubicacion: string;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lon?: number;
  @IsDateString() estimado: string;
  @IsOptional() @IsString() notas?: string;
}

class CreateDangerousGoodsDto {
  @IsString() numeroONU: string;
  @IsString() clase: string;
  @IsString() nombreTecnico: string;
  @IsOptional() @IsNumber() cantidadKg?: number;
  @IsOptional() @IsString() grupoEmbalaje?: string;
  @IsOptional() @IsNumber() puntoInflamacion?: number;
  @IsOptional() @IsBoolean() hojaSeguridad?: boolean;
  @IsOptional() @IsBoolean() equipoObligatorio?: boolean;
  @IsOptional() @IsBoolean() permisosCompletos?: boolean;
  @IsOptional() @IsBoolean() cumpleNormativa?: boolean;
  @IsOptional() @IsString() notas?: string;
}

export class CreateTripDto {
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiProperty() @IsString() vehicleId: string;
  @ApiProperty() @IsString() driverId: string;
  @ApiProperty() @IsString() origen: string;
  @ApiProperty() @IsString() destino: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() origenLat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() origenLon?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() destinoLat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() destinoLon?: number;
  @ApiProperty() @IsDateString() fechaSalidaProgramada: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaLlegadaEstimada?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() duracionEstimadaHoras?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() esperaEnDestinoHoras?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() descansosConductorHoras?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() distanciaKm?: number;
  @ApiPropertyOptional({ enum: TripStatus }) @IsOptional() @IsEnum(TripStatus) status?: TripStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() tipoCarga?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() pesoCarga?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() volumenCarga?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcionCarga?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() esCargaPeligrosa?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() esMineria?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() esDistribucion?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() tarifaAcordada?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional({ type: [CreateCheckpointDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateCheckpointDto)
  checkpoints?: CreateCheckpointDto[];
  @ApiPropertyOptional()
  @IsOptional() @ValidateNested() @Type(() => CreateDangerousGoodsDto)
  dangerousGoods?: CreateDangerousGoodsDto;
}
