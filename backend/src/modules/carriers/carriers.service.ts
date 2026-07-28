import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { CreateCarrierVehicleDto, CreateCarrierDriverDto } from './dto/carrier-resources.dto';

@Injectable()
export class CarriersService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════════════════════════
  // CARRIER CRUD
  // ═══════════════════════════════════════════════════════════════

  async findAll(params: { search?: string; page?: number; limit?: number }) {
    const { search, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { cuit: { contains: search, mode: 'insensitive' } },
        { contacto: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.carrier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razonSocial: 'asc' },
        include: {
          vehicles: { where: { isActive: true } },
          drivers: { where: { isActive: true } },
          _count: { select: { vehicles: true, drivers: true, trips: true } },
        },
      }),
      this.prisma.carrier.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const carrier = await this.prisma.carrier.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { patente: 'asc' } },
        drivers: { orderBy: { lastName: 'asc' } },
        _count: { select: { trips: true } },
      },
    });
    if (!carrier) throw new NotFoundException('Operador logístico no encontrado');
    return carrier;
  }

  async create(dto: CreateCarrierDto) {
    const data = {
      ...dto,
      cuit: dto.cuit?.trim() ? dto.cuit.trim() : null,
      email: dto.email?.trim() ? dto.email.trim() : null,
      telefono: dto.telefono?.trim() ? dto.telefono.trim() : null,
      contacto: dto.contacto?.trim() ? dto.contacto.trim() : null,
      domicilio: dto.domicilio?.trim() ? dto.domicilio.trim() : null,
      ciudad: dto.ciudad?.trim() ? dto.ciudad.trim() : null,
      provincia: dto.provincia?.trim() ? dto.provincia.trim() : null,
      notas: dto.notas?.trim() ? dto.notas.trim() : null,
    };
    return this.prisma.carrier.create({ data });
  }

  async update(id: string, dto: UpdateCarrierDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.cuit !== undefined) data.cuit = dto.cuit?.trim() ? dto.cuit.trim() : null;
    if (dto.email !== undefined) data.email = dto.email?.trim() ? dto.email.trim() : null;
    if (dto.telefono !== undefined) data.telefono = dto.telefono?.trim() ? dto.telefono.trim() : null;
    if (dto.contacto !== undefined) data.contacto = dto.contacto?.trim() ? dto.contacto.trim() : null;
    if (dto.domicilio !== undefined) data.domicilio = dto.domicilio?.trim() ? dto.domicilio.trim() : null;
    if (dto.ciudad !== undefined) data.ciudad = dto.ciudad?.trim() ? dto.ciudad.trim() : null;
    if (dto.provincia !== undefined) data.provincia = dto.provincia?.trim() ? dto.provincia.trim() : null;
    if (dto.notas !== undefined) data.notas = dto.notas?.trim() ? dto.notas.trim() : null;

    return this.prisma.carrier.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.carrier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CARRIER VEHICLES
  // ═══════════════════════════════════════════════════════════════

  async findVehicles(carrierId: string) {
    await this.findOne(carrierId);
    return this.prisma.carrierVehicle.findMany({
      where: { carrierId, isActive: true },
      orderBy: { patente: 'asc' },
    });
  }

  async createVehicle(carrierId: string, dto: CreateCarrierVehicleDto) {
    await this.findOne(carrierId);
    return this.prisma.carrierVehicle.create({
      data: { ...dto, carrierId } as any,
    });
  }

  async updateVehicle(vehicleId: string, dto: Partial<CreateCarrierVehicleDto>) {
    return this.prisma.carrierVehicle.update({
      where: { id: vehicleId },
      data: dto as any,
    });
  }

  async removeVehicle(vehicleId: string) {
    return this.prisma.carrierVehicle.update({
      where: { id: vehicleId },
      data: { isActive: false },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CARRIER DRIVERS
  // ═══════════════════════════════════════════════════════════════

  async findDrivers(carrierId: string) {
    await this.findOne(carrierId);
    return this.prisma.carrierDriver.findMany({
      where: { carrierId, isActive: true },
      orderBy: { lastName: 'asc' },
    });
  }

  async createDriver(carrierId: string, dto: CreateCarrierDriverDto) {
    await this.findOne(carrierId);
    return this.prisma.carrierDriver.create({
      data: { ...dto, carrierId },
    });
  }

  async updateDriver(driverId: string, dto: Partial<CreateCarrierDriverDto>) {
    return this.prisma.carrierDriver.update({
      where: { id: driverId },
      data: dto,
    });
  }

  async removeDriver(driverId: string) {
    return this.prisma.carrierDriver.update({
      where: { id: driverId },
      data: { isActive: false },
    });
  }
}
