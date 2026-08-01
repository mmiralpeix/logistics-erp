'use client';
import { Clock, CalendarCheck } from 'lucide-react';

export function RouteAndDatesSection({
  register,
  isLocked,
  totalLeadTime,
}: {
  register: any;
  isLocked: boolean;
  totalLeadTime: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          Origen *
        </label>
        <input {...register('origen', { required: true })} className="input w-full text-sm" placeholder="Ej: Salta" disabled={isLocked} />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          Destino *
        </label>
        <input {...register('destino', { required: true })} className="input w-full text-sm" placeholder="Ej: Mariana" disabled={isLocked} />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          Fecha y Hora de Salida *
        </label>
        <input {...register('fechaSalidaProgramada', { required: true })} type="datetime-local" className="input w-full text-sm" disabled={isLocked} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Llegada Estimada
          </label>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {totalLeadTime}h Lead Time Total
          </span>
        </div>
        <input {...register('fechaLlegadaEstimada')} type="datetime-local" className="input w-full text-sm" disabled={isLocked} />
      </div>

      {/* Fechas Reales */}
      <div>
        <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <CalendarCheck className="w-3.5 h-3.5" /> Salida Real
        </label>
        <input {...register('fechaSalidaReal')} type="datetime-local" className="input w-full text-sm border-emerald-300 dark:border-emerald-700/50" />
      </div>

      <div>
        <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <CalendarCheck className="w-3.5 h-3.5" /> Llegada Real
        </label>
        <input {...register('fechaLlegadaReal')} type="datetime-local" className="input w-full text-sm border-emerald-300 dark:border-emerald-700/50" />
      </div>
    </div>
  );
}
