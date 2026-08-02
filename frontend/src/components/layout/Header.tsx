'use client';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useLayoutStore } from '@/lib/layoutStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { toggleMobileMenu } = useLayoutStore();

  const { data: alerts } = useQuery({
    queryKey: ['expiring-alerts'],
    queryFn: () => dashboardApi.getExpiringAlerts().then((r) => r.data),
    refetchInterval: 300000,
  });

  const alertCount = (alerts?.vehicles?.length || 0) + (alerts?.drivers?.length || 0);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex-shrink-0"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">{title}</h1>
            {subtitle && <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            )}
          </button>

          {/* Notifications Button */}
          <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
