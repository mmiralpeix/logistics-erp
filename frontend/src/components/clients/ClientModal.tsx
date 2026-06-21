'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Building2 } from 'lucide-react';

interface Props { client?: any; onClose: () => void; }

export function ClientModal({ client, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!client;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: client || { condicionIVA: 'RESPONSABLE_INSCRIPTO', categoriaCliente: 'STANDARD', provincia: 'Chubut' },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? clientsApi.update(client.id, data) : clientsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Cliente actualizado' : 'Cliente creado');
      qc.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Razón Social *</label>
              <input {...register('razonSocial', { required: 'Requerido' })} className="input" placeholder="Empresa S.A." />
              {errors.razonSocial && <p className="text-red-400 text-xs mt-1">{String(errors.razonSocial?.message)}</p>}
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
            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="0297-444-5678" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="contacto@empresa.com" />
            </div>
            <div>
              <label className="label">Contacto Principal</label>
              <input {...register('contactoPrincipal')} className="input" placeholder="Ing. Juan Pérez" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select {...register('categoriaCliente')} className="input">
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Observaciones adicionales..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-700">
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
