import { IsString, IsNotEmpty, IsOptional, IsDateString, IsObject, IsBoolean } from 'class-validator';

export class SaveReportDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsDateString()
  periodoFrom: string;

  @IsDateString()
  periodoTo: string;

  @IsOptional()
  @IsObject()
  filtrosJson?: Record<string, any>;

  @IsOptional()
  @IsString()
  resumenIA?: string;

  @IsOptional()
  @IsObject()
  datosJson?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  favorito?: boolean;

  @IsOptional()
  @IsString()
  creadoPor?: string;
}
