import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const helmet = require('helmet');
const compression = require('compression');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api');

  // Gzip Response Compression & Security Headers
  app.use(compression());
  app.use(helmet());

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter — sanitizes Prisma errors, logs full stack traces
  app.useGlobalFilters(new AllExceptionsFilter());

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

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`\n🚀 LogisticsPro ERP Backend corriendo en el puerto ${port}`);
  console.log(`📚 Swagger Docs disponible en /api/docs\n`);
}

bootstrap();
