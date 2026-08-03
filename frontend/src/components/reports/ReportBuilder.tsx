'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { formatCPK } from '@/lib/tire-utils';
import { FileText, Sparkles, Save, Eye, CheckCircle2, Upload, Trash2, Edit3, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportBuilderProps {
  onOpenPreview: (reportData: any, config: any) => void;
  selectedTemplate?: any;
  onClearTemplate?: () => void;
}

export function ReportBuilder({ onOpenPreview, selectedTemplate, onClearTemplate }: ReportBuilderProps) {
  const qc = useQueryClient();

  const [titulo, setTitulo] = useState('Informe Ejecutivo de Operaciones & Mantenimiento');
  const [categoria, setCategoria] = useState('GERENCIA');
  const [periodoFrom, setPeriodoFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [periodoTo, setPeriodoTo] = useState(new Date().toISOString().slice(0, 10));

  // Logo & Non-Numeric Editable Texts State
  const [companyLogo, setCompanyLogo] = useState('');
  const [clientLogo, setClientLogo] = useState('');
  const [customNotes, setCustomNotes] = useState('Se adjuntan los registros operativos y estados contables para revisión mensual.');
  const [sectionTripsTitle, setSectionTripsTitle] = useState('Anexo I: Detalle Operativo de Viajes');
  const [sectionMaintenanceTitle, setSectionMaintenanceTitle] = useState('Anexo II: Mantenimiento & Salud de Vehículos');
  const [sectionTiresTitle, setSectionTiresTitle] = useState('Anexo III: Gestión de Neumáticos & Métrica CPK');
  const [signatureLeftTitle, setSignatureLeftTitle] = useState('Firma Responsable Operativo');
  const [signatureRightTitle, setSignatureRightTitle] = useState('Firma Gerencia General');

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

  // Sync selected template whenever selectedTemplate prop changes
  useEffect(() => {
    if (selectedTemplate) {
      if (selectedTemplate.nombre) setTitulo(selectedTemplate.nombre);
      if (selectedTemplate.categoria) setCategoria(selectedTemplate.categoria);
      const cfg = selectedTemplate.configJson || selectedTemplate.filtrosJson || {};
      setBlocks((prev) => ({
        ...prev,
        ...cfg,
      }));
      if (cfg.companyLogo) setCompanyLogo(cfg.companyLogo);
      if (cfg.clientLogo) setClientLogo(cfg.clientLogo);
      if (cfg.customNotes) setCustomNotes(cfg.customNotes);
      if (cfg.sectionTripsTitle) setSectionTripsTitle(cfg.sectionTripsTitle);
      if (cfg.sectionMaintenanceTitle) setSectionMaintenanceTitle(cfg.sectionMaintenanceTitle);
      if (cfg.sectionTiresTitle) setSectionTiresTitle(cfg.sectionTiresTitle);
      if (cfg.signatureLeftTitle) setSignatureLeftTitle(cfg.signatureLeftTitle);
      if (cfg.signatureRightTitle) setSignatureRightTitle(cfg.signatureRightTitle);
    }
  }, [selectedTemplate]);

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
      filtrosJson: {
        ...blocks,
        companyLogo,
        clientLogo,
        customNotes,
        sectionTripsTitle,
        sectionMaintenanceTitle,
        sectionTiresTitle,
        signatureLeftTitle,
        signatureRightTitle,
      },
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'company' | 'client') => {
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
        if (key === 'company') setCompanyLogo(result);
        else setClientLogo(result);
        toast.success(`Logo ${key === 'company' ? 'Empresa' : 'Cliente'} cargado`);
      }
    };
    reader.readAsDataURL(file);
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
      {/* Active Template Banner */}
      {selectedTemplate && (
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Plantilla Aplicada
                </span>
                <span className="text-xs text-blue-100 font-medium">Categoría: {selectedTemplate.categoria}</span>
              </div>
              <h3 className="text-sm font-extrabold mt-0.5">{selectedTemplate.nombre}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClearTemplate && (
              <button
                type="button"
                onClick={onClearTemplate}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all text-white"
              >
                Resetear a Por Defecto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Configuration Header Controls */}
      <div className="card p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Diseñador Visual & Editor Interactivo de Reportes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalizá textos tipiables, logotipos de empresa/cliente y bloques ejecutivos
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
              onClick={() => onOpenPreview(reportData, { titulo, categoria, blocks, companyLogo, clientLogo, customNotes, sectionTripsTitle, sectionMaintenanceTitle, sectionTiresTitle, signatureLeftTitle, signatureRightTitle })}
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
              Título del Reporte (Tipiable) *
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

        {/* Logo Pickers Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Subir Logo Empresa</span>
              <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'company')} className="hidden" />
            </label>
            <input
              type="text"
              value={companyLogo}
              onChange={(e) => setCompanyLogo(e.target.value)}
              className="input text-[11px] py-1 flex-1 font-mono"
              placeholder="URL Logo Empresa"
            />
            {companyLogo && (
              <button type="button" onClick={() => setCompanyLogo('')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-purple-600" />
              <span>Subir Logo Cliente</span>
              <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'client')} className="hidden" />
            </label>
            <input
              type="text"
              value={clientLogo}
              onChange={(e) => setClientLogo(e.target.value)}
              className="input text-[11px] py-1 flex-1 font-mono"
              placeholder="URL Logo Cliente"
            />
            {clientLogo && (
              <button type="button" onClick={() => setClientLogo('')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
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
              {companyLogo ? (
                <img src={companyLogo} alt="Logo Empresa" className="h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                  LP
                </div>
              )}
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
              {clientLogo && (
                <img src={clientLogo} alt="Logo Cliente" className="h-8 object-contain ml-auto mb-1" />
              )}
              <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 block">
                {categoria}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                Período: {formatDate(periodoFrom)} al {formatDate(periodoTo)}
              </p>
            </div>
          </div>
        )}

        {/* REPORT TITLE (TYPIABLE IN CANVAS) */}
        <div className="space-y-1">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full text-2xl font-black text-slate-900 dark:text-white border-b border-dashed border-blue-300 hover:border-blue-600 bg-transparent focus:outline-none"
            placeholder="Título del Reporte"
          />
          <p className="text-xs text-slate-400 font-medium">
            Generado automáticamente el {new Date().toLocaleDateString('es-AR')} • <span className="text-blue-600 font-semibold">Tipiá cualquier texto para modificarlo</span>
          </p>
        </div>

        {/* BLOCK 2: EXECUTIVE SUMMARY AI */}
        {blocks.showSummary && reportData?.resumenIA && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Síntesis Ejecutiva por IA & Analítica de Tendencias</span>
              </div>
              <span className="text-[10px] text-blue-500 font-normal">Editable</span>
            </div>
            <textarea
              rows={3}
              value={reportData.resumenIA}
              onChange={(e) => {
                if (reportData) reportData.resumenIA = e.target.value;
              }}
              className="w-full text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-transparent border-b border-dashed border-blue-300 focus:outline-none focus:border-blue-600"
            />
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
            <input
              type="text"
              value={sectionTripsTitle}
              onChange={(e) => setSectionTripsTitle(e.target.value)}
              className="w-full text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 bg-transparent focus:outline-none pb-1"
            />
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
            <input
              type="text"
              value={sectionMaintenanceTitle}
              onChange={(e) => setSectionMaintenanceTitle(e.target.value)}
              className="w-full text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 bg-transparent focus:outline-none pb-1"
            />
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
            <input
              type="text"
              value={sectionTiresTitle}
              onChange={(e) => setSectionTiresTitle(e.target.value)}
              className="w-full text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 bg-transparent focus:outline-none pb-1"
            />
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

        {/* CUSTOM NOTES & OBSERVATIONS EDITABLE BLOCK */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
            Notas & Observaciones Ejecutivas (Tipiable)
          </label>
          <textarea
            rows={2}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-600 font-medium leading-relaxed"
            placeholder="Añadí notas o conclusiones personalizables..."
          />
        </div>

        {/* BLOCK 7: SIGNATURES & APPROVAL */}
        {blocks.showSignatures && (
          <div className="pt-12 grid grid-cols-2 gap-12 border-t border-slate-200 dark:border-slate-700 text-center">
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <input
                type="text"
                value={signatureLeftTitle}
                onChange={(e) => setSignatureLeftTitle(e.target.value)}
                className="w-full text-center text-xs font-extrabold text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 bg-transparent focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Jefe de Operaciones LogisticsPro</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-48 mx-auto mb-2" />
              <input
                type="text"
                value={signatureRightTitle}
                onChange={(e) => setSignatureRightTitle(e.target.value)}
                className="w-full text-center text-xs font-extrabold text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 bg-transparent focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">Aprobación Corporativa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

