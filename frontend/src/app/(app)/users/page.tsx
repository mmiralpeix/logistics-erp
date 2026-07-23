'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.getAll().then((r) => r.data) });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggle(id),
    onSuccess: () => { toast.success('Estado actualizado'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  return (
    <div>
      <Header title="Control de Acceso" subtitle="Usuarios y roles del sistema (RBAC)" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Último acceso</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando...</td></tr>
                : users?.map((u: any) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-600/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-blue">{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.lastLogin) || 'Nunca'}</td>
                    <td className="px-4 py-3">
                      {u.isActive
                        ? <span className="badge badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Activo</span>
                        : <span className="badge badge-red flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Inactivo</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleMutation.mutate(u.id)} className={u.isActive ? 'btn-danger py-1 text-xs' : 'btn-secondary py-1 text-xs'}>
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
