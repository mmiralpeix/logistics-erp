'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
    if (token) router.replace('/dashboard');
    else router.replace('/login');
  }, [router]);
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Cargando LogisticsPro ERP...</p>
      </div>
    </div>
  );
}
