'use client';
import { CircleDot, Truck, Warehouse, RefreshCw, AlertCircle, DollarSign, Award, Activity } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { formatCPK } from '@/lib/tire-utils';

interface TireKPIsProps {
  kpis?: {
    totalTires: number;
    installedCount: number;
    warehouseCount: number;
    retreadCount: number;
    retiredCount: number;
    lowDepthAlertCount: number;
    totalInvestment: number;
    averageCpk: number;
    totalRetreadsCount: number;
    averageKmPerTire: number;
  };
  isLoading?: boolean;
}

export function TireKPIs({ kpis, isLoading }: TireKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse h-24 bg-slate-100 dark:bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {/* 1. Total Activos */}
      <div className="card p-4 border-l-4 border-l-blue-600 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Neumáticos
          </span>
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <CircleDot className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {kpis?.totalTires || 0}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-medium">activos</span>
        </div>
      </div>

      {/* 2. Instalados */}
      <div className="card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Instalados
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {kpis?.installedCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-medium">en rodaje</span>
        </div>
      </div>

      {/* 3. En Depósito */}
      <div className="card p-4 border-l-4 border-l-cyan-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            En Depósito
          </span>
          <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
            <Warehouse className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {kpis?.warehouseCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-medium">stock disponible</span>
        </div>
      </div>

      {/* 4. En Recapado */}
      <div className="card p-4 border-l-4 border-l-purple-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            En Recapado
          </span>
          <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <RefreshCw className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black text-purple-700 dark:text-purple-300">
            {kpis?.retreadCount || 0}
          </span>
          <span className="text-[10px] text-slate-500 ml-1 font-medium">en proceso</span>
        </div>
      </div>

      {/* 5. Alerta Desgaste Crítico */}
      <div className="card p-4 border-l-4 border-l-red-500 flex flex-col justify-between shadow-sm bg-red-50/20 dark:bg-red-950/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            Desgaste Crítico
          </span>
          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-xl font-black text-red-600 dark:text-red-400">
            {kpis?.lowDepthAlertCount || 0}
          </span>
          <span className="text-[10px] text-red-600/80 dark:text-red-400/80 ml-1 font-bold">(&lt; 3.0 mm)</span>
        </div>
      </div>

      {/* 6. Inversión Total */}
      <div className="card p-4 border-l-4 border-l-emerald-600 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Inversión Flota
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-lg font-black text-slate-900 dark:text-white truncate block">
            {formatMoney(kpis?.totalInvestment || 0)}
          </span>
        </div>
      </div>

      {/* 7. Costo por Km (CPK) */}
      <div className="card p-4 border-l-4 border-l-indigo-600 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Promedio CPK
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 truncate block">
            {formatCPK(kpis?.averageCpk)}
          </span>
        </div>
      </div>
    </div>
  );
}
