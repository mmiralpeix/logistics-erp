'use client';
import { Search, Filter, Download, UserCheck } from 'lucide-react';

interface DriverScheduleFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  modalidad: string;
  onModalidadChange: (modalidad: string) => void;
  supervisor: string;
  onSupervisorChange: (supervisor: string) => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function DriverScheduleFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  modalidad,
  onModalidadChange,
  supervisor,
  onSupervisorChange,
  onExport,
  isExporting,
}: DriverScheduleFiltersProps) {
  const statusPills = [
    { key: '', label: 'Todos los Choferes' },
    { key: 'EN_RUTA', label: '🟢 En Ruta' },
    { key: 'DESCANSANDO', label: '🔵 Descansando' },
    { key: 'PROXIMO_A_DESCANSO', label: '🟡 Próximos a Descanso' },
    { key: 'EXCEDIDO', label: '🔴 Excedidos' },
  ];

  return (
    <div className="card p-4 mb-6 space-y-4 shadow-sm">
      {/* Top row: Status Badges */}
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

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 border-slate-300 dark:border-slate-700"
        >
          <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{isExporting ? 'Exportando...' : 'Exportar Reporte CSV'}</span>
        </button>
      </div>

      {/* Bottom row: Search & Select Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por chofer o DNI..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input pl-10 text-xs py-2"
          />
        </div>

        {/* Modalidad Selector */}
        <div className="relative">
          <select
            value={modalidad}
            onChange={(e) => onModalidadChange(e.target.value)}
            className="input py-2 text-xs font-medium bg-white dark:bg-slate-900"
          >
            <option value="">Todas las Modalidades (21x7, 14x7, 28x14...)</option>
            <option value="21x7">Régimen 21x7 (Estándar)</option>
            <option value="14x7">Régimen 14x7 (Corto)</option>
            <option value="28x14">Régimen 28x14 (Largo)</option>
            <option value="PERSONALIZADA">Régimen Personalizado</option>
          </select>
        </div>

        {/* Supervisor Input */}
        <div className="relative">
          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por Supervisor..."
            value={supervisor}
            onChange={(e) => onSupervisorChange(e.target.value)}
            className="input pl-10 text-xs py-2"
          />
        </div>
      </div>
    </div>
  );
}
