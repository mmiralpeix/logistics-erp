'use client';
import { Filter, Calendar, Truck, User, Building, RefreshCw } from 'lucide-react';

export interface GlobalFilterState {
  dateRange: 'this_month' | 'last_30_days' | 'quarter' | 'year' | 'custom';
  vehicleId: string;
  driverId: string;
  project: string;
}

interface DashboardGlobalFiltersProps {
  filters: GlobalFilterState;
  onChange: (filters: GlobalFilterState) => void;
  vehicles?: any[];
  drivers?: any[];
  onReset: () => void;
}

export function DashboardGlobalFilters({
  filters,
  onChange,
  vehicles,
  drivers,
  onReset,
}: DashboardGlobalFiltersProps) {
  const isFiltered =
    filters.dateRange !== 'this_month' ||
    !!filters.vehicleId ||
    !!filters.driverId ||
    !!filters.project;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 mb-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Filtros Globales del Dashboard
          </h3>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Filtros</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Date Range Selector */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" /> Período Temporal
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onChange({ ...filters, dateRange: e.target.value as any })}
            className="input py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800"
          >
            <option value="this_month">Mes Actual (Agosto 2026)</option>
            <option value="last_30_days">Últimos 30 Días</option>
            <option value="quarter">Este Trimestre (Q3)</option>
            <option value="year">Año 2026 Completo</option>
          </select>
        </div>

        {/* Vehicle Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <Truck className="w-3 h-3 text-emerald-500" /> Vehículo Especifico
          </label>
          <select
            value={filters.vehicleId}
            onChange={(e) => onChange({ ...filters, vehicleId: e.target.value })}
            className="input py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800"
          >
            <option value="">Toda la Flota (Todos)</option>
            {vehicles?.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.patente} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>

        {/* Driver Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-purple-500" /> Conductor
          </label>
          <select
            value={filters.driverId}
            onChange={(e) => onChange({ ...filters, driverId: e.target.value })}
            className="input py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800"
          >
            <option value="">Todos los Conductores</option>
            {drivers?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName} (DNI: {d.dni})
              </option>
            ))}
          </select>
        </div>

        {/* Project / Sucursal Filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
            <Building className="w-3 h-3 text-amber-500" /> Proyecto / Sucursal
          </label>
          <select
            value={filters.project}
            onChange={(e) => onChange({ ...filters, project: e.target.value })}
            className="input py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800"
          >
            <option value="">Todos los Proyectos y Bases</option>
            <option value="BASE_CENTRAL">Base Central — Casa Matriz</option>
            <option value="MINERIA_NORTE">Proyecto Minería Norte</option>
            <option value="LOGISTICA_SUR">Operaciones Logística Sur</option>
            <option value="PETROLEO_VACA_MUERTA">Yacimiento Vaca Muerta</option>
          </select>
        </div>
      </div>
    </div>
  );
}
