'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, vehiclesApi, driversApi, usersApi, tiresApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { LayoutGrid, Settings2, RotateCcw, Plus, Check, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// Widget System & Registry
import { UserWidgetItem, DEFAULT_DASHBOARD_LAYOUT } from '@/lib/dashboard-widgets.registry';
import { DashboardGlobalFilters, GlobalFilterState } from '@/components/dashboard/DashboardGlobalFilters';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { AddWidgetModal } from '@/components/dashboard/AddWidgetModal';

// Specialized Widgets
import { WidgetKpiCard } from '@/components/dashboard/widgets/WidgetKpiCard';
import { WidgetChartMonthly } from '@/components/dashboard/widgets/WidgetChartMonthly';
import { WidgetChartFuel } from '@/components/dashboard/widgets/WidgetChartFuel';
import { WidgetChartDistribution } from '@/components/dashboard/widgets/WidgetChartDistribution';
import { WidgetListTrips } from '@/components/dashboard/widgets/WidgetListTrips';
import { WidgetListAlerts } from '@/components/dashboard/widgets/WidgetListAlerts';
import { WidgetListTires } from '@/components/dashboard/widgets/WidgetListTires';
import { WidgetListDriverSchedules } from '@/components/dashboard/widgets/WidgetListDriverSchedules';
import { WidgetQuickReports } from '@/components/dashboard/widgets/WidgetQuickReports';

