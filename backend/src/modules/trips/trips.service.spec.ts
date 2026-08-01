import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TripStatus, VehicleStatus } from '@prisma/client';

describe('TripsService', () => {
  let service: TripsService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      trip: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        update: jest.fn(),
      },
      driver: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return trip when found', async () => {
      const mockTrip = { id: 'trip-1', numero: 'VJ-2026-ABC123' };
      prismaMock.trip.findUnique.mockResolvedValue(mockTrip);

      const result = await service.findOne('trip-1');
      expect(result).toEqual(mockTrip);
    });

    it('should throw NotFoundException when trip does not exist', async () => {
      prismaMock.trip.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and update vehicle status if vehicleId exists', async () => {
      const mockTrip = { id: 'trip-1', numero: 'VJ-2026-100', vehicleId: 'veh-1' };
      prismaMock.trip.findUnique.mockResolvedValue(mockTrip);
      prismaMock.trip.update.mockResolvedValue({ ...mockTrip, status: TripStatus.FINALIZADO });

      await service.updateStatus('trip-1', TripStatus.FINALIZADO);

      expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'veh-1' },
        data: { status: VehicleStatus.DISPONIBLE },
      });
    });

    it('should NOT throw error when updateStatus is called on subcontracted trip (vehicleId is null)', async () => {
      const mockTrip = { id: 'trip-2', numero: 'VJ-2026-200', vehicleId: null };
      prismaMock.trip.findUnique.mockResolvedValue(mockTrip);
      prismaMock.trip.update.mockResolvedValue({ ...mockTrip, status: TripStatus.FINALIZADO });

      await expect(service.updateStatus('trip-2', TripStatus.FINALIZADO)).resolves.toBeDefined();
      expect(prismaMock.vehicle.update).not.toHaveBeenCalled();
    });
  });
});
