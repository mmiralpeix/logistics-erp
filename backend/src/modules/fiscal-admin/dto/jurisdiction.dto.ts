import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateJurisdictionDto {
  @ApiProperty() @IsString() nombre: string;
  @ApiProperty() @IsString() codigo: string;
  @ApiPropertyOptional() @IsOptional() @IsString() organismo?: string;
}

export class UpdateJurisdictionDto extends PartialType(CreateJurisdictionDto) {}
