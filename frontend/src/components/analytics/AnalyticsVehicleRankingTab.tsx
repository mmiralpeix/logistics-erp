'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Trophy, Truck, Fuel, DollarSign, ArrowUpRight } from 'lucide-react';

export function AnalyticsVehicleRankingTab() {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ['analytics-vehicle-ranking'],
    queryFn: () => analyticsApi.getVehicleRanking().then((r) => r.data),
  });

  if (isLoading) {
    return <div className="card p-12 text-center text-slate-400 text-xs">Generando ranking de eficiencia operativa de vehículos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-wider">
          <Trophy className="w-5 h-5" />
          <span>Ranking de Eficiencia Operativa de la Flota</span>
        </div>
        <p className="text-xs text-slate-500">
          Clasificación de unidades ordenada por margen bruto operativo, costo por kilómetro y rendimiento diésel
        </p>
      </div>

      <div className="card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Pos / Vehículo</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-right">Km Recorridos</th>
              <th className="px-4 py-3 text-right">Facturado ($)</th>
              <th className="px-4 py-3 text-right">Costo Operativo ($)</th>
              <th className="px-4 py-3 text-right">Costo / Km ($)</th>
              <th className="px-4 py-3 text-right">Rendimiento (km/l)</th>
              <th className="px-4 py-3 text-right">Margen Bruto (%)</th>
            </tr>
          </thead>
          <tbody>
            {!ranking || ranking.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                  No hay vehículos registrados para rankear
                </td>
              </tr>
            ) : (
              ranking.map((v: any, index: number) => (
                <tr key={v.id} className="table-row">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      index === 0 ? 'bg-amber-400 text-amber-950' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-extrabold">{v.patente}</span>
                      <p className="text-[11px] text-slate-400 font-normal">{v.marca} {v.modelo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-semibold">{v.tipo || 'CAMION'}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{v.totalKms.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatMoney(v.totalIngresos)}</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600">{formatMoney(v.costoTotal)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">${v.costoPorKm}</td>
                  <td className="px-4 py-3 text-right font-bold text-cyan-600">{v.rendimientoKmL} km/l</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-block">
                      {v.margenPct}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
