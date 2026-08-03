'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Sparkles, Wrench, Fuel, CircleDot, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function AnalyticsPredictiveTab() {
  const { data: predData, isLoading } = useQuery({
    queryKey: ['analytics-predictions'],
    queryFn: () => analyticsApi.getPredictive().then((r) => r.data),
  });

  if (isLoading) {
    return <div className="card p-12 text-center text-slate-400 text-xs">Calculando proyecciones predictivas por IA...</div>;
  }

  const maint = predData?.maintenancePredictions || [];
  const tires = predData?.tirePredictions || [];
  const fuel = predData?.fuelForecast;

  return (
    <div className="space-y-6">
      {/* AI Predictive Forecast Banner */}
      <div className="card p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white space-y-3 shadow-lg">
        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-cyan-300">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Motor Predictivo por Analítica IA & Tasa de Uso</span>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed font-medium">
          Proyecciones calculadas automáticamente según el patrón de acumulación de kilómetros, tasa de desgaste de neumáticos y consumo histórico de combustible.
        </p>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-blue-800 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-300 block">Combustible Proyectado 90 Días</span>
            <span className="text-xl font-black text-white">{fuel?.proyectadoLitros90Dias?.toLocaleString()} L</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-300 block">Presupuesto Diésel Estimado</span>
            <span className="text-xl font-black text-amber-300">{formatMoney(fuel?.proyectadoGasto90Dias)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-300 block">Costo Promedio Diésel</span>
            <span className="text-xl font-black text-cyan-300">${fuel?.costoPromedioPorLitro}/L</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Maintenance Predictions */}
        <div className="card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                Predicción de Próximos Servicios Preventivos
              </h3>
              <p className="text-xs text-slate-500">Estimación por tasa promedio de uso (180 km/día)</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {maint.map((item: any) => (
              <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white">{item.patente}</span>
                  <span className="text-slate-500 ml-2 font-medium">{item.marca} {item.modelo}</span>
                  <p className="text-[11px] text-slate-500">
                    Km Actual: <strong className="text-slate-800 dark:text-slate-200">{item.kilometrajeActual.toLocaleString()} km</strong> (Service a los {item.kmProximoService.toLocaleString()} km)
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 block mb-1">
                    en ~{item.diasEstimadosProximoService} días
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Restan {item.kmRestantes.toLocaleString()} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Tire Lifespan Predictions */}
        <div className="card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-indigo-600" />
                Vida Útil Restante de Neumáticos
              </h3>
              <p className="text-xs text-slate-500">Kilómetros estimados antes de alcanzar 3.0 mm</p>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {tires.map((tire: any) => (
              <div key={tire.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">{tire.codigoInterno}</span>
                  <span className="text-slate-500 ml-2 font-medium">{tire.marca} {tire.modelo}</span>
                  <p className="text-[11px] text-slate-500">
                    Profundidad actual: <strong className="text-blue-600 font-bold">{tire.profundidadActualMm} mm</strong> • Ubicación: {tire.vehiculoPatente}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    ~{tire.kmRestantesVidaUtil.toLocaleString()} km
                  </span>
                  {tire.recapadoRecomendado && (
                    <span className="text-[10px] font-black text-purple-600 dark:text-purple-400">
                      🔄 Recapado Sugerido
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
