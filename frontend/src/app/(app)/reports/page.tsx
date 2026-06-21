'use client';
import { useState } from 'react';
import { reportsApi, downloadBlob } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BarChart2, FileSpreadsheet, Truck, Fuel, MapPin, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);

  const [loading, setLoading] = useState<string | null>(null);
  const [dates, setDates] = useState({ from: defaultFrom, to: defaultTo });

  const download = async (type: string, fn: () => Promise<any>, filename: string) => {
    setLoading(type);
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
      toast.success(`Reporte descargado: ${filename}`);
    } catch (e: any) {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(null);
    }
  };

  const reports = [
    {
      id: 'trips',
      icon: <MapPin className="w-8 h-8 text-blue-400" />,
      title: 'Reporte de Viajes',
      description: 'Listado completo de viajes con origen, destino, vehículo, conductor, costos y margen de rentabilidad.',
      badge: 'Excel',
      badgeCls: 'badge-green',
      fn: () => reportsApi.downloadTripsExcel(dates.from, dates.to),
      filename: `reporte-viajes-${dates.from}-${dates.to}.xlsx`,
      hasDates: true,
    },
    {
      id: 'fleet',
      icon: <Truck className="w-8 h-8 text-purple-400" />,
      title: 'Reporte de Flota',
      description: 'Estado actual de todos los vehículos, vencimientos de documentación, kilometraje y costos históricos.',
      badge: 'Excel',
      badgeCls: 'badge-green',
      fn: () => reportsApi.downloadFleetExcel(),
      filename: 'reporte-flota.xlsx',
      hasDates: false,
    },
    {
      id: 'fuel',
      icon: <Fuel className="w-8 h-8 text-orange-400" />,
      title: 'Reporte de Combustible',
      description: 'Historial de cargas, consumos, rendimientos promedio y detección de desvíos por vehículo.',
      badge: 'Excel',
      badgeCls: 'badge-green',
      fn: () => reportsApi.downloadFuelExcel(dates.from, dates.to),
      filename: `reporte-combustible-${dates.from}-${dates.to}.xlsx`,
      hasDates: true,
    },
  ];

  return (
    <div>
      <Header
        title="Reportes y Exportaciones"
        subtitle="Generación de informes en Excel con filtros avanzados"
      />

      <div className="p-6 space-y-6">
        {/* Date filter */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" /> Filtro de Período
          </h3>
          <div className="flex items-center gap-4">
            <div>
              <label className="label">Fecha desde</label>
              <input type="date" value={dates.from} onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Fecha hasta</label>
              <input type="date" value={dates.to} onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} className="input" />
            </div>
            <div className="flex gap-2 pt-5">
              {[
                { label: 'Mes actual', from: new Date(now.getFullYear(), now.getMonth(), 1), to: now },
                { label: 'Mes anterior', from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) },
                { label: 'Este año', from: new Date(now.getFullYear(), 0, 1), to: now },
              ].map((preset) => (
                <button key={preset.label} onClick={() => setDates({ from: preset.from.toISOString().slice(0, 10), to: preset.to.toISOString().slice(0, 10) })} className="btn-secondary py-1.5 text-xs">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="card p-6 flex flex-col gap-4 hover:border-blue-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-slate-700/50 rounded-xl">{report.icon}</div>
                <span className={report.badgeCls}>{report.badge}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">{report.title}</h3>
                <p className="text-sm text-slate-400">{report.description}</p>
                {report.hasDates && (
                  <p className="text-xs text-slate-500 mt-2">
                    Período: {dates.from} al {dates.to}
                  </p>
                )}
              </div>
              <button
                onClick={() => download(report.id, report.fn, report.filename)}
                disabled={loading !== null}
                className="btn-primary justify-center disabled:opacity-60"
              >
                {loading === report.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                ) : (
                  <><Download className="w-4 h-4" /> Descargar Excel</>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* API docs link */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Acceso a la API</h3>
          <p className="text-sm text-slate-400 mb-3">Todos los módulos disponen de API REST documentada. Intégralos con tus sistemas existentes.</p>
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4" /> Abrir Swagger API Docs
          </a>
        </div>
      </div>
    </div>
  );
}
