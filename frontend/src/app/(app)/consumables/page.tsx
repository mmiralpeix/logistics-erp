'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consumablesApi, vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney } from '@/lib/utils';
import { Plus, Fuel, AlertTriangle, TrendingDown, TrendingUp, Droplet, FlaskConical, Wrench, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const CONSUMABLE_TYPES = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'DIESEL', label: 'Diésel' },
  { id: 'UREA', label: 'Urea (ARLA 32)' },
  { id: 'ACEITE_MOTOR', label: 'Aceite de Motor' },
  { id: 'LUBRICANTE', label: 'Lubricante' },
  { id: 'ADITIVO', label: 'Aditivo' },
  { id: 'OTRO', label: 'Otros' },
];

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  DIESEL: { label: 'Diésel', bg: 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', text: 'text-amber-800 dark:text-amber-400', icon: Fuel },
  UREA: { label: 'Urea (ARLA 32)', bg: 'bg-cyan-100 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20', text: 'text-cyan-800 dark:text-cyan-400', icon: Droplet },
  ACEITE_MOTOR: { label: 'Aceite Motor', bg: 'bg-purple-100 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20', text: 'text-purple-800 dark:text-purple-400', icon: FlaskConical },
  LUBRICANTE: { label: 'Lubricante', bg: 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20', text: 'text-indigo-800 dark:text-indigo-400', icon: Wrench },
  ADITIVO: { label: 'Aditivo', bg: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-400', icon: Droplet },
  OTRO: { label: 'Otro', bg: 'bg-slate-100 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', icon: Droplet },
};

export default function ConsumablesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('TODOS');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['consumables', selectedType],
    queryFn: () => consumablesApi.getAll({ tipoConsumible: selectedType, limit: 50 }).then((r) => r.data),
  });
  const { data: stats } = useQuery({
    queryKey: ['consumables-stats'],
    queryFn: () => consumablesApi.getStats().then((r) => r.data),
  });
  const { data: deviations } = useQuery({
    queryKey: ['consumables-deviations'],
    queryFn: () => consumablesApi.getDeviations().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => consumablesApi.create(d),
    onSuccess: () => {
      toast.success('Consumible registrado correctamente');
      qc.invalidateQueries({ queryKey: ['consumables'] });
      qc.invalidateQueries({ queryKey: ['consumables-stats'] });
      qc.invalidateQueries({ queryKey: ['consumables-deviations'] });
      setShowModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar consumible'),
  });

  return (
    <div>
      <Header
        title="Control de Consumibles"
        subtitle="Medición y rendimiento de Diésel, Urea (ARLA 32), aceites y aditivos"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Consumible
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards desglosadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card Diésel */}
          <div className="stat-card border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Diésel</span>
              <Fuel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {(stats?.diesel?.litros || 0).toLocaleString('es-AR')} L
            </p>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>Costo: <strong>{formatMoney(stats?.diesel?.costoTotal)}</strong></span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats?.diesel?.rendimientoKmL ? (1 / stats.diesel.rendimientoKmL).toFixed(3) : '0.000'} L/km
                <span className="text-[10px] opacity-85 ml-1">({stats?.diesel?.rendimientoKmL ? (100 / stats.diesel.rendimientoKmL).toFixed(1) : 0} L/100km)</span>
              </span>
            </div>
          </div>

          {/* Card Urea (ARLA 32) */}
          <div className="stat-card border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Urea (ARLA 32)</span>
              <Droplet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {(stats?.urea?.litros || 0).toLocaleString('es-AR')} L
            </p>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
              <span>Costo: <strong>{formatMoney(stats?.urea?.costoTotal)}</strong></span>
              <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                Ratio: {(stats?.urea?.ratioPromedio || 0).toFixed(1)}% vs Diésel
              </span>
            </div>
          </div>

          {/* Card Otros Consumibles */}
          <div className="stat-card border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Otros Fluidos</span>
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatMoney(stats?.otros?.costoTotal)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
              {(stats?.otros?.litros || 0).toLocaleString('es-AR')} L / Unidades de lubricantes y aditivos
            </p>
          </div>

          {/* Card Desvíos */}
          <div className="stat-card border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Desvíos / Alertas</span>
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.anomalies || 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
              Anomalías de consumo detectadas
            </p>
          </div>
        </div>

        {/* Alertas de Desvíos */}
        {deviations && deviations.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Alertas de consumo y desvíos recientes
            </h3>
            <div className="space-y-2">
              {deviations.slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-white dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-4 py-2 text-xs">
                  <div>
                    <span className="font-semibold text-red-900 dark:text-red-300">{d.vehicle?.patente} - {d.vehicle?.marca} ({d.tipoConsumible || d.tipoCombustible})</span>
                    <p className="text-slate-600 dark:text-slate-400">{formatDate(d.fecha)} · {d.litros} L · {formatMoney(d.costoTotal)}</p>
                  </div>
                  {d.notas && <p className="text-red-700 dark:text-red-400 font-medium max-w-sm text-right">{d.notas}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros por tipo de consumible */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CONSUMABLE_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                selectedType === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tabla de registros */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="section-title">Registros de Cargas de Consumibles</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Total: {data?.total || 0} registros</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Cantidad / Litros</th>
                <th className="px-4 py-3 text-left">Precio Unit.</th>
                <th className="px-4 py-3 text-left">Costo Total</th>
                <th className="px-4 py-3 text-left">KM Actual</th>
                <th className="px-4 py-3 text-left">Consumo (Litros x KM)</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando datos...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">No se encontraron registros de consumibles.</td></tr>
              ) : data?.data?.map((log: any) => {
                const badge = TYPE_BADGES[log.tipoConsumible || log.tipoCombustible] || TYPE_BADGES.OTRO;
                const Icon = badge.icon;
                const litrosPorKm = log.rendimientoKmL && log.rendimientoKmL > 0 ? (1 / log.rendimientoKmL).toFixed(3) : null;
                const consumoL100Km = log.rendimientoKmL && log.rendimientoKmL > 0 ? (100 / log.rendimientoKmL).toFixed(1) : null;
                return (
                  <tr key={log.id} className={`table-row ${log.esDesvio ? 'bg-red-50/70 dark:bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(log.fecha)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{log.vehicle?.patente}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.vehicle?.marca} {log.vehicle?.modelo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${badge.bg} ${badge.text}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{log.litros} L</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{formatMoney(log.precioPorLitro)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{formatMoney(log.costoTotal)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.kmActual ? `${log.kmActual.toLocaleString('es-AR')} km` : '-'}</td>
                    <td className="px-4 py-3">
                      {litrosPorKm ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            {log.rendimientoKmL < 2.3 ? <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> : <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                            <span className={log.rendimientoKmL < 2.3 ? 'text-red-600 dark:text-red-400 font-bold text-sm' : 'text-emerald-600 dark:text-emerald-400 font-bold text-sm'}>
                              {litrosPorKm} L/km
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            ({consumoL100Km} L/100km · {log.rendimientoKmL} km/L)
                          </span>
                        </div>
                      ) : log.ratioUreaPorcentaje ? (
                        <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Ratio Urea: {log.ratioUreaPorcentaje}%</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{log.proveedor || '-'}</td>
                    <td className="px-4 py-3">
                      {log.esDesvio ? (
                        <span className="badge badge-red flex items-center gap-1" title={log.notas}>⚠ Desvío</span>
                      ) : (
                        <span className="badge badge-green">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <ConsumableModal onClose={() => setShowModal(false)} onSave={(d: any) => createMutation.mutate(d)} />}
    </div>
  );
}

function ConsumableModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-consumables'],
    queryFn: () => vehiclesApi.getAll({ limit: 100, category: 'MOTRIZ' }).then((r) => r.data.data),
  });

  const [form, setForm] = useState<any>({
    tipoConsumible: 'DIESEL',
    fecha: new Date().toISOString().slice(0, 10),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const estimatedTotal = form.litros && form.precioPorLitro ? Number(form.litros) * Number(form.precioPorLitro) : 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Registrar Carga de Consumible
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg">✕</button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Vehículo *</label>
            <select value={form.vehicleId || ''} onChange={(e) => set('vehicleId', e.target.value)} className="input">
              <option value="">Seleccionar vehículo de la flota...</option>
              {vehicles?.map((v: any) => (
                <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tipo de Consumible *</label>
            <select value={form.tipoConsumible} onChange={(e) => set('tipoConsumible', e.target.value)} className="input">
              <option value="DIESEL">Diésel</option>
              <option value="UREA">Urea (ARLA 32 / DEF)</option>
              <option value="ACEITE_MOTOR">Aceite de Motor</option>
              <option value="LUBRICANTE">Lubricante de Transmisión/Grasa</option>
              <option value="ADITIVO">Aditivo de Limpieza/Anticongelante</option>
              <option value="OTRO">Otro Fluido</option>
            </select>
          </div>

          <div>
            <label className="label">Fecha *</label>
            <input type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} className="input" />
          </div>

          <div>
            <label className="label">{form.tipoConsumible === 'DIESEL' || form.tipoConsumible === 'UREA' ? 'Litros *' : 'Cantidad / Litros *'}</label>
            <input
              type="number"
              step="0.01"
              value={form.litros || ''}
              onChange={(e) => set('litros', Number(e.target.value))}
              className="input"
              placeholder={form.tipoConsumible === 'UREA' ? '20' : '300'}
            />
          </div>

          <div>
            <label className="label">Precio por Litro/Unidad ($) *</label>
            <input
              type="number"
              step="0.01"
              value={form.precioPorLitro || ''}
              onChange={(e) => set('precioPorLitro', Number(e.target.value))}
              className="input"
              placeholder={form.tipoConsumible === 'UREA' ? '1450' : '1180'}
            />
          </div>

          <div>
            <label className="label">Odómetro / KM Actuales</label>
            <input
              type="number"
              value={form.kmActual || ''}
              onChange={(e) => set('kmActual', Number(e.target.value))}
              className="input"
              placeholder="Ej: 145200"
            />
          </div>

          <div>
            <label className="label">Proveedor / Estación de Servicio</label>
            <input
              type="text"
              value={form.proveedor || ''}
              onChange={(e) => set('proveedor', e.target.value)}
              className="input"
              placeholder="Ej: YPF, Shell, Axion, Depósito Central..."
            />
          </div>

          <div className="col-span-2">
            <label className="label">Notas adicionales / N° Factura</label>
            <textarea
              rows={2}
              value={form.notas || ''}
              onChange={(e) => set('notas', e.target.value)}
              className="input resize-none"
              placeholder="Comentarios sobre el suministro..."
            />
          </div>

          {estimatedTotal > 0 && (
            <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Costo Total Estimado:</span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-200">{formatMoney(estimatedTotal)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button
            onClick={() => {
              if (!form.vehicleId || !form.litros || !form.precioPorLitro) {
                toast.error('Por favor complete los campos obligatorios (*)');
                return;
              }
              onSave({ ...form, costoTotal: estimatedTotal });
            }}
            className="btn-primary"
          >
            Registrar Consumible
          </button>
        </div>
      </div>
    </div>
  );
}
