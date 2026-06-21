'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney, formatDate, TRIP_STATUS_MAP, VEHICLE_STATUS_MAP } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Truck, Users, MapPin, DollarSign, AlertTriangle, TrendingUp, Fuel, Wrench, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardApi.getStats().then((r) => r.data), refetchInterval: 60000 });
  const { data: monthlyChart } = useQuery({ queryKey: ['monthly-chart'], queryFn: () => dashboardApi.getMonthlyChart().then((r) => r.data) });
  const { data: recentTrips } = useQuery({ queryKey: ['recent-trips'], queryFn: () => dashboardApi.getRecentTrips(8).then((r) => r.data) });
  const { data: expiringAlerts } = useQuery({ queryKey: ['expiring-alerts'], queryFn: () => dashboardApi.getExpiringAlerts().then((r) => r.data) });
  const { data: tripDistribution } = useQuery({ queryKey: ['trip-distribution'], queryFn: () => dashboardApi.getTripStatusDistribution().then((r) => r.data) });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400">Cargando dashboard...</p>
      </div>
    </div>
  );

  const totalAlerts = (expiringAlerts?.vehicles?.length || 0) + (expiringAlerts?.drivers?.length || 0);

  return (
    <div>
      <Header
        title="Dashboard Ejecutivo"
        subtitle={`Actualizado: ${new Date().toLocaleString('es-AR', { timeStyle: 'short', dateStyle: 'short' })}`}
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Truck className="w-5 h-5 text-blue-400" />}
            label="Flota Total"
            value={stats?.fleet?.total || 0}
            sub={`${stats?.fleet?.available || 0} disponibles · ${stats?.fleet?.inTrip || 0} en viaje`}
            color="blue"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5 text-green-400" />}
            label="Viajes Activos"
            value={stats?.trips?.active || 0}
            sub={`${stats?.trips?.pending || 0} programados pendientes`}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-yellow-400" />}
            label="Facturación Mes"
            value={formatMoney(stats?.financial?.monthlyRevenue)}
            sub={`Margen: ${stats?.financial?.grossMarginPct || 0}%`}
            color="yellow"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            label="Alertas"
            value={totalAlerts}
            sub={`${stats?.alerts?.pendingMaintenances || 0} mantenimientos pendientes`}
            color="red"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-purple-400" />}
            label="Conductores"
            value={stats?.drivers?.total || 0}
            sub="Activos en sistema"
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            label="Viajes Completados"
            value={stats?.trips?.completedThisMonth || 0}
            sub="Este mes"
            color="green"
          />
          <StatCard
            icon={<Fuel className="w-5 h-5 text-orange-400" />}
            label="Combustible Mes"
            value={formatMoney(stats?.financial?.monthlyFuelCost)}
            sub={`${(stats?.financial?.monthlyFuelLiters || 0).toLocaleString('es-AR')} litros`}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
            label="Utilización Flota"
            value={`${stats?.fleet?.utilizationRate || 0}%`}
            sub="Vehículos activos / total"
            color="cyan"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 card p-5">
            <h3 className="section-title mb-4">Facturación y Viajes (últimos 6 meses)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyChart || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mes" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#F1F5F9' }}
                  formatter={(v: any) => [formatMoney(v), '']}
                />
                <Area type="monotone" dataKey="facturacion" stroke="#2563EB" fill="url(#colorRev)" name="Facturación" strokeWidth={2} />
                <Area type="monotone" dataKey="combustible" stroke="#F59E0B" fill="url(#colorFuel)" name="Combustible" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Trip Distribution Pie */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Estado de Viajes</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={(tripDistribution || []).filter((d: any) => d.count > 0)}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => value > 0 ? `${value}` : ''}
                  labelLine={false}
                >
                  {(tripDistribution || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(v: any, name: any) => [v, TRIP_STATUS_MAP[name]?.label || name]}
                />
                <Legend formatter={(v) => TRIP_STATUS_MAP[v]?.label || v} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row: Recent trips + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trips */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h3 className="section-title">Viajes Recientes</h3>
              <a href="/trips" className="text-blue-400 hover:text-blue-300 text-sm">Ver todos →</a>
            </div>
            <div className="divide-y divide-slate-700/50">
              {(recentTrips || []).slice(0, 6).map((trip: any) => {
                const statusInfo = TRIP_STATUS_MAP[trip.status] || { label: trip.status, cls: 'badge-gray' };
                return (
                  <div key={trip.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-700/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-white">{trip.numero}</span>
                        <span className={statusInfo.cls}>{statusInfo.label}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{trip.origen} → {trip.destino}</p>
                      <p className="text-xs text-slate-500">{trip.vehicle?.patente} · {trip.driver?.firstName} {trip.driver?.lastName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-white">{formatMoney(trip.tarifaAcordada)}</p>
                      <p className="text-xs text-slate-500">{formatDate(trip.fechaSalidaProgramada)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-700">
              <h3 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Alertas de Vencimiento
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {(expiringAlerts?.vehicles || []).slice(0, 4).map((v: any) => (
                <div key={v.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-300">{v.patente} - {v.marca}</p>
                  {v.vencimientoSeguro && new Date(v.vencimientoSeguro) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-400/80">Seguro vence: {formatDate(v.vencimientoSeguro)}</p>
                  )}
                  {v.vencimientoITV && new Date(v.vencimientoITV) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-400/80">ITV vence: {formatDate(v.vencimientoITV)}</p>
                  )}
                  {v.vencimientoRUTA && new Date(v.vencimientoRUTA) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-400/80">RUTA vence: {formatDate(v.vencimientoRUTA)}</p>
                  )}
                </div>
              ))}
              {(expiringAlerts?.drivers || []).slice(0, 3).map((d: any) => (
                <div key={d.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-300">{d.firstName} {d.lastName}</p>
                  {d.licenciaVencimiento && <p className="text-xs text-red-400/80">Licencia: {formatDate(d.licenciaVencimiento)}</p>}
                  {d.examenMedicoVencimiento && <p className="text-xs text-red-400/80">Médico: {formatDate(d.examenMedicoVencimiento)}</p>}
                </div>
              ))}
              {totalAlerts === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">Sin alertas de vencimiento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: any; sub: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
