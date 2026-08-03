'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { formatDate, formatDateTime, formatMoney } from '@/lib/utils';
import { formatCPK, formatPositionLabel, getTireStatusBadge } from '@/lib/tire-utils';
import { X, History, QrCode, Truck, RefreshCw, Eye, Calendar, DollarSign, Award, Layers } from 'lucide-react';

interface TireTimelineModalProps {
  tireId: string;
  onClose: () => void;
}

export function TireTimelineModal({ tireId, onClose }: TireTimelineModalProps) {
  const [activeTab, setActiveTab] = useState<'movements' | 'retreads' | 'inspections'>('movements');

  const { data: tire, isLoading } = useQuery({
    queryKey: ['tire-detail-timeline', tireId],
    queryFn: () => tiresApi.getOne(tireId).then((r) => r.data),
  });

  const badge = getTireStatusBadge(tire?.status);

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
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Histórico & Trazabilidad — Neumático {tire?.codigoInterno || '...'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tire?.marca} {tire?.modelo} ({tire?.medida}) • N° Serie: <span className="font-mono font-bold">{tire?.numeroSerie}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30 dark:bg-slate-900/30">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Profundidad Banda</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{tire.profundidadActualMm} mm</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Km Recorridos</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">{tire.kilometrosRecorridos?.toLocaleString() || 0} km</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cantidad Recapados</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">{tire.cantidadRecapados} de {tire.maxRecapadosPermitidos}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Métrica CPK</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{formatCPK(tire.cpk)}</span>
                </div>
              </div>

              {/* QR Code Box */}
              <div className="flex items-center justify-between p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 shadow-sm">
                    <QrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider block">
                      Código QR Único de Trazabilidad Activo
                    </span>
                    <span className="font-mono text-xs font-black text-blue-800 dark:text-blue-300">
                      {tire.codigoQR}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-xl border text-xs font-black flex items-center gap-1.5 ${badge.badgeClass}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${badge.dotClass}`} />
                  <span>{badge.label}</span>
                </div>
              </div>

              {/* Navigation Tabs Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('movements')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeTab === 'movements'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Movimientos e Historial ({tire.movements?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('retreads')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeTab === 'retreads'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recapados ({tire.retreads?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('inspections')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    activeTab === 'inspections'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspecciones Periódicas ({tire.inspections?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: MOVEMENTS TIMELINE */}
              {activeTab === 'movements' && (
                <div className="space-y-3">
                  {!tire.movements || tire.movements.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                      No hay eventos de movimientos registrados aún.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-4 pt-2">
                      {tire.movements.map((mov: any) => (
                        <div key={mov.id} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 shadow-sm" />
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                                {mov.tipoMovimiento}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {formatDateTime(mov.createdAt)}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                              {mov.posicionOrigen && (
                                <span>Origen: <strong className="text-slate-900 dark:text-white">{mov.posicionOrigen}</strong></span>
                              )}
                              {mov.posicionDestino && (
                                <span>Destino: <strong className="text-emerald-600 dark:text-emerald-400">{mov.posicionDestino}</strong></span>
                              )}
                              {mov.profundidadMm && (
                                <span>Profundidad: <strong>{mov.profundidadMm} mm</strong></span>
                              )}
                              {mov.costo > 0 && (
                                <span className="text-purple-600 dark:text-purple-400 font-bold">Costo: {formatMoney(mov.costo)}</span>
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
                  )}
                </div>
              )}

              {/* TAB 2: RETREADS */}
              {activeTab === 'retreads' && (
                <div className="space-y-3">
                  {!tire.retreads || tire.retreads.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                      No se han registrado trabajos de recapado para este neumático.
                    </div>
                  ) : (
                    tire.retreads.map((r: any) => (
                      <div key={r.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-purple-700 dark:text-purple-300">
                            Recapado #{r.numeroRecapado} — {r.empresaRecapadora}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                            {r.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <div><span className="text-slate-400 block text-[10px]">Fecha Envío</span> {formatDate(r.fechaEnvio)}</div>
                          <div><span className="text-slate-400 block text-[10px]">Fecha Recepción</span> {r.fechaRecepcion ? formatDate(r.fechaRecepcion) : 'En proceso'}</div>
                          <div><span className="text-slate-400 block text-[10px]">Costo</span> <strong className="text-purple-600">{formatMoney(r.costo)}</strong></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: INSPECTIONS */}
              {activeTab === 'inspections' && (
                <div className="space-y-3">
                  {!tire.inspections || tire.inspections.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                      No hay inspecciones periódicas registradas para este neumático.
                    </div>
                  ) : (
                    tire.inspections.map((insp: any) => (
                      <div key={insp.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            Inspección del {formatDate(insp.fecha)} — Inspector: {insp.inspector}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            insp.resultado === 'CORRECTO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : insp.resultado === 'REQUIERE_SEGUIMIENTO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {insp.resultado}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>Profundidad: <strong className="text-emerald-600">{insp.profundidadMm} mm</strong></span>
                          <span>Presión: <strong>{insp.presionPsi} PSI</strong></span>
                          <span>Estado Visual: <strong>{insp.estadoVisual}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
