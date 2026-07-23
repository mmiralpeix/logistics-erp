'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/lib/auth';
import { authApi } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!isAuthenticated) {
      authApi.getProfile().then((res) => {
        setAuth(res.data, token);
      }).catch(() => {
        router.replace('/login');
      });
    }
  }, [isAuthenticated, router, setAuth]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
