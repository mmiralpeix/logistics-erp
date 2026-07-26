'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { CheckCircle, XCircle, Loader2, ArrowRight, Truck } from 'lucide-react';
import Link from 'next/link';

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('El enlace de activación es inválido o no contiene un token.');
      return;
    }

    authApi.activateAccount(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || '¡Cuenta activada exitosamente!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Error al activar la cuenta. El enlace ha expirado.');
      });
  }, [token]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
      <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
        <Truck className="w-6 h-6" />
      </div>

      {status === 'loading' && (
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-white">Verificando Token de Activación...</h2>
          <p className="text-xs text-slate-400">Por favor aguarde un instante mientras validamos sus credenciales corporativas.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">¡Cuenta Activada!</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <div className="pt-4">
            <Link
              href="/login"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>Iniciar Sesión Ahora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black text-white">Error de Activación</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          <div className="pt-4">
            <Link
              href="/login"
              className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all block"
            >
              Volver al Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-blue-500 animate-spin" />}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}
