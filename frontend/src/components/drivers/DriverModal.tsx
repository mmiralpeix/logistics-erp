'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, UserCheck } from 'lucide-react';

export function DriverModal({ driver, onClose }: { driver?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!driver;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: driver || { habilitadoCargasPeligrosas: false, licenciaTipo: 'E' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? driversApi.update(driver.id, data) : driversApi.create(data),
    onSuccess: () => { toast.success(isEdit ? 'Conductor actualizado' : 'Conductor creado'); qc.invalidateQueries({ queryKey: ['drivers'] }); onClose(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">DNI *</label>
              <input {...register('dni', { required: true })} className="input" placeholder="28456789" />
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input {...register('firstName', { required: true })} className="input" placeholder="Héctor" />
            </div>
            <div>
              <label className="label">Apellido *</label>
              <input {...register('lastName', { required: true })} className="input" placeholder="Morales" />
            </div>
            <div>
              <label className="label">CUIL</label>
              <input {...register('cuil')} className="input" placeholder="20-28456789-4" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="011-15-4567-8901" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" />
            </div>
            <div className="col-span-2">
              <label className="label">Domicilio</label>
              <input {...register('domicilio')} className="input" placeholder="Calle Las Flores 456" />
            </div>
            <div>
              <label className="label">Fecha de nacimiento</label>
              <input {...register('fechaNacimiento')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Fecha de ingreso</label>
              <input {...register('fechaIngreso')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input {...register('ciudad')} className="input" placeholder="Comodoro Rivadavia" />
            </div>
            <div>
              <label className="label">Provincia</label>
              <input {...register('provincia')} className="input" placeholder="Chubut" />
            </div>

            {/* Licencia */}
            <div className="col-span-3 mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 mb-3">Licencia de Conducir</h3>
            </div>
            <div>
              <label className="label">Tipo de licencia</label>
              <select {...register('licenciaTipo')} className="input">
                {['A', 'B', 'C', 'D', 'E'].map((t) => <option key={t} value={t}>Clase {t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">N° Licencia</label>
              <input {...register('licenciaNumero')} className="input" placeholder="CHU-28456789" />
            </div>
            <div>
              <label className="label">Vencimiento licencia</label>
              <input {...register('licenciaVencimiento')} type="date" className="input" />
            </div>

            {/* Medical */}
            <div>
              <label className="label">Vcto. Examen médico</label>
              <input {...register('examenMedicoVencimiento')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Vcto. Psicofísico</label>
              <input {...register('psicofisicoVencimiento')} type="date" className="input" />
            </div>

            {/* Dangerous goods */}
            <div className="col-span-3 p-3 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input {...register('habilitadoCargasPeligrosas')} type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-300">Habilitado para Cargas Peligrosas (ONU)</span>
              </label>
              <div>
                <label className="label">Vcto. Cert. Cargas Peligrosas</label>
                <input {...register('certificadoCargasPeligrosas')} type="date" className="input" />
              </div>
            </div>

            <div className="col-span-3">
              <label className="label">CBU (para pagos)</label>
              <input {...register('cbu')} className="input" placeholder="1234567890123456789012" />
            </div>
            <div className="col-span-3">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Conductor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
