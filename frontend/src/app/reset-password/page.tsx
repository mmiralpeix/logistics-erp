'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Lock, CheckCircle, ArrowRight, Truck, Loader2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token de restablecimiento inválido o no encontrado');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword(token, password);
      toast.success(res.data.message || 'Contraseña actualizada correctamente');
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
      <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
        <Truck className="w-6 h-6" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-white">Restablecer Contraseña</h2>
        <p className="text-xs text-slate-400">Ingresá tu nueva clave corporativa para volver a acceder al sistema.</p>
      </div>

      {success ? (
        <div className="text-center space-y-4 pt-4">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">¡Contraseña Actualizada!</h3>
          <p className="text-xs text-slate-300">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link
            href="/login"
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all block"
          >
            <span>Ir al Inicio de Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Repetir Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <Suspense fallback={<Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
