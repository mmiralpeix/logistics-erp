'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, formatMoney, INVOICE_STATUS_MAP } from '@/lib/utils';
import { Plus, Receipt, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', filterStatus, page],
    queryFn: () => billingApi.getAll({ status: filterStatus || undefined, page, limit: 15 }).then((r) => r.data),
  });

  const { data: stats } = useQuery({ queryKey: ['billing-stats'], queryFn: () => billingApi.getStats().then((r) => r.data) });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => billingApi.updateStatus(id, status),
    onSuccess: () => { toast.success('Estado actualizado'); qc.invalidateQueries({ queryKey: ['invoices'] }); qc.invalidateQueries({ queryKey: ['billing-stats'] }); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => billingApi.create(data),
    onSuccess: () => { toast.success('Factura creada'); qc.invalidateQueries({ queryKey: ['invoices'] }); setShowModal(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div>
      <Header
        title="Facturación"
        subtitle="Remitos, facturas y notas de crédito"
        actions={<button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Nueva Factura</button>}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <DollarSign className="w-5 h-5 text-green-400" />
            <p className="text-2xl font-bold text-white">{formatMoney(stats?.monthly?._sum?.total)}</p>
            <p className="text-sm text-slate-400">Facturado este mes ({stats?.monthly?._count || 0})</p>
          </div>
          <div className="stat-card">
            <Clock className="w-5 h-5 text-blue-400" />
            <p className="text-2xl font-bold text-white">{formatMoney(stats?.pending?._sum?.total)}</p>
            <p className="text-sm text-slate-400">Pendiente de cobro ({stats?.pending?._count || 0})</p>
          </div>
          <div className="stat-card">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-2xl font-bold text-white">{formatMoney(stats?.overdue?._sum?.total)}</p>
            <p className="text-sm text-slate-400">Vencidas ({stats?.overdue?._count || 0})</p>
          </div>
          <div className="stat-card">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-2xl font-bold text-white">{formatMoney(stats?.collected?._sum?.total)}</p>
            <p className="text-sm text-slate-400">Cobrado ({stats?.collected?._count || 0})</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-48">
            <option value="">Todos</option>
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
              {isLoading ? (
                <tr><td colSpan={10} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : data?.data?.map((inv: any) => {
                const st = INVOICE_STATUS_MAP[inv.status] || { label: inv.status, cls: 'badge-gray' };
                return (
                  <tr key={inv.id} className="table-row">
                    <td className="px-4 py-3"><p className="font-mono text-sm font-medium text-white">{inv.numero}</p></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-300">{inv.client?.razonSocial}</p>
                      <p className="text-xs text-slate-500">{inv.client?.cuit}</p>
                    </td>
                    <td className="px-4 py-3"><span className="badge badge-gray">{inv.tipo?.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{formatDate(inv.fechaEmision)}</td>
                    <td className="px-4 py-3">
                      <span className={inv.fechaVencimiento && new Date(inv.fechaVencimiento) < new Date() ? 'text-red-400 text-xs font-medium' : 'text-xs text-slate-400'}>
                        {formatDate(inv.fechaVencimiento)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-300">{formatMoney(inv.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-400">{formatMoney(inv.iva)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-white">{formatMoney(inv.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => updateMutation.mutate({ id: inv.id, status: e.target.value })}
                        className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300"
                      >
                        {Object.entries(INVOICE_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-sm text-slate-400">Total: {data.total} facturas</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <InvoiceModal onClose={() => setShowModal(false)} onSave={(d: any) => createMutation.mutate(d)} />}
    </div>
  );
}

function InvoiceModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const { data: clients } = useQuery({ queryKey: ['clients-inv'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const [form, setForm] = useState<any>({ tipo: 'FACTURA_A', items: [{ descripcion: '', cantidad: 1, precioUnit: 0 }] });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const subtotal = form.items.reduce((s: number, i: any) => s + (Number(i.cantidad) * Number(i.precioUnit)), 0);
  const iva = form.tipo === 'FACTURA_A' ? subtotal * 0.21 : 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3"><Receipt className="w-5 h-5 text-blue-400" /><h2 className="text-lg font-semibold text-white">Nueva Factura</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Cliente *</label>
              <select value={form.clientId || ''} onChange={(e) => set('clientId', e.target.value)} className="input">
                <option value="">Seleccionar...</option>
                {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
              </select>
            </div>
            <div><label className="label">Tipo de comprobante</label>
              <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input">
                <option value="FACTURA_A">Factura A</option>
                <option value="FACTURA_B">Factura B</option>
                <option value="FACTURA_C">Factura C</option>
                <option value="REMITO">Remito</option>
              </select>
            </div>
            <div><label className="label">Fecha de vencimiento</label>
              <input type="date" value={form.fechaVencimiento || ''} onChange={(e) => set('fechaVencimiento', e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Items</label>
            {form.items.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input value={item.descripcion} onChange={(e) => { const items = [...form.items]; items[idx].descripcion = e.target.value; set('items', items); }} className="input flex-1" placeholder="Descripción" />
                <input type="number" value={item.cantidad} onChange={(e) => { const items = [...form.items]; items[idx].cantidad = Number(e.target.value); set('items', items); }} className="input w-20" placeholder="Cant." />
                <input type="number" value={item.precioUnit} onChange={(e) => { const items = [...form.items]; items[idx].precioUnit = Number(e.target.value); set('items', items); }} className="input w-32" placeholder="Precio unit." />
              </div>
            ))}
            <button onClick={() => set('items', [...form.items, { descripcion: '', cantidad: 1, precioUnit: 0 }])} className="btn-secondary py-1 text-xs mt-1">+ Agregar ítem</button>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-right space-y-1">
            <p className="text-slate-400 text-sm">Subtotal: <strong className="text-white">{formatMoney(subtotal)}</strong></p>
            <p className="text-slate-400 text-sm">IVA (21%): <strong className="text-white">{formatMoney(iva)}</strong></p>
            <p className="text-lg font-bold text-white">Total: {formatMoney(subtotal + iva)}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={() => onSave(form)} className="btn-primary">Crear Factura</button>
        </div>
      </div>
    </div>
  );
}
