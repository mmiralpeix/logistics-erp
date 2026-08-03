import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDateString } from 'class-validator';

export class SendToRetreadDto {
  @IsString()
  @IsNotEmpty()
  empresaRecapadora: string;

  @IsNumber()
  @Min(0)
  costo: number;

  @IsDateString()
  fechaEnvio: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ReceiveFromRetreadDto {
  @IsDateString()
  fechaRecepcion: string;

  @IsNumber()
  @Min(0)
  profundidadNuevaMm: number;

  @IsOptional()
  @IsNumber()
  costo?: number;

  @IsOptional()
  @IsNumber()
  garantiaMeses?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
