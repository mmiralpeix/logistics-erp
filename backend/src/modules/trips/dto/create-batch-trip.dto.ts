import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUnitAssignmentDto {
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  trailerId?: string;

  @IsString()
  @IsOptional()
  tipoOperacion?: string;

  @IsString()
  @IsOptional()
  carrierId?: string;

  @IsString()
  @IsOptional()
  carrierDriverId?: string;

  @IsString()
  @IsOptional()
  carrierVehicleId?: string;

  @IsString()
  @IsOptional()
  carrierTrailerId?: string;

  @IsString()
  @IsOptional()
  subcontractorName?: string;

  @IsNumber()
  @IsOptional()
  subcontractorFee?: number;

  @IsString()
  @IsOptional()
  numeroRemito?: string;

  @IsString()
  @IsOptional()
  numeroOCCliente?: string;

  @IsNumber()
  @IsOptional()
  tarifaAcordada?: number;

  @IsNumber()
  @IsOptional()
  pesoExcedenteKg?: number;

  @IsNumber()
  @IsOptional()
  montoExcedente?: number;

  @IsNumber()
  @IsOptional()
  pesoCargaKg?: number;
}


export class CreateBatchTripDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  contractId?: string;

  @IsString()
  @IsNotEmpty()
  origen: string;

  @IsString()
  @IsNotEmpty()
  destino: string;

  @IsNumber()
  @IsOptional()
  origenLat?: number;

  @IsNumber()
  @IsOptional()
  origenLon?: number;

  @IsNumber()
  @IsOptional()
  destinoLat?: number;

  @IsNumber()
  @IsOptional()
  destinoLon?: number;

  @IsString()
  @IsNotEmpty()
  fechaSalidaProgramada: string;

  @IsNumber()
  @IsOptional()
  duracionEstimadaHoras?: number;

  @IsNumber()
  @IsOptional()
  esperaEnDestinoHoras?: number;

  @IsNumber()
  @IsOptional()
  descansosConductorHoras?: number;

  @IsNumber()
  @IsOptional()
  distanciaKm?: number;

  @IsString()
  @IsOptional()
  tipoCarga?: string;

  @IsString()
  @IsOptional()
  descripcionCarga?: string;

  @IsNumber()
  @IsOptional()
  pesoCargaGenericoKg?: number;

  @IsNumber()
  @IsOptional()
  tarifaGenerica?: number;

  @IsBoolean()
  @IsOptional()
  esCargaPeligrosa?: boolean;

  @IsBoolean()
  @IsOptional()
  esMineria?: boolean;

  @IsBoolean()
  @IsOptional()
  esDistribucion?: boolean;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsOptional()
  dangerousGoods?: any;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUnitAssignmentDto)
  assignments: BatchUnitAssignmentDto[];
}
