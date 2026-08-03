'use client';
import { useQuery } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils';
import { formatCPK, formatPositionLabel } from '@/lib/tire-utils';
import { X, History, QrCode, Truck, RefreshCw, Eye, Calendar, Award } from 'lucide-react';

interface TireTimelineModalProps {
  tireId: string;
  onClose: () => void;
}

export function TireTimelineModal({ tireId, onClose }: TireTimelineModalProps) {
  const { data: tire, isLoading } = useQuery({
    queryKey: ['tire-detail-timeline', tireId],
    queryFn: () => tiresApi.getOne(tireId).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Ciclo de Vida — Neumático {tire?.codigoInterno || '...'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tire?.marca} {tire?.modelo} ({tire?.medida}) • Serie: <span className="font-mono">{tire?.numeroSerie}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
              Cargando historial completo del neumático...
            </div>
          ) : !tire ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              Neumático no encontrado.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Asset Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Profundidad Actual</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{tire.profundidadActualMm} mm</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Kilómetros</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{tire.kilometrosRecorridos} km</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Recapados</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">{tire.cantidadRecapados} de {tire.maxRecapadosPermitidos}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Métrica CPK</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatCPK(tire.cpk)}</span>
                </div>
              </div>

              {/* QR Code Box */}
              <div className="flex items-center justify-between p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 shadow-sm">
                    <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
                      Código QR Único de Trazabilidad
                    </span>
                    <span className="font-mono text-xs font-extrabold text-blue-800 dark:text-blue-300">
                      {tire.codigoQR}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  {tire.status}
                </span>
              </div>

              {/* Permanent Movement Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Línea de Tiempo de Movimientos e Historial
                </h3>

                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-4 pt-2">
                  {tire.movements?.map((mov: any) => (
                    <div key={mov.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600" />
                      <div className="bg-white dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {mov.tipoMovimiento}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(mov.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {mov.posicionOrigen && (
                            <span>Origen: <strong className="text-slate-800 dark:text-white">{mov.posicionOrigen}</strong></span>
                          )}
                          {mov.posicionDestino && (
                            <span>Destino: <strong className="text-blue-600 dark:text-blue-400">{mov.posicionDestino}</strong></span>
                          )}
                          {mov.profundidadMm && (
                            <span>Prof: <strong>{mov.profundidadMm} mm</strong></span>
                          )}
                          {mov.costo > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Costo: {formatMoney(mov.costo)}</span>
                          )}
                        </div>

                        {mov.motivo && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            &quot;{mov.motivo}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
