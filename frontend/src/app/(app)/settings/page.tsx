'use client';
import { Header } from '@/components/layout/Header';
import { Building2, Bell, Shield, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div>
      <Header title="Configuración del Sistema" subtitle="Parámetros generales y preferencias" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="section-title">Datos de la Empresa</h3>
            </div>
            <div className="space-y-3">
              <div><label className="label">Razón Social</label><input className="input" defaultValue="Transportes del Sur Patagónico S.A." /></div>
              <div><label className="label">CUIT</label><input className="input" defaultValue="30-71234500-1" /></div>
              <div><label className="label">Domicilio fiscal</label><input className="input" defaultValue="Av. Hipólito Yrigoyen 1234, Comodoro Rivadavia" /></div>
              <div><label className="label">Teléfono</label><input className="input" defaultValue="0297-444-1234" /></div>
              <div><label className="label">Email</label><input className="input" defaultValue="info@transportesdelsur.com.ar" /></div>
              <button className="btn-primary mt-2">Guardar cambios</button>
            </div>
          </div>

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
              <a href="http://localhost:3001/api/docs" target="_blank" className="btn-secondary w-full justify-center text-xs py-2">Ver Swagger API</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
