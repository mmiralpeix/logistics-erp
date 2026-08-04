import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class RescheduleTripDto {
  @IsDateString()
  newDeparture: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
