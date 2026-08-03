'use client';
import { Truck, Clock, AlertTriangle, AlertCircle, Award, Calendar } from 'lucide-react';

interface DriverScheduleKPIsProps {
  kpis?: {
    totalDrivers: number;
    enRutaCount: number;
    descansandoCount: number;
    proximoDescansoCount: number;
    excedidosCount: number;
    promedioDiasRuta: number;
    promedioDiasDescanso: number;
    topDriverEnRuta: { name: string; days: number } | null;
  };
  isLoading?: boolean;
}

export function DriverScheduleKPIs({ kpis, isLoading }: DriverScheduleKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse h-24 bg-slate-100 dark:bg-slate-800/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Choferes En Ruta */}
      <div className="card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            En Ruta
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis?.enRutaCount || 0}
          </span>
          <span className="text-[11px] text-slate-500 ml-1 font-medium">choferes</span>
        </div>
      </div>

      {/* 2. Descansando */}
      <div className="card p-4 border-l-4 border-l-blue-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Descansando
          </span>
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {kpis?.descansandoCount || 0}
          </span>
          <span className="text-[11px] text-slate-500 ml-1 font-medium">choferes</span>
        </div>
      </div>

      {/* 3. Próximos a Descanso */}
      <div className="card p-4 border-l-4 border-l-amber-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Próximos Descanso
          </span>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpis?.proximoDescansoCount || 0}
          </span>
          <span className="text-[11px] text-slate-500 ml-1 font-medium">restan ≤2d</span>
        </div>
      </div>

      {/* 4. Excedidos */}
      <div className="card p-4 border-l-4 border-l-red-500 flex flex-col justify-between shadow-sm bg-red-50/30 dark:bg-red-950/10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
            Excedidos
          </span>
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className="text-2xl font-black text-red-600 dark:text-red-400">
            {kpis?.excedidosCount || 0}
          </span>
          <span className="text-[11px] text-red-600/80 dark:text-red-400/80 ml-1 font-bold">requieren franco</span>
        </div>
      </div>

      {/* 5. Promedios Ruta / Franco */}
      <div className="card p-4 border-l-4 border-l-purple-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Prom. Días
          </span>
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1 text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white text-base">{kpis?.promedioDiasRuta || 0}d</span>
            <span className="text-[10px] text-slate-400 uppercase">Ruta</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base">{kpis?.promedioDiasDescanso || 0}d</span>
            <span className="text-[10px] text-slate-400 uppercase">Franco</span>
          </div>
        </div>
      </div>

      {/* 6. Mayor Permanencia en Ruta */}
      <div className="card p-4 border-l-4 border-l-indigo-500 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Mayor Permanencia
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          {kpis?.topDriverEnRuta ? (
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={kpis.topDriverEnRuta.name}>
                {kpis.topDriverEnRuta.name}
              </p>
              <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {kpis.topDriverEnRuta.days} días seguidos
              </p>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Sin choferes</span>
          )}
        </div>
      </div>
    </div>
  );
}
