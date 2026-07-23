'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney, MAINTENANCE_STATUS_MAP } from '@/lib/utils';
import { Plus, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', filterStatus],
    queryFn: () => maintenanceApi.getAll({ status: filterStatus || undefined, limit: 50 }).then((r) => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: () => maintenanceApi.getUpcoming().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => maintenanceApi.update(id, data),
    onSuccess: () => { toast.success('Estado actualizado'); qc.invalidateQueries({ queryKey: ['maintenance'] }); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => maintenanceApi.create(data),
    onSuccess: () => { toast.success('Mantenimiento creado'); qc.invalidateQueries({ queryKey: ['maintenance'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div>
      <Header
        title="Gestión de Mantenimiento"
        subtitle="Control preventivo y correctivo de flota"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Mantenimiento
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Upcoming alerts */}
        {upcoming && upcoming.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Mantenimientos próximos ({upcoming.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {upcoming.slice(0, 4).map((m: any) => (
                <div key={m.id} className="bg-white dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">{m.vehicle?.patente}</p>
                  <p className="text-xs text-slate-600 dark:text-amber-400/80">{m.descripcion}</p>
                  {m.fechaProxima && <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">{formatDate(m.fechaProxima)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-52">
            <option value="">Todos los estados</option>
            {Object.entries(MAINTENANCE_STATUS_MAP).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
          </select>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Taller</th>
                <th className="px-4 py-3 text-left">Costo</th>
                <th className="px-4 py-3 text-left">Próximo</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando...</td></tr>
              ) : data?.data?.map((m: any) => {
                const st = MAINTENANCE_STATUS_MAP[m.status] || { label: m.status, cls: 'badge-gray' };
                return (
                  <tr key={m.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{m.vehicle?.patente}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.vehicle?.marca} {m.vehicle?.modelo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.tipo === 'PREVENTIVO' ? 'badge badge-blue' : 'badge badge-yellow'}>{m.tipo}</span>
                    </td>
                    <td className="px-4 py-3"><p className="text-slate-800 dark:text-slate-300 max-w-xs truncate">{m.descripcion}</p></td>
                    <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                    <td className="px-4 py-3"><p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(m.fecha)}</p></td>
                    <td className="px-4 py-3"><p className="text-xs text-slate-500 dark:text-slate-400">{m.taller || '-'}</p></td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-slate-900 dark:text-white">{formatMoney(m.costoTotal)}</p></td>
                    <td className="px-4 py-3"><p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(m.fechaProxima) || (m.kmProximo ? `${m.kmProximo?.toLocaleString('es-AR')} km` : '-')}</p></td>
                    <td className="px-4 py-3">
                      <select
                        value={m.status}
                        onChange={(e) => updateMutation.mutate({ id: m.id, status: e.target.value })}
                        className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
                      >
                        {Object.entries(MAINTENANCE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <MaintenanceModal onClose={() => setShowModal(false)} onSave={(d: any) => createMutation.mutate(d)} />}
    </div>
  );
}

function MaintenanceModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const { data: vehicles } = useQuery({ queryKey: ['vehicles-mnt'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const [form, setForm] = useState<any>({ tipo: 'PREVENTIVO', status: 'PENDIENTE' });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3"><Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" /><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nuevo Mantenimiento</h2></div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">✕</button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Vehículo *</label>
            <select value={form.vehicleId || ''} onChange={(e) => set('vehicleId', e.target.value)} className="input">
              <option value="">Seleccionar...</option>
              {vehicles?.map((v: any) => <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CORRECTIVO">Correctivo</option>
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="input">
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="COMPLETADO">Completado</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Descripción *</label>
            <textarea value={form.descripcion || ''} onChange={(e) => set('descripcion', e.target.value)} rows={2} className="input resize-none" placeholder="Descripción del trabajo a realizar..." />
          </div>
          <div><label className="label">Fecha</label><input type="date" value={form.fecha || ''} onChange={(e) => set('fecha', e.target.value)} className="input" /></div>
          <div><label className="label">Taller</label><input type="text" value={form.taller || ''} onChange={(e) => set('taller', e.target.value)} className="input" placeholder="Nombre del taller" /></div>
          <div><label className="label">KM actuales</label><input type="number" value={form.kmActual || ''} onChange={(e) => set('kmActual', Number(e.target.value))} className="input" /></div>
          <div><label className="label">KM próx. service</label><input type="number" value={form.kmProximo || ''} onChange={(e) => set('kmProximo', Number(e.target.value))} className="input" /></div>
          <div><label className="label">Fecha próximo service</label><input type="date" value={form.fechaProxima || ''} onChange={(e) => set('fechaProxima', e.target.value)} className="input" /></div>
          <div><label className="label">Costo Total ($)</label><input type="number" value={form.costoTotal || ''} onChange={(e) => set('costoTotal', Number(e.target.value))} className="input" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  );
}
