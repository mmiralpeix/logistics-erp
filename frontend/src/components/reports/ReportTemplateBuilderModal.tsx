'use client';
import { useState } from 'react';
import { X, Image as ImageIcon, Palette, Layout, BarChart2, PieChart, LineChart, Shield, Check, Upload, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ReportConfig {
  companyLogo: string;
  clientLogo: string;
  reportTitle: string;
  reportSubtitle: string;
  theme: 'blue' | 'slate' | 'emerald' | 'purple';
  showKpiSummary: boolean;
  showFinancialChart: boolean;
  showFleetChart: boolean;
  showFuelChart: boolean;
  showTireChart: boolean;
  // Non-numeric editable text blocks
  customNotes?: string;
  sectionTripsTitle?: string;
  sectionMaintenanceTitle?: string;
  sectionTiresTitle?: string;
  signatureLeftTitle?: string;
  signatureLeftSubtitle?: string;
  signatureRightTitle?: string;
  signatureRightSubtitle?: string;
  footerText?: string;
}

interface Props {
  initialConfig: ReportConfig;
  onClose: () => void;
  onApply: (config: ReportConfig) => void;
}

export function ReportTemplateBuilderModal({ initialConfig, onClose, onApply }: Props) {
  const [config, setConfig] = useState<ReportConfig>({
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

  const THEMES = [
    { id: 'blue', label: 'Azul Corporativo', bg: 'bg-blue-600', text: 'text-blue-600' },
    { id: 'slate', label: 'Gris Premium', bg: 'bg-slate-800', text: 'text-slate-800' },
    { id: 'emerald', label: 'Verde Sustentable', bg: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 'purple', label: 'Púrpura Logístico', bg: 'bg-purple-600', text: 'text-purple-600' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'companyLogo' | 'clientLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Seleccione un archivo de imagen válido (PNG, JPG, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setConfig((prev) => ({ ...prev, [key]: dataUrl }));
        toast.success(`Logo ${key === 'companyLogo' ? 'de Empresa' : 'de Cliente'} cargado`);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-3xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Diseñador & Personalizador de Reporte Visual</h2>
              <p className="text-xs text-slate-500">Configurá logotipos, textos tipiables, temas de color y módulos ejecutivos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs overflow-y-auto max-h-[80vh]">
          {/* Section 1: Branding & Logos */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Identidad Visual & Logotipos Directos (URL o Archivo)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Logo */}
              <div className="space-y-2 card p-3 border border-slate-200 dark:border-slate-800">
                <label className="label font-bold flex items-center justify-between">
                  <span>Logo Empresa Transportista</span>
                  {config.companyLogo && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, companyLogo: '' })}
                      className="text-[10px] text-rose-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" /> Quitar Logo
                    </button>
                  )}
                </label>

                {config.companyLogo ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img src={config.companyLogo} alt="Logo Empresa" className="h-10 max-w-[120px] object-contain" />
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Cargado
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Sin logotipo seleccionado</div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <label className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Subir desde PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'companyLogo')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={config.companyLogo}
                    onChange={(e) => setConfig({ ...config, companyLogo: e.target.value })}
                    className="input font-mono text-[11px] py-1 flex-1"
                    placeholder="o pegar URL https://..."
                  />
                </div>
              </div>

              {/* Client Logo */}
              <div className="space-y-2 card p-3 border border-slate-200 dark:border-slate-800">
                <label className="label font-bold flex items-center justify-between">
                  <span>Logo Cliente / Co-branding (Opcional)</span>
                  {config.clientLogo && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, clientLogo: '' })}
                      className="text-[10px] text-rose-500 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" /> Quitar Logo
                    </button>
                  )}
                </label>

                {config.clientLogo ? (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img src={config.clientLogo} alt="Logo Cliente" className="h-10 max-w-[120px] object-contain" />
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Cargado
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Sin logotipo cliente</div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <label className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    <span>Subir desde PC</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'clientLogo')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={config.clientLogo}
                    onChange={(e) => setConfig({ ...config, clientLogo: e.target.value })}
                    className="input font-mono text-[11px] py-1 flex-1"
                    placeholder="o pegar URL https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Non-Numeric Editable Texts */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Edit3 className="w-4 h-4 text-emerald-600" /> Apartados de Texto Editables / Tipiables
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Título Encabezado del Reporte</label>
                <input
                  type="text"
                  value={config.reportTitle}
                  onChange={(e) => setConfig({ ...config, reportTitle: e.target.value })}
                  className="input font-bold"
                  placeholder="Informe Ejecutivo de Operaciones"
                />
              </div>

              <div>
                <label className="label">Subtítulo / Bajada</label>
                <input
                  type="text"
                  value={config.reportSubtitle}
                  onChange={(e) => setConfig({ ...config, reportSubtitle: e.target.value })}
                  className="input"
                  placeholder="Resumen Operativo & Financiero de Flota"
                />
              </div>
            </div>

            <div>
              <label className="label">Notas, Observaciones & Términos Personalizables</label>
              <textarea
                rows={2}
                value={config.customNotes || ''}
                onChange={(e) => setConfig({ ...config, customNotes: e.target.value })}
                className="input w-full leading-relaxed"
                placeholder="Escribí aquí observaciones ejecutivas, condiciones o notas aclaratorias..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Título Firma Izquierda</label>
                <input
                  type="text"
                  value={config.signatureLeftTitle || ''}
                  onChange={(e) => setConfig({ ...config, signatureLeftTitle: e.target.value })}
                  className="input font-semibold"
                />
              </div>

              <div>
                <label className="label">Título Firma Derecha</label>
                <input
                  type="text"
                  value={config.signatureRightTitle || ''}
                  onChange={(e) => setConfig({ ...config, signatureRightTitle: e.target.value })}
                  className="input font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="label">Texto Nota al Pie (Pie de Página)</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
                className="input font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Section 3: Color Theme */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-600" /> Paleta de Colores de Presentación
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setConfig({ ...config, theme: th.id as any })}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                    config.theme === th.id
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${th.bg} flex-shrink-0`} />
                  <span className="text-slate-800 dark:text-slate-200 text-xs">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Visual Graphic Modules */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-emerald-600" /> Módulos Gráficos Habilitados en la Plantilla
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 card hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Resumen de KPIs Clave</span>
                    <p className="text-[11px] text-slate-500">Facturación, Costos Totales, Rendimiento y Salud de Neumáticos</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showKpiSummary}
                  onChange={(e) => setConfig({ ...config, showKpiSummary: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 card hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Gráfico de Evolución Financiera (Facturación vs Costos)</span>
                    <p className="text-[11px] text-slate-500">Gráfico comparativo de barras de ingresos y egresos</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showFinancialChart}
                  onChange={(e) => setConfig({ ...config, showFinancialChart: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 card hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Gráfico de Distribución de Flota y Viajes</span>
                    <p className="text-[11px] text-slate-500">Gráfico de torta/dona por estado operativo de unidades</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showFleetChart}
                  onChange={(e) => setConfig({ ...config, showFleetChart: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 card hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <LineChart className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Gráfico de Rendimiento Diésel (km/l)</span>
                    <p className="text-[11px] text-slate-500">Tendencia histórica de eficiencia de combustible</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showFuelChart}
                  onChange={(e) => setConfig({ ...config, showFuelChart: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 card hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Semáforo de Salud & Desgaste de Neumáticos</span>
                    <p className="text-[11px] text-slate-500">Barra de vida útil y estado de neumáticos montados</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showTireChart}
                  onChange={(e) => setConfig({ ...config, showTireChart: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button
              type="button"
              onClick={() => { onApply(config); onClose(); }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Aplicar & Generar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

