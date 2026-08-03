import { IsString, IsNotEmpty, IsOptional, IsDateString, IsIn } from 'class-validator';

export class RecordShiftEventDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['INICIO_TURNO', 'REGRESO', 'INICIO_DESCANSO', 'FIN_DESCANSO', 'CAMBIO_MODALIDAD'])
  tipoRegistro: 'INICIO_TURNO' | 'REGRESO' | 'INICIO_DESCANSO' | 'FIN_DESCANSO' | 'CAMBIO_MODALIDAD';

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
