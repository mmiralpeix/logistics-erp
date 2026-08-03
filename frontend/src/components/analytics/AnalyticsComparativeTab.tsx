'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { formatMoney } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitCompare, Calendar } from 'lucide-react';

export function AnalyticsComparativeTab() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: compData, isLoading } = useQuery({
    queryKey: ['analytics-comparative'],
    queryFn: () => analyticsApi.getComparative().then((r) => r.data),
  });

  if (isLoading) {
    return <div className="card p-12 text-center text-slate-400 text-xs">Cargando comparativas temporales...</div>;
  }

  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider">
          <GitCompare className="w-4 h-4" />
          <span>Módulo de Comparativa Interanual ({compData?.currentYear} vs {compData?.lastYear})</span>
        </div>
        <p className="text-xs text-slate-500">
          Análisis comparativo de facturación y costos directos entre períodos homólogos
        </p>
      </div>

      {/* Bar Comparison Chart */}
      <div className="card p-5 space-y-4 shadow-sm">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Calendar className="w-4 h-4 text-purple-600" />
          Facturación Año Actual ({compData?.currentYear}) vs Año Anterior ({compData?.lastYear})
        </h3>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compData?.monthlySeries || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="mes" stroke={axisColor} fontSize={11} />
              <YAxis stroke={axisColor} fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(value: number) => [formatMoney(value), '']} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="facturacionActual" name={`Facturación ${compData?.currentYear}`} fill="#2563EB" radius={[4, 4, 0, 0]} />
              <Bar dataKey="facturacionAnterior" name={`Facturación ${compData?.lastYear}`} fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Data Breakdown */}
      <div className="card overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
          Tabla de Comparativa Mensual
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              <th className="p-3 text-left">Mes</th>
              <th className="p-3 text-right">Facturación {compData?.currentYear} ($)</th>
              <th className="p-3 text-right">Facturación {compData?.lastYear} ($)</th>
              <th className="p-3 text-right">Costos {compData?.currentYear} ($)</th>
              <th className="p-3 text-right">Margen {compData?.currentYear} (%)</th>
              <th className="p-3 text-right">Margen {compData?.lastYear} (%)</th>
            </tr>
          </thead>
          <tbody>
            {compData?.monthlySeries?.map((row: any) => (
              <tr key={row.mes} className="border-b border-slate-100 dark:border-slate-800 font-medium">
                <td className="p-3 font-bold text-slate-900 dark:text-white">{row.mes}</td>
                <td className="p-3 text-right font-bold text-blue-600">{formatMoney(row.facturacionActual)}</td>
                <td className="p-3 text-right text-slate-500">{formatMoney(row.facturacionAnterior)}</td>
                <td className="p-3 text-right text-rose-600 font-bold">{formatMoney(row.costosActual)}</td>
                <td className="p-3 text-right font-bold text-emerald-600">{row.margenActual}%</td>
                <td className="p-3 text-right text-slate-500">{row.margenAnterior}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
