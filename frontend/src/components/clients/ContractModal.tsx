'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, FileText, CheckCircle } from 'lucide-react';

interface Props {
  clientId: string;
  contract?: any;
  onClose: () => void;
}

export function ContractModal({ clientId, contract, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!contract;

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: contract ? {
      ...contract,
      pesoMinimoTn: contract.pesoMinimoKg ? contract.pesoMinimoKg / 1000 : '',
      fechaInicio: contract.fechaInicio ? new Date(contract.fechaInicio).toISOString().split('T')[0] : '',
      fechaFin: contract.fechaFin ? new Date(contract.fechaFin).toISOString().split('T')[0] : '',
    } : {
      numero: '',
      descripcion: '',
      cantidadViajes: '',
      pesoMinimoTn: '',
      tarifaBase: '',
      tarifaExcedentePorTn: '',
      status: 'ACTIVA',
      fechaInicio: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = {
        ...data,
        cantidadViajes: data.cantidadViajes !== '' && data.cantidadViajes !== null && data.cantidadViajes !== undefined ? Number(data.cantidadViajes) : null,
        pesoMinimoKg: data.pesoMinimoTn !== '' && data.pesoMinimoTn !== null && data.pesoMinimoTn !== undefined ? Number(data.pesoMinimoTn) * 1000 : null,
        tarifaBase: data.tarifaBase !== '' && data.tarifaBase !== null && data.tarifaBase !== undefined ? Number(data.tarifaBase) : null,
        tarifaExcedentePorTn: data.tarifaExcedentePorTn !== '' && data.tarifaExcedentePorTn !== null && data.tarifaExcedentePorTn !== undefined ? Number(data.tarifaExcedentePorTn) : null,
      };
      delete payload.pesoMinimoTn;
      if (contract?.id) {
        payload.id = contract.id;
      }
      return clientsApi.createContract(clientId, payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Órden de Compra actualizada' : 'Órden de Compra creada exitosamente');
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client-contracts', clientId] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar la Órden de Compra'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEdit ? 'Editar / Ampliar Órden de Compra' : 'Nueva Órden de Compra (OC)'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">N° de Órden de Compra (OC) *</label>
              <input {...register('numero', { required: true })} className="input uppercase font-bold" placeholder="OC-LMA-2024-090" />
            </div>

            <div className="col-span-2">
              <label className="label">Descripción / Objeto del Contrato</label>
              <input {...register('descripcion')} className="input" placeholder="Transporte Carbonato de Litio Puna - Salar de Olaroz" />
            </div>

            <div>
              <label className="label">Cantidad de Viajes Autorizados *</label>
              <input {...register('cantidadViajes')} type="number" step="any" className="input font-bold text-blue-600 dark:text-blue-400" placeholder="Ej: 10, 50, 20" />
              <p className="text-[11px] text-slate-500 mt-0.5">Límite acordado de viajes para esta OC</p>
            </div>

            <div>
              <label className="label">Estado de la OC</label>
              <select {...register('status')} className="input font-medium">
                <option value="ACTIVA">🟢 ACTIVA (En uso)</option>
                <option value="PENDIENTE">🟡 PENDIENTE (Siguiente OC)</option>
                <option value="COMPLETADA">🔴 AGOTADA / COMPLETADA</option>
                <option value="PAUSADA">⚪ PAUSADA</option>
              </select>
            </div>

            <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-blue-600" /> Esquema Tarifario de la OC (Si no aplica dejar en blanco)
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Mínimo Garantizado (Tn)</label>
                  <input {...register('pesoMinimoTn')} type="number" step="any" className="input" placeholder="Ej: 30" />
                </div>
                <div>
                  <label className="label">Tarifa Base ($)</label>
                  <input {...register('tarifaBase')} type="number" step="any" className="input font-semibold" placeholder="Ej: 380000" />
                </div>
                <div>
                  <label className="label">Tarifa Tn Extra ($/Tn)</label>
                  <input {...register('tarifaExcedentePorTn')} type="number" step="any" className="input" placeholder="Ej: 14500" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Fecha Inicio Vigencia</label>
              <input {...register('fechaInicio')} type="date" className="input" />
            </div>

            <div>
              <label className="label">Fecha Vencimiento Vigencia</label>
              <input {...register('fechaFin')} type="date" className="input" />
            </div>

            <div className="col-span-2">
              <label className="label">Condiciones Especiales y Notas</label>
              <textarea {...register('condiciones')} rows={2} className="input resize-none" placeholder="Condiciones de pago, remitos obligatorios, balanza..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar OC' : 'Guardar Órden de Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
