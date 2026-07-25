'use client';
import { useState } from 'react';
import { Package, Tag, Layers, MapPin, DollarSign, AlertCircle } from 'lucide-react';

interface SparePartModalProps {
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

const CATEGORIES = [
  'FILTROS',
  'LUBRICANTES',
  'FRENOS',
  'NEUMATICOS',
  'CORREAS',
  'SISTEMA_ELECTRICO',
  'VALVULAS_CISTERNA',
  'SUSPENSION',
  'VARIOS',
];

const VEHICLE_TYPES = [
  'TODOS',
  'CAMION',
  'TRACTOR',
  'SEMIRREMOLQUE',
  'SEMI_CISTERNA',
  'CARRETON',
  'BATEA',
  'BITREN',
  'CAMIONETA',
];

export function SparePartModal({ initialData, onClose, onSave }: SparePartModalProps) {
  const [form, setForm] = useState<any>(
    initialData || {
      categoria: 'FILTROS',
      stockActual: 1,
      stockMinimo: 1,
      precioUnitario: 0,
      tiposCompatibles: 'TODOS',
    }
  );

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      stockActual: Number(form.stockActual) || 0,
      stockMinimo: Number(form.stockMinimo) || 1,
      precioUnitario: Number(form.precioUnitario) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {initialData ? 'Editar Repuesto en Pañol' : 'Nuevo Repuesto / Insumo'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Código SKU / Parte *</label>
              <input
                type="text"
                required
                value={form.sku || ''}
                onChange={(e) => set('sku', e.target.value)}
                className="input font-mono"
                placeholder="Ej: REP-FIL-001"
              />
            </div>
            <div>
              <label className="label">Categoría *</label>
              <select
                value={form.categoria}
                onChange={(e) => set('categoria', e.target.value)}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Nombre / Descripción Repuesto *</label>
            <input
              type="text"
              required
              value={form.nombre || ''}
              onChange={(e) => set('nombre', e.target.value)}
              className="input"
              placeholder="Ej: Filtro de Aceite Scania R450 / P360"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Stock Actual</label>
              <input
                type="number"
                min={0}
                value={form.stockActual || 0}
                onChange={(e) => set('stockActual', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                min={0}
                value={form.stockMinimo || 1}
                onChange={(e) => set('stockMinimo', e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Precio Unitario ($)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.precioUnitario || 0}
                onChange={(e) => set('precioUnitario', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ubicación en Estantería / Depósito</label>
              <input
                type="text"
                value={form.ubicacion || ''}
                onChange={(e) => set('ubicacion', e.target.value)}
                className="input"
                placeholder="Ej: Estante A-3, Nivel 2"
              />
            </div>
            <div>
              <label className="label">Compatibilidad con Flota</label>
              <select
                value={form.tiposCompatibles || 'TODOS'}
                onChange={(e) => set('tiposCompatibles', e.target.value)}
                className="input"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === 'TODOS' ? 'Compatible con toda la Flota' : `Solo ${t}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notas / Modelos Específicos</label>
            <textarea
              rows={2}
              value={form.notas || ''}
              onChange={(e) => set('notas', e.target.value)}
              className="input resize-none"
              placeholder="Ej: Compatible con motores Scania DC13 de 450cv a 500cv"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Repuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
