import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReserveFundType, ReserveFundTxType } from '@prisma/client';
import { UpdateReserveFundConfigDto } from './dto/update-config.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';

const DEFAULT_WEIGHTS: Record<string, number> = {
  CAMION: 50,
  TRACTOR: 50,
  SEMIRREMOLQUE: 30,
  SEMI_CISTERNA: 30,
  CISTERNA: 30,
  CARRETON: 30,
  BATEA: 30,
  BITREN: 40,
  CAMIONETA: 15,
  EQUIPO_ESPECIAL: 25,
  VOLQUETE: 25,
  ACOPLADO: 20,
};

@Injectable()
export class ReserveFundsService {
  private readonly logger = new Logger(ReserveFundsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtener o crear configuración global de fondos por empresa
   */
  async getConfig(tenantId: string = 'default') {
    let config = await this.prisma.reserveFundConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.reserveFundConfig.create({
        data: {
          tenantId,
          pctMaintenance: 13.0,
          pctTires: 11.0,
          vehicleTypeWeights: DEFAULT_WEIGHTS,
        },
      });
    }

    return config;
  }

  /**
   * Actualizar configuración de porcentajes y pesos de reparto
   */
  async updateConfig(dto: UpdateReserveFundConfigDto, tenantId: string = 'default') {
    const config = await this.getConfig(tenantId);
    return this.prisma.reserveFundConfig.update({
      where: { id: config.id },
      data: {
        pctMaintenance: dto.pctMaintenance,
        pctTires: dto.pctTires,
        vehicleTypeWeights: dto.vehicleTypeWeights,
      },
    });
  }

  /**
   * Registrar movimiento contable y actualizar saldos de un activo
   */
  private async recordTransaction(params: {
    tenantId?: string;
    vehicleId: string;
    fundType: ReserveFundType;
    txType: ReserveFundTxType;
    monto: number; // Positivo para ingreso, negativo para egreso
    concepto: string;
    referenceNumber?: string;
    tripId?: string;
    maintenanceId?: string;
    maintenanceItemId?: string;
    createdById?: string;
  }) {
    const tenantId = params.tenantId || 'default';

    // Obtener o crear la cuenta del fondo para el activo
    let fund = await this.prisma.reserveFund.findUnique({
      where: {
        vehicleId_fundType: {
          vehicleId: params.vehicleId,
          fundType: params.fundType,
        },
      },
    });

    if (!fund) {
      fund = await this.prisma.reserveFund.create({
        data: {
          tenantId,
          vehicleId: params.vehicleId,
          fundType: params.fundType,
          accumulatedTotal: 0,
          spentTotal: 0,
          availableBalance: 0,
        },
      });
    }

    const saldoAnterior = fund.availableBalance;
    const saldoPosterior = Math.round((saldoAnterior + params.monto) * 100) / 100;

    let newAccumulated = fund.accumulatedTotal;
    let newSpent = fund.spentTotal;

    if (params.monto > 0) {
      newAccumulated += params.monto;
    } else {
      newSpent += Math.abs(params.monto);
    }

    // Actualizar resumen de la cuenta
    await this.prisma.reserveFund.update({
      where: { id: fund.id },
      data: {
        accumulatedTotal: Math.round(newAccumulated * 100) / 100,
        spentTotal: Math.round(newSpent * 100) / 100,
        availableBalance: saldoPosterior,
      },
    });

    // Registrar asiento en el libro diario (Ledger)
    return this.prisma.reserveFundTransaction.create({
      data: {
        tenantId,
        reserveFundId: fund.id,
        vehicleId: params.vehicleId,
        fundType: params.fundType,
        txType: params.txType,
        monto: Math.round(params.monto * 100) / 100,
        saldoAnterior: Math.round(saldoAnterior * 100) / 100,
        saldoPosterior,
        tripId: params.tripId,
        maintenanceId: params.maintenanceId,
        maintenanceItemId: params.maintenanceItemId,
        referenceNumber: params.referenceNumber,
        concepto: params.concepto,
        createdById: params.createdById,
      },
    });
  }

