import { Module } from '@nestjs/common';
import { DangerousGoodsController } from './dangerous-goods.controller';
import { DangerousGoodsService } from './dangerous-goods.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DangerousGoodsController],
  providers: [DangerousGoodsService],
  exports: [DangerousGoodsService],
})
export class DangerousGoodsModule {}
