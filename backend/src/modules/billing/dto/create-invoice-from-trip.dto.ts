import { IsString, IsNotEmpty } from 'class-validator';

export class CreateInvoiceFromTripDto {
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;
}
