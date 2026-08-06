'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import { X, Settings, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface DriverScheduleConfigModalProps {
  driver: any;
  onClose: () => void;
  onSave?: () => void;
}

export function DriverScheduleConfigModal({ driver, onClose, onSave }: DriverScheduleConfigModalProps) {
  const qc = useQueryClient();

  const formatInputDate = (d?: any) => {
    if (!d) return '';
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const [form, setForm] = useState({
    modalidadLaboral: driver.modalidadLaboral || '21x7',
    diasTrabajo: driver.diasTrabajo || 21,
    diasDescanso: driver.diasDescanso || 7,
    supervisor: driver.supervisor || '',
    fechaInicioTurno: formatInputDate(driver.fechaInicioTurno),
    fechaRegreso: formatInputDate(driver.fechaRegreso),
    fechaInicioDescanso: formatInputDate(driver.fechaInicioDescanso),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => driversApi.updateScheduleConfig(driver.id, data),
    onSuccess: () => {
      toast.success(`Jornada de ${driver.firstName} ${driver.lastName} actualizada`);
      qc.invalidateQueries({ queryKey: ['driver-schedule'] });
      qc.invalidateQueries({ queryKey: ['driver-schedule-kpis'] });
      qc.invalidateQueries({ queryKey: ['drivers'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al actualizar la jornada');
    },
  });

  const handleModalidadPreset = (mod: string) => {
    if (mod === '21x7') setForm((f) => ({ ...f, modalidadLaboral: mod, diasTrabajo: 21, diasDescanso: 7 }));
    else if (mod === '14x7') setForm((f) => ({ ...f, modalidadLaboral: mod, diasTrabajo: 14, diasDescanso: 7 }));
    else if (mod === '28x14') setForm((f) => ({ ...f, modalidadLaboral: mod, diasTrabajo: 28, diasDescanso: 14 }));
    else setForm((f) => ({ ...f, modalidadLaboral: mod }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Configurar Régimen Laboral
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {driver.firstName} {driver.lastName} (DNI: {driver.dni})
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Modalidad Laboral / Régimen
            </label>
            <select
              value={form.modalidadLaboral}
              onChange={(e) => handleModalidadPreset(e.target.value)}
              className="input w-full text-sm font-semibold"
            >
              <option value="21x7">Régimen 21x7 (21 días ruta / 7 días franco)</option>
              <option value="14x7">Régimen 14x7 (14 días ruta / 7 días franco)</option>
              <option value="28x14">Régimen 28x14 (28 días ruta / 14 días franco)</option>
              <option value="PERSONALIZADA">Personalizada (Ajuste manual de días)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Días Trabajo Permitidos
              </label>
              <input
                type="number"
                min={1}
                value={form.diasTrabajo}
                onChange={(e) => setForm((f) => ({ ...f, diasTrabajo: Number(e.target.value) }))}
                className="input w-full text-sm font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Días Franco / Descanso
              </label>
              <input
                type="number"
                min={1}
                value={form.diasDescanso}
                onChange={(e) => setForm((f) => ({ ...f, diasDescanso: Number(e.target.value) }))}
                className="input w-full text-sm font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Supervisor Asignado
            </label>
            <input
              type="text"
              placeholder="Ej: Ing. Carlos Gómez"
              value={form.supervisor}
              onChange={(e) => setForm((f) => ({ ...f, supervisor: e.target.value }))}
              className="input w-full text-sm"
            />
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Ajuste Manual de Fechas de Turno Activo
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Fecha Inicio Turno Ruta</label>
                <input
                  type="date"
                  value={form.fechaInicioTurno}
                  onChange={(e) => setForm((f) => ({ ...f, fechaInicioTurno: e.target.value }))}
                  className="input w-full text-xs py-1.5"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Fecha Inicio Descanso</label>
                <input
                  type="date"
                  value={form.fechaInicioDescanso}
                  onChange={(e) => setForm((f) => ({ ...f, fechaInicioDescanso: e.target.value }))}
                  className="input w-full text-xs py-1.5"
                />
              </div>
            </div>
            {form.fechaInicioTurno && form.fechaInicioDescanso && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Cargaste las dos fechas: el sistema va a considerar al chofer &quot;En Descanso&quot; (esa fecha manda sobre el turno de ruta).
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>{mutation.isPending ? 'Guardando...' : 'Guardar Jornada'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
