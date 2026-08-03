'use client';
import { useQuery } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import { formatEventTypeName } from '@/lib/schedule-utils';
import { X, History, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShiftHistoryModalProps {
  driver: any;
  onClose: () => void;
}

export function ShiftHistoryModal({ driver, onClose }: ShiftHistoryModalProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['driver-shift-history', driver.id],
    queryFn: () => driversApi.getShiftHistory(driver.id).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Historial de Jornadas — {driver.firstName} {driver.lastName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro cronológico de turnos de ruta, regresos a base y períodos de descanso
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
              Cargando historial de jornadas...
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-sm">Sin registros históricos de jornada</p>
              <p className="text-xs text-slate-400">Los registros aparecerán automáticamente al registrar inicios de turno o descansos.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6">
              {logs.map((log: any) => (
                <div key={log.id} className="relative pl-6">
                  {/* Event Marker */}
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                    log.excedido ? 'bg-red-500' : log.tipoRegistro === 'INICIO_TURNO' ? 'bg-emerald-500' : log.tipoRegistro === 'INICIO_DESCANSO' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {formatEventTypeName(log.tipoRegistro)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatDateTime(log.fechaInicio)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {log.diasTrabajados !== null && log.diasTrabajados !== undefined && (
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-[11px]">
                          Días trabajados: {log.diasTrabajados}
                        </span>
                      )}
                      {log.diasDescansados !== null && log.diasDescansados !== undefined && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded font-semibold text-[11px]">
                          Días descansados: {log.diasDescansados}
                        </span>
                      )}
                      {log.excedido && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 rounded font-bold text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Régimen Excedido
                        </span>
                      )}
                    </div>

                    {log.notas && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        &quot;{log.notas}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
