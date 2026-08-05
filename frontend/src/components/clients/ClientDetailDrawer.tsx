'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import {
  X, Building2, Phone, Mail, MapPin, ShieldAlert, CreditCard,
  FileText, MapPin as MapPinIcon, DollarSign, Plus, Trash2, ShieldCheck, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientDetailDrawerProps {
  clientId: string | null;
  onClose: () => void;
}

export function ClientDetailDrawer({ clientId, onClose }: ClientDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'contracts' | 'trips' | 'billing' | 'rates'>('info');
  const [newRate, setNewRate] = useState({ origen: '', destino: '', tipoCarga: 'GENERAL', tarifaBase: '', costoPorTnExcedente: '', horasEsperaLibres: '2' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['client-summary-360', clientId],
    queryFn: () => clientsApi.getSummary360(clientId!).then((r) => r.data),
    enabled: !!clientId,
  });

  const addRateMutation = useMutation({
    mutationFn: (rateData: any) => clientsApi.addRate(clientId!, rateData),
    onSuccess: () => {
      toast.success('Tarifa agregada al tarifario del cliente');
      setNewRate({ origen: '', destino: '', tipoCarga: 'GENERAL', tarifaBase: '', costoPorTnExcedente: '', horasEsperaLibres: '2' });
      qc.invalidateQueries({ queryKey: ['client-summary-360', clientId] });
    },
    onError: () => toast.error('Error al guardar tarifa'),
  });

  const removeRateMutation = useMutation({
    mutationFn: (rateId: string) => clientsApi.removeRate(rateId),
    onSuccess: () => {
      toast.success('Tarifa eliminada');
      qc.invalidateQueries({ queryKey: ['client-summary-360', clientId] });
    },
  });

  if (!clientId) return null;

  const client = data?.client;
  const stats = data?.stats;
  const trips = data?.trips || [];
  const invoices = data?.invoices || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{client?.razonSocial || 'Cargando...'}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Scoring {client?.scoring || 'A'}
                </span>
                {client?.riesgoBloqueado ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Bloqueado por Riesgo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Habilitado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">CUIT: {client?.cuit} • Condición: {client?.condicionIVA}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs font-bold bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Información & Crédito
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'contracts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Órdenes de Compra (OC) ({client?.contracts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Historial de Viajes ({stats?.totalViajes || 0})
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'billing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Cuenta Corriente & Facturas
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={`py-3 border-b-2 transition-colors ${activeTab === 'rates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Matriz de Tarifarios ({client?.rates?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Cargando expediente 360°...</div>
          ) : activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Credit Risk Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Límite de Crédito Otorgado</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                    {formatMoney(client?.limiteCredito)}
                  </span>
                  <span className="text-[11px] text-slate-500">Plazo: {client?.diasCredito || 30} días</span>
                </div>
                <div className="card p-4 border-l-4 border-l-amber-500">
                  <span className="text-[10px] font-black uppercase text-slate-500">Saldo Pendiente de Cobro</span>
                  <span className="text-xl font-black text-amber-600 block mt-1">
                    {formatMoney(stats?.totalPendienteCobro)}
                  </span>
                  <span className="text-[11px] text-slate-500">Facturas emitidas impagas</span>
                </div>
                <div className="card p-4 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-black uppercase text-slate-500">Facturación Cobrada Total</span>
                  <span className="text-xl font-black text-emerald-600 block mt-1">
                    {formatMoney(stats?.totalFacturado)}
                  </span>
                  <span className="text-[11px] text-slate-500">Acumulado histórico</span>
                </div>
              </div>

              {/* General Details */}
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Datos Comerciales & Domicilio</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Domicilio Fiscal</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{client?.domicilio}, {client?.ciudad}, {client?.provincia}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Teléfono / Email</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{client?.telefono} • {client?.email}</span>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="card p-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Contactos Principales</h3>
                {client?.contacts?.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin contactos adicionales registrados</p>
                ) : (
                  <div className="space-y-2">
                    {client?.contacts?.map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{c.nombre}</span>
                          <span className="text-slate-500 ml-2 font-medium">({c.cargo || 'Contacto'})</span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {c.telefono} • {c.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'contracts' ? (
            <div className="space-y-4">
              {client?.contracts?.map((c: any) => {
                const totalAllowed = c.cantidadViajes ? Number(c.cantidadViajes) : null;
                const executed = c._count?.trips || 0;
                const pct = totalAllowed ? Math.min(100, Math.round((executed / totalAllowed) * 100)) : 0;

                return (
                  <div key={c.id} className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{c.numero}</span>
                        <p className="text-xs text-slate-500">{c.descripcion || 'Sin descripción'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {c.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div>
                        <span className="text-slate-400 block font-semibold">Tarifa Base</span>
                        <span className="font-bold text-blue-600">{c.tarifaBase ? formatMoney(c.tarifaBase) : 'Sin definir'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Tn Excedente</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.tarifaExcedentePorTn ? `${formatMoney(c.tarifaExcedentePorTn)}/Tn` : 'Sin definir'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Peso Mínimo</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{c.pesoMinimoKg ? `${Number(c.pesoMinimoKg).toLocaleString()} kg` : '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Viajes Permitidos</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{totalAllowed ? `${executed} / ${totalAllowed}` : `${executed} (sin límite)`}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Vigencia</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString() : '-'} ➔ {c.fechaFin ? new Date(c.fechaFin).toLocaleDateString() : 'Sin vencimiento'}
                        </span>
                      </div>
                      {c.condiciones && (
                        <div className="col-span-2 sm:col-span-3">
                          <span className="text-slate-400 block font-semibold">Condiciones</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{c.condiciones}</span>
                        </div>
                      )}
                    </div>

                    {totalAllowed && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span>Consumo de viajes: {executed} / {totalAllowed}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${pct >= 90 ? 'bg-rose-600' : pct >= 75 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'trips' ? (
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 text-left">Número</th>
                    <th className="p-3 text-left">Origen ➔ Destino</th>
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-right">Tarifa ($)</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t: any) => (
                    <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{t.numero}</td>
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-300">{t.origen} ➔ {t.destino}</td>
                      <td className="p-3 text-slate-500">{new Date(t.fechaSalidaProgramada).toLocaleDateString()}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatMoney(t.tarifaAcordada)}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'billing' ? (
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 text-left">Factura N°</th>
                    <th className="p-3 text-left">Emisión</th>
                    <th className="p-3 text-left">Vencimiento</th>
                    <th className="p-3 text-right">Total ($)</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.numero}</td>
                      <td className="p-3 text-slate-500">{new Date(inv.fechaEmision).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-500">{inv.fechaVencimiento ? new Date(inv.fechaVencimiento).toLocaleDateString() : '-'}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{formatMoney(inv.total)}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          inv.status === 'PAGADA' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Rates tab */
            <div className="space-y-6">
              {/* Form to add rate */}
              <div className="card p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs font-black uppercase text-slate-500">Agregar Nueva Tarifa por Tramo</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Origen (ej. Buenos Aires)"
                    value={newRate.origen}
                    onChange={(e) => setNewRate({ ...newRate, origen: e.target.value })}
                    className="input"
                  />
                  <input
                    type="text"
                    placeholder="Destino (ej. Vaca Muerta)"
                    value={newRate.destino}
                    onChange={(e) => setNewRate({ ...newRate, destino: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Tarifa Base ($)"
                    value={newRate.tarifaBase}
                    onChange={(e) => setNewRate({ ...newRate, tarifaBase: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Tn Excedente ($/Tn)"
                    value={newRate.costoPorTnExcedente}
                    onChange={(e) => setNewRate({ ...newRate, costoPorTnExcedente: e.target.value })}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Horas Espera Libres"
                    value={newRate.horasEsperaLibres}
                    onChange={(e) => setNewRate({ ...newRate, horasEsperaLibres: e.target.value })}
                    className="input"
                  />
                  <button
                    onClick={() => addRateMutation.mutate(newRate)}
                    disabled={!newRate.origen || !newRate.destino || !newRate.tarifaBase}
                    className="btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Agregar Tarifa
                  </button>
                </div>
              </div>

              {/* Rates table */}
              <div className="card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="table-header">
                      <th className="p-3 text-left">Origen ➔ Destino</th>
                      <th className="p-3 text-right">Tarifa Base ($)</th>
                      <th className="p-3 text-right">Tn Excedente ($)</th>
                      <th className="p-3 text-right">Hs Espera Libres</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client?.rates?.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400">Sin tarifarios registrados para este cliente</td></tr>
                    ) : (
                      client?.rates?.map((r: any) => (
                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{r.origen} ➔ {r.destino}</td>
                          <td className="p-3 text-right font-bold text-blue-600">{formatMoney(r.tarifaBase)}</td>
                          <td className="p-3 text-right font-medium text-slate-600">${r.costoPorTnExcedente}/Tn</td>
                          <td className="p-3 text-right text-slate-500">{r.horasEsperaLibres} hs</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => removeRateMutation.mutate(r.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
