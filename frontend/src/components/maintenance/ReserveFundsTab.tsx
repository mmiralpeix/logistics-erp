'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reserveFundsApi, vehiclesApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import {
  Wrench,
  CircleDot,
  Coins,
  TrendingUp,
  Settings,
  AlertTriangle,
  Award,
  ArrowUpRight,
  X,
  Save,
  Search,
  Plus,
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

export function ReserveFundsTab() {
  const queryClient = useQueryClient();
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Selected Asset Ledger State
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [searchVehicle, setSearchVehicle] = useState<string>('');

  // Manual Adjustment Form State
  const [manualVehicleId, setManualVehicleId] = useState('');
  const [manualFundType, setManualFundType] = useState<'MAINTENANCE' | 'TIRES'>('MAINTENANCE');
  const [manualMonto, setManualMonto] = useState<number | ''>('');
  const [manualConcepto, setManualConcepto] = useState('');

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

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-list-funds'],
    queryFn: async () => {
      const res = await vehiclesApi.getAll({ limit: 100 });
      return res.data.data || [];
    },
  });

  const { data: assetSummary, isLoading: isLoadingAssetSummary } = useQuery({
    queryKey: ['asset-reserve-funds-tab', selectedVehicleId],
    queryFn: async () => {
      if (!selectedVehicleId) return null;
      const res = await reserveFundsApi.getAssetSummary(selectedVehicleId);
      return res.data;
    },
    enabled: !!selectedVehicleId,
  });

  // Config Form State
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

  const manualAdjustmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await reserveFundsApi.manualAdjustment(payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ajuste manual registrado exitosamente');
      setIsManualModalOpen(false);
      setManualMonto('');
      setManualConcepto('');
      queryClient.invalidateQueries({ queryKey: ['reserve-funds-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['asset-reserve-funds-tab', selectedVehicleId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al registrar ajuste manual');
    },
  });

  const handleOpenConfigModal = () => {
    if (configData) {
      setPctMaint(configData.pctMaintenance || 13);
      setPctTires(configData.pctTires || 11);
      if (configData.vehicleTypeWeights) setWeights(configData.vehicleTypeWeights);
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

  const handleSaveManualAdjustment = () => {
    if (!manualVehicleId || !manualMonto || !manualConcepto) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    manualAdjustmentMutation.mutate({
      vehicleId: manualVehicleId,
      fundType: manualFundType,
      monto: Number(manualMonto),
      concepto: manualConcepto,
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
      {/* Top Action Bar inside Maintenance */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            Sistema de Fondos de Reserva por Unidad
          </h3>
          <p className="text-xs text-slate-500">
            Fondos provisionados automáticos por viaje finalizado (13% Mantenimiento / 11% Neumáticos)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>Ajuste Manual Auditable</span>
          </button>

          <button
            onClick={handleOpenConfigModal}
            className="btn btn-secondary flex items-center gap-2 text-xs"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span>Configurar Porcentajes y Pesos</span>
          </button>
        </div>
      </div>

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
            <span>Reserva disponible taller</span>
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
            <span>Gasto supera la reserva provisionada</span>
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

          <div className="h-[300px] w-full pt-4">
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
                  onClick={() => setSelectedVehicleId(item.vehicle.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-blue-500 transition-colors"
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

      {/* Asset Explorer & Account Ledger Section */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" />
              Consulta de Cuenta Corriente por Unidad
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona una unidad para inspeccionar su extracto bancario de reserva y movimientos de OT
            </p>
          </div>

          <div className="w-full sm:w-72">
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="input w-full"
            >
              <option value="">-- Seleccionar Equipo de Flota --</option>
              {(vehicles || []).map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.patente} - {v.marca} {v.modelo} ({v.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedVehicleId && assetSummary && (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Account Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4 border-l-4 border-l-blue-600 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-500 block uppercase">🛠️ Fondo Mantenimiento</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
                  {formatMoney(assetSummary.maintenanceFund?.availableBalance || 0)}
                </span>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Acumulado: <strong>{formatMoney(assetSummary.maintenanceFund?.accumulatedTotal || 0)}</strong></span>
                  <span>Gastado: <strong className="text-red-500">{formatMoney(assetSummary.maintenanceFund?.spentTotal || 0)}</strong></span>
                </div>
              </div>

              <div className="card p-4 border-l-4 border-l-purple-600 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-bold text-slate-500 block uppercase">🛞 Fondo Neumáticos</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white block mt-1">
                  {formatMoney(assetSummary.tiresFund?.availableBalance || 0)}
                </span>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>Acumulado: <strong>{formatMoney(assetSummary.tiresFund?.accumulatedTotal || 0)}</strong></span>
                  <span>Gastado: <strong className="text-red-500">{formatMoney(assetSummary.tiresFund?.spentTotal || 0)}</strong></span>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-left">Fondo</th>
                    <th className="p-3 text-left">Concepto / Referencia</th>
                    <th className="p-3 text-right">Monto ($)</th>
                    <th className="p-3 text-right">Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody>
                  {(assetSummary.transactions || []).map((tx: any) => (
                    <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          tx.fundType === 'MAINTENANCE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                        }`}>
                          {tx.fundType === 'MAINTENANCE' ? '🛠️ MANTENIMIENTO' : '🛞 NEUMÁTICOS'}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{tx.concepto}</p>
                        {tx.referenceNumber && (
                          <span className="text-[10px] font-mono text-slate-400">Ref: {tx.referenceNumber}</span>
                        )}
                      </td>
                      <td className={`p-3 text-right font-black ${tx.monto > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tx.monto > 0 ? `+${formatMoney(tx.monto)}` : formatMoney(tx.monto)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                        {formatMoney(tx.saldoPosterior)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Config Modal */}
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
                Si un viaje incluye varios equipos, el fondo generado se reparte proporcionalmente según sus pesos.
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

      {/* Manual Adjustment Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                Ajuste Manual de Fondo de Reserva
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seleccionar Equipo de Flota *
              </label>
              <select
                value={manualVehicleId}
                onChange={(e) => setManualVehicleId(e.target.value)}
                className="input w-full text-xs"
              >
                <option value="">-- Seleccionar Equipo --</option>
                {(vehicles || []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.patente} - {v.marca} {v.modelo} ({v.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Fondo *
                </label>
                <select
                  value={manualFundType}
                  onChange={(e) => setManualFundType(e.target.value as any)}
                  className="input w-full text-xs"
                >
                  <option value="MAINTENANCE">🛠️ Mantenimiento</option>
                  <option value="TIRES">🛞 Neumáticos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto ($) *
                </label>
                <input
                  type="number"
                  step="100"
                  placeholder="Ej: 50000 o -25000"
                  value={manualMonto}
                  onChange={(e) => setManualMonto(e.target.value ? Number(e.target.value) : '')}
                  className="input w-full text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Positivo (+) crédito, negativo (-) débito</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Concepto / Motivo de Auditoría *
              </label>
              <input
                type="text"
                placeholder="Ej: Ajuste de saldo inicial por auditoría de saldo"
                value={manualConcepto}
                onChange={(e) => setManualConcepto(e.target.value)}
                className="input w-full text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="btn btn-secondary text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveManualAdjustment}
                disabled={manualAdjustmentMutation.isPending}
                className="btn btn-primary text-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Registrar Ajuste</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
