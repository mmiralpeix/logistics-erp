'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit2, Trash2, Eye, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { ClientModal } from '@/components/clients/ClientModal';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => clientsApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => { toast.success('Cliente eliminado'); qc.invalidateQueries({ queryKey: ['clients'] }); },
    onError: () => toast.error('Error al eliminar cliente'),
  });

  const handleEdit = (client: any) => { setEditing(client); setShowModal(true); };
  const handleNew = () => { setEditing(null); setShowModal(true); };

  return (
    <div>
      <Header
        title="Gestión de Clientes"
        subtitle={`${data?.total || 0} clientes registrados`}
        actions={
          <button onClick={handleNew} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </button>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por razón social, CUIT o email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Razón Social / CUIT</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Localidad</th>
                <th className="px-4 py-3 text-left">Condición IVA</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Viajes</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No se encontraron clientes</p>
                </td></tr>
              ) : data?.data?.map((client: any) => (
                <tr key={client.id} className="table-row">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{client.razonSocial}</p>
                    <p className="text-xs text-slate-400">{client.cuit}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {client.telefono && <p className="flex items-center gap-1 text-slate-300 text-xs"><Phone className="w-3 h-3" /> {client.telefono}</p>}
                      {client.email && <p className="flex items-center gap-1 text-slate-400 text-xs"><Mail className="w-3 h-3" /> {client.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="flex items-center gap-1 text-slate-300 text-xs"><MapPin className="w-3 h-3" /> {client.ciudad}, {client.provincia}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-gray text-xs">{client.condicionIVA?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={client.categoriaCliente === 'PREMIUM' ? 'badge badge-yellow' : 'badge badge-gray'}>
                      {client.categoriaCliente}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Users className="w-3 h-3" /> {client._count?.trips || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/clients/${client.id}`} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Ver detalle">
                        <Eye className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleEdit(client)} className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`¿Eliminar a ${client.razonSocial}?`)) deleteMutation.mutate(client.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <p className="text-sm text-slate-400">Mostrando {(page - 1) * 15 + 1} - {Math.min(page * 15, data.total)} de {data.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                <span className="px-3 py-1 text-sm text-slate-400">Pág. {page}/{data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && <ClientModal client={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
