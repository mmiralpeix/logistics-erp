'use client';
import { useState } from 'react';
import { Shield, User, Mail, Lock, Phone, X, Check } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/auth';

interface UserModalProps {
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function UserModal({ initialData, onClose, onSave }: UserModalProps) {
  const [form, setForm] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'OPERATIONS_MANAGER',
    phone: initialData?.phone || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (key: string, val: any) => {
    setForm({ ...form, [key]: val });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!form.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El correo electrónico es obligatorio';
    if (!initialData && !form.password) newErrors.password = 'La contraseña inicial es obligatoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: any = { ...form };
    if (initialData && !payload.password) {
      delete payload.password; // Don't send empty password when editing
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Editar Usuario / Permisos' : 'Dar de Alta Nuevo Usuario'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? 'Modifique el rol y los datos del empleado' : 'Cargue los datos corporativos del nuevo integrante'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Carlos"
                className="input w-full text-sm"
              />
              {errors.firstName && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Apellido *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Gómez"
                className="input w-full text-sm"
              />
              {errors.lastName && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico Corporativo *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="cgomez@logistics.com"
                className="input w-full text-sm pl-9"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {initialData ? 'Nueva Contraseña (dejar en blanco para mantener actual)' : 'Contraseña Inicial *'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                className="input w-full text-sm pl-9"
              />
            </div>
            {errors.password && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Rol y Permisos en el ERP *
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={form.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className="input w-full text-sm pl-9 font-medium"
              >
                <option value="SUPER_ADMIN">Super Administrador — Acceso Total</option>
                <option value="ADMIN">Administrador — Gestión Global</option>
                <option value="OPERATIONS_MANAGER">Gerente de Operaciones — Flota & Viajes</option>
                <option value="DISPATCHER">Despachante — Planificación Logística</option>
                <option value="DRIVER">Chofer / Conductor — Hoja de Ruta</option>
                <option value="ACCOUNTANT">Contabilidad — Facturación & Cobros</option>
                <option value="VIEWER">Solo Lectura — Auditoría</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Teléfono de Contacto (Opcional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+54 9 11 4567-8901"
                className="input w-full text-sm pl-9"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary text-sm px-5 py-2 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Guardar Cambios' : 'Dar de Alta Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
