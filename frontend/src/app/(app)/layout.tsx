'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore, getStoredToken } from '@/lib/auth';
import { authApi } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrate, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) {
      authApi.getProfile().then((res) => {
        hydrate(res.data, token);
      }).catch(() => {
        router.replace('/login');
      });
    }
  }, [isAuthenticated, router, hydrate]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
