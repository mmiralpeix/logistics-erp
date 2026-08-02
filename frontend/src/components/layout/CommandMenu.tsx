'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Truck,
  Map,
  Wrench,
  Receipt,
  Users,
  Building2,
  FileText,
  Settings,
  LayoutDashboard,
  ShieldAlert,
  Droplet,
  X,
  ArrowRight,
} from 'lucide-react';

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { title: 'Dashboard Principal', href: '/dashboard', icon: LayoutDashboard, category: 'Navegación' },
  { title: 'Gestión de Viajes & Rutas', href: '/trips', icon: Map, category: 'Operaciones' },
  { title: 'Estado de Flota & Equipos', href: '/vehicles', icon: Truck, category: 'Operaciones' },
  { title: 'Mantenimiento & Pañol (OT)', href: '/maintenance', icon: Wrench, category: 'Mantenimiento' },
  { title: 'Transportistas Tercerizados', href: '/carriers', icon: Building2, category: 'Operaciones' },
  { title: 'Facturación & Tarificación', href: '/billing', icon: Receipt, category: 'Finanzas' },
  { title: 'Gestión de Clientes & Contratos', href: '/clients', icon: Users, category: 'Comercial' },
  { title: 'Cargas Peligrosas (ARBA / UN)', href: '/dangerous-goods', icon: ShieldAlert, category: 'Seguridad' },
  { title: 'Control de Combustible', href: '/fuel', icon: Droplet, category: 'Operaciones' },
  { title: 'Reportes & Exportaciones', href: '/reports', icon: FileText, category: 'Analítica' },
  { title: 'Usuarios & Permisos RBAC', href: '/users', icon: Users, category: 'Administración' },
  { title: 'Configuración del Sistema', href: '/settings', icon: Settings, category: 'Administración' },
];

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = NAV_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulo, pantalla o acción (Ej: Viajes, Flota)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No se encontraron módulos coincidentes con &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800/80 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-colors flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span>Navegar con <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono text-[10px]">Ctrl+K</kbd></span>
          </div>
          <span>Pulsar <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-mono text-[10px]">ESC</kbd> para salir</span>
        </div>
      </div>
    </div>
  );
}
