'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reserveFundsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney } from '@/lib/utils';
import {
  Wrench,
  CircleDot,
  Coins,
  TrendingUp,
  Settings,
  AlertTriangle,
  Award,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';

export default function ReserveFundsDashboardPage() {
  const queryClient = useQueryClient();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Queries
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['reserve-funds-dashboard'],
    queryFn: async () => {
      const res = await reserveFundsApi.getDashboard();
      return res.data;
    },
  });

  const { data: configData } = useQuery({
    queryKey: ['reserve-funds-config'],
    queryFn: async () => {
      const res = await reserveFundsApi.getConfig();
      return res.data;
    },
  });

  // Config State
  const [pctMaint, setPctMaint] = useState(13);
  const [pctTires, setPctTires] = useState(11);
  const [weights, setWeights] = useState<Record<string, number>>({
    TRACTOR: 50,
    CAMION: 50,
    SEMIRREMOLQUE: 30,
    CISTERNA: 30,
    SEMI_CISTERNA: 30,
    CARRETON: 30,
    BATEA: 30,
    DOLLY: 15,
    ACOPLADO: 20,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await reserveFundsApi.updateConfig(payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Configuración de Fondos de Reserva actualizada');
      setIsConfigModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['reserve-funds-config'] });
      queryClient.invalidateQueries({ queryKey: ['reserve-funds-dashboard'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al guardar configuración');
    },
  });

  const handleOpenConfigModal = () => {
    if (configData) {
      setPctMaint(configData.pctMaintenance || 13);
      setPctTires(configData.pctTires || 11);
      if (configData.vehicleTypeWeights) {
        setWeights(configData.vehicleTypeWeights);
      }
    }
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      pctMaintenance: Number(pctMaint),
      pctTires: Number(pctTires),
      vehicleTypeWeights: weights,
    });
  };

  const kpis = dashboardData?.kpis || {
    totalMaintAccumulated: 0,
    totalMaintSpent: 0,
    totalMaintAvailable: 0,
    totalTiresAccumulated: 0,
    totalTiresSpent: 0,
    totalTiresAvailable: 0,
    grandTotalAvailable: 0,
  };

  const rankings = dashboardData?.rankings || {
    topFunded: [],
    topSpenders: [],
    deficitUnits: [],
  };

  const monthlyEvolution = dashboardData?.monthlyEvolution || [];

  return (
    <div className="space-y-6">
      <Header
        title="Fondos de Reserva por Unidad"
        subtitle="Monitoreo financiero del dinero reservado por viajes para mantenimiento y neumáticos"
        actions={
          <button
            onClick={handleOpenConfigModal}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span>Configurar Porcentajes y Pesos</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fondo Mantenimiento */}
        <div className="card p-5 border-l-4 border-l-blue-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                🛠️ Fondo Mantenimiento (13%)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatMoney(kpis.totalMaintAvailable)}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Acumulado: <strong className="text-slate-700 dark:text-slate-300">{formatMoney(kpis.totalMaintAccumulated)}</strong></span>
            <span>Gastado: <strong className="text-red-500">{formatMoney(kpis.totalMaintSpent)}</strong></span>
          </div>
        </div>

        {/* Card 2: Fondo Neumáticos */}
        <div className="card p-5 border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                🛞 Fondo Neumáticos (11%)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatMoney(kpis.totalTiresAvailable)}
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <CircleDot className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Acumulado: <strong className="text-slate-700 dark:text-slate-300">{formatMoney(kpis.totalTiresAccumulated)}</strong></span>
            <span>Gastado: <strong className="text-red-500">{formatMoney(kpis.totalTiresSpent)}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Disponible Global */}
        <div className="card p-5 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                💰 Disponible Global Flota
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(kpis.grandTotalAvailable)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <span>Reserva líquida para imprevistos</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Positivo
            </span>
          </div>
        </div>

        {/* Card 4: Unidades en Déficit */}
        <div className="card p-5 border-l-4 border-l-amber-500 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ⚠️ Unidades en Déficit
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {rankings.deficitUnits.length} Equipo(s)
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Gasto supera la reserva acumulada</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Chart + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Evolution Chart */}
        <div className="lg:col-span-2 card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Evolución Mensual de Fondos de Reserva
              </h3>
              <p className="text-xs text-slate-500">
                Acreditaciones por viajes vs. Egresos por mantenimientos y cambio de neumáticos
              </p>
            </div>
          </div>

          <div className="h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: any) => formatMoney(Number(val))}
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos (Viajes)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresosMantenimiento" name="Egresos Mantenimiento" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresosNeumaticos" name="Egresos Neumáticos" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Top Funded Units Ranking */}
        <div className="card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Top 5 Unidades con Mayor Saldo
          </h3>
          <div className="space-y-3">
            {rankings.topFunded.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No hay unidades registradas aún.</p>
            ) : (
              rankings.topFunded.map((item: any, idx: number) => (
                <div
                  key={item.vehicle.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.vehicle.patente}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.vehicle.marca} {item.vehicle.modelo} ({item.vehicle.tipo})
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(item.totalAvailable)}
                    </p>
                    <p className="text-[10px] text-slate-500">Disponible</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Configurar Porcentajes y Pesos de Fondos
                </h3>
                <p className="text-xs text-slate-500">
                  Establece los porcentajes globales asignados por viaje y el peso de distribución por tipo de equipo
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Global Percentages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🛠️ Porcentaje Fondo Mantenimiento (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={pctMaint}
                  onChange={(e) => setPctMaint(Number(e.target.value))}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  🛞 Porcentaje Fondo Neumáticos (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={pctTires}
                  onChange={(e) => setPctTires(Number(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Allocation Weights by Vehicle Type */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pesos de Distribución por Tipo de Equipo (Ponderación)
              </h4>
              <p className="text-xs text-slate-500">
                Si un viaje incluye varios equipos, el fondo generado se reparte proporcionalmente según la suma de sus pesos.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {Object.entries(weights).map(([typeKey, weightVal]) => (
                  <div key={typeKey} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                      {typeKey}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={weightVal}
                        onChange={(e) =>
                          setWeights({
                            ...weights,
                            [typeKey]: Number(e.target.value),
                          })
                        }
                        className="input text-xs py-1 px-2 w-full"
                      />
                      <span className="text-xs text-slate-500 font-semibold">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configuración</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
