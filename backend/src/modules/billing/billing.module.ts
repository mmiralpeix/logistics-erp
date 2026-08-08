import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { FiscalModule } from '../fiscal/fiscal.module';

@Module({ imports: [FiscalModule], controllers: [BillingController], providers: [BillingService] })
export class BillingModule {}
