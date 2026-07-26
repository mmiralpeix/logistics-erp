'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney, formatDate, formatDateTime, TRIP_STATUS_MAP } from '@/lib/utils';
import { Plus, Search, Map, Truck, User, Eye, Edit2, FileText, FileCheck, Building2, Container, Layers, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { TripModal } from '@/components/trips/TripModal';
import { BatchTripModal } from '@/components/trips/BatchTripModal';
import { WaybillModal } from '@/components/trips/WaybillModal';

const STATUSES = Object.entries(TRIP_STATUS_MAP);

export default function TripsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [waybillTrip, setWaybillTrip] = useState<any>(null);
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
      setShowBatchModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al generar el convoy de viajes');
    },
  });

  return (
    <div className="space-y-6">
      <Header
        title="Gestión Operativa de Viajes & Despachos"
        subtitle="Monitoreo en tiempo real de rutas, cargas salmuera/minería, remitos y finanzas de flota"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
            >
              <Layers className="w-4 h-4" />
              <span>Generar Convoy (Multi-Unidad)</span>
            </button>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Viaje</span>
            </button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por N° Viaje, Origen, Destino, Remito..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9"
            />
          </div>

          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input w-44">
            <option value="">Todos los estados</option>
            {STATUSES.map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
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
                  <th className="px-4 py-3 text-left">Tarifa, Costo & Rentabilidad</th>
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
                  const tarifa = trip.tarifaAcordada || 0;
                  const costo = trip.costoTotal || 0;
                  const margen = tarifa - costo;
                  const margenPct = tarifa > 0 ? Math.round((margen / tarifa) * 100) : 0;

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

                      {/* Documentation: Remito, OC & Certificado */}
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

                          {trip.numeroCertificado ? (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit border border-amber-200 dark:border-amber-800">
                              <FileCheck className="w-3 h-3" /> Cert. #{trip.numeroCertificado}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block">Sin certificar</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <p><span className="text-slate-400">Salida:</span> {formatDate(trip.fechaSalidaProgramada)}</p>
                        <p><span className="text-slate-400">Est. Llegada:</span> {formatDate(trip.fechaLlegadaEstimada)}</p>
                      </td>

                      {/* Tarifa, Costos & Semáforo Rentabilidad % */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Tarifa:</span>
                            <span>{formatMoney(tarifa)}</span>
                          </p>
                          <p className="font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 uppercase">Costo:</span>
                            <span>{formatMoney(costo)}</span>
                          </p>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                            <p className={`font-bold text-[11px] ${margen >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {formatMoney(margen)}
                            </p>
                            {tarifa > 0 && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                margenPct >= 30
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                  : margenPct >= 15
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                              }`}>
                                {margenPct}%
                              </span>
                            )}
                          </div>
                        </div>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setWaybillTrip(trip)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                            title="Imprimir Hoja de Ruta / Manifiesto Digital"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
          {data && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              <span>Mostrando {data.data.length} de {data.total} viajes</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>Página {page} de {data.totalPages || 1}</span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TripModal
          trip={editing}
          onClose={() => setShowModal(false)}
          onSave={() => setShowModal(false)}
        />
      )}

      {showBatchModal && (
        <BatchTripModal
          onClose={() => setShowBatchModal(false)}
          onSave={(data) => createBatchMutation.mutate(data)}
          isLoading={createBatchMutation.isPending}
        />
      )}

      {waybillTrip && (
        <WaybillModal
          trip={waybillTrip}
          onClose={() => setWaybillTrip(null)}
        />
      )}
    </div>
  );
}
