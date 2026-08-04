import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { ReserveFundsModule } from '../reserve-funds/reserve-funds.module';

@Module({
  imports: [ReserveFundsModule],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
