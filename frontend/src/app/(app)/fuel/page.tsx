'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FuelPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/consumables');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-slate-500 dark:text-slate-400">Redirigiendo a Consumibles...</p>
    </div>
  );
}
