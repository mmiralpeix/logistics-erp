import { IsString, IsOptional, IsEmail, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty() @IsString() dni: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() telefono?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() domicilio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ciudad?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() provincia?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cuil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cbu?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaNacimiento?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fechaIngreso?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenciaTipo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenciaNumero?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() licenciaVencimiento?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() habilitadoCargasPeligrosas?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() certificadoCargasPeligrosas?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() examenMedicoVencimiento?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() psicofisicoVencimiento?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notas?: string;
}
