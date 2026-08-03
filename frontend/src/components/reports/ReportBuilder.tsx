'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { formatCPK } from '@/lib/tire-utils';
import { FileText, Sparkles, Save, Printer, Download, Eye, Layers, Plus, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportBuilderProps {
  onOpenPreview: (reportData: any, config: any) => void;
}

export function ReportBuilder({ onOpenPreview }: ReportBuilderProps) {
  const qc = useQueryClient();

  const [titulo, setTitulo] = useState('Informe Ejecutivo de Operaciones & Mantenimiento');
  const [categoria, setCategoria] = useState('GERENCIA');
  const [periodoFrom, setPeriodoFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [periodoTo, setPeriodoTo] = useState(new Date().toISOString().slice(0, 10));

  // Blocks Visibility State
  const [blocks, setBlocks] = useState({
    showLogo: true,
    showSummary: true,
    showKPIs: true,
    showTripTable: true,
    showMaintenanceTable: true,
    showTireTable: true,
    showSignatures: true,
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-builder-data', periodoFrom, periodoTo, categoria],
    queryFn: () =>
      reportsApi.generateReportData({ from: periodoFrom, to: periodoTo, categoria }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => reportsApi.saveReport(data),
    onSuccess: () => {
      toast.success('Reporte guardado exitosamente en la Biblioteca');
      qc.invalidateQueries({ queryKey: ['saved-reports'] });
    },
    onError: () => toast.error('Error al guardar el reporte'),
  });

  const handleSaveToLibrary = () => {
    saveMutation.mutate({
      titulo,
      categoria,
      periodoFrom,
      periodoTo,
      resumenIA: reportData?.resumenIA,
      datosJson: reportData,
      filtrosJson: blocks,
    });
  };

  const handleApplyTemplate = (config: any, templateName: string) => {
    setBlocks({ ...blocks, ...config });
    toast.success(`Plantilla "${templateName}" aplicada`);
  };

  if (isLoading) {
    return (
      <div className="card p-12 text-center text-slate-500 font-medium">
        Compilando datos y métricas para el reporte corporativo...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Header Controls */}
      <div className="card p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Diseñador Visual de Reportes Corporativos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalizá la estructura de bloques, fechas y exportaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToLibrary}
              disabled={saveMutation.isPending}
              className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-blue-600" />
              <span>{saveMutation.isPending ? 'Guardando...' : 'Guardar en Biblioteca'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPreview(reportData, { titulo, categoria, blocks })}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Eye className="w-4 h-4" />
              <span>Vista Previa / Imprimir PDF</span>
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Título del Reporte *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input w-full text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Categoría / Área
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="input w-full text-xs font-semibold"
            >
              <option value="GERENCIA">Gerencia General</option>
              <option value="OPERACIONES">Operaciones & Viajes</option>
              <option value="MANTENIMIENTO">Mantenimiento & Taller</option>
              <option value="FLOTA">Flota & Neumáticos</option>
              <option value="RRHH">Recursos Humanos & Jornadas</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desde</label>
              <input
                type="date"
                value={periodoFrom}
                onChange={(e) => setPeriodoFrom(e.target.value)}
                className="input w-full text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Hasta</label>
              <input
                type="date"
                value={periodoTo}
                onChange={(e) => setPeriodoTo(e.target.value)}
                className="input w-full text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Block Toggles Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2">Bloques Visibles:</span>
          {[
            { key: 'showLogo', label: 'Encabezado / Logo' },
            { key: 'showSummary', label: 'Resumen Inteligente IA' },
            { key: 'showKPIs', label: 'Indicadores KPI' },
            { key: 'showTripTable', label: 'Tabla de Viajes' },
            { key: 'showMaintenanceTable', label: 'Tabla Mantenimiento' },
            { key: 'showTireTable', label: 'Tabla Neumáticos' },
            { key: 'showSignatures', label: 'Anexo de Firmas' },
          ].map((b) => {
            const isChecked = (blocks as any)[b.key];
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => setBlocks((prev: any) => ({ ...prev, [b.key]: !prev[b.key] }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isChecked
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isChecked ? '✓ ' : '+ '} {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Canvas / Report Document Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg space-y-8 max-w-4xl mx-auto border-t-8 border-t-blue-600">
        {/* BLOCK 1: HEADER & LOGO */}
        {blocks.showLogo && (
          <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                L
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  LogisticsPro ERP
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Sistema de Gestión Integral de Transporte & Logística
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 block">
                {categoria}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                Período: {formatDate(periodoFrom)} al {formatDate(periodoTo)}
              </p>
            </div>
          </div>
        )}

        {/* REPORT TITLE */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
            {titulo}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Generado automáticamente el {new Date().toLocaleDateString('es-AR')}
          </p>
        </div>

        {/* BLOCK 2: EXECUTIVE SUMMARY AI */}
        {blocks.showSummary && reportData?.resumenIA && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Síntesis Ejecutiva por IA & Analítica de Tendencias</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
              {reportData.resumenIA}
            </p>
          </div>
        )}

        {/* BLOCK 3: KPIS GRID */}
        {blocks.showKPIs && reportData?.metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Facturación Bruta</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(reportData.metrics.totalRevenue)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Costos Operativos</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">{formatMoney(reportData.metrics.totalOperatingCosts)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Margen Bruto</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{reportData.metrics.marginPct}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Efectividad Viajes</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{reportData.metrics.tripSuccessRate}</span>
            </div>
          </div>
        )}

        {/* BLOCK 4: TRIPS TABLE */}
        {blocks.showTripTable && reportData?.trips && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">
              Anexo I: Detalle Operativo de Viajes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-2 text-left">N° Viaje</th>
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2 text-left">Origen - Destino</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-right">Tarifa ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.trips.slice(0, 8).map((t: any) => (
                    <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 font-mono font-bold">{t.numeroViaje}</td>
                      <td className="p-2 font-medium">{t.client?.razonSocial || '-'}</td>
                      <td className="p-2">{t.origen} ➔ {t.destino}</td>
                      <td className="p-2 font-bold">{t.status}</td>
                      <td className="p-2 text-right font-bold">{formatMoney(t.tarifaCliente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOCK 5: MAINTENANCE TABLE */}
        {blocks.showMaintenanceTable && reportData?.maintenances && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">
              Anexo II: Mantenimiento & Salud de Vehículos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-2 text-left">N° OT</th>
                    <th className="p-2 text-left">Vehículo</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-right">Costo Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.maintenances.slice(0, 6).map((m: any) => (
                    <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 font-mono font-bold">{m.numeroOT}</td>
                      <td className="p-2 font-bold">{m.vehicle?.patente}</td>
                      <td className="p-2">{m.tipo}</td>
                      <td className="p-2">{m.descripcion}</td>
                      <td className="p-2 text-right font-bold">{formatMoney(m.costoTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOCK 6: TIRES TABLE */}
        {blocks.showTireTable && reportData?.tires && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1">
              Anexo III: Gestión de Neumáticos & Métrica CPK
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Marca / Modelo</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Profundidad</th>
                    <th className="p-2 text-right">Métrica CPK</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.tires.slice(0, 6).map((tire: any) => (
                    <tr key={tire.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 font-mono font-bold">{tire.codigoInterno}</td>
                      <td className="p-2 font-medium">{tire.marca} {tire.modelo} ({tire.medida})</td>
                      <td className="p-2 font-semibold">{tire.status}</td>
                      <td className="p-2 font-bold">{tire.profundidadActualMm} mm</td>
                      <td className="p-2 text-right font-bold text-indigo-600">{formatCPK(tire.cpk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BLOCK 7: SIGNATURES & APPROVAL */}
        {blocks.showSignatures && (
          <div className="pt-12 grid grid-cols-2 gap-12 border-t border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Firma Responsable Operativo</p>
              <p className="text-[10px] text-slate-400">Jefe de Operaciones LogisticsPro</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Firma Gerencia General</p>
              <p className="text-[10px] text-slate-400">Aprobación Corporativa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
