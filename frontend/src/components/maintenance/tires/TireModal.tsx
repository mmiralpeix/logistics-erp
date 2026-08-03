'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { X, CircleDot, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TireModalProps {
  tire?: any;
  onClose: () => void;
  onSave?: () => void;
}

export function TireModal({ tire, onClose, onSave }: TireModalProps) {
  const isEdit = !!tire;
  const qc = useQueryClient();

  const [form, setForm] = useState({
    codigoInterno: tire?.codigoInterno || `T-${Math.floor(100000 + Math.random() * 900000)}`,
    codigoQR: tire?.codigoQR || '',
    numeroSerie: tire?.numeroSerie || '',
    marca: tire?.marca || 'Michelin',
    modelo: tire?.modelo || 'X Multi Z',
    medida: tire?.medida || '295/80 R22.5',
    tipo: tire?.tipo || 'DIRECCIONAL',
    fechaCompra: tire?.fechaCompra ? new Date(tire.fechaCompra).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    proveedor: tire?.proveedor || 'Neumáticos del Norte S.A.',
    precioCompra: tire?.precioCompra || 450000,
    garantiaMeses: tire?.garantiaMeses || 12,
    profundidadInicialMm: tire?.profundidadInicialMm || 14.0,
    profundidadActualMm: tire?.profundidadActualMm || 14.0,
    presionRecomendadaPsi: tire?.presionRecomendadaPsi || 110,
    maxRecapadosPermitidos: tire?.maxRecapadosPermitidos || 3,
    notas: tire?.notas || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? tiresApi.update(tire.id, data) : tiresApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Neumático actualizado' : 'Neumático registrado exitosamente');
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['maintenance-tires-kpis'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al guardar el neumático');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigoInterno || !form.numeroSerie || !form.marca || !form.medida) {
      toast.error('Por favor complete los campos obligatorios');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <CircleDot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isEdit ? `Editar Neumático ${tire.codigoInterno}` : 'Alta de Nuevo Neumático'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro del activo individual en el inventario de la flota
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Código Interno *
              </label>
              <input
                type="text"
                value={form.codigoInterno}
                onChange={(e) => setForm((f) => ({ ...f, codigoInterno: e.target.value }))}
                className="input w-full text-sm font-mono font-bold"
                placeholder="T-000001"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Número de Serie (Fabricante) *
              </label>
              <input
                type="text"
                value={form.numeroSerie}
                onChange={(e) => setForm((f) => ({ ...f, numeroSerie: e.target.value }))}
                className="input w-full text-sm font-mono font-bold"
                placeholder="SN-9988776655"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Marca *
              </label>
              <input
                type="text"
                value={form.marca}
                onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))}
                className="input w-full text-sm font-medium"
                placeholder="Michelin / Goodyear / Fate"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Modelo *
              </label>
              <input
                type="text"
                value={form.modelo}
                onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))}
                className="input w-full text-sm font-medium"
                placeholder="X Multi Z"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Medida *
              </label>
              <input
                type="text"
                value={form.medida}
                onChange={(e) => setForm((f) => ({ ...f, medida: e.target.value }))}
                className="input w-full text-sm font-medium"
                placeholder="295/80 R22.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Tipo de Banda de Rodamiento *
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as any }))}
                className="input w-full text-sm font-medium"
              >
                <option value="DIRECCIONAL">Direccional (Eje Delantero)</option>
                <option value="TRACCION">Tracción (Ejes Traseros Duales)</option>
                <option value="REMOLQUE">Remolque (Semirremolque)</option>
                <option value="AUXILIAR">Auxiliar / Auxilio</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Proveedor
              </label>
              <input
                type="text"
                value={form.proveedor}
                onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}
                className="input w-full text-sm font-medium"
                placeholder="Proveedor / Distribuidor"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Precio Compra ($) *
              </label>
              <input
                type="number"
                value={form.precioCompra}
                onChange={(e) => setForm((f) => ({ ...f, precioCompra: Number(e.target.value) }))}
                className="input w-full text-sm font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Prof. Inicial (mm) *
              </label>
              <input
                type="number"
                step="0.1"
                value={form.profundidadInicialMm}
                onChange={(e) => setForm((f) => ({ ...f, profundidadInicialMm: Number(e.target.value) }))}
                className="input w-full text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Presión Rec. (PSI)
              </label>
              <input
                type="number"
                value={form.presionRecomendadaPsi}
                onChange={(e) => setForm((f) => ({ ...f, presionRecomendadaPsi: Number(e.target.value) }))}
                className="input w-full text-sm font-bold"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-xs">
              Cancelar
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>{mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar Neumático'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
