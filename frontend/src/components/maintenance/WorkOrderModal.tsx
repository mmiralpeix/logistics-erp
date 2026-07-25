'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import { Wrench, Plus, Trash2, ShieldCheck, DollarSign, Calendar } from 'lucide-react';

interface Item {
  descripcion: string;
  repuestoCodigo?: string;
  cantidad: number;
  costoUnitario: number;
}

interface WorkOrderModalProps {
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function WorkOrderModal({ initialData, onClose, onSave }: WorkOrderModalProps) {
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-mnt-select'],
    queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>(
    initialData || {
      tipo: 'PREVENTIVO',
      status: 'PENDIENTE',
      costoManoObra: 0,
      items: [{ descripcion: '', repuestoCodigo: '', cantidad: 1, costoUnitario: 0 }],
    }
  );

  const [items, setItems] = useState<Item[]>(
    initialData?.items || [{ descripcion: '', repuestoCodigo: '', cantidad: 1, costoUnitario: 0 }]
  );

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleAddItem = () => {
    setItems([...items, { descripcion: '', repuestoCodigo: '', cantidad: 1, costoUnitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, key: keyof Item, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: val };
    setItems(updated);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0), 0);
  const totalCostoFinal = (Number(form.costoManoObra) || 0) + itemsTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.descripcion.trim() !== '');
    onSave({
      ...form,
      costoRepuestos: itemsTotal,
      costoTotal: totalCostoFinal,
      items: validItems,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-3xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {initialData ? 'Editar Orden de Trabajo (OT)' : 'Nueva Orden de Trabajo (OT)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {form.numeroOT ? `Número OT: ${form.numeroOT}` : 'Se asignará número correlativo automáticamente'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="label">Vehículo / Patente *</label>
              <select
                required
                value={form.vehicleId || ''}
                onChange={(e) => set('vehicleId', e.target.value)}
                className="input"
              >
                <option value="">Seleccionar vehículo de flota...</option>
                {vehicles?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.patente} — {v.marca} {v.modelo} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo de Trabajo</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                <option value="PREVENTIVO">Mantenimiento Preventivo</option>
                <option value="CORRECTIVO">Reparación Correctiva</option>
              </select>
            </div>

            <div>
              <label className="label">Estado OT</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
                <option value="PENDIENTE">Pendiente (Programada)</option>
                <option value="EN_CURSO">En Curso (En Taller)</option>
                <option value="COMPLETADO">Completada / Entregada</option>
                <option value="CANCELADO">Cancelada</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">Descripción de Trabajos a Realizar *</label>
              <input
                type="text"
                required
                value={form.descripcion || ''}
                onChange={(e) => set('descripcion', e.target.value)}
                className="input"
                placeholder="Ej: Service 40.000 km, cambio aceite motor, filtros y alineación"
              />
            </div>
          </div>

          {/* Taller y Kilometraje */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Taller / Proveedor</label>
              <input
                type="text"
                value={form.taller || ''}
                onChange={(e) => set('taller', e.target.value)}
                className="input"
                placeholder="Ej: Taller Central / Scania Oficial"
              />
            </div>
            <div>
              <label className="label">Teléfono Taller</label>
              <input
                type="text"
                value={form.tallerTelefono || ''}
                onChange={(e) => set('tallerTelefono', e.target.value)}
                className="input"
                placeholder="Ej: +54 11 4433-2211"
              />
            </div>
            <div>
              <label className="label">Mecánico a Cargo</label>
              <input
                type="text"
                value={form.mecanico || ''}
                onChange={(e) => set('mecanico', e.target.value)}
                className="input"
                placeholder="Nombre del mecánico"
              />
            </div>

            <div>
              <label className="label">KM Actual Vehículo</label>
              <input
                type="number"
                value={form.kmActual || ''}
                onChange={(e) => set('kmActual', Number(e.target.value))}
                className="input"
                placeholder="Km al ingresar a taller"
              />
            </div>
            <div>
              <label className="label">KM Próximo Service</label>
              <input
                type="number"
                value={form.kmProximo || ''}
                onChange={(e) => set('kmProximo', Number(e.target.value))}
                className="input"
                placeholder="Ej: 60.000 km"
              />
            </div>
            <div>
              <label className="label">Fecha Próximo Service</label>
              <input
                type="date"
                value={form.fechaProxima ? form.fechaProxima.split('T')[0] : ''}
                onChange={(e) => set('fechaProxima', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Repuestos & Consumibles (Items) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Repuestos & Consumibles Utilizados
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Repuesto
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Descripción (ej: Filtro Aceite Scania R450)"
                    value={item.descripcion}
                    onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                    className="input flex-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Cód. Repuesto"
                    value={item.repuestoCodigo || ''}
                    onChange={(e) => handleItemChange(idx, 'repuestoCodigo', e.target.value)}
                    className="input w-28 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(idx, 'cantidad', Number(e.target.value))}
                    className="input w-16 text-xs text-center"
                    min={1}
                  />
                  <input
                    type="number"
                    placeholder="Precio ($)"
                    value={item.costoUnitario}
                    onChange={(e) => handleItemChange(idx, 'costoUnitario', Number(e.target.value))}
                    className="input w-28 text-xs"
                  />
                  <div className="w-24 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ${((item.cantidad || 0) * (item.costoUnitario || 0)).toLocaleString('es-AR')}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desglose de Costos Final */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="label">Costo Mano de Obra ($)</label>
                <input
                  type="number"
                  value={form.costoManoObra || 0}
                  onChange={(e) => set('costoManoObra', Number(e.target.value))}
                  className="input w-36 text-sm"
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>Repuestos: <b className="text-slate-900 dark:text-white">${itemsTotal.toLocaleString('es-AR')}</b></p>
                <p>Mano de Obra: <b className="text-slate-900 dark:text-white">${(Number(form.costoManoObra) || 0).toLocaleString('es-AR')}</b></p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">COSTO TOTAL ESTIMADO</span>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${totalCostoFinal.toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Guardar Cambios' : 'Crear Orden de Trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