  /**
   * Procesar acreditación automática de Fondos por Viaje Finalizado
   */
  async processTripAccrual(tripId: string, tenantId: string = 'default') {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        trailer: true,
        reserveFundTransactions: true,
      },
    });

    if (!trip) throw new NotFoundException(`Viaje ${tripId} no encontrado`);

    // Evitar acreditación duplicada
    if (trip.reserveFundTransactions.length > 0) {
      this.logger.warn(`El viaje ${trip.numero} ya tiene fondos de reserva acreditados. Omitiendo.`);
      return { status: 'skipped', reason: 'already_accrued' };
    }

    const tarifa = trip.tarifaAcordada || 0;
    if (tarifa <= 0) {
      this.logger.warn(`El viaje ${trip.numero} posee tarifa 0. Omitiendo acreditación de reserva.`);
      return { status: 'skipped', reason: 'zero_tariff' };
    }

    const config = await this.getConfig(tenantId);
    const weightsMap: Record<string, number> = (config.vehicleTypeWeights as any) || DEFAULT_WEIGHTS;

    const totalMaintGenerated = (tarifa * config.pctMaintenance) / 100;
    const totalTiresGenerated = (tarifa * config.pctTires) / 100;

    // Recopilar activos participantes
    const participatingAssets: Array<{ id: string; tipo: string; patente: string }> = [];
    if (trip.vehicle) participatingAssets.push({ id: trip.vehicle.id, tipo: trip.vehicle.tipo, patente: trip.vehicle.patente });
    if (trip.trailer) participatingAssets.push({ id: trip.trailer.id, tipo: trip.trailer.tipo, patente: trip.trailer.patente });

    if (participatingAssets.length === 0) {
      return { status: 'skipped', reason: 'no_participating_assets' };
    }

    // Calcular suma de pesos
    let sumWeights = 0;
    const assetWeights = participatingAssets.map((asset) => {
      const weight = weightsMap[asset.tipo] || 30;
      sumWeights += weight;
      return { ...asset, weight };
    });

    if (sumWeights <= 0) sumWeights = participatingAssets.length;

    // Repartir acreditación a cada activo participante
    for (const asset of assetWeights) {
      const normalizedWeight = asset.weight / sumWeights;
      const maintShare = Math.round(totalMaintGenerated * normalizedWeight * 100) / 100;
      const tiresShare = Math.round(totalTiresGenerated * normalizedWeight * 100) / 100;

      // Acreditar Fondo Mantenimiento
      if (maintShare > 0) {
        await this.recordTransaction({
          tenantId,
          vehicleId: asset.id,
          fundType: ReserveFundType.MAINTENANCE,
          txType: ReserveFundTxType.INGRESO_VIAJE,
          monto: maintShare,
          concepto: `Acreditación ${config.pctMaintenance}% por Viaje ${trip.numero} (${asset.patente})`,
          referenceNumber: trip.numero,
          tripId: trip.id,
        });
      }

      // Acreditar Fondo Neumáticos
      if (tiresShare > 0) {
        await this.recordTransaction({
          tenantId,
          vehicleId: asset.id,
          fundType: ReserveFundType.TIRES,
          txType: ReserveFundTxType.INGRESO_VIAJE,
          monto: tiresShare,
          concepto: `Acreditación ${config.pctTires}% por Viaje ${trip.numero} (${asset.patente})`,
          referenceNumber: trip.numero,
          tripId: trip.id,
        });
      }
    }

    this.logger.log(`✅ Fondos de reserva acreditados exitosamente para Viaje ${trip.numero} entre ${participatingAssets.length} activos.`);
    return { status: 'success', tripId: trip.id, totalMaintGenerated, totalTiresGenerated };
  }

  /**
   * Procesar débito automático de Fondos por Orden de Trabajo Completada
   */
  async processMaintenanceDebit(maintenanceId: string, tenantId: string = 'default') {
    const ot = await this.prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        vehicle: true,
        items: { include: { sparePart: true } },
        reserveFundTransactions: true,
      },
    });

    if (!ot) throw new NotFoundException(`Orden de Trabajo ${maintenanceId} no encontrada`);

    if (ot.reserveFundTransactions.length > 0) {
      this.logger.warn(`La Orden de Trabajo ${ot.numeroOT} ya procesó débitos de fondos. Omitiendo.`);
      return { status: 'skipped', reason: 'already_debited' };
    }

    const otNumber = ot.numeroOT || `OT-${ot.id.substring(0, 8)}`;
    const tireCategories = ['NEUMATICOS', 'CUBIERTAS', 'CAMARAS', 'VALVULAS', 'RECAPADO', 'ALINEACION_BALANCEO'];

    let totalMaintDebit = 0;
    let totalTiresDebit = 0;

    if (ot.items && ot.items.length > 0) {
      for (const item of ot.items) {
        const itemCost = item.costoTotal || item.cantidad * item.costoUnitario || 0;
        if (itemCost <= 0) continue;

        const cat = (item.sparePart?.categoria || item.descripcion || '').toUpperCase();
        const isTireItem = tireCategories.some((tCat) => cat.includes(tCat));

        if (isTireItem) {
          totalTiresDebit += itemCost;
          await this.recordTransaction({
            tenantId,
            vehicleId: ot.vehicleId,
            fundType: ReserveFundType.TIRES,
            txType: ReserveFundTxType.EGRESO_NEUMATICOS,
            monto: -Math.abs(itemCost),
            concepto: `Débito Neumáticos por ${item.descripcion} (OT ${otNumber})`,
            referenceNumber: otNumber,
            maintenanceId: ot.id,
            maintenanceItemId: item.id,
          });
        } else {
          totalMaintDebit += itemCost;
          await this.recordTransaction({
            tenantId,
            vehicleId: ot.vehicleId,
            fundType: ReserveFundType.MAINTENANCE,
            txType: ReserveFundTxType.EGRESO_MANTENIMIENTO,
            monto: -Math.abs(itemCost),
            concepto: `Débito Mantenimiento por ${item.descripcion} (OT ${otNumber})`,
            referenceNumber: otNumber,
            maintenanceId: ot.id,
            maintenanceItemId: item.id,
          });
        }
      }
    } else {
      // Si la OT no tiene ítems individualizados pero tiene costo mano de obra / costo total
      const totalCost = ot.costoTotal || (ot.costoManoObra || 0) + (ot.costoRepuestos || 0);
      if (totalCost > 0) {
        totalMaintDebit = totalCost;
        await this.recordTransaction({
          tenantId,
          vehicleId: ot.vehicleId,
          fundType: ReserveFundType.MAINTENANCE,
          txType: ReserveFundTxType.EGRESO_MANTENIMIENTO,
          monto: -Math.abs(totalCost),
          concepto: `Débito Mantenimiento por OT ${otNumber} (${ot.descripcion})`,
          referenceNumber: otNumber,
          maintenanceId: ot.id,
        });
      }
    }

    this.logger.log(`✅ Débito de fondos procesado para OT ${otNumber}: Mantenimiento -$${totalMaintDebit}, Neumáticos -$${totalTiresDebit}.`);
    return { status: 'success', otNumber, totalMaintDebit, totalTiresDebit };
  }

  /**
   * Obtener cuenta corriente e historial financiero de un activo
   */
  async getAssetFundSummary(vehicleId: string, tenantId: string = 'default') {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, patente: true, marca: true, modelo: true, tipo: true },
    });

    if (!vehicle) throw new NotFoundException(`Vehículo ${vehicleId} no encontrado`);

    const funds = await this.prisma.reserveFund.findMany({
      where: { vehicleId },
    });

    const maintFund = funds.find((f) => f.fundType === ReserveFundType.MAINTENANCE) || {
      accumulatedTotal: 0,
      spentTotal: 0,
      availableBalance: 0,
    };

    const tiresFund = funds.find((f) => f.fundType === ReserveFundType.TIRES) || {
      accumulatedTotal: 0,
      spentTotal: 0,
      availableBalance: 0,
    };

    const transactions = await this.prisma.reserveFundTransaction.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      vehicle,
      maintenanceFund: maintFund,
      tiresFund: tiresFund,
      transactions,
    };
  }

  /**
   * Dashboard Global de Fondos de Reserva
   */
  async getGlobalDashboardMetrics(tenantId: string = 'default') {
    const funds = await this.prisma.reserveFund.findMany({
      include: { vehicle: { select: { id: true, patente: true, marca: true, modelo: true, tipo: true } } },
    });

    let totalMaintAccumulated = 0;
    let totalMaintSpent = 0;
    let totalMaintAvailable = 0;

    let totalTiresAccumulated = 0;
    let totalTiresSpent = 0;
    let totalTiresAvailable = 0;

    // Consolidar saldos por vehículo
    const assetBalancesMap = new Map<string, {
      vehicle: any;
      maintAvailable: number;
      tiresAvailable: number;
      totalAvailable: number;
      totalSpent: number;
    }>();

    for (const f of funds) {
      if (f.fundType === ReserveFundType.MAINTENANCE) {
        totalMaintAccumulated += f.accumulatedTotal;
        totalMaintSpent += f.spentTotal;
        totalMaintAvailable += f.availableBalance;
      } else if (f.fundType === ReserveFundType.TIRES) {
        totalTiresAccumulated += f.accumulatedTotal;
        totalTiresSpent += f.spentTotal;
        totalTiresAvailable += f.availableBalance;
      }

      const existing = assetBalancesMap.get(f.vehicleId) || {
        vehicle: f.vehicle,
        maintAvailable: 0,
        tiresAvailable: 0,
        totalAvailable: 0,
        totalSpent: 0,
      };

      if (f.fundType === ReserveFundType.MAINTENANCE) existing.maintAvailable = f.availableBalance;
      if (f.fundType === ReserveFundType.TIRES) existing.tiresAvailable = f.availableBalance;
      existing.totalAvailable += f.availableBalance;
      existing.totalSpent += f.spentTotal;

      assetBalancesMap.set(f.vehicleId, existing);
    }

    const assetList = Array.from(assetBalancesMap.values());

    // Rankings
    const topFunded = [...assetList].sort((a, b) => b.totalAvailable - a.totalAvailable).slice(0, 5);
    const topSpenders = [...assetList].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
    const deficitUnits = assetList.filter((a) => a.maintAvailable < 0 || a.tiresAvailable < 0);

    // Evolución Mensual (Últimos 6 meses)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('es-AR', { month: 'short', year: 'numeric' });

      const txs = await this.prisma.reserveFundTransaction.findMany({
        where: { createdAt: { gte: start, lte: end } },
      });

      let ingresos = 0;
      let egresosMaint = 0;
      let egresosTires = 0;

      for (const t of txs) {
        if (t.monto > 0) ingresos += t.monto;
        else if (t.fundType === ReserveFundType.MAINTENANCE) egresosMaint += Math.abs(t.monto);
        else if (t.fundType === ReserveFundType.TIRES) egresosTires += Math.abs(t.monto);
      }

      monthlyData.push({
        mes: label,
        ingresos: Math.round(ingresos),
        egresosMantenimiento: Math.round(egresosMaint),
        egresosNeumaticos: Math.round(egresosTires),
      });
    }

    return {
      kpis: {
        totalMaintAccumulated: Math.round(totalMaintAccumulated),
        totalMaintSpent: Math.round(totalMaintSpent),
        totalMaintAvailable: Math.round(totalMaintAvailable),
        totalTiresAccumulated: Math.round(totalTiresAccumulated),
        totalTiresSpent: Math.round(totalTiresSpent),
        totalTiresAvailable: Math.round(totalTiresAvailable),
        grandTotalAvailable: Math.round(totalMaintAvailable + totalTiresAvailable),
      },
      rankings: {
        topFunded,
        topSpenders,
        deficitUnits,
      },
      monthlyEvolution: monthlyData,
    };
  }

  /**
   * Registro de Ajuste Manual
   */
  async manualAdjustment(dto: ManualAdjustmentDto, userId?: string, tenantId: string = 'default') {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) throw new NotFoundException(`Vehículo ${dto.vehicleId} no encontrado`);

    return this.recordTransaction({
      tenantId,
      vehicleId: dto.vehicleId,
      fundType: dto.fundType,
      txType: ReserveFundTxType.AJUSTE_MANUAL,
      monto: dto.monto,
      concepto: `[Ajuste Manual] ${dto.concepto}`,
      createdById: userId,
    });
  }
}
