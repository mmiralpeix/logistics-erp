'use client';
import { useQuery } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { formatCPK, getTireDepthInfo } from '@/lib/tire-utils';
import { CircleDot, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function WidgetListTires() {
  const { data: criticalTires, isLoading } = useQuery({
    queryKey: ['dashboard-critical-tires'],
    queryFn: () => tiresApi.getAll({ minProfundidad: 3.0, limit: 6 }).then((r) => r.data),
  });

  const list = criticalTires?.data || [];

  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            Neumáticos con Desgaste Crítico (&lt;3.0 mm)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Unidades que requieren recambio o recapado urgente
          </p>
        </div>
        <Link
          href="/maintenance"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ir a Neumáticos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 flex-1">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Cargando neumáticos...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            🟢 No hay neumáticos con desgaste crítico de banda
          </div>
        ) : (
          list.map((tire: any) => {
            const depthInfo = getTireDepthInfo(tire.profundidadActualMm, tire.profundidadInicialMm);
            return (
              <div
                key={tire.id}
                className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CircleDot className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <div>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {tire.codigoInterno}
                    </span>
                    <span className="text-slate-500 font-medium ml-2">
                      {tire.marca} {tire.modelo} ({tire.medida})
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Ubicación: <strong className="text-slate-800 dark:text-slate-200">{tire.vehicle ? tire.vehicle.patente : 'Depósito Central'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-extrabold text-xs block ${depthInfo.textClass}`}>
                    {tire.profundidadActualMm} mm
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold">
                    CPK: {formatCPK(tire.cpk)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
