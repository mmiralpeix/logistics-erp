'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/auth';
import { CheckCircle, XCircle, UserPlus, Search, Shield, Edit, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserModal } from '@/components/users/UserModal';

export default function UsersPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al crear el usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado exitosamente');
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditUserData(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersApi.toggle(id),
    onSuccess: () => {
      toast.success('Estado del usuario actualizado');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const filteredUsers = Array.isArray(users)
    ? users.filter((u: any) => {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const email = u.email.toLowerCase();
        const role = (ROLE_LABELS[u.role] || u.role).toLowerCase();
        return fullName.includes(q) || email.includes(q) || role.includes(q);
      })
    : [];

  return (
    <div>
      <Header title="Control de Acceso" subtitle="Gestión de empleados, usuarios y permisos del sistema (RBAC)" />
      
      <div className="p-6 space-y-4">
        {/* Header Controls: Search & New User Button */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 text-sm w-full"
            />
          </div>

          <button
            onClick={() => {
              setEditUserData(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Usuario</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Usuario / Empleado</th>
                <th className="px-4 py-3 text-left">Rol en ERP</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Último Acceso</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="badge badge-blue flex items-center gap-1.5 w-fit font-medium">
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {u.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(u.lastLogin) || 'Nunca'}
                    </td>

                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="badge badge-green flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="badge badge-red flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditUserData(u);
                          setShowModal(true);
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        className={
                          u.isActive
                            ? 'text-xs font-semibold text-rose-600 hover:underline'
                            : 'text-xs font-semibold text-emerald-600 hover:underline'
                        }
                      >
                        {u.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          initialData={editUserData}
          onClose={() => {
            setShowModal(false);
            setEditUserData(null);
          }}
          onSave={(data) => {
            if (editUserData?.id) {
              updateMutation.mutate({ id: editUserData.id, ...data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </div>
  );
}
