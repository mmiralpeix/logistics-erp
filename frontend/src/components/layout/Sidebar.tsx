'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, ROLE_LABELS } from '@/lib/auth';
import {
  LayoutDashboard, Users, Truck, UserCheck, MapPin, Wrench, Fuel,
  FileText, DollarSign, Receipt, BarChart2, Satellite, Settings,
  ChevronRight, LogOut, Shield, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Resumen ejecutivo' },
  { href: '/clients', icon: Users, label: 'Clientes', description: 'Gestión de clientes' },
  { href: '/vehicles', icon: Truck, label: 'Vehículos', description: 'Flota propia y tercerizada' },
  { href: '/drivers', icon: UserCheck, label: 'Conductores', description: 'Personal de conducción' },
  { href: '/trips', icon: MapPin, label: 'Viajes', description: 'Planificación multidía' },
  { href: '/maintenance', icon: Wrench, label: 'Mantenimiento', description: 'Preventivo y correctivo' },
  { href: '/fuel', icon: Fuel, label: 'Combustible', description: 'Control y rendimiento' },
  { href: '/dangerous-goods', icon: Package, label: 'C. Peligrosas', description: 'Decreto 779/95' },
  { href: '/documents', icon: FileText, label: 'Documentos', description: 'Gestión documental' },
  { href: '/billing', icon: Receipt, label: 'Facturación', description: 'Remitos y facturas' },
  { href: '/reports', icon: BarChart2, label: 'Reportes', description: 'Exportar PDF/Excel' },
  { href: '/gps', icon: Satellite, label: 'GPS', description: 'Rastreo en tiempo real' },
];

const adminItems = [
  { href: '/users', icon: Shield, label: 'Usuarios', description: 'Control de acceso' },
  { href: '/settings', icon: Settings, label: 'Configuración', description: 'Parámetros del sistema' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-white leading-tight">LogisticsPro</h1>
          <p className="text-xs text-slate-500 truncate">ERP Empresarial</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-1">Módulos</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive && 'active')}>
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-500')} />
              <span className="flex-1 min-w-0">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400 flex-shrink-0" />}
            </Link>
          );
        })}

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-4">Administración</p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn('sidebar-link', isActive && 'active')}>
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-400' : 'text-slate-500')} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500 truncate">{ROLE_LABELS[user?.role || ''] || user?.role}</p>
          </div>
          <button onClick={logout} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
