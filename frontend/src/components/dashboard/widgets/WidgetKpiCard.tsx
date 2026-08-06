'use client';
import { Truck, MapPin, DollarSign, AlertTriangle, Users, CircleDot, Fuel, Wrench } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { formatCPK } from '@/lib/tire-utils';

interface WidgetKpiCardProps {
  type: string;
  stats?: any;
  tireKpis?: any;
}

export function WidgetKpiCard({ type, stats, tireKpis }: WidgetKpiCardProps) {
  switch (type) {
    case 'kpi-fleet':
      return (
        <div className="card p-4 border-l-4 border-l-blue-600 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Flota Total
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.fleet?.total || 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {stats?.fleet?.motriz || 0} motrices · {stats?.fleet?.remolcado || 0} remolcadas
            </p>
          </div>
        </div>
      );

    case 'kpi-trips':
      return (
        <div className="card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Viajes Activos
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.trips?.active || 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {stats?.trips?.pending || 0} programados pendientes
            </p>
          </div>
        </div>
      );

    case 'kpi-revenue':
      return (
        <div className="card p-4 border-l-4 border-l-amber-500 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Facturación Mes
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white truncate block">
              {formatMoney(stats?.financial?.monthlyRevenue)}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Margen Bruto: {stats?.financial?.grossMarginPct || 0}%
            </p>
          </div>
        </div>
      );

    case 'kpi-alerts':
      return (
        <div className="card p-4 border-l-4 border-l-red-500 flex flex-col justify-between shadow-sm h-full bg-red-50/20 dark:bg-red-950/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              Alertas Totales ERP
            </span>
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {stats?.alerts?.total || 0}
            </span>
            <p className="text-[11px] text-red-600/80 dark:text-red-400/80 font-bold mt-0.5">
              {stats?.alerts?.pendingMaintenances || 0} mantenimientos pendientes
            </p>
          </div>
        </div>
      );

    case 'kpi-drivers':
      return (
        <div className="card p-4 border-l-4 border-l-purple-500 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Conductores Activos
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.drivers?.total || 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Choferes registrados en sistema
            </p>
          </div>
        </div>
      );

    case 'kpi-tires':
      return (
        <div className="card p-4 border-l-4 border-l-indigo-600 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gestión Neumáticos
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <CircleDot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
              {tireKpis?.totalTires || 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              CPK Promedio: <strong className="text-indigo-600">{formatCPK(tireKpis?.averageCpk)}</strong>
            </p>
          </div>
        </div>
      );

    case 'kpi-fuel':
      return (
        <div className="card p-4 border-l-4 border-l-cyan-600 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Consumo Combustible
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <Fuel className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white truncate block">
              {(stats?.financial?.monthlyFuelLiters || 0).toLocaleString()} L
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Costo mensual: <strong className="text-cyan-600">{formatMoney(stats?.financial?.monthlyFuelCost)}</strong>
            </p>
          </div>
        </div>
      );

    case 'kpi-maintenance':
      return (
        <div className="card p-4 border-l-4 border-l-rose-500 flex flex-col justify-between shadow-sm h-full">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Salud Mantenimiento
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {stats?.alerts?.pendingMaintenances || 0}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Ordenes de trabajo pendientes
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
