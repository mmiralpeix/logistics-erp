'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi, vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney } from '@/lib/utils';
import { Plus, Fuel, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FuelPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['fuel'], queryFn: () => fuelApi.getAll({ limit: 30 }).then((r) => r.data) });
  const { data: stats } = useQuery({ queryKey: ['fuel-stats'], queryFn: () => fuelApi.getStats().then((r) => r.data) });
  const { data: deviations } = useQuery({ queryKey: ['fuel-deviations'], queryFn: () => fuelApi.getDeviations().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => fuelApi.create(data),
    onSuccess: () => { toast.success('Carga registrada'); qc.invalidateQueries({ queryKey: ['fuel'] }); qc.invalidateQueries({ queryKey: ['fuel-stats'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al registrar'),
  });

  return (
    <div>
      <Header
        title="Control de Combustible"
        subtitle="Registro, rendimiento y detección de desvíos"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Registrar Carga
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <Fuel className="w-5 h-5 text-orange-400" />
            <p className="text-2xl font-bold text-white">{(stats?.totals?._sum?.litros || 0).toLocaleString('es-AR')} L</p>
            <p className="text-sm text-slate-400">Total litros (período)</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <p className="text-2xl font-bold text-white">{formatMoney(stats?.totals?._sum?.costoTotal)}</p>
            <p className="text-sm text-slate-400">Costo total combustible</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <p className="text-2xl font-bold text-white">{(stats?.totals?._avg?.rendimientoKmL || 0).toFixed(2)} km/L</p>
            <p className="text-sm text-slate-400">Rendimiento promedio</p>
          </div>
          <div className="stat-card">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-2xl font-bold text-white">{stats?.anomalies || 0}</p>
            <p className="text-sm text-slate-400">Desvíos detectados</p>
          </div>
        </div>

        {/* Deviations alert */}
        {deviations && deviations.length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h3 className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> Desvíos de rendimiento detectados
            </h3>
            <div className="space-y-2">
              {deviations.slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  <div>
                    <span className="text-sm font-medium text-red-300">{d.vehicle?.patente} - {d.vehicle?.marca}</span>
                    <p className="text-xs text-red-400/80">{formatDate(d.fecha)} · {d.litros}L · Rendimiento: {d.rendimientoKmL} km/L</p>
                  </div>
                  {d.notas && <p className="text-xs text-red-400 max-w-xs">{d.notas}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="section-title">Registro de Cargas</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Litros</th>
                <th className="px-4 py-3 text-left">Precio/L</th>
                <th className="px-4 py-3 text-left">Costo Total</th>
                <th className="px-4 py-3 text-left">KM Actual</th>
                <th className="px-4 py-3 text-left">Rendimiento</th>
                <th className="px-4 py-3 text-left">Proveedor</th>
                <th className="px-4 py-3 text-left">Desvío</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : data?.data?.map((log: any) => (
                <tr key={log.id} className={`table-row ${log.esDesvio ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDate(log.fecha)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{log.vehicle?.patente}</p>
                    <p className="text-xs text-slate-400">{log.vehicle?.marca} {log.vehicle?.modelo}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{log.litros} L</td>
                  <td className="px-4 py-3 text-slate-300">{formatMoney(log.precioPorLitro)}</td>
                  <td className="px-4 py-3 font-medium text-white">{formatMoney(log.costoTotal)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{log.kmActual?.toLocaleString('es-AR') || '-'} km</td>
                  <td className="px-4 py-3">
                    {log.rendimientoKmL ? (
                      <div className="flex items-center gap-1">
                        {log.rendimientoKmL < 1.2 ? <TrendingDown className="w-3.5 h-3.5 text-red-400" /> : <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                        <span className={log.rendimientoKmL < 1.2 ? 'text-red-400' : 'text-green-400'}>{log.rendimientoKmL} km/L</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{log.proveedor || '-'}</td>
                  <td className="px-4 py-3">
                    {log.esDesvio ? <span className="badge badge-red">⚠ Desvío</span> : <span className="badge badge-green">Normal</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <FuelModal onClose={() => setShowModal(false)} onSave={(d: any) => createMutation.mutate(d)} />}
    </div>
  );
}

function FuelModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const { data: vehicles } = useQuery({ queryKey: ['vehicles-fuel'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const [form, setForm] = useState<any>({ tipoCombustible: 'DIESEL', fecha: new Date().toISOString().slice(0, 10) });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Registrar Carga de Combustible</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Vehículo *</label>
            <select value={form.vehicleId || ''} onChange={(e) => set('vehicleId', e.target.value)} className="input">
              <option value="">Seleccionar...</option>
              {vehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.patente} - {v.marca}</option>)}
            </select>
          </div>
          <div><label className="label">Fecha *</label><input type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} className="input" /></div>
          <div><label className="label">Tipo de combustible</label>
            <select value={form.tipoCombustible} onChange={(e) => set('tipoCombustible', e.target.value)} className="input">
              <option value="DIESEL">Diesel</option>
              <option value="GASOIL">Gasoil</option>
              <option value="NAFTA">Nafta</option>
            </select>
          </div>
          <div><label className="label">Litros *</label><input type="number" step="0.01" value={form.litros || ''} onChange={(e) => set('litros', Number(e.target.value))} className="input" placeholder="280" /></div>
          <div><label className="label">Precio por litro ($) *</label><input type="number" step="0.01" value={form.precioPorLitro || ''} onChange={(e) => set('precioPorLitro', Number(e.target.value))} className="input" placeholder="1180" /></div>
          <div><label className="label">KM actuales</label><input type="number" value={form.kmActual || ''} onChange={(e) => set('kmActual', Number(e.target.value))} className="input" /></div>
          <div><label className="label">Proveedor / Estación</label><input type="text" value={form.proveedor || ''} onChange={(e) => set('proveedor', e.target.value)} className="input" placeholder="YPF, Shell, Axion..." /></div>
          <div className="col-span-2"><label className="label">Notas</label><textarea rows={2} value={form.notas || ''} onChange={(e) => set('notas', e.target.value)} className="input resize-none" /></div>
          {form.litros && form.precioPorLitro && (
            <div className="col-span-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-medium text-blue-400">Costo total estimado: {formatMoney(Number(form.litros) * Number(form.precioPorLitro))}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave({ ...form, costoTotal: Number(form.litros) * Number(form.precioPorLitro) })} className="btn-primary">Registrar Carga</button>
        </div>
      </div>
    </div>
  );
}
