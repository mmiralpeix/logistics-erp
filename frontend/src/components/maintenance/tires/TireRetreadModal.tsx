'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { X, RefreshCw, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TireRetreadModalProps {
  tire: any;
  mode?: 'send' | 'receive';
  onClose: () => void;
  onSave?: () => void;
}

export function TireRetreadModal({ tire, mode = 'send', onClose, onSave }: TireRetreadModalProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    empresaRecapadora: 'Bandag / Recapados del Centro S.A.',
    costo: 180000,
    fechaEnvio: new Date().toISOString().slice(0, 10),
    fechaRecepcion: new Date().toISOString().slice(0, 10),
    profundidadNuevaMm: 14.0,
    garantiaMeses: 6,
    observaciones: '',
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => tiresApi.sendToRetread(tire.id, data),
    onSuccess: () => {
      toast.success(`Neumático ${tire.codigoInterno} enviado a recapado`);
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['maintenance-tires-kpis'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al registrar envío a recapado');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (data: any) => tiresApi.receiveFromRetread(tire.id, data),
    onSuccess: () => {
      toast.success(`Neumático ${tire.codigoInterno} recibido post-recapado`);
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['maintenance-tires-kpis'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al registrar recepción de recapado');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'send') {
      sendMutation.mutate(form);
    } else {
      receiveMutation.mutate(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {mode === 'send'
                  ? `Envío a Recapado — Neumático ${tire.codigoInterno}`
                  : `Recepción Post-Recapado — Neumático ${tire.codigoInterno}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Recapados actuales: <span className="font-bold text-purple-600 dark:text-purple-400">{tire.cantidadRecapados}</span> / {tire.maxRecapadosPermitidos} máx
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'send' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Empresa Recapadora *
                </label>
                <input
                  type="text"
                  value={form.empresaRecapadora}
                  onChange={(e) => setForm((f) => ({ ...f, empresaRecapadora: e.target.value }))}
                  className="input w-full text-sm font-medium"
                  placeholder="Bandag / Recapados del Norte S.A."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Costo Estimado ($) *
                  </label>
                  <input
                    type="number"
                    value={form.costo}
                    onChange={(e) => setForm((f) => ({ ...f, costo: Number(e.target.value) }))}
                    className="input w-full text-sm font-bold text-purple-600 dark:text-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fecha Envío *
                  </label>
                  <input
                    type="date"
                    value={form.fechaEnvio}
                    onChange={(e) => setForm((f) => ({ ...f, fechaEnvio: e.target.value }))}
                    className="input w-full text-sm"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nueva Profundidad (mm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.profundidadNuevaMm}
                    onChange={(e) => setForm((f) => ({ ...f, profundidadNuevaMm: Number(e.target.value) }))}
                    className="input w-full text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fecha Recepción *
                  </label>
                  <input
                    type="date"
                    value={form.fechaRecepcion}
                    onChange={(e) => setForm((f) => ({ ...f, fechaRecepcion: e.target.value }))}
                    className="input w-full text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Observaciones
            </label>
            <input
              type="text"
              placeholder="Detalles sobre el diseño de la nueva banda de rodamiento..."
              value={form.observaciones}
              onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
              className="input w-full text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-xs">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending || receiveMutation.isPending}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4" />
              <span>
                {sendMutation.isPending || receiveMutation.isPending
                  ? 'Guardando...'
                  : mode === 'send'
                  ? 'Confirmar Envío'
                  : 'Confirmar Recepción'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
