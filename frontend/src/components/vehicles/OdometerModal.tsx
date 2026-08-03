'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Gauge } from 'lucide-react';

interface Props {
  vehicle: any;
  onClose: () => void;
}

export function OdometerModal({ vehicle, onClose }: Props) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      kilometraje: vehicle?.kilometraje || 0,
      horasMotor: vehicle?.horasMotor || 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      vehiclesApi.updateOdometer(vehicle.id, {
        kilometraje: Number(data.kilometraje),
        horasMotor: data.horasMotor !== '' ? Number(data.horasMotor) : undefined,
      }),
    onSuccess: () => {
      toast.success(`Odómetro actualizado para ${vehicle.patente}`);
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicle-summary-360', vehicle.id] });
      onClose();
    },
    onError: () => toast.error('Error al actualizar odómetro'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Actualizar Odómetro & Horas</h2>
              <p className="text-xs text-slate-500 font-mono">Dominio: {vehicle.patente} ({vehicle.marca} {vehicle.modelo})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4 text-xs">
          <div>
            <label className="label">Kilometraje Actual (Km) *</label>
            <input
              {...register('kilometraje', { required: 'Requerido' })}
              type="number"
              step="any"
              className="input"
              placeholder="Ej: 145200"
            />
            {errors.kilometraje && <p className="text-rose-500 text-xs mt-1">{String(errors.kilometraje?.message)}</p>}
          </div>

          <div>
            <label className="label">Horas de Motor (Horómetro)</label>
            <input
              {...register('horasMotor')}
              type="number"
              step="any"
              className="input"
              placeholder="Ej: 3200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Actualizando...' : 'Guardar Odómetro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
