'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, VEHICLE_STATUS_MAP, VEHICLE_TYPE_MAP, getExpiryBadge } from '@/lib/utils';
import { Plus, Search, Truck, Edit2, Trash2, Eye, AlertTriangle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { VehicleModal } from '@/components/vehicles/VehicleModal';

const STATUS_FILTERS = ['', 'DISPONIBLE', 'EN_VIAJE', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'];

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, status, page],
    queryFn: () => vehiclesApi.getAll({ search, status: status || undefined, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: () => { toast.success('Vehículo eliminado'); qc.invalidateQueries({ queryKey: ['vehicles'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  return (
    <div>
      <Header
        title="Gestión de Vehículos"
        subtitle={`${data?.total || 0} vehículos registrados`}
        actions={
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Vehículo
          </button>
        }
      />

      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por patente, marca, modelo..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-52">
            <option value="">Todos los estados</option>
            {STATUS_FILTERS.slice(1).map((s) => (
              <option key={s} value={s}>{VEHICLE_STATUS_MAP[s]?.label}</option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Vehículo</th>
                <th className="px-4 py-3 text-left">Tipo / Capacidad</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Kilometraje</th>
                <th className="px-4 py-3 text-left">Seguro</th>
                <th className="px-4 py-3 text-left">ITV</th>
                <th className="px-4 py-3 text-left">RUTA</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : data?.data?.map((v: any) => {
                const st = VEHICLE_STATUS_MAP[v.status] || { label: v.status, cls: 'badge-gray' };
                const seguro = getExpiryBadge(v.vencimientoSeguro);
                const itv = getExpiryBadge(v.vencimientoITV);
                const ruta = getExpiryBadge(v.vencimientoRUTA);
                return (
                  <tr key={v.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center"><Truck className="w-4 h-4 text-slate-400" /></div>
                        <div>
                          <p className="font-semibold text-white">{v.patente}</p>
                          <p className="text-xs text-slate-400">{v.marca} {v.modelo} {v.anio}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{VEHICLE_TYPE_MAP[v.tipo] || v.tipo}</p>
                      {v.capacidadKg && <p className="text-xs text-slate-500">{(v.capacidadKg / 1000).toFixed(0)} tn</p>}
                    </td>
                    <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                    <td className="px-4 py-3"><span className="text-slate-300">{v.kilometraje?.toLocaleString('es-AR')} km</span></td>
                    <td className="px-4 py-3">
                      <div><span className={seguro.cls}>{seguro.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(v.vencimientoSeguro)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div><span className={itv.cls}>{itv.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(v.vencimientoITV)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div><span className={ruta.cls}>{ruta.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(v.vencimientoRUTA)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/vehicles/${v.id}`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"><Eye className="w-4 h-4" /></a>
                        <button onClick={() => { setEditing(v); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`¿Eliminar ${v.patente}?`)) deleteMutation.mutate(v.id); }} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-sm text-slate-400">Total: {data.total} vehículos</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                <span className="px-3 py-1 text-sm text-slate-400">Pág. {page}/{data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <VehicleModal vehicle={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
