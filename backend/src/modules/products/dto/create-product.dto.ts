import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() @IsString() codigo: string;
  @ApiProperty() @IsString() descripcion: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unidadMedida?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() precio?: number;
  @ApiPropertyOptional({ description: 'Alícuota de IVA por defecto para este producto/servicio (ej. 21, 10.5, 0). Si no se especifica, la factura usa la regla general vigente.' })
  @IsOptional() @IsNumber() tipoIVADefault?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() actividadCodigo?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
