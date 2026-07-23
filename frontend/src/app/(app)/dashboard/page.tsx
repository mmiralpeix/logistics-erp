'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatMoney, formatDate, TRIP_STATUS_MAP } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Truck, Users, MapPin, DollarSign, AlertTriangle, TrendingUp, Fuel, CheckCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => dashboardApi.getStats().then((r) => r.data), refetchInterval: 60000 });
  const { data: monthlyChart } = useQuery({ queryKey: ['monthly-chart'], queryFn: () => dashboardApi.getMonthlyChart().then((r) => r.data) });
  const { data: recentTrips } = useQuery({ queryKey: ['recent-trips'], queryFn: () => dashboardApi.getRecentTrips(8).then((r) => r.data) });
  const { data: expiringAlerts } = useQuery({ queryKey: ['expiring-alerts'], queryFn: () => dashboardApi.getExpiringAlerts().then((r) => r.data) });
  const { data: tripDistribution } = useQuery({ queryKey: ['trip-distribution'], queryFn: () => dashboardApi.getTripDistribution().then((r) => r.data) });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">Cargando dashboard...</p>
      </div>
    </div>
  );

  const totalAlerts = (expiringAlerts?.vehicles?.length || 0) + (expiringAlerts?.drivers?.length || 0);

  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  const rawDist = tripDistribution || [];
  const filteredDist = rawDist.filter((d: any) => d.count > 0);

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
            icon={<Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            label="Flota Total"
            value={stats?.fleet?.total || 0}
            sub={`${stats?.fleet?.available || 0} disponibles · ${stats?.fleet?.inTrip || 0} en viaje`}
            color="blue"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5 text-emerald-600 dark:text-green-400" />}
            label="Viajes Activos"
            value={stats?.trips?.active || 0}
            sub={`${stats?.trips?.pending || 0} programados pendientes`}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5 text-amber-600 dark:text-yellow-400" />}
            label="Facturación Mes"
            value={formatMoney(stats?.financial?.monthlyRevenue)}
            sub={`Margen: ${stats?.financial?.grossMarginPct || 0}%`}
            color="yellow"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />}
            label="Alertas"
            value={totalAlerts}
            sub={`${stats?.alerts?.pendingMaintenances || 0} mantenimientos pendientes`}
            color="red"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            label="Conductores"
            value={stats?.drivers?.total || 0}
            sub="Activos en sistema"
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            label="Viajes Completados"
            value={stats?.trips?.completedThisMonth || 0}
            sub="Este mes"
            color="green"
          />
          <StatCard
            icon={<Fuel className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            label="Combustible Mes"
            value={formatMoney(stats?.financial?.monthlyFuelCost)}
            sub={`${(stats?.financial?.monthlyFuelLiters || 0).toLocaleString('es-AR')} litros`}
            color="orange"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
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
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyChart || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="mes" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: 'bold' }}
                  formatter={(v: any) => [formatMoney(v), '']}
                />
                <Legend
                  formatter={(v) => (
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-medium ml-1">
                      {v}
                    </span>
                  )}
                />
                <Bar dataKey="facturacion" fill="#2563EB" name="Facturación ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="combustible" fill="#F59E0B" name="Combustible ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trip Distribution Pie */}
          <div className="card p-5 flex flex-col justify-between">
            <h3 className="section-title mb-2">Estado de Viajes</h3>
            {filteredDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[240px] text-slate-500 dark:text-slate-400">
                <MapPin className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Sin viajes registrados</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={filteredDist}
                      dataKey="count"
                      nameKey="status"
                      cx="50%" cy="50%"
                      outerRadius={65}
                      innerRadius={30}
                      paddingAngle={3}
                    >
                      {filteredDist.map((item: any, i: number) => (
                        <Cell key={item.status} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(v: any, name: any) => [v, TRIP_STATUS_MAP[name]?.label || name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Status breakdown grid */}
                <div className="grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {rawDist.map((item: any) => {
                    const st = TRIP_STATUS_MAP[item.status] || { label: item.status, cls: 'badge-gray' };
                    return (
                      <div key={item.status} className="flex items-center justify-between px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/50 dark:border-slate-700/50">
                        <span className={st.cls}>{st.label}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Recent trips + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trips */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="section-title">Viajes Recientes</h3>
              <a href="/trips" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">Ver todos →</a>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {(recentTrips || []).slice(0, 6).map((trip: any) => {
                const statusInfo = TRIP_STATUS_MAP[trip.status] || { label: trip.status, cls: 'badge-gray' };
                return (
                  <div key={trip.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{trip.numero}</span>
                        <span className={statusInfo.cls}>{statusInfo.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{trip.origen} → {trip.destino}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{trip.vehicle?.patente} · {trip.driver?.firstName} {trip.driver?.lastName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{formatMoney(trip.tarifaAcordada)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(trip.fechaSalidaProgramada)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-yellow-400" />
                Alertas de Vencimiento
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {(expiringAlerts?.vehicles || []).slice(0, 4).map((v: any) => (
                <div key={v.id} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">{v.patente} - {v.marca}</p>
                  {v.vencimientoSeguro && new Date(v.vencimientoSeguro) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-700 dark:text-amber-400/80">Seguro vence: {formatDate(v.vencimientoSeguro)}</p>
                  )}
                  {v.vencimientoITV && new Date(v.vencimientoITV) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-700 dark:text-amber-400/80">ITV vence: {formatDate(v.vencimientoITV)}</p>
                  )}
                  {v.vencimientoRUTA && new Date(v.vencimientoRUTA) < new Date(Date.now() + 30 * 86400000) && (
                    <p className="text-xs text-amber-700 dark:text-amber-400/80">RUTA vence: {formatDate(v.vencimientoRUTA)}</p>
                  )}
                </div>
              ))}
              {(expiringAlerts?.drivers || []).slice(0, 3).map((d: any) => (
                <div key={d.id} className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">{d.firstName} {d.lastName}</p>
                  {d.licenciaVencimiento && <p className="text-xs text-red-700 dark:text-red-400/80">Licencia: {formatDate(d.licenciaVencimiento)}</p>}
                  {d.examenMedicoVencimiento && <p className="text-xs text-red-700 dark:text-red-400/80">Médico: {formatDate(d.examenMedicoVencimiento)}</p>}
                </div>
              ))}
              {totalAlerts === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
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
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
