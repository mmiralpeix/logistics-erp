'use client';
import { getScheduleStatusBadge, ScheduleStatusBadgeInfo } from '@/lib/schedule-utils';
import { formatDate } from '@/lib/utils';
import { Truck, Clock, Calendar, History, Settings, Play, CheckCircle2, Home, Power } from 'lucide-react';

interface DriverScheduleCardProps {
  driver: any;
  onRecordEvent: (driverId: string, tipo: string, currentDriverName: string) => void;
  onViewHistory: (driver: any) => void;
  onConfigureModalidad: (driver: any) => void;
}

export function DriverScheduleCard({
  driver,
  onRecordEvent,
  onViewHistory,
  onConfigureModalidad,
}: DriverScheduleCardProps) {
  const m = driver.scheduleMetrics || {};
  const badge: ScheduleStatusBadgeInfo = getScheduleStatusBadge(m.status);

  const activeTrip = driver.trips?.[0];

  return (
    <div className="card p-5 hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Top Bar: Driver Info & Status Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-extrabold text-sm rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-800">
            {driver.firstName?.[0]}{driver.lastName?.[0]}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              {driver.firstName} {driver.lastName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>DNI: {driver.dni}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Modalidad: {m.modalidadLaboral} ({m.diasTrabajo}x{m.diasDescanso})
              </span>
              {driver.supervisor && (
                <>
                  <span>•</span>
                  <span className="text-slate-500">Sup: {driver.supervisor}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-xl border text-xs font-extrabold flex items-center gap-2 ${badge.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
            <span>{badge.label}</span>
          </div>

          <button
            type="button"
            onClick={() => onConfigureModalidad(driver)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Configurar régimen laboral y fechas"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar of Work/Rest Cycle */}
      <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            {m.status === 'DESCANSANDO' || m.status === 'EXCEDIDO_DESCANSO' ? (
              <>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Descanso: Día {m.diasEnDescanso} de {m.diasDescanso}
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                Ruta: Día {m.diasEnRuta} de {m.diasTrabajo}
              </>
            )}
          </span>

          <span className="font-mono font-extrabold text-slate-600 dark:text-slate-400">
            {m.porcentajeCompletado}% completado
          </span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              m.status === 'EXCEDIDO' || m.status === 'EXCEDIDO_DESCANSO'
                ? 'bg-red-500'
                : m.status === 'PROXIMO_A_DESCANSO'
                ? 'bg-amber-500'
                : m.status === 'DESCANSANDO'
                ? 'bg-blue-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, m.porcentajeCompletado || 0)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 font-medium">
          <span>
            {m.status === 'DESCANSANDO' || m.status === 'EXCEDIDO_DESCANSO'
              ? `Inicio descanso: ${formatDate(m.fechaInicioDescanso)}`
              : m.fechaInicioTurno
              ? `Inicio turno: ${formatDate(m.fechaInicioTurno)}`
              : 'Sin turno activo'}
          </span>
          <span>
            {m.proximoCambioEstado
              ? `Próx. cambio: ${formatDate(m.proximoCambioEstado)}`
              : 'No especificado'}
          </span>
        </div>
      </div>

      {/* Active Trip Banner if currently on route */}
      {activeTrip && (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs">
          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-600" /> Viaje Activo: #{activeTrip.numero}
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            Destino: {activeTrip.destino}
          </span>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onViewHistory(driver)}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-blue-500" />
          <span>Ver Historial de Jornadas</span>
        </button>

        {/* Quick Shift Event Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* If Resting: Option to Finish Rest / Start Shift */}
          {m.status === 'DESCANSANDO' || m.status === 'EXCEDIDO_DESCANSO' ? (
            <button
              type="button"
              onClick={() => onRecordEvent(driver.id, 'INICIO_TURNO', `${driver.firstName} ${driver.lastName}`)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Iniciar Turno Ruta
            </button>
          ) : (
            <>
              {/* If on Route: Option to Record Return or Start Rest */}
              {!driver.fechaRegreso && m.fechaInicioTurno && (
                <button
                  type="button"
                  onClick={() => onRecordEvent(driver.id, 'REGRESO', `${driver.firstName} ${driver.lastName}`)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Home className="w-3 h-3 text-blue-500" /> Registrar Regreso Base
                </button>
              )}

              <button
                type="button"
                onClick={() => onRecordEvent(driver.id, 'INICIO_DESCANSO', `${driver.firstName} ${driver.lastName}`)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Clock className="w-3 h-3" /> Iniciar Descanso / Franco
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
