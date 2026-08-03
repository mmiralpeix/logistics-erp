'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { formatMoney } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Truck, CircleDot, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AnalyticsOverviewTab() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: kpisData, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: () => analyticsApi.getKpis().then((r) => r.data),
  });

  const { data: comparativeData } = useQuery({
    queryKey: ['analytics-comparative'],
    queryFn: () => analyticsApi.getComparative().then((r) => r.data),
  });

  if (isLoadingKpis) {
    return <div className="card p-12 text-center text-slate-400 text-xs">Cargando métricas de Business Intelligence...</div>;
  }

  const kpis = kpisData?.kpis;
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="space-y-6">
      {/* Executive KPIs Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Costo por KM */}
        <div className="card p-5 border-l-4 border-l-blue-600 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Costo Operativo / Km</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{kpis?.costoPorKm}</span>
              <span className={`text-xs font-bold flex items-center ${kpis?.costoPorKmDelta?.startsWith('-') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpis?.costoPorKmDelta?.startsWith('-') ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                {kpis?.costoPorKmDelta}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Basado en {kpis?.totalKms?.toLocaleString()} km recorridos
            </p>
          </div>
        </div>

        {/* Facturación Bruta */}
        <div className="card p-5 border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Facturación Bruta</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white truncate">{formatMoney(kpis?.totalRevenue)}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-4 h-4" /> {kpis?.revenueDelta}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Margen Bruto: <strong className="text-emerald-600">{kpis?.grossMargin}</strong>
            </p>
          </div>
        </div>

        {/* Disponibilidad Flota */}
        <div className="card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Disponibilidad Flota</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block mt-1">
              {kpis?.disponibilidadPct}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {kpis?.fleetAvailable} disponibles · {kpis?.fleetInShop} en taller
            </p>
          </div>
        </div>

        {/* CPK Neumáticos */}
        <div className="card p-5 border-l-4 border-l-indigo-600 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">CPK Neumáticos Global</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <CircleDot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
              {kpis?.avgCpk}
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Costo por Km por neumático activo
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Costs */}
        <div className="card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Evolución de Ingresos vs Costos Operativos
              </h3>
              <p className="text-xs text-slate-500">Comparativa mensual acumulada</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={comparativeData?.monthlySeries || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFacturacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="mes" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => [formatMoney(value), '']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="facturacionActual" name="Facturación Actual" stroke="#2563EB" fillOpacity={1} fill="url(#colorFacturacion)" />
                <Area type="monotone" dataKey="costosActual" name="Costos Operativos" stroke="#EF4444" fillOpacity={1} fill="url(#colorCostos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Margen Operativo % */}
        <div className="card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Evolución de Margen Bruto Operativo (%)
              </h3>
              <p className="text-xs text-slate-500">Porcentaje de rentabilidad mensual</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeData?.monthlySeries || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="mes" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} unit="%" />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Margen']} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="margenActual" name="Margen Año Actual" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="margenAnterior" name="Margen Año Anterior" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
