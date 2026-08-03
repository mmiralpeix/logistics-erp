'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { X, Eye, Save, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TireInspectionModalProps {
  tire: any;
  onClose: () => void;
  onSave?: () => void;
}

export function TireInspectionModal({ tire, onClose, onSave }: TireInspectionModalProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    inspector: 'Técnico de Mantenimiento',
    profundidadMm: tire.profundidadActualMm || 12.0,
    presionPsi: tire.presionActualPsi || tire.presionRecomendadaPsi || 110,
    estadoVisual: 'BUENO',
    resultado: 'CORRECTO' as 'CORRECTO' | 'REQUIERE_SEGUIMIENTO' | 'DEBE_REEMPLAZARSE',
    observaciones: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => tiresApi.recordInspection(tire.id, data),
    onSuccess: () => {
      toast.success(`Inspección de ${tire.codigoInterno} registrada`);
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['maintenance-tires-kpis'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al guardar inspección');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Inspección de Neumático {tire.codigoInterno}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Medición con profundímetro y manómetro en taller / ruta
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Inspector / Técnico *
            </label>
            <input
              type="text"
              value={form.inspector}
              onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
              className="input w-full text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Profundidad Medida (mm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={form.profundidadMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setForm((f) => ({
                    ...f,
                    profundidadMm: val,
                    resultado: val <= 3.0 ? 'DEBE_REEMPLAZARSE' : val <= 6.0 ? 'REQUIERE_SEGUIMIENTO' : 'CORRECTO',
                  }));
                }}
                className="input w-full text-sm font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Presión Medida (PSI) *
              </label>
              <input
                type="number"
                value={form.presionPsi}
                onChange={(e) => setForm((f) => ({ ...f, presionPsi: Number(e.target.value) }))}
                className="input w-full text-sm font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Estado Visual
              </label>
              <select
                value={form.estadoVisual}
                onChange={(e) => setForm((f) => ({ ...f, estadoVisual: e.target.value }))}
                className="input w-full text-xs font-semibold"
              >
                <option value="EXCELENTE">Excelente</option>
                <option value="BUENO">Bueno (Desgaste Parejo)</option>
                <option value="DESGASTE_DESIGUAL">Desgaste Irregular / Desalineado</option>
                <option value="DANO_FLANCO">Daño en Flanco / Deformación</option>
                <option value="REEMPLAZAR">Banda Gastada a Límite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Dictamen Final *
              </label>
              <select
                value={form.resultado}
                onChange={(e) => setForm((f) => ({ ...f, resultado: e.target.value as any }))}
                className="input w-full text-xs font-bold"
              >
                <option value="CORRECTO">🟢 Correcto (Apto)</option>
                <option value="REQUIERE_SEGUIMIENTO">🟡 Requiere Seguimiento</option>
                <option value="DEBE_REEMPLAZARSE">🔴 Debe Reemplazarse / Recaparse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Observaciones
            </label>
            <input
              type="text"
              placeholder="Detalle adicional de inspección..."
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
              disabled={mutation.isPending}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{mutation.isPending ? 'Guardando...' : 'Guardar Inspección'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
