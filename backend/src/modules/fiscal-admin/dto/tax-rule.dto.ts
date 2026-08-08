import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TaxRuleType } from '@prisma/client';

export class CreateTaxRuleDto {
  @ApiPropertyOptional({ description: 'null = regla nacional (ej. IVA). Con valor = específica de esa provincia/CABA.' })
  @IsOptional() @IsString() jurisdictionId?: string;
  @ApiProperty({ enum: TaxRuleType }) @IsEnum(TaxRuleType) tipo: TaxRuleType;
  @ApiPropertyOptional() @IsOptional() @IsString() actividadCodigo?: string;
  @ApiProperty() @IsNumber() alicuota: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() exento?: boolean;
  @ApiProperty({ description: 'Fecha desde la cual rige esta regla (ISO 8601).' }) @IsDateString() validFrom: string;
  @ApiPropertyOptional({ description: 'Fecha hasta la cual rige. Vacío = todavía vigente.' })
  @IsOptional() @IsDateString() validTo?: string;
  @ApiProperty({ description: 'Cita de la normativa oficial que respalda esta alícuota — obligatoria, no se cargan reglas sin fuente.' })
  @IsString() fuenteNormativa: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descripcion?: string;
}

export class UpdateTaxRuleDto extends PartialType(CreateTaxRuleDto) {}
