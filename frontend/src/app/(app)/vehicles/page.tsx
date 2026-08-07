'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { VEHICLE_STATUS_MAP, VEHICLE_TYPE_MAP } from '@/lib/utils';
import { ExpiryCell } from '@/components/ui/ExpiryCell';
import {
  Plus, Search, Truck, Edit2, Trash2, Eye, Gauge, Wrench, ShieldAlert, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { VehicleModal } from '@/components/vehicles/VehicleModal';
import { VehicleDetailDrawer } from '@/components/vehicles/VehicleDetailDrawer';
import { OdometerModal } from '@/components/vehicles/OdometerModal';

const STATUS_FILTERS = ['', 'DISPONIBLE', 'EN_VIAJE', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO'];

const CATEGORY_TABS = [
  { id: '', label: 'Todas las Unidades', icon: '🚛' },
  { id: 'MOTRIZ', label: 'Unidades Motrices', icon: '🚚' },
  { id: 'REMOLCADO', label: 'Semis & Cisternas', icon: '📦' },
  { id: 'CARRETON', label: 'Carretones & Pesados', icon: '🚜' },
  { id: 'UTILITARIO', label: 'Utilitarios', icon: '🛻' },
];

export default function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected360Id, setSelected360Id] = useState<string | null>(null);
  const [odometerVehicle, setOdometerVehicle] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, status, category, page],
    queryFn: () => vehiclesApi.getAll({ search, status: status || undefined, category: category || undefined, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: () => { toast.success('Equipo eliminado'); qc.invalidateQueries({ queryKey: ['vehicles'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  return (
    <div>
      <Header
        title="Gestión de Flota Pesada, Equipos & Ficha 360°"
        subtitle={`${data?.total || 0} equipos registrados en sistema`}
        actions={
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-700">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setCategory(tab.id); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap border-b-2 ${
                category === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por patente, marca, modelo, tipo..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-52">
            <option value="">Todos los estados</option>
            {STATUS_FILTERS.slice(1).map((s) => (
              <option key={s} value={s}>{VEHICLE_STATUS_MAP[s]?.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Dominio / Equipo</th>
                <th className="px-4 py-3 text-left">Tipo & Especificaciones</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Kilometraje / Service</th>
                <th className="px-4 py-3 text-center">Seguro</th>
                <th className="px-4 py-3 text-center">ITV / VTV</th>
                <th className="px-4 py-3 text-center">CRIM</th>
                <th className="px-4 py-3 text-center">SENASA</th>
                <th className="px-4 py-3 text-right">Acciones 360°</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando flota de vehículos...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                  <p>No se encontraron equipos registrados</p>
                </td></tr>
              ) : (
                data?.data?.map((vehicle: any) => {
                  const kmProximoService = Math.ceil(vehicle.kilometraje / 15000) * 15000 + 15000;
                  const kmRestantes = Math.max(0, kmProximoService - vehicle.kilometraje);
                  const isRemolcado = ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA', 'BITREN', 'ACOPLADO'].includes(vehicle.tipo);

                  return (
                    <tr key={vehicle.id} className="table-row">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 dark:text-white text-base">{vehicle.patente}</span>
                          {vehicle.isThirdParty && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700">Tercero</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{vehicle.marca} {vehicle.modelo} ({vehicle.anio})</p>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{VEHICLE_TYPE_MAP[vehicle.tipo] || vehicle.tipo}</span>
                        <p className="text-slate-500">{vehicle.capacidadKg ? `${(vehicle.capacidadKg / 1000).toFixed(1)} Tn` : 'N/A'}</p>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                          vehicle.status === 'DISPONIBLE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' :
                          vehicle.status === 'EN_VIAJE' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700' :
                          'bg-amber-100 dark:bg-amber-950 text-amber-700'
                        }`}>
                          {VEHICLE_STATUS_MAP[vehicle.status]?.label || vehicle.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-white">{vehicle.kilometraje?.toLocaleString()} km</span>
                        <p className="text-[11px] text-slate-500">Service en ~{kmRestantes.toLocaleString()} km</p>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <ExpiryCell date={vehicle.vencimientoSeguro} />
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <ExpiryCell date={vehicle.vencimientoITV} />
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <ExpiryCell date={vehicle.vencimientoCrim} />
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <ExpiryCell date={vehicle.vencimientoSenasa} na={!isRemolcado} />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelected360Id(vehicle.id)}
                            onMouseEnter={() =>
                              qc.prefetchQuery({
                                queryKey: ['vehicle-summary-360', vehicle.id],
                                queryFn: () => vehiclesApi.getSummary360(vehicle.id).then((r) => r.data),
                              })
                            }
                            className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ficha 360°
                          </button>

                          <button
                            onClick={() => setOdometerVehicle(vehicle)}
                            title="Actualizar Odómetro"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Gauge className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { setEditing(vehicle); setShowModal(true); }}
                            title="Editar Equipo"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => { if (confirm('¿Eliminar este equipo?')) deleteMutation.mutate(vehicle.id); }}
                            title="Eliminar Equipo"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle Create/Edit Modal */}
      {showModal && (
        <VehicleModal vehicle={editing} onClose={() => setShowModal(false)} />
      )}

      {/* Odometer Modal */}
      {odometerVehicle && (
        <OdometerModal vehicle={odometerVehicle} onClose={() => setOdometerVehicle(null)} />
      )}

      {/* Expediente 360° Drawer */}
      <VehicleDetailDrawer
        vehicleId={selected360Id}
        onClose={() => setSelected360Id(null)}
      />
    </div>
  );
}
