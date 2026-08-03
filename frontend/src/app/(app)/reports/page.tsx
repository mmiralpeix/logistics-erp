'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { reportsApi } from '@/lib/api';
import { FileText, BookOpen, Clock, Download, Palette, Printer, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// Report Components
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportTemplatesList } from '@/components/reports/ReportTemplatesList';
import { ReportSchedulesList } from '@/components/reports/ReportSchedulesList';
import { ReportPreviewModal } from '@/components/reports/ReportPreviewModal';
import { ReportTemplateBuilderModal, ReportConfig } from '@/components/reports/ReportTemplateBuilderModal';
import { ReportVisualViewer } from '@/components/reports/ReportVisualViewer';

const defaultConfig: ReportConfig = {
  companyLogo: '',
  clientLogo: '',
  reportTitle: 'Informe Ejecutivo de Operaciones & Flota',
  reportSubtitle: 'Resumen Operativo, Consumo Diésel, Neumáticos y Finanzas',
  theme: 'blue',
  showKpiSummary: true,
  showFinancialChart: true,
  showFleetChart: true,
  showFuelChart: true,
  showTireChart: true,
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'schedules' | 'visual'>('builder');
  const [previewModal, setPreviewModal] = useState<{ reportData: any; config: any } | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig>(defaultConfig);

  const handleDownloadTripsExcel = async () => {
    try {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      const res = await reportsApi.downloadTripsExcel(from, to);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Viajes_${from}_al_${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte de Viajes en Excel descargado');
    } catch {
      toast.error('Error al descargar reporte de viajes');
    }
  };

  const handleDownloadFleetExcel = async () => {
    try {
      const res = await reportsApi.downloadFleetExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Estado_Flota_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte de Flota en Excel descargado');
    } catch {
      toast.error('Error al descargar reporte de flota');
    }
  };

  const handleDownloadFuelExcel = async () => {
    try {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const to = new Date().toISOString().slice(0, 10);
      const res = await reportsApi.downloadFuelExcel(from, to);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Control_Combustible_${from}_al_${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte de Combustible descargado');
    } catch {
      toast.error('Error al descargar reporte de combustible');
    }
  };

  return (
    <div>
      <Header
        title="Centro Profesional de Reportes Corporativos"
        subtitle="Diseñador visual de informes, personalizador de logotipos, biblioteca y envíos automáticos"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-md shadow-blue-600/20"
            >
              <Palette className="w-4 h-4" />
              <span>Diseñar Reporte Visual (Logos & Gráficos)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTripsExcel}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel Viajes</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFleetExcel}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Excel Flota</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFuelExcel}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Excel Combustible</span>
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'builder'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Generador de Consultas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'visual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Reporte Visual Corporativo (PDF)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Biblioteca & Plantillas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'schedules'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Envíos Automáticos Programados
          </button>
        </div>

        {/* TAB 1: BUILDER */}
        {activeTab === 'builder' && (
          <ReportBuilder
            onOpenPreview={(reportData, config) => setPreviewModal({ reportData, config })}
          />
        )}

        {/* TAB 2: VISUAL CUSTOM REPORT */}
        {activeTab === 'visual' && (
          <ReportVisualViewer
            config={reportConfig}
            data={{}}
            onBack={() => setShowConfigModal(true)}
          />
        )}

        {/* TAB 3: TEMPLATES & SAVED */}
        {activeTab === 'templates' && (
          <ReportTemplatesList
            onSelectTemplate={(template) => {
              setActiveTab('builder');
              toast.success(`Plantilla "${template.nombre}" cargada en el diseñador`);
            }}
          />
        )}

        {/* TAB 4: SCHEDULES */}
        {activeTab === 'schedules' && <ReportSchedulesList />}
      </div>

      {/* CONFIG BUILDER MODAL */}
      {showConfigModal && (
        <ReportTemplateBuilderModal
          initialConfig={reportConfig}
          onClose={() => setShowConfigModal(false)}
          onApply={(newCfg) => {
            setReportConfig(newCfg);
            setActiveTab('visual');
            toast.success('Plantilla visual configurada exitosamente');
          }}
        />
      )}

      {/* PRINT PREVIEW MODAL */}
      {previewModal && (
        <ReportPreviewModal
          reportData={previewModal.reportData}
          config={previewModal.config}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  );
}
