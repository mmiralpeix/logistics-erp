'use client';
import { formatDate, formatMoney } from '@/lib/utils';
import { formatCPK } from '@/lib/tire-utils';
import { X, Printer, Download, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface ReportPreviewModalProps {
  reportData: any;
  config: {
    titulo: string;
    categoria: string;
    blocks: any;
  };
  onClose: () => void;
}

export function ReportPreviewModal({ reportData, config, onClose }: ReportPreviewModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const { blocks, titulo, categoria } = config;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:static" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header Actions (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Vista Previa de Impresión / Documento PDF Corporativo
              </h2>
              <p className="text-xs text-slate-500">
                Membrete corporativo listo para imprimir o guardar como PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white text-slate-900 print:p-0 print:overflow-visible">
          {/* Header & Logo */}
          {blocks.showLogo && (
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                  L
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
                    LogisticsPro ERP
                  </h1>
                  <p className="text-xs text-slate-500 font-bold">
                    Sistema de Gestión Integral de Transporte & Logística
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black uppercase text-blue-700 block">
                  {categoria}
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  Fecha: {new Date().toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <h2 className="text-2xl font-black leading-tight text-slate-900">{titulo}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Período: {formatDate(reportData?.periodo?.from)} al {formatDate(reportData?.periodo?.to)}
            </p>
          </div>

          {/* Executive Summary IA */}
          {blocks.showSummary && reportData?.resumenIA && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Síntesis Ejecutiva por IA & Analítica de Tendencias
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                {reportData.resumenIA}
              </p>
            </div>
          )}

          {/* KPIs Grid */}
          {blocks.showKPIs && reportData?.metrics && (
            <div className="grid grid-cols-4 gap-3 bg-slate-100 p-4 rounded-xl border border-slate-300 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Facturación Bruta</span>
                <span className="text-base font-black text-slate-900">{formatMoney(reportData.metrics.totalRevenue)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Costos Operativos</span>
                <span className="text-base font-black text-red-600">{formatMoney(reportData.metrics.totalOperatingCosts)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Margen Bruto</span>
                <span className="text-base font-black text-emerald-600">{reportData.metrics.marginPct}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Efectividad Viajes</span>
                <span className="text-base font-black text-blue-600">{reportData.metrics.tripSuccessRate}</span>
              </div>
            </div>
          )}

          {/* Trips Table */}
          {blocks.showTripTable && reportData?.trips && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1">
                Anexo I: Detalle Operativo de Viajes
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-1.5">N° Viaje</th>
                    <th className="p-1.5">Cliente</th>
                    <th className="p-1.5">Origen ➔ Destino</th>
                    <th className="p-1.5">Estado</th>
                    <th className="p-1.5 text-right">Tarifa ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.trips.slice(0, 10).map((t: any) => (
                    <tr key={t.id} className="border-b border-slate-200">
                      <td className="p-1.5 font-mono font-bold">{t.numeroViaje}</td>
                      <td className="p-1.5 font-medium">{t.client?.razonSocial || '-'}</td>
                      <td className="p-1.5">{t.origen} ➔ {t.destino}</td>
                      <td className="p-1.5 font-bold">{t.status}</td>
                      <td className="p-1.5 text-right font-bold">{formatMoney(t.tarifaCliente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Maintenance Table */}
          {blocks.showMaintenanceTable && reportData?.maintenances && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1">
                Anexo II: Salud de Flota & Mantenimiento
              </h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-1.5">N° OT</th>
                    <th className="p-1.5">Vehículo</th>
                    <th className="p-1.5">Tipo</th>
                    <th className="p-1.5">Descripción</th>
                    <th className="p-1.5 text-right">Costo Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.maintenances.slice(0, 8).map((m: any) => (
                    <tr key={m.id} className="border-b border-slate-200">
                      <td className="p-1.5 font-mono font-bold">{m.numeroOT}</td>
                      <td className="p-1.5 font-bold">{m.vehicle?.patente}</td>
                      <td className="p-1.5">{m.tipo}</td>
                      <td className="p-1.5">{m.descripcion}</td>
                      <td className="p-1.5 text-right font-bold">{formatMoney(m.costoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signatures */}
          {blocks.showSignatures && (
            <div className="pt-12 grid grid-cols-2 gap-12 border-t border-slate-300 text-center">
              <div>
                <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900">Firma Responsable Operativo</p>
                <p className="text-[10px] text-slate-500">Jefe de Operaciones LogisticsPro</p>
              </div>
              <div>
                <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-900">Firma Gerencia General</p>
                <p className="text-[10px] text-slate-500">Aprobación Corporativa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
