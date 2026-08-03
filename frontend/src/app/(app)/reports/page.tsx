'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { reportsApi } from '@/lib/api';
import { FileText, BookOpen, Clock, Download, Sparkles, Printer, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// Phase 4 Report Components
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import { ReportTemplatesList } from '@/components/reports/ReportTemplatesList';
import { ReportSchedulesList } from '@/components/reports/ReportSchedulesList';
import { ReportPreviewModal } from '@/components/reports/ReportPreviewModal';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'schedules'>('builder');

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState<{ reportData: any; config: any } | null>(null);

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
        subtitle="Diseñador visual de informes, resumen por IA, biblioteca de plantillas y envíos automáticos"
        actions={
          <div className="flex items-center gap-2">
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
            <FileText className="w-4 h-4" /> Diseñador & Generador Visual
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

        {/* TAB 2: TEMPLATES & SAVED */}
        {activeTab === 'templates' && (
          <ReportTemplatesList
            onSelectTemplate={(template) => {
              setActiveTab('builder');
              toast.success(`Plantilla "${template.nombre}" cargada en el diseñador`);
            }}
          />
        )}

        {/* TAB 3: SCHEDULES */}
        {activeTab === 'schedules' && <ReportSchedulesList />}
      </div>

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
