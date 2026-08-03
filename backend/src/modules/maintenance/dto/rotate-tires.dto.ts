import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class RotateTiresDto {
  @IsString()
  @IsNotEmpty()
  tireId1: string;

  @IsString()
  @IsNotEmpty()
  tireId2: string;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsNumber()
  kilometrajeVehiculo?: number;

  @IsOptional()
  @IsString()
  usuario?: string;
}
