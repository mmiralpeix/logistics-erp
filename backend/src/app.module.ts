import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { TripsModule } from './modules/trips/trips.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FuelModule } from './modules/fuel/fuel.module';
import { ConsumablesModule } from './modules/consumables/consumables.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CostsModule } from './modules/costs/costs.module';
import { BillingModule } from './modules/billing/billing.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { FiscalAdminModule } from './modules/fiscal-admin/fiscal-admin.module';
import { CompanyModule } from './modules/company/company.module';
import { ProductsModule } from './modules/products/products.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { GpsModule } from './modules/gps/gps.module';
import { HealthModule } from './modules/health/health.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { DangerousGoodsModule } from './modules/dangerous-goods/dangerous-goods.module';
import { CertificationsModule } from './modules/certifications/certifications.module';
import { MailModule } from './modules/mail/mail.module';
import { CarriersModule } from './modules/carriers/carriers.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReserveFundsModule } from './modules/reserve-funds/reserve-funds.module';

import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    ClientsModule,
    VehiclesModule,
    DriversModule,
    TripsModule,
    CertificationsModule,
    MaintenanceModule,
    FuelModule,
    ConsumablesModule,
    DocumentsModule,
    CostsModule,
    FiscalModule,
    FiscalAdminModule,
    CompanyModule,
    ProductsModule,
    PaymentsModule,
    BillingModule,
    ReportsModule,
    GpsModule,
    AlertsModule,
    DangerousGoodsModule,
    CarriersModule,
    AnalyticsModule,
    ReserveFundsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
