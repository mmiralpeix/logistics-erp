'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, DollarSign } from 'lucide-react';

interface Props {
  trip: any;
  onClose: () => void;
}

export function AddTripCostModal({ trip, onClose }: Props) {
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      categoria: 'PEAJES',
      descripcion: '',
      monto: '',
      comprobante: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      tripsApi.addCost(trip.id, {
        categoria: data.categoria,
        descripcion: data.descripcion,
        monto: Number(data.monto),
        comprobante: data.comprobante || undefined,
      }),
    onSuccess: () => {
      toast.success('Gasto rendido exitosamente');
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['trip-summary-360', trip.id] });
      onClose();
    },
    onError: () => toast.error('Error al registrar el gasto'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Rendir Gasto Directo de Ruta</h2>
              <p className="text-xs text-slate-500 font-mono">Viaje #{trip.numero} ({trip.origen} ➔ {trip.destino})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4 text-xs">
          <div>
            <label className="label">Categoría del Gasto *</label>
            <select {...register('categoria')} className="input">
              <option value="PEAJES">Peajes</option>
              <option value="VIATICOS">Viáticos / Alimentación</option>
              <option value="PERNOCTE">Pernocte / Alojamiento</option>
              <option value="ESTACIONAMIENTO">Estacionamiento / Balanza</option>
              <option value="MANTENIMIENTO_RUTA">Mantenimiento de Emergencia en Ruta</option>
              <option value="COMBUSTIBLE_EXTRA">Combustible Extra</option>
              <option value="VARIOS">Gastos Varios</option>
            </select>
          </div>

          <div>
            <label className="label">Descripción o Detalle *</label>
            <input
              {...register('descripcion', { required: 'Requerido' })}
              type="text"
              className="input"
              placeholder="Ej: Peaje Cabeza de Buey / Viático almuerzo"
            />
            {errors.descripcion && <p className="text-rose-500 text-xs mt-1">{String(errors.descripcion?.message)}</p>}
          </div>

          <div>
            <label className="label">Monto ($) *</label>
            <input
              {...register('monto', { required: 'Requerido' })}
              type="number"
              step="any"
              className="input"
              placeholder="Ej: 14500"
            />
            {errors.monto && <p className="text-rose-500 text-xs mt-1">{String(errors.monto?.message)}</p>}
          </div>

          <div>
            <label className="label">Número de Comprobante / Ticket</label>
            <input
              {...register('comprobante')}
              type="text"
              className="input"
              placeholder="Ej: FAC-B 0001-00045123"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
