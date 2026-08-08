import { IsString, IsOptional, IsBoolean, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxCondition } from '@prisma/client';

export class UpsertCompanyDto {
  @ApiProperty() @IsString() razonSocial: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nombreFantasia?: string;
  @ApiProperty() @IsString() cuit: string;
  @ApiPropertyOptional({ enum: TaxCondition }) @IsOptional() @IsEnum(TaxCondition) condicionIVA?: TaxCondition;
  @ApiProperty() @IsString() domicilioFiscal: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ciudad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provincia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigoPostal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() convenioMultilateral?: boolean;
  @ApiPropertyOptional({ description: 'Jurisdicción fiscal sede de la empresa (TaxJurisdiction.id).' })
  @IsOptional() @IsString() jurisdictionId?: string;
}
