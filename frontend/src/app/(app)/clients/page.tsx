'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit2, Trash2, Eye, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { ClientModal } from '@/components/clients/ClientModal';
import { ContractModal } from '@/components/clients/ContractModal';
import { formatMoney } from '@/lib/utils';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [contractClient, setContractClient] = useState<any>(null);
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

  const handleEdit = (client: any) => { setEditingClient(client); setShowClientModal(true); };
  const handleNewClient = () => { setEditingClient(null); setShowClientModal(true); };
  const handleNewContract = (client: any) => { setContractClient(client); setShowContractModal(true); };

  return (
    <div>
      <Header
        title="Gestión de Clientes & Órdenes de Compra (OC)"
        subtitle={`${data?.total || 0} clientes registrados en sistema`}
        actions={
          <button onClick={handleNewClient} className="btn-primary">
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
                <th className="px-4 py-3 text-left">Órden de Compra (OC) Activa & Consumo</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Localidad</th>
                <th className="px-4 py-3 text-left">Viajes Total</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando clientes...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                  <p>No se encontraron clientes</p>
                </td></tr>
              ) : data?.data?.map((client: any) => {
                const activeContract = client.contracts?.find((c: any) => c.status === 'ACTIVA') || client.contracts?.[0];
                const totalAllowed = activeContract?.cantidadViajes ? Number(activeContract.cantidadViajes) : null;
                const executedTrips = activeContract?.viajesEjecutados ?? activeContract?._count?.trips ?? 0;
                const remainingTrips = totalAllowed ? Math.max(0, totalAllowed - executedTrips) : null;
                const pctConsumido = totalAllowed ? Math.min(100, Math.round((executedTrips / totalAllowed) * 100)) : 0;

                const isCompleted = totalAllowed && executedTrips >= totalAllowed;
                const isNearExhausted = totalAllowed && remainingTrips !== null && remainingTrips <= 5 && !isCompleted;

                return (
                  <tr key={client.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{client.razonSocial}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{client.cuit}</p>
                    </td>

                    {/* Active OC and Progress Bar */}
                    <td className="px-4 py-3">
                      {activeContract ? (
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="badge badge-blue text-[11px] font-bold flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> {activeContract.numero}
                            </span>
                            {isCompleted ? (
                              <span className="badge badge-red text-[10px] font-bold">🔴 AGOTADA</span>
                            ) : isNearExhausted ? (
                              <span className="badge badge-yellow text-[10px] font-bold">🟡 POR AGOTARSE</span>
                            ) : (
                              <span className="badge badge-green text-[10px] font-semibold">🟢 ACTIVA</span>
                            )}
                          </div>

                          {/* Consumo de Viajes */}
                          {totalAllowed ? (
                            <div>
                              <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">
                                <span>{executedTrips} / {totalAllowed} viajes</span>
                                <span className="font-bold text-slate-900 dark:text-white">{remainingTrips} restantes ({pctConsumido}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full transition-all ${isCompleted ? 'bg-red-500' : isNearExhausted ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${pctConsumido}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-600 dark:text-slate-400">Sin límite de viajes</p>
                          )}

                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Base: {formatMoney(activeContract.tarifaBase)} {activeContract.pesoMinimoKg ? `(${activeContract.pesoMinimoKg / 1000} Tn)` : ''}
                            {activeContract.tarifaExcedentePorTn ? ` + ${formatMoney(activeContract.tarifaExcedentePorTn)}/Tn extra` : ''}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Sin OC cargada</span>
                          <button onClick={() => handleNewContract(client)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-0.5">
                            <Plus className="w-3 h-3" /> Cargar OC
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {client.telefono && <p className="flex items-center gap-1 text-slate-800 dark:text-slate-300 text-xs"><Phone className="w-3 h-3 text-slate-400" /> {client.telefono}</p>}
                        {client.email && <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs"><Mail className="w-3 h-3 text-slate-400" /> {client.email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 text-slate-800 dark:text-slate-300 text-xs"><MapPin className="w-3 h-3 text-slate-400" /> {client.ciudad}, {client.provincia}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-800 dark:text-slate-300 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> {client._count?.trips || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleNewContract(client)} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors" title="Nueva Órden de Compra (OC)">
                          <Plus className="w-4 h-4" />
                        </button>
                        <a href={`/clients/${client.id}`} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors" title="Ver detalle e historial OCs">
                          <Eye className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleEdit(client)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-500/10 rounded transition-colors" title="Editar cliente">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar a ${client.razonSocial}?`)) deleteMutation.mutate(client.id); }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors" title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">Mostrando {(page - 1) * 15 + 1} - {Math.min(page * 15, data.total)} de {data.total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1 px-3 disabled:opacity-40">Anterior</button>
                <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">Pág. {page}/{data.totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary py-1 px-3 disabled:opacity-40">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showClientModal && <ClientModal client={editingClient} onClose={() => setShowClientModal(false)} />}
      {showContractModal && contractClient && <ContractModal clientId={contractClient.id} onClose={() => setShowContractModal(false)} />}
    </div>
  );
}
