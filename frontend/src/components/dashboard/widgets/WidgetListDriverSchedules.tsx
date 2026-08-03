'use client';
import { useQuery } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import { getScheduleStatusBadge } from '@/lib/schedule-utils';
import { Clock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function WidgetListDriverSchedules() {
  const { data: scheduleDrivers, isLoading } = useQuery({
    queryKey: ['dashboard-driver-schedules'],
    queryFn: () => driversApi.getSchedule({ limit: 6 }).then((r) => r.data),
  });

  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Driver Schedule (Jornadas en Ruta & Franco)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de días de trabajo y descansos de choferes
          </p>
        </div>
        <Link
          href="/drivers"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ver Driver Schedule <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 flex-1">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Cargando jornadas...</div>
        ) : !scheduleDrivers || scheduleDrivers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No hay conductores registrados</div>
        ) : (
          scheduleDrivers.slice(0, 6).map((driver: any) => {
            const badge = getScheduleStatusBadge(driver.scheduleMetrics?.status);
            return (
              <div
                key={driver.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {driver.firstName} {driver.lastName}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Régimen: <strong className="text-slate-700 dark:text-slate-300">{driver.modalidadLaboral || '21x7'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black inline-block mb-1 ${badge.badgeClass}`}>
                    {badge.label}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {driver.scheduleMetrics?.diasEnRuta || 0} días en ruta
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
