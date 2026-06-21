'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Truck } from 'lucide-react';

export function VehicleModal({ vehicle, onClose }: { vehicle?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!vehicle;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: vehicle || { tipo: 'CAMION', status: 'DISPONIBLE', anio: new Date().getFullYear(), kilometraje: 0, isThirdParty: false },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? vehiclesApi.update(vehicle.id, data) : vehiclesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Vehículo actualizado' : 'Vehículo creado'); qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Patente *</label>
              <input {...register('patente', { required: true })} className="input" placeholder="AB 123 CD" />
            </div>
            <div>
              <label className="label">Marca *</label>
              <input {...register('marca', { required: true })} className="input" placeholder="Scania" />
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input {...register('modelo', { required: true })} className="input" placeholder="R 450" />
            </div>
            <div>
              <label className="label">Año *</label>
              <input {...register('anio', { required: true })} type="number" className="input" />
            </div>
            <div>
              <label className="label">Tipo *</label>
              <select {...register('tipo')} className="input">
                {['CAMION','SEMIRREMOLQUE','CAMIONETA','EQUIPO_ESPECIAL','CISTERNA','VOLQUETE','ACOPLADO'].map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select {...register('status')} className="input">
                {['DISPONIBLE','EN_VIAJE','EN_MANTENIMIENTO','FUERA_DE_SERVICIO'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Capacidad (kg)</label>
              <input {...register('capacidadKg')} type="number" className="input" placeholder="40000" />
            </div>
            <div>
              <label className="label">Capacidad (m³)</label>
              <input {...register('capacidadM3')} type="number" className="input" placeholder="80" />
            </div>
            <div>
              <label className="label">Tipo de Carga</label>
              <input {...register('tipoCarga')} className="input" placeholder="General / Granel" />
            </div>
            <div>
              <label className="label">Kilometraje actual</label>
              <input {...register('kilometraje')} type="number" className="input" />
            </div>
            <div>
              <label className="label">N° Seguro</label>
              <input {...register('numeroSeguro')} className="input" placeholder="POL-2024-001" />
            </div>
            <div>
              <label className="label">Aseguradora</label>
              <input {...register('aseguradora')} className="input" placeholder="La Segunda" />
            </div>
            <div>
              <label className="label">Vcto. Seguro</label>
              <input {...register('vencimientoSeguro')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Vcto. ITV</label>
              <input {...register('vencimientoITV')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Vcto. RUTA</label>
              <input {...register('vencimientoRUTA')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Color</label>
              <input {...register('color')} className="input" placeholder="Blanco" />
            </div>
            <div>
              <label className="label">N° Chasis</label>
              <input {...register('numeroChasis')} className="input" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input {...register('isThirdParty')} type="checkbox" id="thirdParty" className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="thirdParty" className="text-sm text-slate-300">Vehículo tercerizado</label>
            </div>
            <div className="col-span-3">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
