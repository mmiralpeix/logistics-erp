'use client';
import { Bell, Search, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { data: alerts } = useQuery({
    queryKey: ['expiring-alerts'],
    queryFn: () => dashboardApi.getExpiringAlerts().then((r) => r.data),
    refetchInterval: 300000,
  });

  const alertCount = (alerts?.vehicles?.length || 0) + (alerts?.drivers?.length || 0);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {actions && <div className="flex items-center gap-2">{actions}</div>}

          <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
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
