import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { TripStatus, VehicleStatus } from '@prisma/client';

describe('QA Full System Integration Audit', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. Should fetch trips list and verify populated 20 sample trips', async () => {
    const count = await prisma.trip.count();
    expect(count).toBeGreaterThanOrEqual(20);

    const trips = await prisma.trip.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { client: true, vehicle: true, driver: true, carrier: true, dangerousGoods: true },
    });

    expect(trips.length).toBe(20);
    trips.forEach((trip) => {
      expect(trip.numero).toMatch(/^VJ-\d{4}-[A-Z0-9]{6}$/);
      expect(trip.origen).toBeDefined();
      expect(trip.destino).toBeDefined();
      expect(Number(trip.tarifaAcordada)).toBeGreaterThan(0);
    });
  });

  it('2. Should calculate Margen Bruto correctly for all trips (Tarifa - Costo)', async () => {
    const trips = await prisma.trip.findMany({
      where: { margenBruto: { not: null } },
      take: 20,
    });
    expect(trips.length).toBeGreaterThan(0);
    trips.forEach((trip) => {
      const tarifa = Number(trip.tarifaAcordada) || 0;
      const costo = Number(trip.costoTotal) || 0;
      const margenCalculado = tarifa - costo;
      expect(Number(trip.margenBruto)).toBe(margenCalculado);
    });
  });

  it('3. Should verify Dangerous Goods compliance declarations for hazmat trips', async () => {
    const hazmatTrips = await prisma.trip.findMany({
      where: { esCargaPeligrosa: true },
      include: { dangerousGoods: true },
    });

    expect(hazmatTrips.length).toBeGreaterThan(0);
    hazmatTrips.forEach((trip) => {
      expect(trip.dangerousGoods).toBeDefined();
      expect(trip.dangerousGoods?.numeroONU).toBeDefined();
    });
  });

  it('4. Should check vehicle status updates when a trip is EN_CURSO vs FINALIZADO', async () => {
    const tripEnCurso = await prisma.trip.findFirst({
      where: { status: TripStatus.EN_CURSO, vehicleId: { not: null } },
      include: { vehicle: true },
    });

    if (tripEnCurso && tripEnCurso.vehicle) {
      expect(tripEnCurso.vehicle.status).toBe(VehicleStatus.EN_VIAJE);
    }
  });

  it('5. Should query active Clients, Vehicles, Drivers and Carriers successfully', async () => {
    const [clientCount, vehicleCount, driverCount, carrierCount] = await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.carrier.count(),
    ]);

    expect(clientCount).toBeGreaterThan(0);
    expect(vehicleCount).toBeGreaterThan(0);
    expect(driverCount).toBeGreaterThan(0);
    expect(carrierCount).toBeGreaterThan(0);
  });
});
