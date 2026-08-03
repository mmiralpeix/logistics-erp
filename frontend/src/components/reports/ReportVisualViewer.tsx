'use client';
import { useState } from 'react';
import { ReportConfig } from './ReportTemplateBuilderModal';
import { formatMoney } from '@/lib/utils';
import { Printer, ArrowLeft, Upload, Edit3, Check, Trash2, FileText, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import toast from 'react-hot-toast';

interface Props {
  config: ReportConfig;
  data: any;
  onBack: () => void;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function ReportVisualViewer({ config: initialConfig, data, onBack }: Props) {
  // Local state to allow typing and modifying non-numeric sections on the fly
  const [localConfig, setLocalConfig] = useState<ReportConfig>({
    customNotes: 'Se adjuntan los registros operativos y estados contables para revisión mensual.',
    sectionTripsTitle: 'Anexo I: Detalle Operativo de Viajes & Fletes',
    sectionMaintenanceTitle: 'Anexo II: Mantenimiento & Salud de Vehículos',
    sectionTiresTitle: 'Anexo III: Gestión de Neumáticos & Métrica CPK',
    signatureLeftTitle: 'Firma Responsable Operativo',
    signatureLeftSubtitle: 'Jefe de Operaciones LogisticsPro',
    signatureRightTitle: 'Firma Gerencia General',
    signatureRightSubtitle: 'Aprobación Corporativa',
    footerText: 'LogisticsPro ERP — Documento Confidencial de Gestión Integral',
    ...initialConfig,
  });

  const [isEditMode, setIsEditMode] = useState(true);

  const financialData = [
    { mes: 'Ene', facturacion: 14500000, costos: 9800000 },
    { mes: 'Feb', facturacion: 16200000, costos: 10500000 },
    { mes: 'Mar', facturacion: 15800000, costos: 10100000 },
    { mes: 'Abr', facturacion: 18400000, costos: 11200000 },
    { mes: 'May', facturacion: 19100000, costos: 12000000 },
    { mes: 'Jun', facturacion: 21500000, costos: 13100000 },
  ];

  const fleetData = [
    { name: 'Disponibles', value: 18 },
    { name: 'En Viaje', value: 12 },
    { name: 'En Taller', value: 5 },
  ];

  const fuelData = [
    { semana: 'Sem 1', rendimiento: 3.1 },
    { semana: 'Sem 2', rendimiento: 3.3 },
    { semana: 'Sem 3', rendimiento: 3.4 },
    { semana: 'Sem 4', rendimiento: 3.6 },
  ];

  const tireHealth = [
    { codigo: 'T-000001', marca: 'Pirelli', vehiculo: 'AH551ZH', salud: 85, mm: 11.2 },
    { codigo: 'T-000002', marca: 'Michelin', vehiculo: 'AH551ZF', salud: 92, mm: 12.5 },
    { codigo: 'T-000003', marca: 'Bridgestone', vehiculo: 'AH551ZI', salud: 64, mm: 7.8 },
    { codigo: 'T-000004', marca: 'Goodyear', vehiculo: 'AH551ZJ', salud: 45, mm: 5.2 },
  ];

  const themeClass =
    localConfig.theme === 'blue' ? 'border-t-blue-600' :
    localConfig.theme === 'emerald' ? 'border-t-emerald-600' :
    localConfig.theme === 'purple' ? 'border-t-purple-600' : 'border-t-slate-800';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'companyLogo' | 'clientLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccione un archivo de imagen válido');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setLocalConfig((prev) => ({ ...prev, [key]: result }));
        toast.success(`Logo ${key === 'companyLogo' ? 'Empresa' : 'Cliente'} actualizado`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <button onClick={onBack} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Volver a Ajustes
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 font-bold ${
              isEditMode ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300' : ''
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? 'Edición Interactiva Activa' : 'Activar Edición de Textos'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF Corporativo
          </button>
        </div>
      </div>

      {/* Printable Visual Report Document */}
      <div className={`card p-8 bg-white dark:bg-slate-900 space-y-8 border-t-8 ${themeClass} shadow-xl max-w-5xl mx-auto print:shadow-none print:p-0 print:border-none`}>
        {/* Document Header with Branding Logos */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Company Logo Section */}
            <div className="relative group">
              {localConfig.companyLogo ? (
                <img src={localConfig.companyLogo} alt="Company Logo" className="h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                  LP
                </div>
              )}
              {isEditMode && (
                <label className="absolute -bottom-2 -right-2 p-1 bg-white dark:bg-slate-800 text-blue-600 rounded-full border border-slate-200 dark:border-slate-700 shadow cursor-pointer print:hidden">
                  <Upload className="w-3 h-3" />
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'companyLogo')} className="hidden" />
                </label>
              )}
            </div>

            {/* Editable Title & Subtitle */}
            <div className="flex-1 space-y-1">
              {isEditMode ? (
                <>
                  <input
                    type="text"
                    value={localConfig.reportTitle}
                    onChange={(e) => setLocalConfig({ ...localConfig, reportTitle: e.target.value })}
                    className="w-full text-2xl font-black text-slate-900 dark:text-white border-b border-dashed border-blue-400 bg-transparent focus:outline-none focus:border-blue-600"
                    placeholder="Título del Reporte"
                  />
                  <input
                    type="text"
                    value={localConfig.reportSubtitle}
                    onChange={(e) => setLocalConfig({ ...localConfig, reportSubtitle: e.target.value })}
                    className="w-full text-xs text-slate-500 font-medium border-b border-dashed border-slate-300 bg-transparent focus:outline-none"
                    placeholder="Subtítulo del Reporte"
                  />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{localConfig.reportTitle}</h1>
                  <p className="text-xs text-slate-500 font-medium">{localConfig.reportSubtitle}</p>
                </>
              )}
            </div>
          </div>

          {/* Client Logo Section */}
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Preparado para</span>
            <div className="relative group">
              {localConfig.clientLogo ? (
                <img src={localConfig.clientLogo} alt="Client Logo" className="h-10 object-contain ml-auto" />
              ) : (
                <div className="text-xs font-bold text-slate-400 border border-dashed border-slate-300 px-2 py-1 rounded">
                  + Logo Cliente
                </div>
              )}
              {isEditMode && (
                <label className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 cursor-pointer print:hidden hover:underline">
                  <Upload className="w-3 h-3" /> Subir Logo
                  <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'clientLogo')} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Module 1: KPI Summary */}
        {localConfig.showKpiSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Facturación Total</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">$109.9M</span>
              <span className="text-[11px] text-emerald-600 font-bold">▲ +14.2% vs previo</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Costos Operativos</span>
              <span className="text-xl font-black text-rose-600 block mt-1">$66.7M</span>
              <span className="text-[11px] text-slate-500">60.6% de margen neto</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Eficiencia Diésel</span>
              <span className="text-xl font-black text-blue-600 block mt-1">3.4 km/l</span>
              <span className="text-[11px] text-emerald-600 font-bold">Promedio de flota</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Salud de Neumáticos</span>
              <span className="text-xl font-black text-emerald-600 block mt-1">91.4%</span>
              <span className="text-[11px] text-slate-500">50 neumáticos montados</span>
            </div>
          </div>
        )}

        {/* Module 2: Financial Evolution Chart */}
        {localConfig.showFinancialChart && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Evolución de Facturación vs Costos ($ ARS)</h3>
            <div className="h-64 card p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                  <Legend />
                  <Bar dataKey="facturacion" name="Facturación Bruta" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costos" name="Costos Directos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Module 3 & 4: Fleet Distribution & Fuel Efficiency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {localConfig.showFleetChart && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Distribución de Flota Pesada</h3>
              <div className="h-56 card p-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fleetData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" label>
                      {fleetData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {localConfig.showFuelChart && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Tendencia de Eficiencia Diésel (km/l)</h3>
              <div className="h-56 card p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="semana" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} domain={[2.5, 4.0]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rendimiento" name="Rendimiento (km/l)" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Module 5: Tire Health Indicators */}
        {localConfig.showTireChart && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Estado & Salud de Neumáticos Críticos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {tireHealth.map((t) => (
                <div key={t.codigo} className="p-3 card space-y-2 border-l-4 border-l-blue-600">
                  <div className="flex justify-between font-bold">
                    <span>{t.codigo} ({t.marca})</span>
                    <span className="text-blue-600">{t.salud}% Salud ({t.mm} mm)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.salud >= 70 ? 'bg-emerald-500' : t.salud >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${t.salud}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Editable Notes & Observations Section */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Notas & Observaciones Ejecutivas (Editable)</span>
          </div>

          {isEditMode ? (
            <textarea
              rows={3}
              value={localConfig.customNotes || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, customNotes: e.target.value })}
              className="w-full text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:outline-none focus:border-blue-600 font-medium leading-relaxed"
              placeholder="Escribí observaciones o notas personalizadas..."
            />
          ) : (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
              {localConfig.customNotes}
            </p>
          )}
        </div>

        {/* Signatures Block with Editable Titles */}
        <div className="pt-8 grid grid-cols-2 gap-12 border-t border-slate-200 dark:border-slate-700 text-center">
          <div>
            <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
            {isEditMode ? (
              <input
                type="text"
                value={localConfig.signatureLeftTitle || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, signatureLeftTitle: e.target.value })}
                className="text-center font-extrabold text-xs text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-400 bg-transparent focus:outline-none"
              />
            ) : (
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{localConfig.signatureLeftTitle}</p>
            )}
            <p className="text-[10px] text-slate-400">{localConfig.signatureLeftSubtitle}</p>
          </div>

          <div>
            <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
            {isEditMode ? (
              <input
                type="text"
                value={localConfig.signatureRightTitle || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, signatureRightTitle: e.target.value })}
                className="text-center font-extrabold text-xs text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-400 bg-transparent focus:outline-none"
              />
            ) : (
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{localConfig.signatureRightTitle}</p>
            )}
            <p className="text-[10px] text-slate-400">{localConfig.signatureRightSubtitle}</p>
          </div>
        </div>

        {/* Document Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between text-[11px] text-slate-400">
          {isEditMode ? (
            <input
              type="text"
              value={localConfig.footerText || ''}
              onChange={(e) => setLocalConfig({ ...localConfig, footerText: e.target.value })}
              className="text-slate-400 border-b border-dashed border-slate-300 bg-transparent text-[11px] focus:outline-none w-2/3"
            />
          ) : (
            <span>{localConfig.footerText}</span>
          )}
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}

