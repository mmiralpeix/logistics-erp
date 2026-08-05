'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carriersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import {
  Plus, Search, Building2, Truck, User, Edit2, Trash2, Phone, Mail, MapPin, X, Eye, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CarrierDetailDrawer } from '@/components/carriers/CarrierDetailDrawer';
import { CarrierSettlementModal } from '@/components/carriers/CarrierSettlementModal';

function CarrierModal({ carrier, onClose }: { carrier?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!carrier;
  const [form, setForm] = useState({
    razonSocial: carrier?.razonSocial || '',
    cuit: carrier?.cuit || '',
    telefono: carrier?.telefono || '',
    email: carrier?.email || '',
    contacto: carrier?.contacto || '',
    domicilio: carrier?.domicilio || '',
    ciudad: carrier?.ciudad || '',
    provincia: carrier?.provincia || '',
    notas: carrier?.notas || '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? carriersApi.update(carrier.id, data) : carriersApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Operador actualizado' : 'Operador creado exitosamente');
      qc.invalidateQueries({ queryKey: ['carriers'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = Array.isArray(err?.response?.data?.message) ? err.response.data.message.join(', ') : err?.response?.data?.message;
      toast.error(msg || 'Error al guardar el operador');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Editar Operador' : 'Nuevo Operador Logístico'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
          className="p-6 space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Razón Social *</label>
              <input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} className="input w-full font-semibold" placeholder="Ej: SGL Logística SRL" required />
            </div>
            <div>
              <label className="label">CUIT</label>
              <input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} className="input w-full" placeholder="30-12345678-9" />
            </div>
            <div>
              <label className="label">Contacto Principal</label>
              <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="input w-full" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input w-full" placeholder="+54 9 387 555-1234" />
            </div>
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" placeholder="contacto@sgl.com.ar" />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className="input w-full" placeholder="Salta" />
            </div>
            <div>
              <label className="label">Provincia</label>
              <input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="input w-full" placeholder="Salta" />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="input w-full resize-none" placeholder="Observaciones generales..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary text-xs px-5 py-2">
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CarriersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selected360Id, setSelected360Id] = useState<string | null>(null);
  const [settlementCarrier, setSettlementCarrier] = useState<any>(null);
  const [editingCarrier, setEditingCarrier] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['carriers', search, page],
    queryFn: () => carriersApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => carriersApi.remove(id),
    onSuccess: () => { toast.success('Operador eliminado'); qc.invalidateQueries({ queryKey: ['carriers'] }); },
    onError: () => toast.error('Error al eliminar operador'),
  });

  return (
    <div>
      <Header
        title="Operadores Logísticos & Transportistas Subcontratados"
        subtitle={`${data?.total || 0} operadores registrados en sistema`}
        actions={
          <button onClick={() => { setEditingCarrier(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Operador
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por razón social, CUIT o contacto..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Razón Social / CUIT</th>
                <th className="px-4 py-3 text-left">Contacto & Localidad</th>
                <th className="px-4 py-3 text-center">Unidades Subcontratadas</th>
                <th className="px-4 py-3 text-center">Choferes Habilitados</th>
                <th className="px-4 py-3 text-right">Acciones 360°</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Cargando operadores logísticos...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                  <p>No se encontraron operadores logísticos</p>
                </td></tr>
              ) : (
                data?.data?.map((carrier: any) => (
                  <tr key={carrier.id} className="table-row">
                    <td className="px-4 py-3">
                      <span className="font-extrabold text-slate-900 dark:text-white">{carrier.razonSocial}</span>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">CUIT: {carrier.cuit || 'Sin CUIT'}</p>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{carrier.contacto || 'Sin contacto'}</p>
                      <p className="text-slate-500">{carrier.ciudad}, {carrier.provincia}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        {carrier.vehicles?.length || carrier._count?.vehicles || 0} equipos
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {carrier.drivers?.length || carrier._count?.drivers || 0} choferes
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelected360Id(carrier.id)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ficha 360°
                        </button>

                        <button
                          onClick={() => setSettlementCarrier(carrier)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Liquidar Fletes
                        </button>

                        <button
                          onClick={() => { setEditingCarrier(carrier); setShowModal(true); }}
                          title="Editar Operador"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => { if (confirm('¿Eliminar este operador?')) deleteMutation.mutate(carrier.id); }}
                          title="Eliminar Operador"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Carrier Create/Edit Modal */}
      {showModal && (
        <CarrierModal carrier={editingCarrier} onClose={() => setShowModal(false)} />
      )}

      {/* Settlement Modal */}
      {settlementCarrier && (
        <CarrierSettlementModal carrier={settlementCarrier} onClose={() => setSettlementCarrier(null)} />
      )}

      {/* Expediente 360° Drawer */}
      <CarrierDetailDrawer
        carrierId={selected360Id}
        onClose={() => setSelected360Id(null)}
      />
    </div>
  );
}
