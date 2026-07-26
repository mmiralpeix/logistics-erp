'use client';
import { useState } from 'react';
import { Package, Truck, ShieldCheck, Tag, Layers, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';

interface SparePartModalProps {
  initialData?: any;
  vehicles?: any[];
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

const HITCH_TYPES = [
  'TODOS',
  'Perno Rey 2"',
  'Perno Rey 3.5"',
  'Lanza / Ojo de Buey',
  'Acople Rápido Cisterna',
  'N/A',
];

export function SparePartModal({ initialData, vehicles = [], onClose, onSave }: SparePartModalProps) {
  // Extract unique brands dynamically from the loaded fleet
  const fleetBrands = Array.from(
    new Set(
      (vehicles || [])
        .map((v: any) => v.marca?.trim())
        .filter((m: string | undefined): m is string => Boolean(m))
    )
  ).sort();

  const [form, setForm] = useState<any>(
    initialData || {
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      categoria: 'FILTROS',
      ambito: 'UNIVERSAL',
      stockActual: 1,
      stockMinimo: 1,
      precioUnitario: 0,
      tiposCompatibles: 'TODOS',
      marcasCompatibles: 'TODAS',
      tipoEnganche: 'TODOS',
    }
  );

  const [isCustomBrand, setIsCustomBrand] = useState<boolean>(() => {
    if (!initialData?.marcasCompatibles) return false;
    const current = initialData.marcasCompatibles.trim();
    if (current === 'TODAS') return false;
    return !fleetBrands.includes(current);
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSku = form.sku?.trim() || `SKU-${Date.now().toString().slice(-6)}`;
    onSave({
      ...form,
      sku: finalSku,
      stockActual: Number(form.stockActual) || 0,
      stockMinimo: Number(form.stockMinimo) || 1,
      precioUnitario: Number(form.precioUnitario) || 0,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {initialData ? 'Editar Repuesto en Pañol' : 'Nuevo Repuesto / Insumo en Pañol'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Código SKU / Parte</label>
                <button
                  type="button"
                  onClick={() => set('sku', `SKU-${Date.now().toString().slice(-6)}`)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Generar
                </button>
              </div>
              <input
                type="text"
                value={form.sku || ''}
                onChange={(e) => set('sku', e.target.value)}
                className="input font-mono text-xs"
                placeholder="Ej: SKU-FIL-001"
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

            <div>
              <label className="label">Ámbito / Aplicación</label>
              <select
                value={form.ambito || 'UNIVERSAL'}
                onChange={(e) => set('ambito', e.target.value)}
                className="input"
              >
                <option value="UNIVERSAL">Universal / Toda la Flota</option>
                <option value="ARRASTRE">Acoplados / Semis / Cisternas</option>
                <option value="TRACCION">Tractores / Camiones (Chasis)</option>
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
              placeholder="Ej: Perno Rey 2' Forjado Heavy Duty Jost o Válvula API 4'"
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

          {/* MATRIZ DE COMPATIBILIDAD FLOTA */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4" /> Matriz de Compatibilidad con la Flota
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Tipo de Vehículo</label>
                <select
                  value={form.tiposCompatibles || 'TODOS'}
                  onChange={(e) => set('tiposCompatibles', e.target.value)}
                  className="input text-xs"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t === 'TODOS' ? 'Todos los tipos' : t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Marca Compatible (Flota Propia)</label>
                <select
                  value={isCustomBrand ? 'OTRA' : (form.marcasCompatibles || 'TODAS')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'OTRA') {
                      setIsCustomBrand(true);
                      set('marcasCompatibles', '');
                    } else {
                      setIsCustomBrand(false);
                      set('marcasCompatibles', val);
                    }
                  }}
                  className="input text-xs font-medium"
                >
                  <option value="TODAS">TODAS (Todas las marcas de la flota)</option>
                  {fleetBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                  <option value="OTRA">+ Especificar otra marca...</option>
                </select>

                {isCustomBrand && (
                  <input
                    type="text"
                    required
                    value={form.marcasCompatibles || ''}
                    onChange={(e) => set('marcasCompatibles', e.target.value)}
                    className="input text-xs mt-2"
                    placeholder="Escriba la marca compatible..."
                  />
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cargadas desde la flota propia
                </span>
              </div>

              <div>
                <label className="label">Tipo de Enganche</label>
                <select
                  value={form.tipoEnganche || 'TODOS'}
                  onChange={(e) => set('tipoEnganche', e.target.value)}
                  className="input text-xs"
                >
                  {HITCH_TYPES.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
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
                placeholder="Ej: Estante B-4, Nivel 1"
              />
            </div>
            <div>
              <label className="label">Modelos Específicos / Observaciones</label>
              <input
                type="text"
                value={form.modelosCompatibles || ''}
                onChange={(e) => set('modelosCompatibles', e.target.value)}
                className="input"
                placeholder="Ej: Aplicable a Semi Cisterna 35.000 Lts"
              />
            </div>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Imagen / Foto de Referencia del Repuesto (URL)
              </span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={form.imagenUrl || ''}
                onChange={(e) => set('imagenUrl', e.target.value)}
                className="input flex-1 text-xs"
                placeholder="https://ejemplo.com/fotos/filtro-aceite-scania.jpg"
              />
              {form.imagenUrl && (
                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={form.imagenUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="label">Notas Adicionales</label>
            <textarea
              rows={2}
              value={form.notas || ''}
              onChange={(e) => set('notas', e.target.value)}
              className="input resize-none"
              placeholder="Notas técnicas de garantía o repuesto equivalente..."
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
