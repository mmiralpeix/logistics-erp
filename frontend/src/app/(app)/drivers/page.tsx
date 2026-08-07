'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Phone, Mail, Edit2, Trash2, Calendar, Users, Clock, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { DriverModal } from '@/components/drivers/DriverModal';
import { ExpiryCell } from '@/components/ui/ExpiryCell';

// Driver Schedule Submodule Components
import { DriverScheduleKPIs } from '@/components/drivers/schedule/DriverScheduleKPIs';
import { DriverScheduleFilters } from '@/components/drivers/schedule/DriverScheduleFilters';
import { DriverScheduleCard } from '@/components/drivers/schedule/DriverScheduleCard';
import { ShiftHistoryModal } from '@/components/drivers/schedule/ShiftHistoryModal';
import { DriverScheduleConfigModal } from '@/components/drivers/schedule/DriverScheduleConfigModal';

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'directory'>('schedule');

  // Directory Tab State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  // Schedule Tab Filters State
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [scheduleModalidad, setScheduleModalidad] = useState('');
  const [scheduleSupervisor, setScheduleSupervisor] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Modals State
  const [historyDriver, setHistoryDriver] = useState<any>(null);
  const [configDriver, setConfigDriver] = useState<any>(null);

  const qc = useQueryClient();

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['drivers', search, page],
    queryFn: () => driversApi.getAll({ search, page, limit: 15 }).then((r) => r.data),
    enabled: activeTab === 'directory',
  });

  const { data: scheduleKpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['driver-schedule-kpis'],
    queryFn: () => driversApi.getScheduleKpis().then((r) => r.data),
    enabled: activeTab === 'schedule',
  });

  const { data: scheduleDrivers, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['driver-schedule', scheduleSearch, scheduleStatus, scheduleModalidad, scheduleSupervisor],
    queryFn: () =>
      driversApi
        .getSchedule({
          search: scheduleSearch,
          status: scheduleStatus,
          modalidad: scheduleModalidad,
          supervisor: scheduleSupervisor,
        })
        .then((r) => r.data),
    enabled: activeTab === 'schedule',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.remove(id),
    onSuccess: () => {
      toast.success('Conductor eliminado');
      qc.invalidateQueries({ queryKey: ['drivers'] });
      qc.invalidateQueries({ queryKey: ['driver-schedule'] });
    },
  });

  const recordEventMutation = useMutation({
    mutationFn: ({ id, tipo }: { id: string; tipo: string }) =>
      driversApi.recordShiftEvent(id, { tipoRegistro: tipo as any }),
    onSuccess: (_, variables) => {
      toast.success('Evento de jornada registrado');
      qc.invalidateQueries({ queryKey: ['driver-schedule'] });
      qc.invalidateQueries({ queryKey: ['driver-schedule-kpis'] });
      qc.invalidateQueries({ queryKey: ['driver-shift-history', variables.id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al registrar evento de jornada');
    },
  });

  const handleRecordEvent = (driverId: string, tipo: string, currentDriverName: string) => {
    if (confirm(`¿Confirmar registro de "${tipo}" para ${currentDriverName}?`)) {
      recordEventMutation.mutate({ id: driverId, tipo });
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await driversApi.exportScheduleReport({
        search: scheduleSearch,
        status: scheduleStatus,
        modalidad: scheduleModalidad,
        supervisor: scheduleSupervisor,
      });
      const rows = res.data;
      if (!rows || rows.length === 0) {
        toast.error('No hay datos de jornadas para exportar');
        return;
      }

      const headers = Object.keys(rows[0]).join(',');
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers, ...rows.map((row: any) => Object.values(row).map((v) => `"${v}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `reporte_jornadas_choferes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Reporte de jornadas descargado exitosamente');
    } catch (err: any) {
      toast.error('Error al exportar reporte de jornadas');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <Header
        title="Gestión de Conductores y Jornadas"
        subtitle="Control operativo en tiempo real de turnos de ruta, días de descanso y licencias"
        actions={
          <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Conductor
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Driver Schedule (Gestión de Jornadas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm transition-all ${
              activeTab === 'directory'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Directorio y Licencias</span>
          </button>
        </div>

        {/* TAB 1: DRIVER SCHEDULE (SUBMÓDULO DE JORNADAS) */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-fade-in">
            {/* Real-time KPIs */}
            <DriverScheduleKPIs kpis={scheduleKpis} isLoading={isLoadingKpis} />

            {/* Filter Bar */}
            <DriverScheduleFilters
              search={scheduleSearch}
              onSearchChange={setScheduleSearch}
              status={scheduleStatus}
              onStatusChange={setScheduleStatus}
              modalidad={scheduleModalidad}
              onModalidadChange={setScheduleModalidad}
              supervisor={scheduleSupervisor}
              onSupervisorChange={setScheduleSupervisor}
              onExport={handleExportCSV}
              isExporting={isExporting}
            />

            {/* Driver Schedule Grid / Cards */}
            {isLoadingSchedule ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
                Cargando jornadas de choferes...
              </div>
            ) : !scheduleDrivers || scheduleDrivers.length === 0 ? (
              <div className="card p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-extrabold text-base text-slate-700 dark:text-slate-300">
                  No se encontraron choferes con los filtros seleccionados
                </p>
                <p className="text-xs text-slate-400">
                  Ajustá los filtros de búsqueda o restablecé el estado para ver más resultados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {scheduleDrivers.map((driver: any) => (
                  <DriverScheduleCard
                    key={driver.id}
                    driver={driver}
                    onRecordEvent={handleRecordEvent}
                    onViewHistory={(d) => setHistoryDriver(d)}
                    onConfigureModalidad={(d) => setConfigDriver(d)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIRECTORIO DE CONDUCTORES Y LICENCIAS */}
        {activeTab === 'directory' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, DNI, teléfono..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3 text-left">Conductor</th>
                    <th className="px-4 py-3 text-left">Contacto</th>
                    <th className="px-4 py-3 text-center">Licencia</th>
                    <th className="px-4 py-3 text-center">Examen Médico</th>
                    <th className="px-4 py-3 text-center">Psicofísico</th>
                    <th className="px-4 py-3 text-center">C. Peligrosas</th>
                    <th className="px-4 py-3 text-left">Viajes</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">Cargando...</td></tr>
                  ) : data?.data?.map((driver: any) => {
                    return (
                      <tr key={driver.id} className="table-row">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {driver.firstName[0]}{driver.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{driver.firstName} {driver.lastName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {driver.dni}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {driver.telefono && <p className="flex items-center gap-1 text-xs text-slate-800 dark:text-slate-300"><Phone className="w-3 h-3 text-slate-400" /> {driver.telefono}</p>}
                          {driver.email && <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"><Mail className="w-3 h-3 text-slate-400" /> {driver.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <ExpiryCell date={driver.licenciaVencimiento} extra={driver.licenciaTipo} />
                        </td>
                        <td className="px-4 py-3">
                          <ExpiryCell date={driver.examenMedicoVencimiento} />
                        </td>
                        <td className="px-4 py-3">
                          <ExpiryCell date={driver.psicofisicoVencimiento} />
                        </td>
                        <td className="px-4 py-3">
                          {driver.habilitadoCargasPeligrosas ? (
                            <div className="flex flex-col items-center text-center gap-0.5">
                              <span className="badge badge-green text-xs">Habilitado</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(driver.certificadoCargasPeligrosas)}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center text-center">
                              <span className="badge badge-gray">No habilitado</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 dark:text-slate-300">{driver._count?.trips || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditing(driver); setShowModal(true); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-yellow-400 hover:bg-amber-50 dark:hover:bg-yellow-500/10 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm(`¿Eliminar a ${driver.firstName} ${driver.lastName}?`)) deleteMutation.mutate(driver.id); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Driver Creation/Edit Modal */}
      {showModal && <DriverModal driver={editing} onClose={() => setShowModal(false)} />}

      {/* Driver Shift History Modal */}
      {historyDriver && <ShiftHistoryModal driver={historyDriver} onClose={() => setHistoryDriver(null)} />}

      {/* Driver Schedule Config Modal */}
      {configDriver && <DriverScheduleConfigModal driver={configDriver} onClose={() => setConfigDriver(null)} />}
    </div>
  );
}
