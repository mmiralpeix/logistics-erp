'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, clientsApi, certificationsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney, INVOICE_STATUS_MAP } from '@/lib/utils';
import { Plus, Receipt, DollarSign, AlertTriangle, CheckCircle, Clock, FileCheck, Layers, Calendar, ArrowRight, Trash2, Eye, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const CERT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  BORRADOR: { label: 'Borrador', cls: 'badge-gray' },
  EN_REVISION: { label: 'En Gestión', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium px-2.5 py-0.5 rounded-full text-xs' },
  APROBADO: { label: 'Aprobado', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-medium px-2.5 py-0.5 rounded-full text-xs' },
  FACTURADO: { label: 'Facturado', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium px-2.5 py-0.5 rounded-full text-xs' },
  RECHAZADO: { label: 'Rechazado', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 font-medium px-2.5 py-0.5 rounded-full text-xs' },
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'certifications' | 'invoices'>('certifications');
  
  // Invoices state
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [prefilledInvoiceData, setPrefilledInvoiceData] = useState<any>(null);

  // Certifications state
  const [certClientFilter, setCertClientFilter] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState('');
  const [certPage, setCertPage] = useState(1);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertDetail, setSelectedCertDetail] = useState<any>(null);

  const qc = useQueryClient();

  // Queries
  const { data: invoicesData, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', filterStatus, page],
    queryFn: () => billingApi.getAll({ status: filterStatus || undefined, page, limit: 15 }).then((r) => r.data),
    enabled: activeTab === 'invoices',
  });

  const { data: stats } = useQuery({ queryKey: ['billing-stats'], queryFn: () => billingApi.getStats().then((r) => r.data) });

  const { data: certsData, isLoading: isLoadingCerts } = useQuery({
    queryKey: ['certifications', certClientFilter, certStatusFilter, certPage],
    queryFn: () => certificationsApi.getAll({ clientId: certClientFilter || undefined, estado: certStatusFilter || undefined, page: certPage, limit: 15 }).then((r) => r.data),
    enabled: activeTab === 'certifications',
  });

  const { data: uncertifiedTrips } = useQuery({
    queryKey: ['uncertified-trips-count'],
    queryFn: () => certificationsApi.getUncertifiedTrips().then((r) => r.data),
  });

  // Mutations
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, status }: any) => billingApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Estado de factura actualizado'); qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['billing-stats'] }); },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => billingApi.create(data),
    onSuccess: () => { toast.success('Factura AFIP emitida'); qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['certifications'] }); setShowInvoiceModal(false); setPrefilledInvoiceData(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al emitir factura'),
  });

  const updateCertMutation = useMutation({
    mutationFn: ({ id, data }: any) => certificationsApi.update(id, data),
    onSuccess: () => { toast.success('Certificación actualizada'); qc.invalidateQueries({ queryKey: ['certifications'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar certificación'),
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id: string) => certificationsApi.remove(id),
    onSuccess: () => { toast.success('Certificación eliminada y viajes liberados'); qc.invalidateQueries({ queryKey: ['certifications'] }); qc.invalidateQueries({ queryKey: ['uncertified-trips-count'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al eliminar'),
  });

  const handleInvoiceFromCert = (cert: any) => {
    setPrefilledInvoiceData({
      clientId: cert.clientId,
      certificationId: cert.id,
      items: [
        {
          descripcion: `Certificado de Servicio N° ${cert.numeroCertificado} - OC: ${cert.numeroOC || 'S/D'} (${cert.cantidadViajes} viajes)`,
          cantidad: 1,
          precioUnit: cert.montoTotal,
        },
      ],
    });
    setShowInvoiceModal(true);
  };

  return (
    <div>
      <Header
        title="Facturación & Certificaciones"
        subtitle="Pre-facturación por lotes, remitos, certificaciones y comprobantes AFIP"
        actions={
          <div className="flex gap-2">
            {activeTab === 'certifications' ? (
              <button onClick={() => setShowCertModal(true)} className="btn-primary flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> Nueva Certificación
              </button>
            ) : (
              <button onClick={() => { setPrefilledInvoiceData(null); setShowInvoiceModal(true); }} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Factura AFIP
              </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Uncertified Trips Banner Alert */}
        {uncertifiedTrips && uncertifiedTrips.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {uncertifiedTrips.length} viajes finalizados listos para certificar
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Agrupalos por cliente y Orden de Compra en un nuevo Certificado N° 1, 2, 3...
                </p>
              </div>
            </div>
            <button onClick={() => setShowCertModal(true)} className="btn-secondary text-xs bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
              Certificar Lote
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('certifications')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'certifications'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Certificaciones de Servicio ({certsData?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" /> Facturas AFIP & Cobranzas
          </button>
        </div>

        {/* SECTION 1: CERTIFICACIONES DE SERVICIO */}
        {activeTab === 'certifications' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex gap-3">
                <select
                  value={certStatusFilter}
                  onChange={(e) => setCertStatusFilter(e.target.value)}
                  className="input w-48 text-sm"
                >
                  <option value="">Todos los Estados</option>
                  {Object.entries(CERT_STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Mostrando {certsData?.data?.length || 0} certificaciones
              </div>
            </div>

            {/* Certifications Table */}
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">N° Certificado</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">N° OC (Contrato)</th>
                    <th className="px-4 py-3 text-center">Viajes</th>
                    <th className="px-4 py-3 text-right">TN Excedentes</th>
                    <th className="px-4 py-3 text-right">Total Flete ($)</th>
                    <th className="px-4 py-3 text-center">Días Gestión</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCerts ? (
                    <tr><td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando certificaciones...</td></tr>
                  ) : certsData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No hay certificaciones registradas. Creá una seleccionando los viajes finalizados de tu cliente.
                      </td>
                    </tr>
                  ) : (
                    certsData?.data?.map((cert: any) => {
                      const st = CERT_STATUS_MAP[cert.estado] || { label: cert.estado, cls: 'badge-gray' };
                      return (
                        <tr key={cert.id} className="table-row">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              Certificado #{cert.numeroCertificado}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(cert.fechaEmision)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{cert.client?.razonSocial}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{cert.periodo}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                            {cert.numeroOC || 'S/D'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                              <Layers className="w-3 h-3 text-slate-500" /> {cert.cantidadViajes}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                            {cert.toneladasExcedentes > 0 ? `${cert.toneladasExcedentes.toFixed(2)} Tn` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white text-base">
                            {formatMoney(cert.montoTotal)}
                          </td>
                          <td className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                            {cert.diasEnGestion || 0} días
                          </td>
                          <td className="px-4 py-3 text-center">
                            <select
                              value={cert.estado}
                              onChange={(e) => updateCertMutation.mutate({ id: cert.id, data: { estado: e.target.value } })}
                              className={`text-xs rounded font-medium border-0 px-2 py-1 ${st.cls}`}
                            >
                              {Object.entries(CERT_STATUS_MAP).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {cert.estado === 'APROBADO' && (
                                <button
                                  onClick={() => handleInvoiceFromCert(cert)}
                                  className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Emitir Factura AFIP desde este certificado"
                                >
                                  <Receipt className="w-3.5 h-3.5" /> Facturar
                                </button>
                              )}

                              <button
                                onClick={() => deleteCertMutation.mutate(cert.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                title="Eliminar certificación y liberar viajes"
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

              {certsData && certsData.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total: {certsData.total} certificaciones</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCertPage((p) => Math.max(1, p - 1))} disabled={certPage === 1} className="btn-secondary py-1 px-3 disabled:opacity-40 text-xs">Anterior</button>
                    <button onClick={() => setCertPage((p) => Math.min(certsData.totalPages, p + 1))} disabled={certPage === certsData.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40 text-xs">Siguiente</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: FACTURAS AFIP */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <DollarSign className="w-5 h-5 text-emerald-600 dark:text-green-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(stats?.monthly?._sum?.total)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Facturado este mes ({stats?.monthly?._count || 0})</p>
              </div>
              <div className="stat-card">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(stats?.pending?._sum?.total)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Pendiente de cobro ({stats?.pending?._count || 0})</p>
              </div>
              <div className="stat-card">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(stats?.overdue?._sum?.total)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Vencidas ({stats?.overdue?._count || 0})</p>
              </div>
              <div className="stat-card">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatMoney(stats?.collected?._sum?.total)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cobrado ({stats?.collected?._count || 0})</p>
              </div>
            </div>

            <div className="flex gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-48 text-sm">
                <option value="">Todos los Estados</option>
                {Object.entries(INVOICE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">N° Factura</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Emisión</th>
                    <th className="px-4 py-3 text-left">Vencimiento</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">IVA</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingInvoices ? (
                    <tr><td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando...</td></tr>
                  ) : invoicesData?.data?.map((inv: any) => {
                    const st = INVOICE_STATUS_MAP[inv.status] || { label: inv.status, cls: 'badge-gray' };
                    return (
                      <tr key={inv.id} className="table-row">
                        <td className="px-4 py-3"><p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{inv.numero}</p></td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-800 dark:text-slate-300">{inv.client?.razonSocial}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{inv.client?.cuit}</p>
                        </td>
                        <td className="px-4 py-3"><span className="badge badge-gray">{inv.tipo?.replace('_', ' ')}</span></td>
                        <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(inv.fechaEmision)}</td>
                        <td className="px-4 py-3">
                          <span className={inv.fechaVencimiento && new Date(inv.fechaVencimiento) < new Date() ? 'text-red-600 dark:text-red-400 text-xs font-medium' : 'text-xs text-slate-500 dark:text-slate-400'}>
                            {formatDate(inv.fechaVencimiento)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-slate-800 dark:text-slate-300">{formatMoney(inv.subtotal)}</td>
                        <td className="px-4 py-3 text-right text-sm text-slate-500 dark:text-slate-400">{formatMoney(inv.iva)}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 dark:text-white">{formatMoney(inv.total)}</td>
                        <td className="px-4 py-3">
                          <select
                            value={inv.status}
                            onChange={(e) => updateInvoiceMutation.mutate({ id: inv.id, status: e.target.value })}
                            className="text-xs bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-800 dark:text-slate-200"
                          >
                            {Object.entries(INVOICE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: NUEVA CERTIFICACION */}
      {showCertModal && (
        <NewCertificationModal
          onClose={() => setShowCertModal(false)}
          onSuccess={() => {
            setShowCertModal(false);
            qc.invalidateQueries({ queryKey: ['certifications'] });
            qc.invalidateQueries({ queryKey: ['uncertified-trips-count'] });
          }}
        />
      )}

      {/* MODAL 2: NUEVA FACTURA AFIP */}
      {showInvoiceModal && (
        <InvoiceModal
          initialData={prefilledInvoiceData}
          onClose={() => { setShowInvoiceModal(false); setPrefilledInvoiceData(null); }}
          onSave={(d: any) => createInvoiceMutation.mutate(d)}
        />
      )}
    </div>
  );
}

// MODAL COMPONENT FOR NEW CERTIFICATION
function NewCertificationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedOC, setSelectedOC] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: uncertifiedTrips, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['uncertified-trips', selectedClient],
    queryFn: () => certificationsApi.getUncertifiedTrips(selectedClient || undefined).then((r) => r.data),
    enabled: !!selectedClient,
  });

  const createCertMutation = useMutation({
    mutationFn: (data: any) => certificationsApi.create(data),
    onSuccess: (res: any) => {
      toast.success(`Certificado #${res.data?.numeroCertificado} generado con éxito`);
      onSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al generar certificación'),
  });

  const toggleTrip = (id: string) => {
    setSelectedTripIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (!uncertifiedTrips) return;
    if (selectedTripIds.length === uncertifiedTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(uncertifiedTrips.map((t: any) => t.id));
    }
  };

  // Calculations
  const selectedTripsObj = uncertifiedTrips?.filter((t: any) => selectedTripIds.includes(t.id)) || [];
  // tarifaAcordada ya incluye el excedente (base + excedente-por-Tn) - sumarlo de nuevo lo duplica.
  const totalAmount = selectedTripsObj.reduce((s: number, t: any) => s + (t.tarifaAcordada || 0), 0);
  const getTripExcessTn = (t: any) => {
    if (t.pesoExcedenteKg) return t.pesoExcedenteKg / 1000;
    if (t.pesoCarga && t.pesoCarga > 30000) return (t.pesoCarga - 30000) / 1000;
    return 0;
  };
  const totalExcessTn = selectedTripsObj.reduce((s: number, t: any) => s + getTripExcessTn(t), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return toast.error('Seleccioná un cliente');
    if (selectedTripIds.length === 0) return toast.error('Seleccioná al menos un viaje');

    createCertMutation.mutate({
      clientId: selectedClient,
      numeroOC: selectedOC,
      periodo: periodo || `Certificación ${new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`,
      tripIds: selectedTripIds,
      observaciones,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Generar Certificación de Servicio</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select
                value={selectedClient}
                onChange={(e) => { setSelectedClient(e.target.value); setSelectedTripIds([]); }}
                className="input font-medium"
                required
              >
                <option value="">Seleccionar Cliente...</option>
                {clients?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.razonSocial} (CUIT: {c.cuit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">N° Orden de Compra (OC)</label>
              <input
                type="text"
                placeholder="ej: 4500000980 - 2"
                value={selectedOC}
                onChange={(e) => setSelectedOC(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {selectedClient && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Viajes Finalizados Sin Certificar ({uncertifiedTrips?.length || 0})
                </h3>
                {uncertifiedTrips && uncertifiedTrips.length > 0 && (
                  <button type="button" onClick={toggleAll} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    {selectedTripIds.length === uncertifiedTrips.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                  </button>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {isLoadingTrips ? (
                  <div className="p-6 text-center text-xs text-slate-500">Buscando viajes del cliente...</div>
                ) : uncertifiedTrips?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No hay viajes pendientes de certificar para este cliente.</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2 text-center w-8">✓</th>
                        <th className="p-2 text-left">N° Remito</th>
                        <th className="p-2 text-left">Ruta / Destino</th>
                        <th className="p-2 text-left">Chofer / Dominio</th>
                        <th className="p-2 text-right">TN Excedente</th>
                        <th className="p-2 text-right">Monto Flete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {uncertifiedTrips?.map((t: any) => (
                        <tr key={t.id} onClick={() => toggleTrip(t.id)} className={`cursor-pointer transition-colors ${selectedTripIds.includes(t.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                          <td className="p-2 text-center">
                            <input type="checkbox" checked={selectedTripIds.includes(t.id)} onChange={() => {}} className="rounded" />
                          </td>
                          <td className="p-2 font-mono font-medium">{t.numeroRemito || t.numero}</td>
                          <td className="p-2">{t.origen} ➔ {t.destino}</td>
                          <td className="p-2">{t.driver?.lastName} ({t.vehicle?.patente})</td>
                          <td className="p-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-300">
                            {getTripExcessTn(t) > 0 ? `${getTripExcessTn(t).toFixed(2)} Tn` : '-'}
                          </td>
                          <td className="p-2 text-right font-bold">{formatMoney(t.tarifaAcordada || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Totals Summary */}
          {selectedTripIds.length > 0 && (
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Resumen de Certificación resultante:</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-semibold">{selectedTripIds.length} Viajes Incluidos</span>
                  {totalExcessTn > 0 && <span className="text-sm text-amber-300 font-medium">+{totalExcessTn.toFixed(2)} Tn Excedente</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total Flete A Certificar</p>
                <p className="text-xl font-bold text-emerald-400">{formatMoney(totalAmount)}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={createCertMutation.isPending || selectedTripIds.length === 0} className="btn-primary flex items-center gap-2">
              <FileCheck className="w-4 h-4" /> Generar Certificado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// MODAL COMPONENT FOR AFIP INVOICE
function InvoiceModal({ initialData, onClose, onSave }: { initialData?: any; onClose: () => void; onSave: (d: any) => void }) {
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  
  const [form, setForm] = useState<any>({
    clientId: initialData?.clientId || '',
    certificationId: initialData?.certificationId || null,
    tipo: 'FACTURA_A',
    items: initialData?.items || [{ descripcion: '', cantidad: 1, precioUnit: 0 }],
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const subtotal = form.items.reduce((s: number, i: any) => s + (Number(i.cantidad) * Number(i.precioUnit)), 0);
  const iva = form.tipo === 'FACTURA_A' ? subtotal * 0.21 : 0;
  const total = subtotal + iva;

  const addItem = () => set('items', [...form.items, { descripcion: '', cantidad: 1, precioUnit: 0 }]);
  const removeItem = (idx: number) => set('items', form.items.filter((_: any, i: number) => i !== idx));
  const updateItem = (idx: number, k: string, v: any) => {
    const next = [...form.items];
    next[idx] = { ...next[idx], [k]: v };
    set('items', next);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Emitir Factura Fiscal AFIP</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">✕</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, subtotal, iva, total }); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cliente *</label>
              <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)} className="input" required>
                <option value="">Seleccionar cliente...</option>
                {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo de Comprobante</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                <option value="FACTURA_A">Factura A (Con IVA 21%)</option>
                <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                <option value="REMITO">Remito Comercial</option>
                <option value="NOTA_CREDITO">Nota de Crédito</option>
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Ítems a Facturar</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium hover:underline">+ Agregar ítem</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    placeholder="Descripción del concepto/servicio"
                    value={item.descripcion}
                    onChange={(e) => updateItem(idx, 'descripcion', e.target.value)}
                    className="input flex-1 text-sm"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Cant"
                    value={item.cantidad}
                    onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                    className="input w-20 text-sm text-center"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Precio Unit"
                    value={item.precioUnit}
                    onChange={(e) => updateItem(idx, 'precioUnit', e.target.value)}
                    className="input w-36 text-sm text-right"
                    required
                  />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-red-500 hover:text-red-700">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-1 text-sm text-right font-mono">
            <p className="text-slate-600 dark:text-slate-400">Subtotal: <span className="font-bold text-slate-900 dark:text-white">{formatMoney(subtotal)}</span></p>
            {form.tipo === 'FACTURA_A' && <p className="text-slate-600 dark:text-slate-400">IVA (21%): <span className="font-bold text-slate-900 dark:text-white">{formatMoney(iva)}</span></p>}
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">Total: {formatMoney(total)}</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Emitir Factura</button>
          </div>
        </form>
      </div>
    </div>
  );
}
