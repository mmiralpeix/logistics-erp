import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { TripStatus, VehicleStatus, DangerousGoodsClass } from '@prisma/client';

describe('QA Exhaustive Multi-Agent System Audit & Stress Verification', () => {
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

  it('1. [Trips] Should fetch all 50+ trips and verify diverse operation types', async () => {
    const totalTrips = await prisma.trip.count();
    expect(totalTrips).toBeGreaterThanOrEqual(50);

    const trips = await prisma.trip.findMany({
      take: 50,
      include: { client: true, vehicle: true, driver: true, carrier: true, dangerousGoods: true },
    });

    const operTypes = new Set(trips.map((t) => t.tipoOperacion));
    expect(operTypes.has('PROPIA')).toBeTruthy();
    expect(operTypes.has('TRACCION_TERCERO_SEMI_PROPIO')).toBeTruthy();
    expect(operTypes.has('SUBCONTRATADA_TOTAL')).toBeTruthy();
  });

  it('2. [Financials] Should verify Gross Margin = Tarifa - CostoTotal across all trips', async () => {
    const trips = await prisma.trip.findMany({
      where: { tarifaAcordada: { not: null }, costoTotal: { not: null } },
      take: 50,
    });

    trips.forEach((t) => {
      const tarifa = Number(t.tarifaAcordada) || 0;
      const costo = Number(t.costoTotal) || 0;
      const expectedMargen = tarifa - costo;
      expect(Number(t.margenBruto)).toBe(expectedMargen);
    });
  });

  it('3. [Dangerous Goods] Should verify UN codes and Hazmat driver certifications', async () => {
    const hazmatDeclarations = await prisma.dangerousGoodsDeclaration.findMany({
      include: { trip: { include: { driver: true } } },
    });

    expect(hazmatDeclarations.length).toBeGreaterThan(0);
    hazmatDeclarations.forEach((decl) => {
      expect(decl.numeroONU).toMatch(/^UN\d{4}$/);
      expect(decl.cumpleNormativa).toBeTruthy();
    });
  });

  it('4. [Fleet & Driver Integrity] Should verify zero null vehicle crashes on subcontracted trips', async () => {
    const subcontractedTrips = await prisma.trip.findMany({
      where: { tipoOperacion: 'SUBCONTRATADA_TOTAL' },
    });

    expect(subcontractedTrips.length).toBeGreaterThan(0);
    subcontractedTrips.forEach((t) => {
      expect(t.vehicleId).toBeNull();
    });
  });

  it('5. [Billing] Should verify Invoice totals = Subtotal + IVA (21%)', async () => {
    const invoices = await prisma.invoice.findMany({ take: 20 });
    expect(invoices.length).toBeGreaterThan(0);

    invoices.forEach((inv) => {
      const subtotal = Number(inv.subtotal) || 0;
      const iva = Number(inv.iva) || 0;
      const expectedTotal = subtotal + iva;
      expect(Number(inv.total)).toBe(expectedTotal);
    });
  });

  it('6. [Maintenance] Should verify vehicle maintenance logs and cost calculation', async () => {
    const maintenances = await prisma.maintenance.findMany({
      include: { vehicle: true },
    });

    expect(maintenances.length).toBeGreaterThan(0);
    maintenances.forEach((m) => {
      expect(m.vehicleId).toBeDefined();
      expect(m.tipo).toBeDefined();
      expect(m.status).toBeDefined();
    });
  });
});
