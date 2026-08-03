import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateReportScheduleDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsString()
  @IsNotEmpty()
  frecuencia: string; // DIARIO | SEMANAL_LUNES | MENSUAL_DIA_1 | TRIMESTRAL

  @IsString()
  @IsNotEmpty()
  destinatarios: string;

  @IsString()
  @IsNotEmpty()
  formato: string; // PDF | EXCEL | CSV

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
