'use client';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tripsApi, vehiclesApi, driversApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Map, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function TripModal({ trip, onClose }: { trip?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!trip;
  const [leadTimePreview, setLeadTimePreview] = useState<number | null>(null);

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-select'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: drivers } = useQuery({ queryKey: ['drivers-select'], queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: trip || {
      status: 'PENDIENTE', esCargaPeligrosa: false, esMineria: false, esDistribucion: false,
      duracionEstimadaHoras: 8, esperaEnDestinoHoras: 2, descansosConductorHoras: 2,
    },
  });

  const duracion = watch('duracionEstimadaHoras') || 0;
  const espera = watch('esperaEnDestinoHoras') || 0;
  const descanso = watch('descansosConductorHoras') || 0;
  const totalLeadTime = Number(duracion) + Number(espera) + Number(descanso);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? tripsApi.update(trip.id, data) : tripsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Viaje actualizado' : 'Viaje creado exitosamente');
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['gantt'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar viaje'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{isEdit ? 'Editar Viaje' : 'Planificar Nuevo Viaje'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Route */}
            <div className="col-span-2 p-4 bg-slate-900/50 rounded-xl border border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Map className="w-4 h-4 text-blue-400" /> Ruta</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Origen *</label>
                  <input {...register('origen', { required: true })} className="input" placeholder="Ciudad, Provincia" />
                </div>
                <div>
                  <label className="label">Destino *</label>
                  <input {...register('destino', { required: true })} className="input" placeholder="Ciudad, Provincia" />
                </div>
                <div>
                  <label className="label">Distancia (km)</label>
                  <input {...register('distanciaKm')} type="number" className="input" placeholder="850" />
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <select {...register('clientId')} className="input">
                    <option value="">Sin cliente asignado</option>
                    {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div>
              <label className="label">Vehículo *</label>
              <select {...register('vehicleId', { required: true })} className="input">
                <option value="">Seleccionar vehículo...</option>
                {vehicles?.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo} ({v.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Conductor *</label>
              <select {...register('driverId', { required: true })} className="input">
                <option value="">Seleccionar conductor...</option>
                {drivers?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName} - LIC: {d.licenciaTipo}</option>
                ))}
              </select>
            </div>

            {/* Timing */}
            <div className="col-span-2 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-green-400" /> Lead Time Multidía
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="label">Salida programada *</label>
                  <input {...register('fechaSalidaProgramada', { required: true })} type="datetime-local" className="input" />
                </div>
                <div>
                  <label className="label">Duración de ruta (h)</label>
                  <input {...register('duracionEstimadaHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Espera en destino (h)</label>
                  <input {...register('esperaEnDestinoHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Descansos conductor (h)</label>
                  <input {...register('descansosConductorHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
              </div>
              {/* Lead time indicator */}
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-xs text-slate-400">
                    <span>🚚 Ruta: <strong className="text-white">{duracion}h</strong></span>
                    <span>⏳ Espera: <strong className="text-white">{espera}h</strong></span>
                    <span>😴 Descanso: <strong className="text-white">{descanso}h</strong></span>
                  </div>
                  <div className="text-sm font-bold text-blue-400">
                    Lead Time Total: {totalLeadTime}h ({(totalLeadTime / 24).toFixed(1)} días)
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  {['Ruta', 'Espera', 'Descanso'].map((label, i) => {
                    const values = [Number(duracion), Number(espera), Number(descanso)];
                    const colors = ['bg-blue-500', 'bg-amber-500', 'bg-purple-500'];
                    const pct = totalLeadTime > 0 ? (values[i] / totalLeadTime) * 100 : 0;
                    return pct > 0 ? (
                      <div key={label} className={`h-2 rounded-full ${colors[i]} transition-all`} style={{ width: `${pct}%` }} title={`${label}: ${values[i]}h`} />
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label className="label">Tipo de Carga</label>
              <input {...register('tipoCarga')} className="input" placeholder="General / Granel / Peligrosa..." />
            </div>
            <div>
              <label className="label">Peso (kg)</label>
              <input {...register('pesoCarga')} type="number" className="input" placeholder="32000" />
            </div>
            <div>
              <label className="label">Tarifa acordada ($)</label>
              <input {...register('tarifaAcordada')} type="number" className="input" placeholder="185000" />
            </div>
            <div>
              <label className="label">Estado</label>
              <select {...register('status')} className="input">
                <option value="PENDIENTE">Pendiente</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* Special flags */}
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('esCargaPeligrosa')} type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                <span className="text-sm text-slate-300 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-400" /> Carga Peligrosa</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('esMineria')} type="checkbox" className="w-4 h-4 text-yellow-600 rounded" />
                <span className="text-sm text-slate-300">Servicios de Minería</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('esDistribucion')} type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-slate-300">Distribución Regional</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="label">Descripción de carga</label>
              <textarea {...register('descripcionCarga')} rows={2} className="input resize-none" placeholder="Descripción detallada de la mercadería a transportar..." />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Instrucciones especiales, contactos, referencias..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Viaje' : 'Crear Viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
