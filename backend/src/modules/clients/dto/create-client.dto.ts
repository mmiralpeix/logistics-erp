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
  @ApiPropertyOptional({ type: [CreateContactDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateContactDto)
  contacts?: CreateContactDto[];
}
