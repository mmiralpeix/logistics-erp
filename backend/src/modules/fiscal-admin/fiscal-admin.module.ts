import { Module } from '@nestjs/common';
import { FiscalAdminController } from './fiscal-admin.controller';
import { FiscalAdminService } from './fiscal-admin.service';

@Module({ controllers: [FiscalAdminController], providers: [FiscalAdminService] })
export class FiscalAdminModule {}
