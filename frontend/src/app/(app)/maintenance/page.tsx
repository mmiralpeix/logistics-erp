'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, vehiclesApi, sparePartsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney, MAINTENANCE_STATUS_MAP } from '@/lib/utils';
import { Plus, Wrench, AlertTriangle, CheckCircle2, ShieldAlert, DollarSign, Activity, FileText, Search, Package, Layers, Image as ImageIcon } from 'lucide-react';
import { WorkOrderModal } from '@/components/maintenance/WorkOrderModal';
import { MaintenanceHealthCard } from '@/components/maintenance/MaintenanceHealthCard';
import { SparePartModal } from '@/components/maintenance/SparePartModal';
import toast from 'react-hot-toast';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'health' | 'costs' | 'inventory'>('orders');
  const [showModal, setShowModal] = useState(false);
  const [showSpareModal, setShowSpareModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [editSpareData, setEditSpareData] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [spareCategory, setSpareCategory] = useState('');
  const [spareSearch, setSpareSearch] = useState('');

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
    onSuccess: (res: any) => {
      toast.success('Repuesto guardado en Pañol');
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
        subtitle="Gestión de Órdenes de Trabajo (OT), mantenimientos preventivos y salud de vehículos"
        actions={
          <button
            onClick={() => {
              setEditData(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Nueva Orden de Trabajo (OT)
          </button>
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Órdenes de Trabajo (OT)
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'health'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Estado de Flota
          </button>

          <button
            onClick={() => setActiveTab('costs')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'costs'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Análisis de Costos ($/Km)
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Pañol & Stock Repuestos
            {Array.isArray(spareParts) && spareParts.some((p: any) => p.stockActual <= p.stockMinimo) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
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
                  placeholder="Buscar por N° OT, Patente, Taller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9 text-sm w-full"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input w-full sm:w-52 text-sm"
              >
                <option value="">Todos los estados</option>
                {Object.entries(MAINTENANCE_STATUS_MAP).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">N° OT</th>
                    <th className="px-4 py-3 text-left">Vehículo</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Trabajos / Descripción</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Taller / Proveedor</th>
                    <th className="px-4 py-3 text-left">Costo Total</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500">
                        Cargando Órdenes de Trabajo...
                      </td>
                    </tr>
                  ) : filteredOrders?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-500">
                        No se encontraron registros de mantenimiento.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders?.map((m: any) => {
                      const st = MAINTENANCE_STATUS_MAP[m.status] || { label: m.status, cls: 'badge-gray' };
                      return (
                        <tr key={m.id} className="table-row">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
                              {m.numeroOT || 'OT-MANUAL'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 dark:text-white">{m.vehicle?.patente}</p>
                            <p className="text-xs text-slate-500">{m.vehicle?.marca} {m.vehicle?.modelo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={m.tipo === 'PREVENTIVO' ? 'badge badge-blue' : 'badge badge-yellow'}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 dark:text-slate-300 font-medium max-w-xs truncate">
                              {m.descripcion}
                            </p>
                            {m.items && m.items.length > 0 && (
                              <p className="text-[11px] text-slate-500">
                                {m.items.length} repuesto(s) registrado(s)
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={m.status}
                              onChange={(e) => updateMutation.mutate({ id: m.id, status: e.target.value })}
                              className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 font-medium text-slate-800 dark:text-slate-200"
                            >
                              {Object.entries(MAINTENANCE_STATUS_MAP).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                            {m.taller || 'Taller Central'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {formatMoney(m.costoTotal)}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => handleEdit(m)}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar Orden de Trabajo ${m.numeroOT || ''}?`)) {
                                  deleteOTMutation.mutate(m.id);
                                }
                              }}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: HEALTH STATUS */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles?.map((v: any) => {
              const costData = costsByVehicle?.find((c: any) => c.vehicleId === v.id);
              return (
                <MaintenanceHealthCard
                  key={v.id}
                  vehicle={v}
                  costData={costData}
                  onNewOT={handleNewForVehicle}
                />
              );
            })}
          </div>
        )}

        {/* TAB 3: COSTS */}
        {activeTab === 'costs' && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Patente</th>
                  <th className="px-4 py-3 text-left">Vehículo</th>
                  <th className="px-4 py-3 text-left">Kilometraje Odómetro</th>
                  <th className="px-4 py-3 text-left">Costo Mantenimiento Acumulado</th>
                  <th className="px-4 py-3 text-left">Costo Promedio por KM ($/Km)</th>
                </tr>
              </thead>
              <tbody>
                {costsByVehicle?.map((c: any) => (
                  <tr key={c.vehicleId} className="table-row">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {c.vehicle?.patente}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {c.vehicle?.marca} {c.vehicle?.modelo}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-300">
                      {(c.vehicle?.kilometraje || 0).toLocaleString('es-AR')} km
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {formatMoney(c._sum?.costoTotal || 0)}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400">
                      ${c.costPerKm || 0} / km
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: INVENTORY / PAÑOL */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar repuesto, SKU, marca..."
                    value={spareSearch}
                    onChange={(e) => setSpareSearch(e.target.value)}
                    className="input pl-9 text-sm w-full"
                  />
                </div>

                <select
                  value={spareCategory}
                  onChange={(e) => setSpareCategory(e.target.value)}
                  className="input w-44 text-sm"
                >
                  <option value="">Todas las categorías</option>
                  <option value="FILTROS">Filtros</option>
                  <option value="LUBRICANTES">Lubricantes</option>
                  <option value="FRENOS">Frenos</option>
                  <option value="NEUMATICOS">Neumáticos</option>
                  <option value="CORREAS">Correas</option>
                  <option value="SISTEMA_ELECTRICO">Sistema Eléctrico</option>
                  <option value="VALVULAS_CISTERNA">Válvulas Cisterna</option>
                  <option value="SUSPENSION">Suspensión</option>
                  <option value="VARIOS">Varios</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditSpareData(null);
                  setShowSpareModal(true);
                }}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> Nuevo Repuesto en Pañol
              </button>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Foto</th>
                    <th className="px-4 py-3 text-left">SKU</th>
                    <th className="px-4 py-3 text-left">Repuesto / Insumo</th>
                    <th className="px-4 py-3 text-left">Categoría</th>
                    <th className="px-4 py-3 text-left">Stock Actual</th>
                    <th className="px-4 py-3 text-left">Ubicación</th>
                    <th className="px-4 py-3 text-left">Compatibilidad</th>
                    <th className="px-4 py-3 text-left">Precio Unitario</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingSpares ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        Cargando inventario de Pañol...
                      </td>
                    </tr>
                  ) : filteredSpareParts?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        No se encontraron repuestos en Pañol.
                      </td>
                    </tr>
                  ) : (
                    filteredSpareParts?.map((p: any) => {
                      const isLowStock = p.stockActual <= p.stockMinimo;
                      return (
                        <tr key={p.id} className="table-row">
                          <td className="px-4 py-3">
                            {p.imagenUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(p.imagenUrl)}
                                className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:scale-105 transition-transform"
                                title="Haga clic para ampliar foto de referencia"
                              >
                                <img
                                  src={p.imagenUrl}
                                  alt={p.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              </button>
                            ) : (
                              <div className="w-10 h-10 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                <ImageIcon className="w-4 h-4 opacity-50" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {p.sku}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white">{p.nombre}</p>
                            {p.notas && <p className="text-xs text-slate-500">{p.notas}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge badge-gray">{p.categoria}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  isLowStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {p.stockActual} u.
                              </span>
                              {isLowStock && (
                                <span className="badge badge-red flex items-center gap-1 text-[10px]">
                                  <AlertTriangle className="w-3 h-3" /> Bajo Stock (Mín: {p.stockMinimo})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                            {p.ubicacion || 'Depósito Principal'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="badge badge-blue text-[11px] font-mono">
                                {p.marcasCompatibles || 'TODAS LAS MARCAS'}
                              </span>
                              {p.tipoEnganche && p.tipoEnganche !== 'TODOS' && (
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  Enganche: {p.tipoEnganche}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                            {formatMoney(p.precioUnitario)}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditSpareData(p);
                                setShowSpareModal(true);
                              }}
                              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar repuesto ${p.sku} (${p.nombre})?`)) {
                                  deleteSpareMutation.mutate(p.id);
                                }
                              }}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
