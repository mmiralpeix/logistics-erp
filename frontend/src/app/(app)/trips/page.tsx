'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney, formatDate, formatDateTime, TRIP_STATUS_MAP } from '@/lib/utils';
import { Plus, Search, Map, Truck, User, Eye, Edit2, FileText, FileCheck, Building2, Container, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { TripModal } from '@/components/trips/TripModal';
import { BatchTripModal } from '@/components/trips/BatchTripModal';

const STATUSES = Object.entries(TRIP_STATUS_MAP);

export default function TripsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['trips', search, statusFilter, clientFilter, page],
    queryFn: () => tripsApi.getAll({ search, status: statusFilter || undefined, clientId: clientFilter || undefined, page, limit: 15 }).then((r) => r.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tripsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Estado del viaje actualizado');
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['trip-distribution'] });
    },
    onError: () => toast.error('Error al actualizar el estado'),
  });

  const createBatchMutation = useMutation({
    mutationFn: (dto: any) => tripsApi.createBatch(dto),
    onSuccess: (res: any) => {
      const data = res.data;
      toast.success(`¡Convoy #${data.convoyCode} generado exitosamente con ${data.count} viajes!`);
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['trip-distribution'] });
      setShowBatchModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al emitir el convoy'),
  });

  return (
    <div>
      <Header
        title="Gestión de Viajes & Operaciones"
        subtitle={`${data?.total || 0} viajes registrados en sistema`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBatchModal(true)} className="btn-secondary flex items-center gap-1.5 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Programar Convoy (Multi-Unidad)</span>
            </button>

            <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Planificar Viaje Individual</span>
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N° viaje, origen, destino, patente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
            />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-48">
            <option value="">Todos los estados</option>
            {STATUSES.map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
          </select>

          <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="input w-52">
            <option value="">Todos los clientes</option>
            {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
          </select>
        </div>

        {/* Trips Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">N° Viaje</th>
                  <th className="px-4 py-3 text-left">Ruta (Origen → Destino)</th>
                  <th className="px-4 py-3 text-left">Asignación Flota (Chasis / Semi / Chofer)</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Documentación (Remito / OC)</th>
                  <th className="px-4 py-3 text-left">Fechas (Salida / Estimada)</th>
                  <th className="px-4 py-3 text-left">Tarifa & Costos</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {isLoading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-500">Cargando viajes...</td></tr>
                ) : data?.data?.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12">
                    <Map className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400">No se encontraron viajes para los filtros seleccionados</p>
                  </td></tr>
                ) : data?.data?.map((trip: any) => {
                  return (
                    <tr key={trip.id} className="table-row">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {trip.numero}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="badge badge-gray text-[10px] font-semibold">
                            {trip.tipoCarga === 'SALMUERA' ? '🧪 SALMUERA' : trip.tipoCarga === 'CARRETON' ? '🚜 CARRETON' : trip.tipoCarga || 'GENERAL'}
                          </span>
                          {trip.convoyCode && (
                            <span className="badge badge-blue text-[10px] font-bold" title="Viaje emitido en convoy multi-unidad">
                              🚀 {trip.convoyCode}
                            </span>
                          )}
                          {trip.esCargaPeligrosa && <span className="badge badge-red text-[10px]">⚠ Peligrosa</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-slate-800 dark:text-slate-300 text-xs font-medium">{trip.origen}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">→ {trip.destino}</p>
                        {trip.distanciaKm && <p className="text-slate-500 text-[11px]">{trip.distanciaKm} km</p>}
                      </td>

                      {/* Dual License Plates: Tractor + Trailer */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-slate-900 dark:text-white text-xs font-bold">
                            <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-green-400" />
                            <span>Camión: {trip.vehicle?.patente}</span>
                          </p>
                          {trip.trailer ? (
                            <p className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                              <Container className="w-3.5 h-3.5" />
                              <span>Semi: {trip.trailer.patente} ({trip.trailer.tipo?.replace('_', ' ')})</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">Sin equipo remolcado</p>
                          )}
                          <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                            <User className="w-3 h-3 text-slate-400" /> {trip.driver?.firstName} {trip.driver?.lastName}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-slate-800 dark:text-slate-300 text-xs font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" /> {trip.client?.razonSocial || '-'}
                        </p>
                      </td>

                      {/* Documentation: Remito & OC */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {trip.numeroRemito ? (
                            <span className="badge badge-purple text-[10px] font-bold flex items-center gap-1 w-fit">
                              <FileCheck className="w-3 h-3" /> {trip.numeroRemito}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">📋 Sin Remito</span>
                          )}

                          {trip.numeroOCCliente || trip.contract?.numero ? (
                            <span className="badge badge-blue text-[10px] font-bold flex items-center gap-1 w-fit">
                              <FileText className="w-3 h-3" /> {trip.numeroOCCliente || trip.contract?.numero}
                            </span>
                          ) : (
                            <button
                              onClick={() => { setEditing(trip); setShowModal(true); }}
                              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-0.5 block"
                            >
                              ⚠️ Sin OC — Cargar
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <p><span className="text-slate-400">Salida:</span> {formatDate(trip.fechaSalidaProgramada)}</p>
                        <p><span className="text-slate-400">Est. Llegada:</span> {formatDate(trip.fechaLlegadaEstimada)}</p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{formatMoney(trip.tarifaAcordada)}</p>
                        {trip.costoTotal && <p className="text-[11px] text-slate-500">Costo: {formatMoney(trip.costoTotal)}</p>}
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={trip.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: trip.id, status: e.target.value })}
                          className={`text-xs rounded-lg px-2 py-1 font-semibold border border-transparent cursor-pointer focus:outline-none ${TRIP_STATUS_MAP[trip.status]?.cls || 'bg-slate-100 text-slate-800'}`}
                        >
                          {STATUSES.map(([val, { label }]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditing(trip); setShowModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Editar viaje"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`/trips/${trip.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500">Página {page} de {data.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 text-xs">Anterior</button>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 text-xs">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TripModal
          trip={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={() => { qc.invalidateQueries({ queryKey: ['trips'] }); setShowModal(false); setEditing(null); }}
        />
      )}

      {showBatchModal && (
        <BatchTripModal
          onClose={() => setShowBatchModal(false)}
          onSave={(dto: any) => createBatchMutation.mutate(dto)}
          isLoading={createBatchMutation.isPending}
        />
      )}
    </div>
  );
}
