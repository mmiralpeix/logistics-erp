import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GpsService {
  constructor(private prisma: PrismaService) {}

  async getActiveVehiclesPosition() {
    return this.prisma.gPSDevice.findMany({
      where: { isActive: true, lastLat: { not: null } },
      include: {
        vehicle: {
          select: { patente: true, marca: true, modelo: true, status: true,
            trips: { where: { status: 'EN_CURSO' as any }, take: 1,
              include: { driver: { select: { firstName: true, lastName: true } }, client: { select: { razonSocial: true } } },
            },
          },
        },
      },
    });
  }

  async updatePosition(deviceId: string, lat: number, lon: number, speed?: number, event?: string) {
    return this.prisma.gPSDevice.update({
      where: { deviceId },
      data: { lastLat: lat, lastLon: lon, lastSpeed: speed, lastEvent: event, lastUpdate: new Date() },
    });
  }

  async registerDevice(dto: any) {
    return this.prisma.gPSDevice.create({ data: dto });
  }

  async getDevices() {
    return this.prisma.gPSDevice.findMany({
      include: { vehicle: { select: { patente: true, marca: true, modelo: true } } },
    });
  }

  async getGeofences() {
    return this.prisma.geofence.findMany({ where: { isActive: true } });
  }

  async createGeofence(dto: any) {
    return this.prisma.geofence.create({ data: dto });
  }
}
