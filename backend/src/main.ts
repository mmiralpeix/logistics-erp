import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LogisticsPro ERP API')
    .setDescription('API completa para el sistema de gestión logística empresarial')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Dashboard', 'Estadísticas ejecutivas')
    .addTag('Clients', 'Gestión de clientes')
    .addTag('Vehicles', 'Gestión de flota')
    .addTag('Drivers', 'Gestión de conductores')
    .addTag('Trips', 'Gestión de viajes')
    .addTag('Maintenance', 'Mantenimiento de vehículos')
    .addTag('Fuel', 'Control de combustible')
    .addTag('Documents', 'Gestión documental')
    .addTag('Billing', 'Facturación')
    .addTag('Reports', 'Reportes y exportaciones')
    .addTag('GPS', 'Rastreo GPS')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 LogisticsPro ERP Backend corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs\n`);
}

bootstrap();
