import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsNumber, Min } from 'class-validator';
import { CertificationStatus } from '@prisma/client';

export class CreateCertificationDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  contractId?: string;

  @IsString()
  @IsOptional()
  numeroOC?: string;

  @IsString()
  @IsOptional()
  periodo?: string;

  @IsArray()
  @IsString({ each: true })
  tripIds: string[];

  @IsEnum(CertificationStatus)
  @IsOptional()
  estado?: CertificationStatus;

  @IsNumber()
  @IsOptional()
  diasEnGestion?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
