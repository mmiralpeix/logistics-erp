import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@logistics.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código TOTP de 6 dígitos (solo si MFA está habilitado)' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  totpToken?: string;
}
