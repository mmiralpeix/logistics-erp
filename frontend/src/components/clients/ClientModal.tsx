'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Building2, CreditCard, ShieldAlert } from 'lucide-react';

interface Props { client?: any; onClose: () => void; }

export function ClientModal({ client, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!client;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: client || { condicionIVA: 'RESPONSABLE_INSCRIPTO', provincia: 'Chubut', diasCredito: 30, scoring: 'A', limiteCredito: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        limiteCredito: Number(data.limiteCredito || 0),
        diasCredito: Number(data.diasCredito || 30),
      };
      return isEdit ? clientsApi.update(client.id, payload) : clientsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients-select'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <label className="label">Razón Social *</label>
              <input {...register('razonSocial', { required: 'Requerido' })} className="input" placeholder="Empresa S.A." />
              {errors.razonSocial && <p className="text-red-500 text-xs mt-1">{String(errors.razonSocial?.message)}</p>}
            </div>
            <div>
              <label className="label">CUIT *</label>
              <input {...register('cuit', { required: 'Requerido' })} className="input" placeholder="30-71234567-9" />
            </div>
            <div>
              <label className="label">Condición IVA</label>
              <select {...register('condicionIVA')} className="input">
                <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                <option value="MONOTRIBUTO">Monotributo</option>
                <option value="EXENTO">Exento</option>
                <option value="NO_RESPONSABLE">No Responsable</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Domicilio *</label>
              <input {...register('domicilio', { required: 'Requerido' })} className="input" placeholder="Av. San Martín 1250" />
            </div>
            <div>
              <label className="label">Ciudad *</label>
              <input {...register('ciudad', { required: 'Requerido' })} className="input" placeholder="Comodoro Rivadavia" />
            </div>
            <div>
              <label className="label">Provincia *</label>
              <select {...register('provincia', { required: 'Requerido' })} className="input">
                {['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'CABA'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Credit Risk & Scoring Section */}
            <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-1">
              <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 block mb-2">Parámetros Comercial & Crédito</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Límite de Crédito ($)</label>
                  <input {...register('limiteCredito')} type="number" className="input" placeholder="5000000" />
                </div>
                <div>
                  <label className="label">Días de Crédito</label>
                  <input {...register('diasCredito')} type="number" className="input" placeholder="30" />
                </div>
                <div>
                  <label className="label">Scoring de Cliente</label>
                  <select {...register('scoring')} className="input">
                    <option value="A">Categoría A (Excelente)</option>
                    <option value="B">Categoría B (Estándar)</option>
                    <option value="C">Categoría C (Alto Riesgo)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input {...register('bloqueadoPorRiesgo')} type="checkbox" id="bloqueadoPorRiesgo" className="w-4 h-4 rounded text-blue-600" />
              <label htmlFor="bloqueadoPorRiesgo" className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Bloquear preventivamente para nuevos viajes por riesgo crediticio
              </label>
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="0297-444-5678" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="contacto@empresa.com" />
            </div>
            <div className="col-span-2">
              <label className="label">Contacto Principal</label>
              <input {...register('contactoPrincipal')} className="input" placeholder="Ing. Juan Pérez" />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Observaciones adicionales..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
