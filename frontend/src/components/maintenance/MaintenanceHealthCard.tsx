'use client';
import { Truck, Wrench, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { formatMoney } from '@/lib/utils';

interface MaintenanceHealthCardProps {
  vehicle: any;
  costData?: any;
  onNewOT: (vehicleId: string) => void;
}

export function MaintenanceHealthCard({ vehicle, costData, onNewOT }: MaintenanceHealthCardProps) {
  const kmCurrent = vehicle.kilometraje || 0;
  // Estimate next service every 20,000 km
  const nextServiceKm = Math.ceil((kmCurrent + 1) / 20000) * 20000;
  const kmRemaining = Math.max(0, nextServiceKm - kmCurrent);
  const progressPercent = Math.min(100, Math.max(0, ((20000 - kmRemaining) / 20000) * 100));

  const isUrgent = kmRemaining < 1500 || vehicle.status === 'EN_MANTENIMIENTO';
  const isWarning = kmRemaining >= 1500 && kmRemaining < 4000;

  return (
    <div className="card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                vehicle.status === 'EN_MANTENIMIENTO'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : isUrgent
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}
            >
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                {vehicle.patente}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {vehicle.marca} {vehicle.modelo}
              </p>
            </div>
          </div>

          <span
            className={`badge ${
              vehicle.status === 'EN_MANTENIMIENTO'
                ? 'badge-red'
                : vehicle.status === 'DISPONIBLE'
                ? 'badge-green'
                : 'badge-yellow'
            }`}
          >
            {vehicle.status}
          </span>
        </div>

        {/* Health Progress Bar */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-400">Odómetro Actual</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              {kmCurrent.toLocaleString('es-AR')} km
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Próx. Service: {nextServiceKm.toLocaleString('es-AR')} km</span>
            <span className={isUrgent ? 'text-rose-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
              Faltan {kmRemaining.toLocaleString('es-AR')} km
            </span>
          </div>
        </div>
      </div>

      {/* Footer info & action */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Costo Acumulado</span>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {costData ? formatMoney(costData._sum.costoTotal) : '$0'}
            {costData?.costPerKm ? <span className="text-[10px] font-normal text-slate-500 ml-1">(${costData.costPerKm}/km)</span> : null}
          </p>
        </div>

        <button
          onClick={() => onNewOT(vehicle.id)}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20"
        >
          <Wrench className="w-3.5 h-3.5" /> Crear OT
        </button>
      </div>
    </div>
  );
}
