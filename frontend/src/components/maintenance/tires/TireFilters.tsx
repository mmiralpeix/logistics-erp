'use client';
import { Search, Filter, Download, LayoutGrid, CircleDot, RefreshCw } from 'lucide-react';

interface TireFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  tipo: string;
  onTipoChange: (tipo: string) => void;
  vehicleId: string;
  onVehicleIdChange: (vehicleId: string) => void;
  vehicles?: any[];
  onOpenAxleMap: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function TireFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  tipo,
  onTipoChange,
  vehicleId,
  onVehicleIdChange,
  vehicles,
  onOpenAxleMap,
  onExport,
  isExporting,
}: TireFiltersProps) {
  const statusPills = [
    { key: '', label: 'Todos los Neumáticos' },
    { key: 'INSTALADO', label: '🟢 Instalados' },
    { key: 'EN_DEPOSITO', label: '🔵 En Depósito' },
    { key: 'EN_RECAPADO', label: '🟣 En Recapado' },
    { key: 'CRITICO', label: '🔴 Desgaste Crítico (<3mm)' },
    { key: 'DADO_DE_BAJA', label: '⚫ Dados de Baja' },
  ];

  return (
    <div className="card p-4 mb-6 space-y-4 shadow-sm">
      {/* Top Row: Status Badges & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => onStatusChange(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                status === pill.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAxleMap}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Mapa Visual de Ejes</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{isExporting ? 'Exportando...' : 'Reporte CSV'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Instant Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Código, QR, N° Serie, Marca, Medida..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-10 text-xs py-2"
          />
        </div>

        {/* Tipo Filter */}
        <div>
          <select
            value={tipo}
            onChange={(e) => onTipoChange(e.target.value)}
            className="input py-2 text-xs font-medium bg-white dark:bg-slate-900"
          >
            <option value="">Todos los Tipos de Banda (Direccional, Tracción...)</option>
            <option value="DIRECCIONAL">Direccional</option>
            <option value="TRACCION">Tracción</option>
            <option value="REMOLQUE">Remolque / Semi</option>
            <option value="AUXILIAR">Auxiliar</option>
          </select>
        </div>

        {/* Vehicle Filter */}
        <div>
          <select
            value={vehicleId}
            onChange={(e) => onVehicleIdChange(e.target.value)}
            className="input py-2 text-xs font-medium bg-white dark:bg-slate-900"
          >
            <option value="">Todos los Vehículos de la Flota</option>
            {vehicles?.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.patente} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
