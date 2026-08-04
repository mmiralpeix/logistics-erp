import { IsNumber, IsObject, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReserveFundConfigDto {
  @ApiProperty({ description: 'Porcentaje global de Fondo de Mantenimiento (%)', example: 13.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  pctMaintenance: number;

  @ApiProperty({ description: 'Porcentaje global de Fondo de Neumáticos (%)', example: 11.0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  pctTires: number;

  @ApiProperty({
    description: 'Pesos de distribución por tipo de vehículo (ej: { TRACTOR: 50, CISTERNA: 30, SEMIRREMOLQUE: 30, DOLLY: 15 })',
    example: { TRACTOR: 50, CISTERNA: 30, SEMIRREMOLQUE: 30, DOLLY: 15, CAMION: 50, CARRETON: 30, BATEA: 30, ACOPLADO: 20 },
  })
  @IsObject()
  vehicleTypeWeights: Record<string, number>;
}