export default function DashboardPage() {
  const qc = useQueryClient();

  // Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Global Filters State
  const [filters, setFilters] = useState<GlobalFilterState>({
    dateRange: 'this_month',
    vehicleId: '',
    driverId: '',
    project: '',
  });

  // User Dashboard Config Layout State
  const [userWidgets, setUserWidgets] = useState<UserWidgetItem[]>(DEFAULT_DASHBOARD_LAYOUT);

  // Queries
  const { data: userConfig } = useQuery({
    queryKey: ['user-dashboard-config'],
    queryFn: () => usersApi.getDashboardConfig().then((r) => r.data),
  });

  useEffect(() => {
    if (userConfig && Array.isArray(userConfig) && userConfig.length > 0) {
      setUserWidgets(userConfig);
    } else {
      const local = localStorage.getItem('user_dashboard_layout');
      if (local) {
        try {
          setUserWidgets(JSON.parse(local));
        } catch {
          setUserWidgets(DEFAULT_DASHBOARD_LAYOUT);
        }
      }
    }
  }, [userConfig]);

  const saveConfigMutation = useMutation({
    mutationFn: (config: UserWidgetItem[]) => usersApi.updateDashboardConfig(config),
    onSuccess: () => {
      toast.success('Configuración de Dashboard guardada');
      qc.invalidateQueries({ queryKey: ['user-dashboard-config'] });
    },
  });

  const handleUpdateWidgets = (updated: UserWidgetItem[]) => {
    setUserWidgets(updated);
    localStorage.setItem('user_dashboard_layout', JSON.stringify(updated));
  };

  const handleSaveEdit = () => {
    saveConfigMutation.mutate(userWidgets);
    setIsEditing(false);
  };

  const handleResetLayout = () => {
    if (confirm('¿Restablecer el Dashboard al diseño predeterminado?')) {
      setUserWidgets(DEFAULT_DASHBOARD_LAYOUT);
      localStorage.removeItem('user_dashboard_layout');
      saveConfigMutation.mutate(DEFAULT_DASHBOARD_LAYOUT);
      toast.success('Dashboard restablecido');
    }
  };

  const handleAddWidget = (widgetType: string) => {
    const existingIndex = userWidgets.findIndex((w) => w.widgetType === widgetType);
    if (existingIndex !== -1) {
      const updated = userWidgets.map((w, idx) => (idx === existingIndex ? { ...w, visible: true } : w));
      handleUpdateWidgets(updated);
    } else {
      const newWidget: UserWidgetItem = {
        id: `w-${Date.now()}`,
        widgetType,
        width: widgetType.startsWith('kpi-') ? '1col' : widgetType === 'quick-reports' ? 'full' : '2col',
        order: userWidgets.length + 1,
        visible: true,
      };
      handleUpdateWidgets([...userWidgets, newWidget]);
    }
    toast.success('Widget añadido al Dashboard');
    setShowAddModal(false);
  };

  // Queries for Data
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => dashboardApi.getStats().then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: monthlyChart } = useQuery({
    queryKey: ['monthly-chart', filters],
    queryFn: () => dashboardApi.getMonthlyChart().then((r) => r.data),
  });

  const { data: vehicleConsumption } = useQuery({
    queryKey: ['vehicle-consumption-chart', filters],
    queryFn: () => dashboardApi.getVehicleConsumptionChart().then((r) => r.data),
  });

  const { data: recentTrips } = useQuery({
    queryKey: ['recent-trips', filters],
    queryFn: () => dashboardApi.getRecentTrips(8).then((r) => r.data),
  });

  const { data: expiringAlerts } = useQuery({
    queryKey: ['expiring-alerts'],
    queryFn: () => dashboardApi.getExpiringAlerts().then((r) => r.data),
  });

  const { data: tripDistribution } = useQuery({
    queryKey: ['trip-distribution', filters],
    queryFn: () => dashboardApi.getTripDistribution().then((r) => r.data),
  });

  const { data: tireKpis } = useQuery({
    queryKey: ['dashboard-tires-kpis'],
    queryFn: () => tiresApi.getKPIs().then((r) => r.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['dashboard-vehicles'],
    queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { data: drivers } = useQuery({
    queryKey: ['dashboard-drivers'],
    queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Cargando dashboard inteligente...</p>
        </div>
      </div>
    );
  }

  // Children Map mapping each widgetType to its React Node
  const childrenMap: Record<string, React.ReactNode> = {
    'kpi-fleet': <WidgetKpiCard type="kpi-fleet" stats={stats} />,
    'kpi-trips': <WidgetKpiCard type="kpi-trips" stats={stats} />,
    'kpi-revenue': <WidgetKpiCard type="kpi-revenue" stats={stats} />,
    'kpi-alerts': <WidgetKpiCard type="kpi-alerts" stats={stats} />,
    'kpi-drivers': <WidgetKpiCard type="kpi-drivers" stats={stats} />,
    'kpi-tires': <WidgetKpiCard type="kpi-tires" tireKpis={tireKpis} />,
    'kpi-fuel': <WidgetKpiCard type="kpi-fuel" stats={stats} />,
    'kpi-maintenance': <WidgetKpiCard type="kpi-maintenance" stats={stats} />,
    'chart-monthly-revenue': <WidgetChartMonthly monthlyChart={monthlyChart} />,
    'chart-fuel-consumption': <WidgetChartFuel vehicleConsumption={vehicleConsumption} />,
    'chart-trip-distribution': <WidgetChartDistribution tripDistribution={tripDistribution} />,
    'list-recent-trips': <WidgetListTrips trips={recentTrips} />,
    'list-expiring-alerts': <WidgetListAlerts alerts={expiringAlerts} />,
    'list-critical-tires': <WidgetListTires />,
    'list-driver-schedules': <WidgetListDriverSchedules />,
    'quick-reports': <WidgetQuickReports />,
  };

  return (
    <div>
      <Header
        title="Dashboard Inteligente Configurable"
        subtitle={`Espacio gerencial personalizable • Actualizado: ${new Date().toLocaleString('es-AR', {
          timeStyle: 'short',
          dateStyle: 'short',
        })}`}
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Añadir Widget
                </button>
                <button
                  type="button"
                  onClick={handleResetLayout}
                  className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
                  title="Restablecer disposición por defecto"
                >
                  <RotateCcw className="w-4 h-4" /> Restablecer
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
              >
                <Settings2 className="w-4 h-4" /> Editar Dashboard
              </button>
            )}
          </div>
        }
      />

      <div className="p-3 md:p-6 space-y-6">
        {/* Global Filters Component */}
        <DashboardGlobalFilters
          filters={filters}
          onChange={setFilters}
          vehicles={vehicles}
          drivers={drivers}
          onReset={() =>
            setFilters({
              dateRange: 'this_month',
              vehicleId: '',
              driverId: '',
              project: '',
            })
          }
        />

        {/* Dynamic Editable Dashboard Grid */}
        <DashboardGrid
          widgets={userWidgets}
          isEditing={isEditing}
          onUpdateWidgets={handleUpdateWidgets}
          onOpenAddModal={() => setShowAddModal(true)}
          childrenMap={childrenMap}
        />
      </div>

      {/* Add Widget Catalog Modal */}
      {showAddModal && (
        <AddWidgetModal
          currentWidgets={userWidgets}
          onAddWidget={handleAddWidget}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
