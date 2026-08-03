import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsDateString, IsIn } from 'class-validator';

export class CreateTireInspectionDto {
  @IsString()
  @IsNotEmpty()
  inspector: string;

  @IsNumber()
  @Min(0)
  profundidadMm: number;

  @IsNumber()
  @Min(0)
  presionPsi: number;

  @IsString()
  @IsNotEmpty()
  estadoVisual: string; // EXCELENTE, BUENO, DESGASTE_DESIGUAL, DANO_FLANCO, REEMPLAZAR

  @IsString()
  @IsNotEmpty()
  @IsIn(['CORRECTO', 'REQUIERE_SEGUIMIENTO', 'DEBE_REEMPLAZARSE'])
  resultado: 'CORRECTO' | 'REQUIERE_SEGUIMIENTO' | 'DEBE_REEMPLAZARSE';

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  fotografiaUrl?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
