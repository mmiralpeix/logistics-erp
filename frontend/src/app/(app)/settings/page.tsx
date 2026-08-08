'use client';
import { Header } from '@/components/layout/Header';
import { getApiUrl, companyApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Bell, Shield, Database } from 'lucide-react';

function CompanyDataCard() {
  const qc = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.getActive().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ values: company ?? undefined });

  const mutation = useMutation({
    mutationFn: (data: any) => companyApi.upsert(data),
    onSuccess: (res) => {
      toast.success('Datos de la empresa guardados');
      qc.setQueryData(['company'], res.data);
      reset(res.data);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar los datos de la empresa'),
  });

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="section-title">Datos de la Empresa</h3>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
      ) : (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          {!company && (
            <p className="text-xs text-amber-600 dark:text-yellow-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
              Todavía no hay datos fiscales cargados para la empresa. Completá y guardá para crearlos.
            </p>
          )}
          <div><label className="label">Razón Social</label><input {...register('razonSocial', { required: true })} className="input" placeholder="Empresa S.A." /></div>
          <div><label className="label">CUIT</label><input {...register('cuit', { required: true })} className="input" placeholder="30-12345678-9" /></div>
          <div><label className="label">Domicilio fiscal</label><input {...register('domicilioFiscal', { required: true })} className="input" /></div>
          <div><label className="label">Teléfono</label><input {...register('telefono')} className="input" /></div>
          <div><label className="label">Email</label><input {...register('email')} className="input" /></div>
          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 disabled:opacity-60">
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <Header title="Configuración del Sistema" subtitle="Parámetros generales y preferencias" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CompanyDataCard />

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-amber-600 dark:text-yellow-400" />
              <h3 className="section-title">Alertas y Notificaciones</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Días anticipación - Documentos', value: 30 },
                { label: 'Días anticipación - Revisiones', value: 15 },
                { label: 'Días anticipación - Mantenimiento', value: 7 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <label className="text-sm text-slate-700 dark:text-slate-300">{item.label}</label>
                  <input type="number" defaultValue={item.value} className="input w-24 text-center" />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-green-400" />
              <h3 className="section-title">Seguridad</h3>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Autenticación JWT', status: '✓ Activa', cls: 'text-emerald-600 dark:text-green-400 font-medium' },
                { label: 'Control de Roles (RBAC)', status: '✓ Activo', cls: 'text-emerald-600 dark:text-green-400 font-medium' },
                { label: 'Auditoría de eventos', status: '✓ Activa', cls: 'text-emerald-600 dark:text-green-400 font-medium' },
                { label: 'Autenticación MFA', status: 'Disponible', cls: 'text-amber-600 dark:text-yellow-400 font-medium' },
                { label: 'Rate limiting', status: '✓ 100 req/min', cls: 'text-emerald-600 dark:text-green-400 font-medium' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className={item.cls}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="section-title">Base de Datos</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Motor</span><span className="text-slate-900 dark:text-white font-medium">PostgreSQL 16</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Cache</span><span className="text-slate-900 dark:text-white font-medium">Redis 7</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">ORM</span><span className="text-slate-900 dark:text-white font-medium">Prisma 5</span></div>
              <div className="flex justify-between"><span className="text-slate-600 dark:text-slate-400">Host</span><span className="text-slate-900 dark:text-white font-medium">postgres:5432</span></div>
            </div>
            <div className="mt-4 space-y-2">
              <a href={`${getApiUrl()}/docs`} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center text-xs py-2">Ver Swagger API</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

