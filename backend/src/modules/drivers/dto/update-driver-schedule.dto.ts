import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class UpdateDriverScheduleDto {
  @IsOptional()
  @IsString()
  modalidadLaboral?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasTrabajo?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  diasDescanso?: number;

  @IsOptional()
  @IsString()
  supervisor?: string;

  @IsOptional()
  @IsDateString()
  fechaInicioTurno?: string;

  @IsOptional()
  @IsDateString()
  fechaRegreso?: string;

  @IsOptional()
  @IsDateString()
  fechaInicioDescanso?: string;
}
