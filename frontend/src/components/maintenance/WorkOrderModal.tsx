'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi, sparePartsApi } from '@/lib/api';
import { Wrench, Plus, Trash2, ShieldCheck, DollarSign, Calendar, PackageCheck, Loader2 } from 'lucide-react';

interface Item {
  descripcion: string;
  repuestoCodigo?: string;
  sparePartId?: string;
  cantidad: number;
  costoUnitario: number;
}

interface WorkOrderModalProps {
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function WorkOrderModal({ initialData, onClose, onSave }: WorkOrderModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-mnt-select'],
    queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { data: spareParts } = useQuery({
    queryKey: ['spare-parts-select'],
    queryFn: () => sparePartsApi.getAll().then((r) => r.data),
  });

  const [form, setForm] = useState<any>(
    initialData || {
      tipo: 'PREVENTIVO',
      status: 'PENDIENTE',
      costoManoObra: 0,
      items: [{ descripcion: '', repuestoCodigo: '', sparePartId: '', cantidad: 1, costoUnitario: 0 }],
    }
  );

  const [items, setItems] = useState<Item[]>(
    initialData?.items || [{ descripcion: '', repuestoCodigo: '', sparePartId: '', cantidad: 1, costoUnitario: 0 }]
  );

  const selectedVehicle = vehicles?.find((v: any) => v.id === form.vehicleId);

  // Filter compatible spare parts for selected vehicle
  const compatibleParts = spareParts?.filter((p: any) => {
    if (!selectedVehicle) return true;
    
    // Check type compatibility
    let typeMatch = true;
    if (p.tiposCompatibles && p.tiposCompatibles !== 'TODOS') {
      const types = p.tiposCompatibles.split(',').map((t: string) => t.trim().toUpperCase());
      typeMatch = types.includes(selectedVehicle.tipo?.toUpperCase()) || types.includes('TODOS');
    }

    // Check brand compatibility
    let brandMatch = true;
    if (p.marcasCompatibles && p.marcasCompatibles !== 'TODAS') {
      const brands = p.marcasCompatibles.split(',').map((b: string) => b.trim().toLowerCase());
      const vBrand = (selectedVehicle.marca || '').toLowerCase();
      brandMatch = brands.some((b) => vBrand.includes(b) || b.includes(vBrand)) || brands.includes('todas');
    }

    return typeMatch && brandMatch;
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleAddItem = () => {
    setItems([...items, { descripcion: '', repuestoCodigo: '', sparePartId: '', cantidad: 1, costoUnitario: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectSparePart = (index: number, sparePartId: string) => {
    const part = spareParts?.find((p: any) => p.id === sparePartId);
    const updated = [...items];
    if (part) {
      updated[index] = {
        ...updated[index],
        sparePartId: part.id,
        descripcion: part.nombre,
        repuestoCodigo: part.sku,
        costoUnitario: part.precioUnitario || 0,
      };
    } else {
      updated[index] = {
        ...updated[index],
        sparePartId: '',
      };
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, key: keyof Item, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: val };
    setItems(updated);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (Number(item.cantidad) || 0) * (Number(item.costoUnitario) || 0), 0);
  const totalCostoFinal = (Number(form.costoManoObra) || 0) + itemsTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validItems = items
        .filter((i) => i.sparePartId || i.repuestoCodigo || i.descripcion?.trim() !== '')
        .map((i) => ({
          ...i,
          descripcion: i.descripcion?.trim() || i.repuestoCodigo || 'Artículo de Inventario',
        }));
      await onSave({
        ...form,
        costoRepuestos: itemsTotal,
        costoTotal: totalCostoFinal,
        items: validItems,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-5xl animate-fade-in max-h-[90vh] flex flex-col">
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
                <option value="CORRECTIVO">Reparación</option>
              </select>
            </div>

            <div>
              <label className="label">Estado OT</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
                <option value="PENDIENTE">Programada</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="COMPLETADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2.5">
              Repuestos & Consumibles Utilizados
            </h3>

            {/* Encabezado y Lista de Ítems Dentro del Mismo Contenedor Card */}
            <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              {/* Encabezado de Columnas */}
              <div className="hidden sm:grid grid-cols-[1fr_130px_75px_110px_32px] gap-3 px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <div>Artículo del Inventario</div>
                <div>Cód. SKU</div>
                <div className="text-center">Cant.</div>
                <div className="text-right">Subtotal</div>
                <div></div>
              </div>

              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const selectedPart = spareParts?.find((p: any) => p.id === item.sparePartId);
                  return (
                    <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm space-y-2">
                      <div className="grid grid-cols-[1fr_130px_75px_110px_32px] gap-3 items-center">
                        {/* 1. Selector Inventario */}
                        <select
                          value={item.sparePartId || ''}
                          onChange={(e) => handleSelectSparePart(idx, e.target.value)}
                          className="input text-xs font-medium truncate w-full"
                        >
                          <option value="">-- Seleccionar --</option>
                          {compatibleParts?.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} (Stock: {p.stockActual})
                            </option>
                          ))}
                        </select>

                        {/* 2. Cód. SKU */}
                        <input
                          type="text"
                          placeholder="Cód. SKU"
                          value={item.repuestoCodigo || ''}
                          onChange={(e) => handleItemChange(idx, 'repuestoCodigo', e.target.value)}
                          className="input font-mono text-xs w-full"
                        />

                        {/* 3. Cant. */}
                        <input
                          type="number"
                          placeholder="Cant"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', Number(e.target.value))}
                          className="input text-xs text-center font-bold w-full"
                          min={1}
                        />

                        {/* 4. Subtotal */}
                        <div className="text-right text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          ${((item.cantidad || 0) * (item.costoUnitario || 0)).toLocaleString('es-AR')}
                        </div>

                        {/* 5. Eliminar */}
                        <div className="flex justify-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded flex items-center justify-center transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {selectedPart && (
                        <div className="flex flex-wrap items-center justify-between text-[11px] px-1 text-slate-500 gap-2 border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1">
                          <span>Stock disponible: <b className={selectedPart.stockActual < item.cantidad ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>{selectedPart.stockActual} u.</b> (Ubicación: {selectedPart.ubicacion || 'Depósito Principal'})</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                            ✓ Compatible con {selectedPart.marcasCompatibles || 'Flota'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón Agregar Repuesto abajo dentro de la casilla */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-blue-600 dark:text-blue-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs mt-2"
              >
                <Plus className="w-4 h-4" /> Agregar Repuesto
              </button>
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
            <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{initialData ? 'Guardar Cambios' : 'Crear Orden de Trabajo'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
