'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReserveFundsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/maintenance?tab=reserve-funds');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20 text-xs text-slate-400">
      Redirigiendo a Mantenimiento ➔ Fondos de Reserva...
    </div>
  );
}
