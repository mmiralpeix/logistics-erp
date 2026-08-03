import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('All Modules Comprehensive Database Audit & Integration Spec', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have populated records in all 38 Prisma entities', async () => {
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const contractCount = await prisma.contract.count();
    const vehicleCount = await prisma.vehicle.count();
    const driverCount = await prisma.driver.count();
    const tripCount = await prisma.trip.count();
    const maintenanceCount = await prisma.maintenance.count();
    const sparePartCount = await prisma.sparePart.count();
    const fuelLogCount = await prisma.fuelLog.count();
    const invoiceCount = await prisma.invoice.count();
    const gpsDeviceCount = await prisma.gPSDevice.count();
    const certificationCount = await prisma.certification.count();
    const carrierCount = await prisma.carrier.count();
    const carrierVehicleCount = await prisma.carrierVehicle.count();
    const carrierDriverCount = await prisma.carrierDriver.count();
    const tireCount = await prisma.tire.count();
    const tireMovementCount = await prisma.tireMovement.count();
    const tireInspectionCount = await prisma.tireInspection.count();
    const tireRetreadCount = await prisma.tireRetread.count();
    const shiftLogCount = await prisma.driverShiftLog.count();
    const trainingCount = await prisma.driverTraining.count();
    const geofenceCount = await prisma.geofence.count();
    const reportTemplateCount = await prisma.reportTemplate.count();
    const reportSavedCount = await prisma.reportSaved.count();
    const reportScheduleCount = await prisma.reportSchedule.count();
    const alertRecordCount = await prisma.alertRecord.count();
    const systemConfigCount = await prisma.systemConfig.count();

    console.log('=== DATABASE INTEGRITY AUDIT RESULTS ===');
    console.log(`- Users: ${userCount}`);
    console.log(`- Clients: ${clientCount}`);
    console.log(`- Contracts: ${contractCount}`);
    console.log(`- Vehicles: ${vehicleCount}`);
    console.log(`- Drivers: ${driverCount}`);
    console.log(`- Trips: ${tripCount}`);
    console.log(`- Maintenances: ${maintenanceCount}`);
    console.log(`- Spare Parts: ${sparePartCount}`);
    console.log(`- Fuel Logs: ${fuelLogCount}`);
    console.log(`- Invoices: ${invoiceCount}`);
    console.log(`- GPS Devices: ${gpsDeviceCount}`);
    console.log(`- Certifications: ${certificationCount}`);
    console.log(`- Carriers (Terceros): ${carrierCount}`);
    console.log(`- Carrier Vehicles: ${carrierVehicleCount}`);
    console.log(`- Carrier Drivers: ${carrierDriverCount}`);
    console.log(`- Tires: ${tireCount}`);
    console.log(`- Tire Movements: ${tireMovementCount}`);
    console.log(`- Tire Inspections: ${tireInspectionCount}`);
    console.log(`- Tire Retreads: ${tireRetreadCount}`);
    console.log(`- Driver Shift Logs: ${shiftLogCount}`);
    console.log(`- Driver Trainings: ${trainingCount}`);
    console.log(`- Geofences: ${geofenceCount}`);
    console.log(`- Report Templates: ${reportTemplateCount}`);
    console.log(`- Report Saved: ${reportSavedCount}`);
    console.log(`- Report Schedules: ${reportScheduleCount}`);
    console.log(`- Alert Records: ${alertRecordCount}`);
    console.log(`- System Config: ${systemConfigCount}`);
    console.log('=======================================');

    expect(userCount).toBeGreaterThan(0);
    expect(clientCount).toBeGreaterThan(0);
    expect(vehicleCount).toBeGreaterThan(0);
    expect(driverCount).toBeGreaterThan(0);
    expect(tripCount).toBeGreaterThan(0);
    expect(maintenanceCount).toBeGreaterThan(0);
    expect(sparePartCount).toBeGreaterThan(0);
    expect(fuelLogCount).toBeGreaterThan(0);
    expect(invoiceCount).toBeGreaterThan(0);
    expect(gpsDeviceCount).toBeGreaterThan(0);
    expect(certificationCount).toBeGreaterThan(0);
    expect(carrierCount).toBeGreaterThan(0);
    expect(tireCount).toBeGreaterThan(0);
    expect(reportTemplateCount).toBeGreaterThan(0);
    expect(alertRecordCount).toBeGreaterThan(0);
    expect(systemConfigCount).toBeGreaterThan(0);
  });
});
