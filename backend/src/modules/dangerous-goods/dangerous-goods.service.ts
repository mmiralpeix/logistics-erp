import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Tabla de clases de riesgo ONU según Decreto 779/95 y Resolución ST 195/97
const CLASES_RIESGO = [
  { clase: 'CLASE_1', codigo: '1', nombre: 'Explosivos', descripcion: 'Materias y objetos explosivos', ejemplos: 'Pólvora, dinamita, fuegos artificiales', color: '#FF6B35' },
  { clase: 'CLASE_2', codigo: '2', nombre: 'Gases', descripcion: 'Gases comprimidos, licuados, disueltos o refrigerados', ejemplos: 'GLP, gas natural, acetileno, CO2', color: '#4A90D9' },
  { clase: 'CLASE_3', codigo: '3', nombre: 'Líquidos Inflamables', descripcion: 'Líquidos con punto de inflamación ≤ 60.5°C', ejemplos: 'Gasolina (UN1203), nafta, alcohol, solventes', color: '#E74C3C' },
  { clase: 'CLASE_4', codigo: '4', nombre: 'Sólidos Inflamables', descripcion: 'Sólidos inflamables, autorreactivos, pirofóricos', ejemplos: 'Azufre, fósforo blanco, magnesio en polvo', color: '#F39C12' },
  { clase: 'CLASE_5', codigo: '5', nombre: 'Sustancias Comburentes y Peróxidos', descripcion: 'Oxidantes y peróxidos orgánicos', ejemplos: 'Peróxido de hidrógeno, cloro, nitrato de amonio', color: '#F1C40F' },
  { clase: 'CLASE_6', codigo: '6', nombre: 'Sustancias Tóxicas e Infecciosas', descripcion: 'Materias venenosas y biológicas', ejemplos: 'Pesticidas, cianuro, material biológico tipo B', color: '#27AE60' },
  { clase: 'CLASE_7', codigo: '7', nombre: 'Material Radiactivo', descripcion: 'Materiales radiactivos y fisibles', ejemplos: 'Uranio, cobalto-60, yodo-131', color: '#8E44AD' },
  { clase: 'CLASE_8', codigo: '8', nombre: 'Sustancias Corrosivas', descripcion: 'Materias que causan necrosis en tejidos o corroen materiales', ejemplos: 'Ácido sulfúrico, ácido clorhídrico, soda cáustica', color: '#1A252F' },
  { clase: 'CLASE_9', codigo: '9', nombre: 'Sustancias Peligrosas Varias', descripcion: 'Materias y objetos que presentan riesgo no cubierto por otras clases', ejemplos: 'Amianto, baterías de litio, hielo seco, vehículos', color: '#95A5A6' },
];

@Injectable()
export class DangerousGoodsService {
  constructor(private prisma: PrismaService) {}

  getClases() {
    return CLASES_RIESGO;
  }

  async findAll(filters: { clase?: string; search?: string }) {
    const { clase, search } = filters;
    const where: any = {};

    if (clase) where.clase = clase;
    if (search) where.OR = [
      { numeroONU: { contains: search, mode: 'insensitive' } },
      { nombreTecnico: { contains: search, mode: 'insensitive' } },
    ];

    return this.prisma.dangerousGoodsDeclaration.findMany({
      where,
      include: {
        trip: {
          select: {
            numero: true,
            origen: true,
            destino: true,
            fechaSalidaProgramada: true,
            status: true,
            vehicle: { select: { patente: true, marca: true } },
            driver: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: string) {
    const decl = await this.prisma.dangerousGoodsDeclaration.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: true,
            client: true,
          },
        },
      },
    });
    if (!decl) throw new NotFoundException('Declaración de carga peligrosa no encontrada');
    return decl;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    // Recalculate cumpleNormativa when updating
    const updated = await this.prisma.dangerousGoodsDeclaration.update({ where: { id }, data });
    if (updated.hojaSeguridad && updated.equipoObligatorio && updated.permisosCompletos) {
      await this.prisma.dangerousGoodsDeclaration.update({ where: { id }, data: { cumpleNormativa: true } });
    }
    return this.findOne(id);
  }

  async approve(id: string) {
    const decl = await this.findOne(id);
    return this.prisma.dangerousGoodsDeclaration.update({
      where: { id },
      data: {
        permisosCompletos: true,
        cumpleNormativa: decl.hojaSeguridad && decl.equipoObligatorio,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dangerousGoodsDeclaration.delete({ where: { id } });
  }

  // Comprehensive compliance check for a trip with dangerous goods
  async checkTripCompliance(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true,
        vehicle: true,
        dangerousGoods: true,
        documents: { where: { tipo: { in: ['CARTA_PORTE', 'HOJA_SEGURIDAD'] as any } } },
      },
    });

    if (!trip) throw new NotFoundException('Viaje no encontrado');
    if (!trip.esCargaPeligrosa) return { compliant: true, message: 'El viaje no es de carga peligrosa' };

    const checks = {
      conductorHabilitado: trip.driver?.habilitadoCargasPeligrosas ?? false,
      certificadoVigente: trip.driver?.certificadoCargasPeligrosas
        ? new Date(trip.driver.certificadoCargasPeligrosas) > new Date()
        : false,
      declaracionExiste: !!trip.dangerousGoods,
      hojaSeguridad: trip.dangerousGoods?.hojaSeguridad ?? false,
      equipoObligatorio: trip.dangerousGoods?.equipoObligatorio ?? false,
      permisosCompletos: trip.dangerousGoods?.permisosCompletos ?? false,
      documentosAdjuntos: trip.documents.length > 0,
    };

    const allPassed = Object.values(checks).every(Boolean);

    const issues: string[] = [];
    if (!checks.conductorHabilitado) issues.push('El conductor no está habilitado para cargas peligrosas (Decreto 779/95)');
    if (!checks.certificadoVigente) issues.push('El certificado de capacitación del conductor está vencido o no existe');
    if (!checks.declaracionExiste) issues.push('Falta declaración de mercancías peligrosas');
    if (!checks.hojaSeguridad) issues.push('Falta hoja de seguridad de la mercancía');
    if (!checks.equipoObligatorio) issues.push('No se confirmó el equipo de emergencia obligatorio a bordo');
    if (!checks.permisosCompletos) issues.push('Los permisos especiales no están completos');
    if (!checks.documentosAdjuntos) issues.push('No hay documentos de carta de porte adjuntos al viaje');

    return {
      compliant: allPassed,
      checks,
      issues,
      normativa: 'Decreto 779/95 — Transporte de Mercancías Peligrosas en la República Argentina',
      claseRiesgo: trip.dangerousGoods?.clase ?? null,
      numeroONU: trip.dangerousGoods?.numeroONU ?? null,
    };
  }
}
