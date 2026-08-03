'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, vehiclesApi, sparePartsApi, tiresApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney, MAINTENANCE_STATUS_MAP } from '@/lib/utils';
import { Plus, Wrench, AlertTriangle, CheckCircle2, ShieldAlert, DollarSign, Activity, FileText, Search, Package, Layers, Image as ImageIcon, CircleDot, LayoutGrid } from 'lucide-react';
import { WorkOrderModal } from '@/components/maintenance/WorkOrderModal';
import { MaintenanceHealthCard } from '@/components/maintenance/MaintenanceHealthCard';
import { SparePartModal } from '@/components/maintenance/SparePartModal';
import toast from 'react-hot-toast';

// Tires Submodule Components
import { TireKPIs } from '@/components/maintenance/tires/TireKPIs';
import { TireFilters } from '@/components/maintenance/tires/TireFilters';
import { TireCard } from '@/components/maintenance/tires/TireCard';
import { VehicleAxleMapModal } from '@/components/maintenance/tires/VehicleAxleMapModal';
import { TireModal } from '@/components/maintenance/tires/TireModal';
import { TireInstallModal } from '@/components/maintenance/tires/TireInstallModal';
import { TireRetreadModal } from '@/components/maintenance/tires/TireRetreadModal';
import { TireInspectionModal } from '@/components/maintenance/tires/TireInspectionModal';
import { TireTimelineModal } from '@/components/maintenance/tires/TireTimelineModal';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'health' | 'costs' | 'inventory' | 'tires'>('orders');
  const [showModal, setShowModal] = useState(false);
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [editSpareData, setEditSpareData] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [spareCategory, setSpareCategory] = useState('');
  const [spareSearch, setSpareSearch] = useState('');

  // Tires Submodule States
  const [tireSearch, setTireSearch] = useState('');
  const [tireStatus, setTireStatus] = useState('');
  const [tireTipo, setTireTipo] = useState('');
  const [tireVehicleId, setTireVehicleId] = useState('');
  const [showTireModal, setShowTireModal] = useState(false);
  const [editTireData, setEditTireData] = useState<any>(null);
  const [installTireModal, setInstallTireModal] = useState<{ tire: any; mode: 'install' | 'dismount'; vehicleId?: string; posicion?: string } | null>(null);
  const [retreadTireModal, setRetreadTireModal] = useState<{ tire: any; mode: 'send' | 'receive' } | null>(null);
  const [inspectionTire, setInspectionTire] = useState<any>(null);
  const [timelineTireId, setTimelineTireId] = useState<string | null>(null);
  const [axleMapVehicleId, setAxleMapVehicleId] = useState<string | null>(null);
  const [isExportingTires, setIsExportingTires] = useState(false);

  const qc = useQueryClient();

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', filterStatus],
    queryFn: () => maintenanceApi.getAll({ status: filterStatus || undefined, limit: 100 }).then((r) => r.data),
  });

  const { data: healthStats } = useQuery({
    queryKey: ['maintenance-health-stats'],
    queryFn: () => maintenanceApi.getHealthStats().then((r) => r.data),
  });

  const { data: upcoming } = useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: () => maintenanceApi.getUpcoming().then((r) => r.data),
  });

  const { data: costsByVehicle } = useQuery({
    queryKey: ['maintenance-costs-vehicle'],
    queryFn: () => maintenanceApi.getCosts().then((r) => r.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-fleet-health'],
    queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { data: spareParts, isLoading: isLoadingSpares } = useQuery({
    queryKey: ['spare-parts-inventory', spareCategory],
    queryFn: () => sparePartsApi.getAll({ categoria: spareCategory || undefined }).then((r) => r.data),
  });

  // Tires Queries
  const { data: tireKpis, isLoading: isLoadingTireKpis } = useQuery({
    queryKey: ['maintenance-tires-kpis'],
    queryFn: () => tiresApi.getKPIs().then((r) => r.data),
    enabled: activeTab === 'tires',
  });

  const { data: tiresData, isLoading: isLoadingTires } = useQuery({
    queryKey: ['maintenance-tires', tireSearch, tireStatus, tireTipo, tireVehicleId],
    queryFn: () =>
      tiresApi
        .getAll({
          search: tireSearch,
          status: tireStatus === 'CRITICO' ? undefined : tireStatus || undefined,
          minProfundidad: tireStatus === 'CRITICO' ? 3.0 : undefined,
          tipo: tireTipo || undefined,
          vehicleId: tireVehicleId || undefined,
          limit: 100,
        })
        .then((r) => r.data),
    enabled: activeTab === 'tires',
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => maintenanceApi.update(id, data),
    onSuccess: () => {
      toast.success('Orden de Trabajo actualizada');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['maintenance-health-stats'] });
      qc.invalidateQueries({ queryKey: ['spare-parts-inventory'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => maintenanceApi.create(data),
    onSuccess: () => {
      toast.success('Orden de Trabajo (OT) registrada exitosamente');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['maintenance-health-stats'] });
      qc.invalidateQueries({ queryKey: ['spare-parts-inventory'] });
      setShowModal(false);
      setEditData(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar OT'),
  });

  const createSpareMutation = useMutation({
    mutationFn: (data: any) => sparePartsApi.create(data),
    onSuccess: () => {
      toast.success('Artículo guardado en inventario');
      setSpareCategory('');
      setSpareSearch('');
      qc.invalidateQueries({ queryKey: ['spare-parts-inventory'] });
      setShowSpareModal(false);
      setEditSpareData(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar repuesto'),
  });

  const updateSpareMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => sparePartsApi.update(id, data),
    onSuccess: () => {
      toast.success('Repuesto actualizado');
      qc.invalidateQueries({ queryKey: ['spare-parts-inventory'] });
      setShowSpareModal(false);
      setEditSpareData(null);
    },
  });

  const deleteOTMutation = useMutation({
    mutationFn: (id: string) => maintenanceApi.remove(id),
    onSuccess: () => {
      toast.success('Orden de Trabajo eliminada');
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['maintenance-health-stats'] });
      qc.invalidateQueries({ queryKey: ['vehicles-fleet-health'] });
    },
  });

  const deleteSpareMutation = useMutation({
    mutationFn: (id: string) => sparePartsApi.remove(id),
    onSuccess: () => {
      toast.success('Repuesto eliminado');
      qc.invalidateQueries({ queryKey: ['spare-parts-inventory'] });
    },
  });

  const handleEdit = (ot: any) => {
    setEditData(ot);
    setShowModal(true);
  };

  const handleNewForVehicle = (vehicleId: string) => {
    setEditData({ vehicleId, tipo: 'PREVENTIVO', status: 'PENDIENTE' });
    setShowModal(true);
  };

  const handleExportTiresCSV = async () => {
    try {
      setIsExportingTires(true);
      const res = await tiresApi.exportReport({
        search: tireSearch,
        status: tireStatus === 'CRITICO' ? undefined : tireStatus || undefined,
        minProfundidad: tireStatus === 'CRITICO' ? 3.0 : undefined,
        tipo: tireTipo || undefined,
        vehicleId: tireVehicleId || undefined,
      });
      const rows = res.data;
      if (!rows || rows.length === 0) {
        toast.error('No hay datos de neumáticos para exportar');
        return;
      }

      const headers = Object.keys(rows[0]).join(',');
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers, ...rows.map((row: any) => Object.values(row).map((v) => `"${v}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `reporte_neumaticos_flota_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Reporte de neumáticos descargado exitosamente');
    } catch (err: any) {
      toast.error('Error al exportar reporte de neumáticos');
    } finally {
      setIsExportingTires(false);
    }
  };

  const filteredOrders = data?.data?.filter((m: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.numeroOT?.toLowerCase().includes(q) ||
      m.vehicle?.patente?.toLowerCase().includes(q) ||
      m.descripcion?.toLowerCase().includes(q) ||
      m.taller?.toLowerCase().includes(q)
    );
  });

  const filteredSpareParts = Array.isArray(spareParts)
    ? spareParts.filter((p: any) => {
        if (!spareSearch) return true;
        const q = spareSearch.toLowerCase();
        return (
          p.sku?.toLowerCase().includes(q) ||
          p.nombre?.toLowerCase().includes(q) ||
          p.ubicacion?.toLowerCase().includes(q) ||
          p.marcasCompatibles?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div>
      <Header
        title="Mantenimiento & Salud de Flota"
        subtitle="Gestión de Órdenes de Trabajo (OT), mantenimientos preventivos, inventario de repuestos y gestión de neumáticos"
        actions={
          activeTab === 'tires' ? (
            <button
              onClick={() => {
                setEditTireData(null);
                setShowTireModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Alta de Neumático
            </button>
          ) : activeTab === 'inventory' ? (
            <button
              onClick={() => {
                setEditSpareData(null);
                setShowSpareModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Nuevo Repuesto / Artículo
            </button>
          ) : (
            <button
              onClick={() => {
                setEditData(null);
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Nueva Orden de Trabajo (OT)
            </button>
          )
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Flota Operativa</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {healthStats?.operational || 0} <span className="text-sm font-normal text-slate-500">/ {healthStats?.totalVehicles || 0}</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vehículos en Taller</span>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {healthStats?.inMaintenance || 0}
              </h3>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">OTs Pendientes</span>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {healthStats?.pendingMaintenances || 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <div className="card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Costo Acumulado Taller</span>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatMoney(healthStats?.totalCost || 0)}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Órdenes de Trabajo (OT)
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'health'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Estado de Flota
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'costs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Análisis de Costos ($/Km)
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Inventario
            {Array.isArray(spareParts) && spareParts.some((p: any) => p.stockActual <= p.stockMinimo) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tires')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === 'tires'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CircleDot className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Tires (Gestión de Neumáticos)
            {tireKpis?.lowDepthAlertCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white font-extrabold text-[10px] rounded-full animate-pulse">
                {tireKpis.lowDepthAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por N° OT, patente, taller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Estado:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input py-1.5 text-xs font-semibold"
                >
                  <option value="">Todos los Estados</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN_CURSO">EN CURSO</option>
                  <option value="COMPLETADO">COMPLETADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">N° OT</th>
                      <th className="px-4 py-3 text-left">Vehículo</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Descripción / Trabajos</th>
                      <th className="px-4 py-3 text-left">Taller</th>
                      <th className="px-4 py-3 text-left">Fechas</th>
                      <th className="px-4 py-3 text-left">Costo Total</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500">
                          Cargando Órdenes de Trabajo...
                        </td>
                      </tr>
                    ) : !filteredOrders || filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500">
                          No se encontraron Órdenes de Trabajo
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ot: any) => {
                        const statusBadge = MAINTENANCE_STATUS_MAP[ot.status] || {
                          cls: 'badge-gray',
                          label: ot.status,
                        };
                        return (
                          <tr key={ot.id} className="table-row">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                              {ot.numeroOT}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {ot.vehicle?.patente}
                              </span>
                              <p className="text-xs text-slate-500">
                                {ot.vehicle?.marca} {ot.vehicle?.modelo}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`badge text-xs font-semibold ${
                                  ot.tipo === 'CORRECTO' || ot.tipo === 'CORRECTIVO'
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                }`}
                              >
                                {ot.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                                {ot.descripcion}
                              </p>
                              {ot.repuestosUtilizados && ot.repuestosUtilizados.length > 0 && (
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                                  Repuestos: {ot.repuestosUtilizados.map((r: any) => `${r.nombre} (x${r.cantidad})`).join(', ')}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                              {ot.taller || 'Taller Central'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              <p>Inicio: {formatDate(ot.fechaInicio)}</p>
                              {ot.fechaFin && <p>Fin: {formatDate(ot.fechaFin)}</p>}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              {formatMoney(ot.costoTotal)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={statusBadge.cls}>{statusBadge.label}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleEdit(ot)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                  title="Editar OT"
                                >
                                  <Wrench className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar la Orden de Trabajo ${ot.numeroOT}?`)) {
                                      deleteOTMutation.mutate(ot.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
                                  title="Eliminar OT"
                                >
                                  ✕
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
          </div>
        )}

        {/* TAB 2: HEALTH */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles?.map((v: any) => (
              <MaintenanceHealthCard
                key={v.id}
                vehicle={v}
                costData={costsByVehicle?.find((c: any) => c.vehicleId === v.id)}
                onNewOT={(vId) => handleNewForVehicle(vId)}
              />
            ))}
          </div>
        )}

        {/* TAB 3: COSTS */}
        {activeTab === 'costs' && (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
              Análisis de Costos Acumulados por Vehículo ($/Km)
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Patente / Vehículo</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Km Acumulados</th>
                  <th className="px-4 py-3 text-left">Total OTs Completadas</th>
                  <th className="px-4 py-3 text-left">Costo Mantenimiento ($)</th>
                  <th className="px-4 py-3 text-right">Costo / Km ($/Km)</th>
                </tr>
              </thead>
              <tbody>
                {costsByVehicle?.map((row: any) => {
                  const cpk = row.kilometraje > 0 ? row.costoTotal / row.kilometraje : 0;
                  return (
                    <tr key={row.vehicleId} className="table-row">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {row.patente}
                        <p className="text-xs text-slate-500 font-normal">{row.marca} {row.modelo}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {row.tipo}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {row.kilometraje?.toLocaleString() || 0} km
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        {row.totalOTs} OTs
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {formatMoney(row.costoTotal)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${cpk.toFixed(2)} / km
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por repuesto, SKU, marca..."
                  value={spareSearch}
                  onChange={(e) => setSpareSearch(e.target.value)}
                  className="input pl-9"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Categoría:</span>
                <select
                  value={spareCategory}
                  onChange={(e) => setSpareCategory(e.target.value)}
                  className="input py-1.5 text-xs font-semibold"
                >
                  <option value="">Todas las Categorías</option>
                  <option value="FILTROS">FILTROS</option>
                  <option value="ACEITES_LUBRICANTES">ACEITES Y LUBRICANTES</option>
                  <option value="FRENOS">FRENOS</option>
                  <option value="SUSPENSION_DIRECCION">SUSPENSIÓN Y DIRECCIÓN</option>
                  <option value="MOTOR_TRANSMISION">MOTOR Y TRANSMISIÓN</option>
                  <option value="SISTEMA_ELECTRICO">SISTEMA ELÉCTRICO</option>
                  <option value="NEUMATICOS_ACCESORIOS">NEUMÁTICOS Y ACCESORIOS</option>
                  <option value="ACCESORIOS_VARIOS">ACCESORIOS VARIOS</option>
                </select>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">SKU / Código</th>
                      <th className="px-4 py-3 text-left">Artículo / Repuesto</th>
                      <th className="px-4 py-3 text-left">Categoría</th>
                      <th className="px-4 py-3 text-left">Stock Actual</th>
                      <th className="px-4 py-3 text-left">Ubicación</th>
                      <th className="px-4 py-3 text-left">Precio Unitario</th>
                      <th className="px-4 py-3 text-left">Compatibilidad</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingSpares ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          Cargando inventario de repuestos...
                        </td>
                      </tr>
                    ) : filteredSpareParts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          No se encontraron artículos de repuestos
                        </td>
                      </tr>
                    ) : (
                      filteredSpareParts.map((spare: any) => {
                        const isLow = spare.stockActual <= spare.stockMinimo;
                        return (
                          <tr key={spare.id} className="table-row">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                              {spare.sku}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-white">{spare.nombre}</p>
                                  {spare.descripcion && (
                                    <p className="text-xs text-slate-500 line-clamp-1">{spare.descripcion}</p>
                                  )}
                                </div>
                                {spare.fotoUrl && (
                                  <button
                                    onClick={() => setPreviewImage(spare.fotoUrl)}
                                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Ver foto de referencia"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge badge-gray text-xs font-semibold">{spare.categoria}</span>
                            </td>
                            <td className="px-4 py-3 font-bold">
                              <span className={isLow ? 'text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-1' : 'text-slate-800 dark:text-slate-200'}>
                                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                                {spare.stockActual} {spare.unidadMedida || 'unid'}
                              </span>
                              {isLow && (
                                <p className="text-[10px] text-rose-500 font-normal">Mínimo: {spare.stockMinimo}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                              {spare.ubicacion || 'Depósito Central'}
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              {formatMoney(spare.precioUnitario)}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                              {spare.marcasCompatibles || 'Universal / Multimarca'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditSpareData(spare);
                                    setShowSpareModal(true);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                  title="Editar Repuesto"
                                >
                                  <Wrench className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar el artículo ${spare.nombre} (${spare.sku})?`)) {
                                      deleteSpareMutation.mutate(spare.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-colors"
                                  title="Eliminar Repuesto"
                                >
                                  ✕
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
          </div>
        )}

        {/* TAB 5: TIRES — GESTIÓN INTEGRAL DE NEUMÁTICOS */}
        {activeTab === 'tires' && (
          <div className="space-y-6 animate-fade-in">
            {/* Real-time Tire KPIs & CPK Metrics */}
            <TireKPIs kpis={tireKpis} isLoading={isLoadingTireKpis} />

            {/* Filter Bar */}
            <TireFilters
              search={tireSearch}
              onSearchChange={setTireSearch}
              status={tireStatus}
              onStatusChange={setTireStatus}
              tipo={tireTipo}
              onTipoChange={setTireTipo}
              vehicleId={tireVehicleId}
              onVehicleIdChange={setTireVehicleId}
              vehicles={vehicles}
              onOpenAxleMap={() => setAxleMapVehicleId(vehicles?.[0]?.id || '')}
              onExport={handleExportTiresCSV}
              isExporting={isExportingTires}
            />

            {/* Tire Cards Grid */}
            {isLoadingTires ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
                Cargando inventario de neumáticos...
              </div>
            ) : !tiresData?.data || tiresData.data.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <CircleDot className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-extrabold text-base text-slate-700 dark:text-slate-300">
                  No se encontraron neumáticos con los filtros seleccionados
                </p>
                <p className="text-xs text-slate-400">
                  Ajustá los criterios de búsqueda o registrá un nuevo neumático activo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiresData.data.map((tire: any) => (
                  <TireCard
                    key={tire.id}
                    tire={tire}
                    onInstall={(t) => setInstallTireModal({ tire: t, mode: 'install' })}
                    onDismount={(t) => setInstallTireModal({ tire: t, mode: 'dismount' })}
                    onRotate={(t) => setAxleMapVehicleId(t.vehicleId || vehicles?.[0]?.id)}
                    onRetread={(t) => setRetreadTireModal({ tire: t, mode: t.status === 'EN_RECAPADO' ? 'receive' : 'send' })}
                    onInspection={(t) => setInspectionTire(t)}
                    onViewHistory={(t) => setTimelineTireId(t.id)}
                    onEdit={(t) => { setEditTireData(t); setShowTireModal(true); }}
                    onShowQR={(t) => setTimelineTireId(t.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showModal && (
        <WorkOrderModal
          initialData={editData}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSave={(data) => {
            if (editData?.id) {
              updateMutation.mutate({ id: editData.id, ...data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}

      {showSpareModal && (
        <SparePartModal
          initialData={editSpareData}
          vehicles={vehicles}
          onClose={() => {
            setShowSpareModal(false);
            setEditSpareData(null);
          }}
          onSave={(data) => {
            if (editSpareData?.id) {
              updateSpareMutation.mutate({ id: editSpareData.id, ...data });
            } else {
              createSpareMutation.mutate(data);
            }
          }}
        />
      )}

      {/* Tires Submodule Modals */}
      {showTireModal && (
        <TireModal
          tire={editTireData}
          onClose={() => {
            setShowTireModal(false);
            setEditTireData(null);
          }}
        />
      )}

      {installTireModal && (
        <TireInstallModal
          tire={installTireModal.tire}
          vehicles={vehicles}
          mode={installTireModal.mode}
          initialPosition={installTireModal.posicion}
          initialVehicleId={installTireModal.vehicleId}
          onClose={() => setInstallTireModal(null)}
        />
      )}

      {retreadTireModal && (
        <TireRetreadModal
          tire={retreadTireModal.tire}
          mode={retreadTireModal.mode}
          onClose={() => setRetreadTireModal(null)}
        />
      )}

      {inspectionTire && (
        <TireInspectionModal
          tire={inspectionTire}
          onClose={() => setInspectionTire(null)}
        />
      )}

      {timelineTireId && (
        <TireTimelineModal
          tireId={timelineTireId}
          onClose={() => setTimelineTireId(null)}
        />
      )}

      {axleMapVehicleId && (
        <VehicleAxleMapModal
          vehicles={vehicles}
          initialVehicleId={axleMapVehicleId}
          onClose={() => setAxleMapVehicleId(null)}
          onMountTire={(vId, pos) => {
            const unassignedTire = tiresData?.data?.find((t: any) => t.status === 'EN_DEPOSITO');
            if (unassignedTire) {
              setAxleMapVehicleId(null);
              setInstallTireModal({ tire: unassignedTire, mode: 'install', vehicleId: vId, posicion: pos });
            } else {
              toast.error('No hay neumáticos en depósito para montar. Registre o desmonte uno primero.');
            }
          }}
        />
      )}

      {previewImage && (
        <div className="modal-overlay z-50" onClick={() => setPreviewImage(null)}>
          <div className="modal max-w-xl p-4 flex flex-col items-center gap-4 relative animate-fade-in">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Foto de Referencia del Repuesto</h3>
            <img
              src={previewImage}
              alt="Repuesto"
              className="max-h-[70vh] rounded-xl object-contain border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
