'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Truck, Eye, EyeOff, Lock, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@logistics.com', password: 'Admin123!' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`¡Bienvenido, ${res.data.user.firstName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LogisticsPro</h1>
          <p className="text-slate-400 mt-1 text-sm">Sistema ERP Logístico Empresarial</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('email')} type="email" placeholder="admin@logistics.com" className="input pl-10" autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••••" className="input pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full btn-primary justify-center py-2.5 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</>
              ) : 'Ingresar al Sistema'}
            </button>
          </form>

          {/* Quick credentials */}
          <div className="mt-6 pt-5 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">Credenciales de prueba:</p>
            <div className="space-y-1.5 text-xs">
              {[
                { role: 'Admin', email: 'admin@logistics.com', pass: 'Admin123!' },
                { role: 'Operaciones', email: 'ops@logistics.com', pass: 'Ops123!' },
                { role: 'Despachador', email: 'despacho@logistics.com', pass: 'Ops123!' },
              ].map((cred) => (
                <div key={cred.role} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                  <span className="text-slate-400 font-medium">{cred.role}:</span>
                  <span className="text-slate-300 font-mono">{cred.email}</span>
                  <span className="text-blue-400 font-mono">{cred.pass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 LogisticsPro ERP · Sistema de Gestión de Transporte
        </p>
      </div>
    </div>
  );
}
