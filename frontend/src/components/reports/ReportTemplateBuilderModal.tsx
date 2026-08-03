'use client';
import { useState } from 'react';
import { X, Image as ImageIcon, Palette, Layout, BarChart2, PieChart, LineChart, Shield, Check } from 'lucide-react';

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
}

interface Props {
  initialConfig: ReportConfig;
  onClose: () => void;
  onApply: (config: ReportConfig) => void;
}

export function ReportTemplateBuilderModal({ initialConfig, onClose, onApply }: Props) {
  const [config, setConfig] = useState<ReportConfig>(initialConfig);

  const THEMES = [
    { id: 'blue', label: 'Azul Corporativo', bg: 'bg-blue-600', text: 'text-blue-600' },
    { id: 'slate', label: 'Gris Premium', bg: 'bg-slate-800', text: 'text-slate-800' },
    { id: 'emerald', label: 'Verde Sustentable', bg: 'bg-emerald-600', text: 'text-emerald-600' },
    { id: 'purple', label: 'Púrpura Logístico', bg: 'bg-purple-600', text: 'text-purple-600' },
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Diseñador & Personalizador de Reporte Visual</h2>
              <p className="text-xs text-slate-500">Configura logotipos, tema de color y módulos gráficos ejecutivos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs overflow-y-auto max-h-[80vh]">
          {/* Section 1: Branding & Logos */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Identidad Visual & Logotipos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">URL Logo Empresa Transportista</label>
                <input
                  type="text"
                  value={config.companyLogo}
                  onChange={(e) => setConfig({ ...config, companyLogo: e.target.value })}
                  className="input font-mono"
                  placeholder="https://ejemplo.com/logo-empresa.png"
                />
              </div>

              <div>
                <label className="label">URL Logo Cliente Empresarial (Opcional)</label>
                <input
                  type="text"
                  value={config.clientLogo}
                  onChange={(e) => setConfig({ ...config, clientLogo: e.target.value })}
                  className="input font-mono"
                  placeholder="https://ejemplo.com/logo-cliente.png"
                />
              </div>
            </div>

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
          </div>

          {/* Section 2: Color Theme */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-purple-600" /> Paleta de Colores de Presentación
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
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

          {/* Section 3: Visual Graphic Modules */}
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
