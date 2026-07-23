'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney, formatDate, formatDateTime, TRIP_STATUS_MAP } from '@/lib/utils';
import { Plus, Search, Map, Truck, User, Eye, Edit2, FileText, FileCheck, Building2, Container } from 'lucide-react';
import toast from 'react-hot-toast';
import { TripModal } from '@/components/trips/TripModal';

const STATUSES = Object.entries(TRIP_STATUS_MAP);

export default function TripsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
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

  return (
    <div>
      <Header
        title="Gestión de Viajes & Operaciones"
        subtitle={`${data?.total || 0} viajes registrados en sistema`}
        actions={
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Planificar Viaje
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N° viaje, origen, destino, remito, OC..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>

          {/* Client Filter */}
          <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="input w-60 font-medium">
            <option value="">Todos los clientes</option>
            {clients?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.razonSocial}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-48">
            <option value="">Todos los estados</option>
            {STATUSES.map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">N° Viaje / Carga</th>
                <th className="px-4 py-3 text-left">Ruta</th>
                <th className="px-4 py-3 text-left">Tractor + Equipo Enganchado</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Documentación (Remito / OC)</th>
                <th className="px-4 py-3 text-left">Salida Programada</th>
                <th className="px-4 py-3 text-left">ETA Llegada</th>
                <th className="px-4 py-3 text-left">Tarifa & Excedente a Cobrar</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando viajes...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12">
                  <Map className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No se encontraron viajes para los filtros seleccionados</p>
                </td></tr>
              ) : data?.data?.map((trip: any) => {
                const excessTn = trip.pesoExcedenteKg ? trip.pesoExcedenteKg / 1000 : 0;
                return (
                  <tr key={trip.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{trip.numero}</p>
                      <span className="badge badge-gray text-[10px] mt-0.5 inline-block font-semibold">
                        {trip.tipoCarga === 'SALMUERA' ? '🧪 SALMUERA' : trip.tipoCarga === 'CARRETON' ? '🚜 CARRETON' : trip.tipoCarga || 'GENERAL'}
                      </span>
                      {trip.esCargaPeligrosa && <span className="badge badge-red text-[10px] ml-1 inline-block">⚠ Peligrosa</span>}
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
                          <span>Tractor: {trip.vehicle?.patente}</span>
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

                    <td className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-300 text-xs">{formatDateTime(trip.fechaSalidaProgramada)}</p>
                      {trip.fechaSalidaReal && <p className="text-emerald-600 dark:text-green-400 text-[11px]">Real: {formatDate(trip.fechaSalidaReal)}</p>}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-800 dark:text-slate-300 text-xs">{formatDateTime(trip.fechaLlegadaEstimada)}</p>
                      {trip.fechaLlegadaReal && <p className="text-emerald-600 dark:text-green-400 text-[11px]">Real: {formatDate(trip.fechaLlegadaReal)}</p>}
                    </td>

                    {/* Rate & Excess Billing */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{formatMoney(trip.tarifaAcordada)}</p>
                        {trip.montoExcedente > 0 ? (
                          <p className="text-[11px] font-extrabold text-emerald-600 dark:text-green-400 mt-0.5">
                            +{excessTn.toFixed(1)} Tn Excedente (+{formatMoney(trip.montoExcedente)})
                          </p>
                        ) : trip.pesoCarga ? (
                          <p className="text-[11px] text-slate-500">{(trip.pesoCarga / 1000).toFixed(1)} Tn (Sin excedente)</p>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <select
                        value={trip.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: trip.id, status: e.target.value })}
                        className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 cursor-pointer shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        {STATUSES.map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/trips/${trip.id}`} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors" title="Ver detalle del viaje">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => { setEditing(trip); setShowModal(true); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-500/10 rounded transition-colors" title="Editar viaje / Enganche / Remito / OC">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total: {data.total} viajes</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">{page}/{data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <TripModal trip={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
