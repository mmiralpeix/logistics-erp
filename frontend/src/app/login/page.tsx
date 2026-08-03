'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi, getApiUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { Truck, Eye, EyeOff, Lock, Mail, Sun, Moon, ShieldCheck, Award, ArrowRight, UserCheck, Scale, MapPin, UserPlus, Phone, User } from 'lucide-react';
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

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // 2FA / MFA Verification Modal State
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; pass: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Manual API URL Config Panel
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customApiUrlInput, setCustomApiUrlInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestConnection = async (targetUrl?: string) => {
    const urlToTest = targetUrl || customApiUrlInput || getApiUrl();
    let clean = urlToTest.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';

    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await axios.get(`${clean}/docs`, { timeout: 6000 }).catch(() => null)
        || await axios.get(`${clean}/auth/profile`, { timeout: 6000 }).catch(() => null);

      if (res && (res.status === 200 || res.status === 401)) {
        setConnectionResult({ ok: true, message: `✅ Servidor respondiendo en ${clean} (Status ${res.status})` });
        toast.success(`Conexión exitosa con ${clean}`);
      } else {
        setConnectionResult({ ok: false, message: `⚠️ Servidor respondió en ${clean} pero sin API NestJS válida.` });
        toast.error(`Sin respuesta válida en ${clean}`);
      }
    } catch (err: any) {
      setConnectionResult({ ok: false, message: `❌ No se pudo conectar a ${clean}. Error de red o CORS.` });
      toast.error(`Error de conexión con ${clean}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Self-Registration State
  const [regForm, setRegForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@logistics.com', password: 'Admin123!' },
  });

  const fillQuickLogin = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  const handleSaveApiUrl = () => {
    if (!customApiUrlInput) return;
    let url = customApiUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (!url.endsWith('/api')) {
      url = url.replace(/\/+$/, '') + '/api';
    }
    localStorage.setItem('NEXT_PUBLIC_API_URL', url);
    toast.success(`URL de API actualizada: ${url}`);
    setShowApiConfig(false);
    window.location.reload();
  };

  const handleResetApiUrl = () => {
    localStorage.removeItem('NEXT_PUBLIC_API_URL');
    toast.success('URL restablecida por defecto');
    setShowApiConfig(false);
    window.location.reload();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      
      if (res.data.mfaRequired) {
        setPendingCredentials({ email: data.email, pass: data.password });
        setShowMfaModal(true);
        toast('Verificación 2FA requerida para esta cuenta', {
          icon: '🛡️',
        });
        return;
      }

      const roleLabels: Record<string, string> = {
        SUPER_ADMIN: 'Super Administrador',
        ADMIN: 'Administrador',
        OPERATIONS_MANAGER: 'Gerente de Operaciones',
        DISPATCHER: 'Despachante',
        DRIVER: 'Chofer',
        ACCOUNTANT: 'Contabilidad',
      };

      setAuth(res.data.user, res.data.access_token);
      toast.success(`¡Bienvenido, ${res.data.user.firstName}! Conectado como ${roleLabels[res.data.user.role] || res.data.user.role}`);
      router.push('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setCustomApiUrlInput(getApiUrl());
        setShowApiConfig(true);
        toast.error(`Error de red o CORS al conectar con ${getApiUrl()}. Verifica la URL de tu Backend abajo.`);
      } else {
        const status = err.response.status;
        const data = err.response.data;
        const serverMsg = typeof data === 'object' && data?.message
          ? (Array.isArray(data.message) ? data.message.join(', ') : data.message)
          : null;

        if (status === 401) {
          toast.error(serverMsg || 'Credenciales inválidas. Revisa usuario y contraseña.');
        } else if (status === 404) {
          setShowApiConfig(true);
          toast.error(`Error 404: Endpoint de API no encontrado en ${getApiUrl()}. Ingresa la URL de tu Backend abajo.`);
        } else if (status >= 500) {
          toast.error(`Error ${status} del servidor Backend. (${getApiUrl()})`);
        } else {
          toast.error(serverMsg || `Error de autenticación (${status})`);
        }
      }
    } finally {
        setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.firstName || !regForm.lastName || !regForm.email || !regForm.password) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setRegLoading(true);
    try {
      const res = await authApi.register(regForm);
      if (res.data.activationLink) {
        toast((t) => (
          <div className="space-y-2">
            <p className="font-bold text-white text-xs">📧 Enlace de Activación Simulado (Dev Mode):</p>
            <p className="text-[11px] text-blue-200 break-all">{res.data.activationLink}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = res.data.activationLink;
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold w-full"
            >
              Hacer clic para Activar Ahora
            </button>
          </div>
        ), { duration: 15000 });
      } else {
        toast.success(`¡Cuenta creada! Se ha enviado el correo de activación a ${regForm.email}`);
      }
      setAuthMode('login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al registrar la cuenta');
    } finally {
      setRegLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCredentials || !totpCode) return;
    setMfaLoading(true);
    try {
      const res = await authApi.login(pendingCredentials.email, pendingCredentials.pass, totpCode);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`¡Verificación de 2FA Exitosa! Bienvenido ${res.data.user.firstName}`);
      setShowMfaModal(false);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Código 2FA incorrecto o vencido');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      toast.success(res.data.message || 'Instrucciones enviadas a tu correo electrónico.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar la solicitud');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans">
      {/* LEFT HERO SECTION (IMAGE & BRANDING) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 select-none border-r border-slate-200 dark:border-slate-800">
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

      {/* RIGHT AUTH FORM SECTION (LIGHT MODE DEFAULT) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-between p-6 sm:p-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative z-10 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between w-full">
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Truck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">LogisticsPro</span>
          </div>

          <button
            onClick={toggleTheme}
            className="ml-auto p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>

        {/* Auth Card Container */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6 py-6">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200 dark:bg-blue-600 dark:text-white dark:border-transparent'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                authMode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200 dark:bg-blue-600 dark:text-white dark:border-transparent'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          {authMode === 'login' ? (
            /* MODE 1: LOGIN FORM */
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20">
                  <UserCheck className="w-3.5 h-3.5" /> Acceso al Sistema
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Iniciar Sesión</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Ingresá tus credenciales corporativas para acceder al sistema.</p>
              </div>

              {/* Quick Login Profiles */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Perfiles Rápidos Demo:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('admin@logistics.com', 'Admin123!')}
                    className="p-2.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-600/20 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-xl text-left transition-all group shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Admin</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Acceso Total</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('ops@logistics.com', 'Ops123!')}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-600/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 rounded-xl text-left transition-all group shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Operaciones</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Gestor Flota</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickLogin('chofer@logistics.com', 'Driver123!')}
                    className="p-2.5 bg-slate-50 hover:bg-amber-50 dark:bg-slate-900 dark:hover:bg-amber-600/20 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 rounded-xl text-left transition-all group shadow-sm"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">Chofer</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Despacho</p>
                  </button>
                </div>
              </div>

              {/* Config Servidor API Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCustomApiUrlInput(getApiUrl());
                    setShowApiConfig(!showApiConfig);
                  }}
                  className="text-[11px] text-slate-500 hover:text-blue-500 underline transition-colors flex items-center gap-1"
                >
                  ⚙️ {showApiConfig ? 'Ocultar Servidor API' : `Servidor API (${getApiUrl()})`}
                </button>
              </div>

              {showApiConfig && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                      ⚙️ Configurar URL del Backend API
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestConnection()}
                      disabled={testingConnection}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border border-amber-500/30"
                    >
                      {testingConnection ? '⏳ Probando...' : '⚡ Probar Conexión'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-amber-200/80">
                    Ingresa la URL pública de tu Backend en Railway para conectar la aplicación:
                  </p>
                  <input
                    type="text"
                    value={customApiUrlInput}
                    onChange={(e) => setCustomApiUrlInput(e.target.value)}
                    placeholder="https://tu-backend.up.railway.app/api"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  {connectionResult && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium border ${connectionResult.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'}`}>
                      {connectionResult.message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                    >
                      Guardar URL y Reintentar
                    </button>
                    <button
                      type="button"
                      onClick={handleResetApiUrl}
                      className="py-1.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg transition-colors"
                    >
                      Restablecer
                    </button>
                  </div>
                </div>
              )}

              {/* Main Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="admin@logistics.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      ¿Olvidaste tu clave?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      {...register('password')}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Recordarme en este dispositivo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
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
          ) : (
            /* MODE 2: SELF-REGISTRATION FORM */
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
                  <UserPlus className="w-3.5 h-3.5" /> Alta de Cuenta
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Crear una Cuenta</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs">Registrá tus datos corporativos para solicitar acceso al ERP.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Nombre *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={regForm.firstName}
                        onChange={(e) => setRegForm({ ...regForm, firstName: e.target.value })}
                        placeholder="Juan"
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={regForm.lastName}
                      onChange={(e) => setRegForm({ ...regForm, lastName: e.target.value })}
                      placeholder="Pérez"
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="jperez@empresa.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Repetir Clave *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Teléfono (Opcional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 pt-2"
                >
                  {regLoading ? (
                    <span>Registrando cuenta...</span>
                  ) : (
                    <>
                      <span>Registrarme en LogisticsPro</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LogisticsPro ERP Inc. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* MODAL 1: RECUPERACIÓN DE CONTRASEÑA */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Mail className="w-4 h-4" /> Recuperación de Contraseña
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">¿Olvidaste tu contraseña?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ingresá tu correo corporativo. Te enviaremos un token seguro con vigencia de 15 minutos para restablecer tu clave.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Correo Registrado</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ejemplo@logistics.com"
                  className="input w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VERIFICACIÓN 2FA / TOTP */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" /> Autenticación de Doble Factor
              </div>
              <button
                onClick={() => setShowMfaModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingresá tu Código TOTP</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Abrí la aplicación Google Authenticator o Authy en tu teléfono e ingresá el código dinámico de 6 dígitos.
              </p>
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Código de 6 Dígitos</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="input w-full text-center tracking-[0.5em] font-mono text-2xl font-bold placeholder-slate-300 dark:placeholder-slate-700 py-3"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMfaModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={mfaLoading || totpCode.length < 6}
                  className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {mfaLoading ? 'Verificando...' : 'Verificar e Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
