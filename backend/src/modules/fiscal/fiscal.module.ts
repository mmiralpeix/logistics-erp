import { Module } from '@nestjs/common';
import { FiscalEngineService } from './fiscal-engine.service';
import { InvoiceNumberingService } from './invoice-numbering.service';

@Module({
  providers: [FiscalEngineService, InvoiceNumberingService],
  exports: [FiscalEngineService, InvoiceNumberingService],
})
export class FiscalModule {}
