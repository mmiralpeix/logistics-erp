'use client';
import { FileSpreadsheet, Plus, Download, Truck, CircleDot, Wrench, MapPin } from 'lucide-react';
import { reportsApi, tiresApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function WidgetQuickReports() {
  const handleDownloadTrips = async () => {
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
      toast.success('Reporte de Viajes descargado');
    } catch {
      toast.error('Error al descargar reporte de viajes');
    }
  };

  const handleDownloadFleet = async () => {
    try {
      const res = await reportsApi.downloadFleetExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Estado_Flota_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte de Flota descargado');
    } catch {
      toast.error('Error al descargar reporte de flota');
    }
  };

  const handleDownloadTires = async () => {
    try {
      const res = await tiresApi.exportReport({});
      const rows = res.data;
      if (!rows || rows.length === 0) return toast.error('No hay datos para exportar');
      const headers = Object.keys(rows[0]).join(',');
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map((row: any) => Object.values(row).map((v) => `"${v}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Reporte_Neumaticos_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte de Neumáticos descargado');
    } catch {
      toast.error('Error al exportar neumáticos');
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Accesos Rápidos a Reportes & Operaciones Frecuentes
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Exportación en 1-Clic</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={handleDownloadTrips}
          className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl text-left transition-all"
        >
          <Download className="w-4 h-4 text-emerald-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Excel Viajes</span>
          <span className="text-[10px] text-slate-500">Últimos 30 días</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadFleet}
          className="p-3 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-xl text-left transition-all"
        >
          <Download className="w-4 h-4 text-blue-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Excel Flota</span>
          <span className="text-[10px] text-slate-500">Estado de unidades</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadTires}
          className="p-3 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 rounded-xl text-left transition-all"
        >
          <Download className="w-4 h-4 text-purple-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">CSV Neumáticos</span>
          <span className="text-[10px] text-slate-500">CPK y mediciones</span>
        </button>

        <Link
          href="/trips"
          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all"
        >
          <Plus className="w-4 h-4 text-blue-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Nuevo Viaje</span>
          <span className="text-[10px] text-slate-500">Generar orden</span>
        </Link>

        <Link
          href="/maintenance"
          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all"
        >
          <Wrench className="w-4 h-4 text-amber-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Nueva OT</span>
          <span className="text-[10px] text-slate-500">Taller preventivo</span>
        </Link>

        <Link
          href="/drivers"
          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all"
        >
          <Truck className="w-4 h-4 text-indigo-600 mb-1" />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Jornadas Choferes</span>
          <span className="text-[10px] text-slate-500">Driver Schedule</span>
        </Link>
      </div>
    </div>
  );
}
