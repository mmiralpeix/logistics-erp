import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateReportTemplateDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  categoria: string;

  @IsObject()
  configJson: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
