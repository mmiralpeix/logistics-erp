'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatDateTime, formatMoney, TRIP_STATUS_MAP } from '@/lib/utils';
import { Plus, Search, Map, Calendar, List, Truck, User, Building2, AlertTriangle, Edit2, Eye, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { TripModal } from '@/components/trips/TripModal';
import { GanttView } from '@/components/trips/GanttView';

const STATUSES = Object.entries(TRIP_STATUS_MAP);

export default function TripsPage() {
  const [view, setView] = useState<'table' | 'gantt'>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trips', search, status, page],
    queryFn: () => tripsApi.getAll({ search, status: status || undefined, page, limit: 15 }).then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => tripsApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Estado actualizado'); qc.invalidateQueries({ queryKey: ['trips'] }); },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const statusColors: Record<string, string> = {
    PENDIENTE: 'bg-slate-600', PROGRAMADO: 'bg-blue-600', EN_CURSO: 'bg-green-600',
    DEMORADO: 'bg-amber-600', FINALIZADO: 'bg-purple-600', CANCELADO: 'bg-red-600',
  };

  return (
    <div>
      <Header
        title="Gestión de Viajes"
        subtitle={`${data?.total || 0} viajes en sistema`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 border border-slate-700 rounded-lg p-0.5">
              <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${view === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <List className="w-3.5 h-3.5" /> Lista
              </button>
              <button onClick={() => setView('gantt')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${view === 'gantt' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Calendar className="w-3.5 h-3.5" /> Gantt
              </button>
            </div>
            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Nuevo Viaje
            </button>
          </div>
        }
      />

      <div className="p-6">
        {view === 'gantt' ? (
          <GanttView />
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="relative flex-1 min-w-48 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="N° viaje, origen, destino..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
              </div>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-48">
                <option value="">Todos los estados</option>
                {STATUSES.map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
              </select>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">N° Viaje / Estado</th>
                    <th className="px-4 py-3 text-left">Ruta</th>
                    <th className="px-4 py-3 text-left">Vehículo / Conductor</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Salida</th>
                    <th className="px-4 py-3 text-left">ETA</th>
                    <th className="px-4 py-3 text-left">Lead Time</th>
                    <th className="px-4 py-3 text-left">Tarifa</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-400">Cargando viajes...</td></tr>
                  ) : data?.data?.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12">
                      <Map className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p className="text-slate-400">No se encontraron viajes</p>
                    </td></tr>
                  ) : data?.data?.map((trip: any) => {
                    const st = TRIP_STATUS_MAP[trip.status] || { label: trip.status, cls: 'badge-gray' };
                    return (
                      <tr key={trip.id} className="table-row">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{trip.numero}</p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={st.cls}>{st.label}</span>
                            {trip.esCargaPeligrosa && <span className="badge badge-red text-[10px]">⚠ Peligrosa</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs font-medium">{trip.origen}</p>
                          <p className="text-slate-500 text-xs">→ {trip.destino}</p>
                          {trip.distanciaKm && <p className="text-slate-600 text-xs">{trip.distanciaKm} km</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="flex items-center gap-1 text-slate-300 text-xs"><Truck className="w-3 h-3" /> {trip.vehicle?.patente}</p>
                          <p className="flex items-center gap-1 text-slate-400 text-xs"><User className="w-3 h-3" /> {trip.driver?.firstName} {trip.driver?.lastName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs">{trip.client?.razonSocial || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs">{formatDateTime(trip.fechaSalidaProgramada)}</p>
                          {trip.fechaSalidaReal && <p className="text-green-400 text-xs">Real: {formatDate(trip.fechaSalidaReal)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-300 text-xs">{formatDateTime(trip.fechaLlegadaEstimada)}</p>
                          {trip.fechaLlegadaReal && <p className="text-green-400 text-xs">Real: {formatDate(trip.fechaLlegadaReal)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {trip.leadTimeTotal && (
                            <div className="flex items-center gap-1 text-slate-300 text-xs">
                              <Clock className="w-3 h-3" />
                              {trip.leadTimeTotal}h
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white text-xs">{formatMoney(trip.tarifaAcordada)}</p>
                          {trip.costoTotal && <p className="text-slate-500 text-xs">Costo: {formatMoney(trip.costoTotal)}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <a href={`/trips/${trip.id}`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"><Eye className="w-3.5 h-3.5" /></a>
                            <select
                              value={trip.status}
                              onChange={(e) => updateStatusMutation.mutate({ id: trip.id, status: e.target.value })}
                              className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300 cursor-pointer"
                            >
                              {STATUSES.map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                  <p className="text-sm text-slate-400">Total: {data.total} viajes</p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                    <span className="px-3 py-1 text-sm text-slate-400">{page}/{data.totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showModal && <TripModal trip={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
