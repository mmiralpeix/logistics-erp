'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  BellOff,
  RefreshCw,
  SlidersHorizontal,
  Search,
  ExternalLink,
  Check,
  X,
  VolumeX,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CentralAlertsPage() {
  const qc = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSeverity, setActiveSeverity] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [search, setSearch] = useState('');

  // Resolve Modal State
  const [resolveModal, setResolveModal] = useState<any>(null);
  const [resolucionNota, setResolucionNota] = useState('');

  // Preferences Modal State
  const [showPrefModal, setShowPrefModal] = useState(false);

  // Queries
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['alerts-stats'],
    queryFn: () => alertsApi.getStats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: alertsList, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['alerts-active', activeCategory, activeSeverity, showResolved, search],
    queryFn: () =>
      alertsApi
        .getActiveAlerts({
          categoria: activeCategory !== 'all' ? activeCategory : undefined,
          severidad: activeSeverity !== 'all' ? activeSeverity : undefined,
          isResolved: showResolved,
          search: search || undefined,
        })
        .then((r) => r.data),
    refetchInterval: 30000,
  });

  // Mutations
  const evaluateMutation = useMutation({
    mutationFn: () => alertsApi.evaluateAll(),
    onSuccess: () => {
      toast.success('Escaneo y reevaluación de reglas globales completado');
      qc.invalidateQueries({ queryKey: ['alerts-stats'] });
      qc.invalidateQueries({ queryKey: ['alerts-active'] });
    },
    onError: () => toast.error('Error al evaluar reglas globales'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, nota }: { id: string; nota?: string }) => alertsApi.resolveAlert(id, nota),
    onSuccess: () => {
      toast.success('Alerta resuelta y archivada');
      setResolveModal(null);
      setResolucionNota('');
      qc.invalidateQueries({ queryKey: ['alerts-stats'] });
      qc.invalidateQueries({ queryKey: ['alerts-active'] });
    },
    onError: () => toast.error('Error al resolver la alerta'),
  });

  const silenceMutation = useMutation({
    mutationFn: (id: string) => alertsApi.silenceAlert(id, 7),
    onSuccess: () => {
      toast.success('Alerta silenciada por 7 días');
      qc.invalidateQueries({ queryKey: ['alerts-active'] });
    },
  });

  const getSeverityBadge = (severidad: string) => {
    switch (severidad) {
      case 'EMERGENCIA':
        return {
          label: 'EMERGENCIA CRÍTICA',
          badgeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800 font-black animate-pulse',
          icon: AlertOctagon,
        };
      case 'CRITICA':
        return {
          label: 'RIESGO ALTO',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold',
          icon: AlertTriangle,
        };
      case 'ADVERTENCIA':
        return {
          label: 'ADVERTENCIA',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 font-bold',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'INFORMACIÓN',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 font-semibold',
          icon: Info,
        };
    }
  };

  const getModuleLink = (modulo: string) => {
    switch (modulo) {
      case 'vehicles':
        return '/vehicles';
      case 'drivers':
        return '/drivers';
      case 'tires':
        return '/maintenance';
      case 'maintenance':
        return '/maintenance';
      case 'inventory':
        return '/consumables';
      case 'billing':
        return '/billing';
      default:
        return '/dashboard';
    }
  };

  return (
    <div>
      <Header
        title="Centro Inteligente de Alertas ERP"
        subtitle="Monitoreo unificado de riesgos, vencimientos de documentación, mantenimiento, neumáticos y choferes"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${evaluateMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{evaluateMutation.isPending ? 'Escaneando...' : 'Reevaluar Reglas'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrefModal(true)}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Preferencias de Alertas</span>
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-l-4 border-l-red-600 bg-red-50/30 dark:bg-red-950/20 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                Emergencias Críticas
              </span>
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600">
                <AlertCircle className="w-5 h-5 animate-bounce" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-red-600 dark:text-red-400">
                {stats?.emergencias || 0}
              </span>
              <p className="text-[11px] text-red-700/80 font-bold mt-0.5">
                Vencimientos cumplidos o fallas graves
              </p>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Riesgo Alto / Críticas
              </span>
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {stats?.criticas || 0}
              </span>
              <p className="text-[11px] text-rose-700/80 font-bold mt-0.5">
                Requieren intervención en 48hs
              </p>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-amber-500 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Advertencias Preventivas
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {stats?.advertencias || 0}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Próximos a vencer en 30 días
              </p>
            </div>
          </div>

          <div className="card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Resueltas Hoy
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {stats?.resueltasHoy || 0}
              </span>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Auditadas y cerradas correctamente
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="card p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Todas las Categorías' },
                { key: 'DOCUMENTACION', label: '📄 Documentación' },
                { key: 'CHOFERES', label: '👨‍✈️ Choferes & Jornadas' },
                { key: 'NEUMATICOS', label: '🛞 Neumáticos' },
                { key: 'MANTENIMIENTO', label: '🔧 Mantenimiento' },
                { key: 'INVENTARIO', label: '📦 Repuestos' },
                { key: 'FACTURACION', label: '💰 Facturación' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Resolved Toggle */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span>Mostrar Historial Resueltas</span>
              </label>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar alerta por título, vehículo, chofer o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2 text-xs"
            />
          </div>
        </div>

        {/* Alerts Cards List */}
        <div className="space-y-3">
          {isLoadingAlerts ? (
            <div className="card p-12 text-center text-slate-400 text-xs">Cargando alertas del ERP...</div>
          ) : !alertsList || alertsList.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                ¡Todo bajo control! No hay alertas activas en esta categoría.
              </p>
              <p className="text-slate-400">
                El sistema monitorea en tiempo real los vencimientos y la salud de la flota.
              </p>
            </div>
          ) : (
            alertsList.map((alert: any) => {
              const badge = getSeverityBadge(alert.severidad);
              return (
                <div
                  key={alert.id}
                  className={`card p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                    alert.severidad === 'EMERGENCIA'
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-900/60'
                      : alert.severidad === 'CRITICA'
                      ? 'bg-rose-50/30 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] border ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] font-mono font-extrabold text-slate-400">
                        {alert.codigo}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        • {alert.categoria}
                      </span>
                    </div>

                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                      {alert.titulo}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {alert.mensaje}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      Detectada: {formatDate(alert.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 justify-end">
                    <Link
                      href={getModuleLink(alert.moduloOrigen)}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ir a Registro
                    </Link>

                    {!alert.isResolved && (
                      <>
                        <button
                          type="button"
                          onClick={() => silenceMutation.mutate(alert.id)}
                          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-slate-600"
                          title="Silenciar por 7 días"
                        >
                          <VolumeX className="w-3.5 h-3.5" /> Silenciar
                        </button>

                        <button
                          type="button"
                          onClick={() => setResolveModal(alert)}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolver
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RESOLVE AUDIT MODAL */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setResolveModal(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Resolver & Archivar Alerta
              </h3>
              <button type="button" onClick={() => setResolveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Alerta: <strong>{resolveModal.titulo}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nota de Auditoría / Resolución *
              </label>
              <textarea
                value={resolucionNota}
                onChange={(e) => setResolucionNota(e.target.value)}
                placeholder="Indique las acciones correctivas tomadas (ej.: 'Seguro renovado con la aseguradora La Segunda hasta 2027')."
                className="input w-full text-xs min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setResolveModal(null)} className="btn-secondary py-1.5 px-3 text-xs">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => resolveMutation.mutate({ id: resolveModal.id, nota: resolucionNota })}
                disabled={resolveMutation.isPending}
                className="btn-primary py-1.5 px-4 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                Confirmar Resolución
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PREFERENCES MODAL */}
      {showPrefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowPrefModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" /> Preferencias de Alertas por Usuario
              </h3>
              <button type="button" onClick={() => setShowPrefModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-slate-200">Notificaciones por Email</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600" />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-slate-200">Avisos Emergencia en Pantalla</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600" />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPrefModal(false)} className="btn-primary py-1.5 px-4 text-xs">
                Guardar Preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertOctagon(props: any) {
  return <ShieldAlert {...props} />;
}
