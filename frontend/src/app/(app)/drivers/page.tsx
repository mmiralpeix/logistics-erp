'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, getExpiryBadge } from '@/lib/utils';
import { Plus, Search, Phone, Mail, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DriverModal } from '@/components/drivers/DriverModal';

export default function DriversPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', search, page],
    queryFn: () => driversApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.remove(id),
    onSuccess: () => { toast.success('Conductor eliminado'); qc.invalidateQueries({ queryKey: ['drivers'] }); },
  });

  return (
    <div>
      <Header
        title="Gestión de Conductores"
        subtitle={`${data?.total || 0} conductores registrados`}
        actions={
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Conductor
          </button>
        }
      />

      <div className="p-6">
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre, DNI, teléfono..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Conductor</th>
                <th className="px-4 py-3 text-left">Contacto</th>
                <th className="px-4 py-3 text-left">Licencia</th>
                <th className="px-4 py-3 text-left">Examen Médico</th>
                <th className="px-4 py-3 text-left">Psicofísico</th>
                <th className="px-4 py-3 text-left">C. Peligrosas</th>
                <th className="px-4 py-3 text-left">Viajes</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando...</td></tr>
              ) : data?.data?.map((driver: any) => {
                const licBadge = getExpiryBadge(driver.licenciaVencimiento);
                const medBadge = getExpiryBadge(driver.examenMedicoVencimiento);
                const psicoBadge = getExpiryBadge(driver.psicofisicoVencimiento);
                return (
                  <tr key={driver.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {driver.firstName[0]}{driver.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{driver.firstName} {driver.lastName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {driver.dni}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {driver.telefono && <p className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-300"><Phone className="w-3 h-3 text-slate-400" /> {driver.telefono}</p>}
                      {driver.email && <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Mail className="w-3 h-3 text-slate-400" /> {driver.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="badge badge-gray text-xs mr-1">{driver.licenciaTipo}</span>
                        <span className={licBadge.cls}>{licBadge.label}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(driver.licenciaVencimiento)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={medBadge.cls}>{medBadge.label}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(driver.examenMedicoVencimiento)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={psicoBadge.cls}>{psicoBadge.label}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(driver.psicofisicoVencimiento)}</p>
                    </td>
                    <td className="px-4 py-3">
                      {driver.habilitadoCargasPeligrosas ? (
                        <div>
                          <span className="badge badge-green text-xs">Habilitado</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDate(driver.certificadoCargasPeligrosas)}</p>
                        </div>
                      ) : (
                        <span className="badge badge-gray">No habilitado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 dark:text-slate-300">{driver._count?.trips || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(driver); setShowModal(true); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-500/10 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if (confirm(`¿Eliminar a ${driver.firstName} ${driver.lastName}?`)) deleteMutation.mutate(driver.id); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <DriverModal driver={editing} onClose={() => setShowModal(false)} />}
    </div>
  );
}
