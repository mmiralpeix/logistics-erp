import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateCarrierDto {
  @ApiProperty({ description: 'Razón social del operador logístico' })
  @IsString()
  razonSocial: string;

  @ApiPropertyOptional() @IsOptional() @IsString() cuit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contacto?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() domicilio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ciudad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provincia?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}
