'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Truck, Eye, EyeOff, Lock, Mail, Sun, Moon, ShieldCheck, Activity, Award, ArrowRight, UserCheck, Scale, MapPin } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import Image from 'next/image';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@logistics.com', password: 'Admin123!' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`¡Bienvenido al sistema, ${res.data.user.firstName}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales inválidas');
    }
  };

  const fillQuickLogin = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
      {/* LEFT HERO SECTION (IMAGE & BRANDING) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 select-none border-r border-slate-800">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/logistics_hero_bg.png"
            alt="Logistics Terminal Sunset"
            fill
            priority
            className="object-cover object-center scale-105 transition-transform duration-10000 ease-out hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-blue-950/30 mix-blend-multiply" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 shadow-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                LogisticsPro <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">ERP v2.4</span>
              </h1>
              <p className="text-xs text-slate-300 font-medium">Gestión Integral de Flotas & Minería</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Servidores Online
            </span>
          </div>
        </div>

        {/* Middle Value Proposition Hero */}
        <div className="relative z-10 max-w-xl my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Plataforma Logística Empresarial
          </div>

          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
            Control Total de tu Flota <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              en Tiempo Real.
            </span>
          </h2>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed font-normal">
            Trazabilidad completa de cargas mineras, salmuera, báscula de balanza, remitos digitales y certificaciones de servicios AFIP automatizadas.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">GPS 24/7</p>
                <p className="text-[11px] text-slate-400">Rastreo en ruta</p>
              </div>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <Scale className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Balanza Neto</p>
                <p className="text-[11px] text-slate-400">Remito & Toneladas</p>
              </div>
            </div>
            <div className="bg-slate-900/70 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Certificación</p>
                <p className="text-[11px] text-slate-400">Facturación AFIP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="relative z-10 grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
          <div>
            <p className="text-2xl font-black text-white">+50,000 Tn</p>
            <p className="text-xs text-slate-400 font-medium">Carga Minera Certificada</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">99.8%</p>
            <p className="text-xs text-slate-400 font-medium">Disponibilidad Operativa</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">100%</p>
            <p className="text-xs text-slate-400 font-medium">Cumplimiento AFIP CAE</p>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN FORM SECTION */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between p-6 sm:p-12 bg-slate-950 dark:bg-slate-950 relative z-10 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base">LogisticsPro</span>
          </div>

          <button
            onClick={toggleTheme}
            className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 flex items-center gap-2 text-xs font-semibold"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>

        {/* Login Card Form */}
        <div className="max-w-md w-full mx-auto my-auto space-y-8 py-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
              <UserCheck className="w-3.5 h-3.5" /> Acceso al Sistema
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Iniciar Sesión</h2>
            <p className="text-slate-400 text-sm">Ingresá tus credenciales corporativas para gestionar la logística.</p>
          </div>

          {/* Quick Login Profiles */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perfiles Rápidos Demo:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin@logistics.com', 'Admin123!')}
                className="p-2.5 bg-slate-900 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-blue-400">Admin</p>
                <p className="text-[10px] text-slate-500">Acceso Total</p>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('ops@logistics.com', 'Ops123!')}
                className="p-2.5 bg-slate-900 hover:bg-emerald-600/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-emerald-400">Operaciones</p>
                <p className="text-[10px] text-slate-500">Gestor de Flota</p>
              </button>
              <button
                type="button"
                onClick={() => fillQuickLogin('chofer@logistics.com', 'Driver123!')}
                className="p-2.5 bg-slate-900 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-amber-400">Chofer</p>
                <p className="text-[10px] text-slate-500">Despacho</p>
              </button>
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@logistics.com"
                  className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Contraseña</label>
                <span className="text-xs text-blue-400 hover:underline cursor-pointer">¿Olvidaste tu clave?</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-800 rounded-xl px-4 py-3 pl-10 pr-10 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Ingresando al sistema...</span>
              ) : (
                <>
                  <span>Ingresar a LogisticsPro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LogisticsPro ERP Inc. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
