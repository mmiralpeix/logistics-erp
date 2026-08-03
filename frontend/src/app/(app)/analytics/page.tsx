'use client';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { analyticsApi } from '@/lib/api';
import { LineChart, GitCompare, Sparkles, Trophy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

// Subcomponents
import { AnalyticsOverviewTab } from '@/components/analytics/AnalyticsOverviewTab';
import { AnalyticsComparativeTab } from '@/components/analytics/AnalyticsComparativeTab';
import { AnalyticsPredictiveTab } from '@/components/analytics/AnalyticsPredictiveTab';
import { AnalyticsVehicleRankingTab } from '@/components/analytics/AnalyticsVehicleRankingTab';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparative' | 'predictive' | 'ranking'>('overview');

  const handleExportExcel = async () => {
    try {
      const res = await analyticsApi.exportAnalyticsExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Tablero_BI_Analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Tablero BI exportado a Excel');
    } catch {
      toast.error('Error al exportar tablero BI');
    }
  };

  return (
    <div>
      <Header
        title="Business Intelligence & Analítica Avanzada"
        subtitle="Inteligencia empresarial, comparativas temporales, proyecciones predictivas y ranking de eficiencia de flota"
        actions={
          <button
            type="button"
            onClick={handleExportExcel}
            className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel BI</span>
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LineChart className="w-4 h-4" /> Tablero Ejecutivo BI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparative')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'comparative'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitCompare className="w-4 h-4" /> Comparativas & Benchmark
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('predictive')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'predictive'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Proyecciones Predictivas IA
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors font-extrabold ${
              activeTab === 'ranking'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" /> Ranking de Eficiencia
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'overview' && <AnalyticsOverviewTab />}
        {activeTab === 'comparative' && <AnalyticsComparativeTab />}
        {activeTab === 'predictive' && <AnalyticsPredictiveTab />}
        {activeTab === 'ranking' && <AnalyticsVehicleRankingTab />}
      </div>
    </div>
  );
}
