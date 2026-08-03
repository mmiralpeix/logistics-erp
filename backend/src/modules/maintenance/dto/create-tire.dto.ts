import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min, IsDateString } from 'class-validator';
import { TireType, TireStatus } from '@prisma/client';

export class CreateTireDto {
  @IsString()
  @IsNotEmpty()
  codigoInterno: string;

  @IsOptional()
  @IsString()
  codigoQR?: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsString()
  @IsNotEmpty()
  numeroSerie: string;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsString()
  @IsNotEmpty()
  medida: string;

  @IsEnum(TireType)
  tipo: TireType;

  @IsOptional()
  @IsEnum(TireStatus)
  status?: TireStatus;

  @IsDateString()
  fechaCompra: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsNumber()
  @Min(0)
  precioCompra: number;

  @IsOptional()
  @IsNumber()
  garantiaMeses?: number;

  @IsNumber()
  @Min(0)
  profundidadInicialMm: number;

  @IsOptional()
  @IsNumber()
  profundidadActualMm?: number;

  @IsOptional()
  @IsNumber()
  presionRecomendadaPsi?: number;

  @IsOptional()
  @IsNumber()
  vidaUtilEstimadaKm?: number;

  @IsOptional()
  @IsNumber()
  maxRecapadosPermitidos?: number;

  @IsOptional()
  @IsString()
  fotoUrl?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
