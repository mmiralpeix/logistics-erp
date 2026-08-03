import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class InstallTireDto {
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  posicion: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrajeVehiculo?: number;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  usuario?: string;
}

export class DismountTireDto {
  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsNumber()
  profundidadMm?: number;

  @IsOptional()
  @IsNumber()
  presionPsi?: number;

  @IsOptional()
  @IsString()
  usuario?: string;
}
