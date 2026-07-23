'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Truck } from 'lucide-react';
import { VEHICLE_TYPE_MAP } from '@/lib/utils';

export function VehicleModal({ vehicle, onClose }: { vehicle?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!vehicle;

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: vehicle || { tipo: 'TRACTOR', status: 'DISPONIBLE', anio: new Date().getFullYear(), kilometraje: 0, isThirdParty: false, cantidadEjes: 3 },
  });

  const selectedTipo = watch('tipo');
  const isCisterna = selectedTipo === 'SEMI_CISTERNA' || selectedTipo === 'CISTERNA';
  const isRemolcado = ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA', 'BITREN', 'ACOPLADO'].includes(selectedTipo);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? vehiclesApi.update(vehicle.id, data) : vehiclesApi.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Equipo actualizado' : 'Equipo creado'); qc.invalidateQueries({ queryKey: ['vehicles'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Editar Equipo de Flota' : 'Nuevo Equipo de Flota'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Patente / Dominio *</label>
              <input {...register('patente', { required: true })} className="input uppercase" placeholder="AB 123 CD" />
            </div>
            <div>
              <label className="label">Marca *</label>
              <input {...register('marca', { required: true })} className="input" placeholder="Scania / Vulcano / Cormetal" />
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input {...register('modelo', { required: true })} className="input" placeholder="R 450 / Semi Cisterna 35k" />
            </div>
            <div>
              <label className="label">Año *</label>
              <input {...register('anio', { required: true })} type="number" className="input" />
            </div>
            <div>
              <label className="label">Tipo de Equipo *</label>
              <select {...register('tipo')} className="input font-medium">
                {Object.entries(VEHICLE_TYPE_MAP).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
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
              <label className="label">Capacidad de Carga (kg / Tn)</label>
              <input {...register('capacidadKg')} type="number" className="input" placeholder="45000" />
            </div>
            <div>
              <label className="label">Volumen útil (m³ / Litros)</label>
              <input {...register('capacidadM3')} type="number" className="input" placeholder="35" />
            </div>
            <div>
              <label className="label">Tipo de Carga habitual</label>
              <input {...register('tipoCarga')} className="input" placeholder="Combustibles / Granel / Maquinaria" />
            </div>

            {/* Atributos específicos para Remolcados / Cisternas / Carretones */}
            {isRemolcado && (
              <div className="col-span-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl grid grid-cols-3 gap-4">
                <div>
                  <label className="label">N° de Ejes</label>
                  <input {...register('cantidadEjes')} type="number" className="input" placeholder="3" />
                </div>
                <div>
                  <label className="label">Tipo de Enganche</label>
                  <input {...register('tipoEnganche')} className="input" placeholder="Perno Rey 2 pulg / Perno 3.5 pulg" />
                </div>
                {isCisterna && (
                  <div>
                    <label className="label">N° Compartimentos</label>
                    <input {...register('cantidadCompartimentos')} type="number" className="input" placeholder="3" />
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="label">Kilometraje actual (km)</label>
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
              <label className="label">Vcto. ITV / RTO</label>
              <input {...register('vencimientoITV')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Vcto. RUTA</label>
              <input {...register('vencimientoRUTA')} type="date" className="input" />
            </div>

            {isCisterna && (
              <div>
                <label className="label">Vcto. Estanqueidad INTI</label>
                <input {...register('vencimientoEstanqueidad')} type="date" className="input" />
              </div>
            )}

            <div>
              <label className="label">Color</label>
              <input {...register('color')} className="input" placeholder="Blanco / Azul" />
            </div>
            <div>
              <label className="label">N° Chasis / Cuadro</label>
              <input {...register('numeroChasis')} className="input" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input {...register('isThirdParty')} type="checkbox" id="thirdParty" className="w-4 h-4 text-blue-600 rounded" />
              <label htmlFor="thirdParty" className="text-sm text-slate-700 dark:text-slate-300">Equipo tercerizado</label>
            </div>
            <div className="col-span-3">
              <label className="label">Notas y Especificaciones</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Medidas especiales, rampas de carretón, certificaciones..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
