import { Module } from '@nestjs/common';
import { ReserveFundsService } from './reserve-funds.service';
import { ReserveFundsController } from './reserve-funds.controller';

@Module({
  controllers: [ReserveFundsController],
  providers: [ReserveFundsService],
  exports: [ReserveFundsService],
})
export class ReserveFundsModule {}
