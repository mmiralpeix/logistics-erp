'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import {
  Plus, Search, Building2, Phone, Mail, MapPin, Edit2, Trash2, Eye,
  FileText, ShieldAlert, ShieldCheck, DollarSign, ListChecks
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ClientModal } from '@/components/clients/ClientModal';
import { ContractModal } from '@/components/clients/ContractModal';
import { ClientDetailDrawer } from '@/components/clients/ClientDetailDrawer';
import { formatMoney } from '@/lib/utils';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedClient360Id, setSelectedClient360Id] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [contractClient, setContractClient] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => clientsApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => { toast.success('Cliente eliminado'); qc.invalidateQueries({ queryKey: ['clients'] }); qc.invalidateQueries({ queryKey: ['clients-select'] }); },
    onError: () => toast.error('Error al eliminar cliente'),
  });

  const handleEdit = (client: any) => { setEditingClient(client); setShowClientModal(true); };
  const handleNewClient = () => { setEditingClient(null); setShowClientModal(true); };
  const handleNewContract = (client: any) => { setContractClient(client); setShowContractModal(true); };

  return (
    <div>
      <Header
        title="Gestión de Clientes, Contratos & Expediente 360°"
        subtitle={`${data?.total || 0} clientes corporativos en sistema`}
        actions={
          <button onClick={handleNewClient} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Cliente
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
              placeholder="Buscar por razón social, CUIT o email..."
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
                <th className="px-4 py-3 text-left">Riesgo & Crédito</th>
                <th className="px-4 py-3 text-left">Órden de Compra (OC) Activa</th>
                <th className="px-4 py-3 text-left">Contacto / Localidad</th>
                <th className="px-4 py-3 text-center">Scoring</th>
                <th className="px-4 py-3 text-right">Acciones 360°</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando clientes corporativos...</td></tr>
              ) : data?.data?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-400 dark:text-slate-600" />
                  <p>No se encontraron clientes</p>
                </td></tr>
              ) : data?.data?.map((client: any) => {
                const activeContract = client.contracts?.find((c: any) => c.status === 'ACTIVA') || client.contracts?.[0];
                const totalAllowed = activeContract?.cantidadViajes ? Number(activeContract.cantidadViajes) : null;
                const executedTrips = activeContract?.viajesEjecutados ?? activeContract?._count?.trips ?? 0;
                const pctConsumido = totalAllowed ? Math.min(100, Math.round((executedTrips / totalAllowed) * 100)) : 0;

                const isBlocked = client.bloqueadoPorRiesgo;

                return (
                  <tr key={client.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{client.razonSocial}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{client.cuit} • {client.condicionIVA}</p>
                    </td>

                    <td className="px-4 py-3">
                      {isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3 h-3" /> Bloqueado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" /> Al Día
                        </span>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">Límite: {client.limiteCredito ? formatMoney(client.limiteCredito) : 'Sin límite'}</p>
                    </td>

                    <td className="px-4 py-3">
                      {activeContract ? (
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{activeContract.numero}</span>
                          {totalAllowed && (
                            <div className="w-32 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div className={`h-full ${pctConsumido >= 90 ? 'bg-rose-600' : 'bg-blue-600'}`} style={{ width: `${pctConsumido}%` }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin OC activa</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{client.contactoPrincipal || 'Sin contacto'}</p>
                      <p>{client.ciudad}, {client.provincia}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {client.scoring || 'A'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedClient360Id(client.id)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ficha 360°
                        </button>
                        <button
                          onClick={() => handleNewContract(client)}
                          title="Gestionar OC"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(client)}
                          title="Editar Cliente"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('¿Eliminar este cliente?')) deleteMutation.mutate(client.id); }}
                          title="Eliminar Cliente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
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
        </div>
      </div>

      {/* Client Edit/Create Modal */}
      {showClientModal && (
        <ClientModal client={editingClient} onClose={() => setShowClientModal(false)} />
      )}

      {/* Contract/OC Modal */}
      {showContractModal && contractClient && (
        <ContractModal clientId={contractClient.id} onClose={() => setShowContractModal(false)} />
      )}

      {/* Expediente 360° Drawer */}
      <ClientDetailDrawer
        clientId={selectedClient360Id}
        onClose={() => setSelectedClient360Id(null)}
      />
    </div>
  );
}
