'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carriersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Plus, Search, Building2, Truck, User, Edit2, ChevronDown, ChevronRight, Phone, Mail, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from '@/components/ui/EmptyState';

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
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Razón Social *</label>
              <input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} className="input w-full text-sm font-semibold" placeholder="Ej: SGL Logística SRL" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">CUIT</label>
              <input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} className="input w-full text-sm" placeholder="30-12345678-9" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Contacto Principal</label>
              <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="input w-full text-sm" placeholder="Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input w-full text-sm" placeholder="+54 9 387 555-1234" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full text-sm" placeholder="contacto@sgl.com.ar" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Ciudad</label>
              <input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className="input w-full text-sm" placeholder="Salta" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Provincia</label>
              <input value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} className="input w-full text-sm" placeholder="Salta" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Notas</label>
              <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="input w-full text-sm resize-none" placeholder="Observaciones generales..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary text-sm px-5 py-2">
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuickAddVehicle({ carrierId, onDone }: { carrierId: string; onDone: () => void }) {
  const [patente, setPatente] = useState('');
  const [tipo, setTipo] = useState('');
  const [marca, setMarca] = useState('');
  const mutation = useMutation({
    mutationFn: (data: any) => carriersApi.createVehicle(carrierId, data),
    onSuccess: () => { toast.success('Vehículo agregado'); setPatente(''); setTipo(''); setMarca(''); onDone(); },
    onError: () => toast.error('Error al agregar vehículo'),
  });
  return (
    <div className="flex items-center gap-2 mt-2 animate-fade-in">
      <input value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} className="input text-xs w-28 font-mono font-bold" placeholder="AB 123 CD" />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input text-xs w-32">
        <option value="">Tipo...</option>
        <option value="TRACTOR">Tractor</option>
        <option value="CAMION">Camión</option>
        <option value="SEMIRREMOLQUE">Semirremolque</option>
        <option value="SEMI_CISTERNA">Semi Cisterna</option>
        <option value="BATEA">Batea</option>
        <option value="CARRETON">Carretón</option>
      </select>
      <input value={marca} onChange={(e) => setMarca(e.target.value)} className="input text-xs w-24" placeholder="Marca" />
      <button onClick={() => patente && mutation.mutate({ patente, tipo: tipo || undefined, marca: marca || undefined })} disabled={!patente || mutation.isPending} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function QuickAddDriver({ carrierId, onDone }: { carrierId: string; onDone: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const mutation = useMutation({
    mutationFn: (data: any) => carriersApi.createDriver(carrierId, data),
    onSuccess: () => { toast.success('Chofer agregado'); setFirstName(''); setLastName(''); setDni(''); onDone(); },
    onError: () => toast.error('Error al agregar chofer'),
  });
  return (
    <div className="flex items-center gap-2 mt-2 animate-fade-in">
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input text-xs w-28" placeholder="Nombre" />
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input text-xs w-28" placeholder="Apellido" />
      <input value={dni} onChange={(e) => setDni(e.target.value)} className="input text-xs w-24 font-mono" placeholder="DNI" />
      <button onClick={() => firstName && lastName && mutation.mutate({ firstName, lastName, dni: dni || undefined })} disabled={!firstName || !lastName || mutation.isPending} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function CarrierRow({ carrier }: { carrier: any }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();

  const { data: detail } = useQuery({
    queryKey: ['carrier-detail', carrier.id],
    queryFn: () => carriersApi.getOne(carrier.id).then((r) => r.data),
    enabled: expanded,
  });

  return (
    <>
      <tr className="table-row">
        <td className="px-4 py-3">
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="font-bold text-slate-900 dark:text-white text-sm">{carrier.razonSocial}</p>
          {carrier.cuit && <p className="text-[11px] text-slate-500 font-mono">{carrier.cuit}</p>}
        </td>
        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
          {carrier.contacto && <p className="flex items-center gap-1"><User className="w-3 h-3" /> {carrier.contacto}</p>}
          {carrier.telefono && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {carrier.telefono}</p>}
          {carrier.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {carrier.email}</p>}
        </td>
        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          {carrier.ciudad && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {carrier.ciudad}{carrier.provincia ? `, ${carrier.provincia}` : ''}</p>}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Truck className="w-3.5 h-3.5" /> {carrier._count?.vehicles ?? 0}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              <User className="w-3.5 h-3.5" /> {carrier._count?.drivers ?? 0}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className="badge badge-blue text-xs font-bold">{carrier._count?.trips ?? 0}</span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
        </td>
      </tr>

      {/* Expanded Detail */}
      {expanded && detail && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-b border-slate-200 dark:border-slate-700/50">
            <div className="grid grid-cols-2 gap-6">
              {/* Vehículos */}
              <div>
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Vehículos ({detail.vehicles?.length || 0})
                </h4>
                {detail.vehicles?.length > 0 ? (
                  <div className="space-y-1">
                    {detail.vehicles.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{v.patente}</span>
                        {v.tipo && <span className="badge badge-gray text-[10px]">{v.tipo?.replace('_', ' ')}</span>}
                        {v.marca && <span className="text-slate-500">{v.marca} {v.modelo || ''}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin vehículos registrados</p>
                )}
                <QuickAddVehicle carrierId={carrier.id} onDone={() => qc.invalidateQueries({ queryKey: ['carrier-detail', carrier.id] })} />
              </div>

              {/* Choferes */}
              <div>
                <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Choferes ({detail.drivers?.length || 0})
                </h4>
                {detail.drivers?.length > 0 ? (
                  <div className="space-y-1">
                    {detail.drivers.map((d: any) => (
                      <div key={d.id} className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-900 dark:text-white">{d.firstName} {d.lastName}</span>
                        {d.dni && <span className="text-slate-500 font-mono">DNI {d.dni}</span>}
                        {d.telefono && <span className="text-slate-400">{d.telefono}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sin choferes registrados</p>
                )}
                <QuickAddDriver carrierId={carrier.id} onDone={() => qc.invalidateQueries({ queryKey: ['carrier-detail', carrier.id] })} />
              </div>
            </div>
          </td>
        </tr>
      )}

      {editing && <CarrierModal carrier={carrier} onClose={() => setEditing(false)} />}
    </>
  );
}

export default function CarriersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['carriers', search, page],
    queryFn: () => carriersApi.getAll({ search, page, limit: 20 }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <Header
        title="Operadores Logísticos Externos"
        subtitle="Gestión de transportistas subcontratados, su flota y choferes"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-600/20">
            <Plus className="w-4 h-4" />
            <span>Nuevo Operador</span>
          </button>
        }
      />

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por razón social, CUIT..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 w-full"
          />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left">Operador</th>
                  <th className="px-4 py-3 text-left">Contacto</th>
                  <th className="px-4 py-3 text-left">Ubicación</th>
                  <th className="px-4 py-3 text-center">Flota</th>
                  <th className="px-4 py-3 text-center">Viajes</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-500">Cargando operadores...</td></tr>
                ) : data?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        icon={Building2}
                        title="Sin operadores logísticos"
                        description="No hay transportistas subcontratados registrados en el sistema. Registre su primer operador para asignarle viajes en modalidad tercerizada o enganche."
                        action={
                          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-4 py-2">
                            <Plus className="w-4 h-4" />
                            <span>Registrar Primer Operador</span>
                          </button>
                        }
                      />
                    </td>
                  </tr>
                ) : data?.data?.map((carrier: any) => (
                  <CarrierRow key={carrier.id} carrier={carrier} />
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              <span>Mostrando {data.data.length} de {data.total} operadores</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40">Anterior</button>
                <span>Pág. {page} de {data.totalPages}</span>
                <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-xs px-2.5 py-1 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <CarrierModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
