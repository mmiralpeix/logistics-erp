import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateContactDto {
  @IsString() nombre: string;
  @IsOptional() @IsString() cargo?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class CreateClientDto {
  @ApiProperty() @IsString() razonSocial: string;
  @ApiProperty() @IsString() cuit: string;
  @ApiProperty() @IsString() domicilio: string;
  @ApiProperty() @IsString() ciudad: string;
  @ApiProperty() @IsString() provincia: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigoPostal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactoPrincipal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() condicionIVA?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoriaCliente?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
  @ApiPropertyOptional() @IsOptional() limiteCredito?: number;
  @ApiPropertyOptional() @IsOptional() diasCredito?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() scoring?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bloqueadoPorRiesgo?: boolean;
  @ApiPropertyOptional({ description: 'Jurisdicción fiscal del cliente (etapa 1 del módulo de facturación).' })
  @IsOptional() @IsString() jurisdictionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() numeroInscripcionIIBB?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() convenioMultilateral?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() actividadCodigo?: string;
  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}
