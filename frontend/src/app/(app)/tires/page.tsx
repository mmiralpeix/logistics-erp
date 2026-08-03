'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tiresApi, vehiclesApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Plus, CircleDot, Download, LayoutGrid, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Tires Components
import { TireKPIs } from '@/components/maintenance/tires/TireKPIs';
import { TireFilters } from '@/components/maintenance/tires/TireFilters';
import { TireCard } from '@/components/maintenance/tires/TireCard';
import { VehicleAxleMapModal } from '@/components/maintenance/tires/VehicleAxleMapModal';
import { TireModal } from '@/components/maintenance/tires/TireModal';
import { TireInstallModal } from '@/components/maintenance/tires/TireInstallModal';
import { TireRetreadModal } from '@/components/maintenance/tires/TireRetreadModal';
import { TireInspectionModal } from '@/components/maintenance/tires/TireInspectionModal';
import { TireTimelineModal } from '@/components/maintenance/tires/TireTimelineModal';

export default function TiresPage() {
  const [tireSearch, setTireSearch] = useState('');
  const [tireStatus, setTireStatus] = useState('');
  const [tireTipo, setTireTipo] = useState('');
  const [tireVehicleId, setTireVehicleId] = useState('');

  // Modals state
  const [showTireModal, setShowTireModal] = useState(false);
  const [editTireData, setEditTireData] = useState<any>(null);
  const [installTireModal, setInstallTireModal] = useState<{ tire: any; mode: 'install' | 'dismount'; vehicleId?: string; posicion?: string } | null>(null);
  const [retreadTireModal, setRetreadTireModal] = useState<{ tire: any; mode: 'send' | 'receive' } | null>(null);
  const [inspectionTire, setInspectionTire] = useState<any>(null);
  const [timelineTireId, setTimelineTireId] = useState<string | null>(null);
  const [axleMapVehicleId, setAxleMapVehicleId] = useState<string | null>(null);
  const [isExportingTires, setIsExportingTires] = useState(false);

  const qc = useQueryClient();

  // Queries
  const { data: tireKpis, isLoading: isLoadingTireKpis } = useQuery({
    queryKey: ['maintenance-tires-kpis'],
    queryFn: () => tiresApi.getKPIs().then((r) => r.data),
  });

  const { data: tiresData, isLoading: isLoadingTires, refetch } = useQuery({
    queryKey: ['maintenance-tires', tireSearch, tireStatus, tireTipo, tireVehicleId],
    queryFn: () =>
      tiresApi
        .getAll({
          search: tireSearch || undefined,
          status: tireStatus === 'CRITICO' ? undefined : tireStatus || undefined,
          minProfundidad: tireStatus === 'CRITICO' ? 3.0 : undefined,
          tipo: tireTipo || undefined,
          vehicleId: tireVehicleId || undefined,
          limit: 100,
        })
        .then((r) => r.data),
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-fleet-tires'],
    queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const handleExportTiresCSV = async () => {
    try {
      setIsExportingTires(true);
      const res = await tiresApi.exportReport({
        search: tireSearch || undefined,
        status: tireStatus === 'CRITICO' ? undefined : tireStatus || undefined,
        minProfundidad: tireStatus === 'CRITICO' ? 3.0 : undefined,
        tipo: tireTipo || undefined,
        vehicleId: tireVehicleId || undefined,
      });
      const rows = res.data;
      if (!rows || rows.length === 0) {
        toast.error('No hay datos de neumáticos para exportar');
        return;
      }

      const headers = Object.keys(rows[0]).join(',');
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers, ...rows.map((row: any) => Object.values(row).map((v) => `"${v}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `reporte_neumaticos_flota_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Reporte de neumáticos descargado exitosamente');
    } catch (err: any) {
      toast.error('Error al exportar reporte de neumáticos');
    } finally {
      setIsExportingTires(false);
    }
  };

  return (
    <div>
      <Header
        title="Gestión Integral de Neumáticos"
        subtitle="Control de inventario, semáforo de desgaste (profundidad en mm), historial de rotaciones, mapa visual de ejes y recapados"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditTireData(null);
                setShowTireModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Registrar Neumático
            </button>
          </div>
        }
      />

      <div className="p-3 md:p-6 space-y-6">
        {/* Real-time Tire KPIs & CPK Metrics */}
        <TireKPIs kpis={tireKpis} isLoading={isLoadingTireKpis} />

        {/* Filter Bar */}
        <TireFilters
          search={tireSearch}
          onSearchChange={setTireSearch}
          status={tireStatus}
          onStatusChange={setTireStatus}
          tipo={tireTipo}
          onTipoChange={setTireTipo}
          vehicleId={tireVehicleId}
          onVehicleIdChange={setTireVehicleId}
          vehicles={vehicles}
          onOpenAxleMap={() => setAxleMapVehicleId(vehicles?.[0]?.id || '')}
          onExport={handleExportTiresCSV}
          isExporting={isExportingTires}
        />

        {/* Tire Cards Grid */}
        {(() => {
          const tireList: any[] = Array.isArray(tiresData)
            ? tiresData
            : Array.isArray(tiresData?.data)
            ? tiresData.data
            : Array.isArray(tiresData?.data?.data)
            ? tiresData.data.data
            : [];

          if (isLoadingTires) {
            return (
              <div className="flex items-center justify-center h-48 card">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Cargando inventario de neumáticos...</p>
                </div>
              </div>
            );
          }

          if (!tireList || tireList.length === 0) {
            return (
              <div className="card p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <CircleDot className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                  No se encontraron neumáticos registrados o coincidentes
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ajustá los filtros de búsqueda o hacé clic en "Registrar Neumático" para dar de alta unidades en stock o instaladas.
                </p>
                <button
                  onClick={() => {
                    setTireSearch('');
                    setTireStatus('');
                    setTireTipo('');
                    setTireVehicleId('');
                  }}
                  className="btn-secondary text-xs px-4 py-2 mt-2 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restablecer Filtros
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tireList.map((tire: any) => (
                <TireCard
                  key={tire.id}
                  tire={tire}
                  onInstall={(t) => setInstallTireModal({ tire: t, mode: 'install' })}
                  onDismount={(t) => setInstallTireModal({ tire: t, mode: 'dismount' })}
                  onRotate={(t) => setAxleMapVehicleId(t.vehicleId || vehicles?.[0]?.id)}
                  onRetread={(t) => setRetreadTireModal({ tire: t, mode: t.status === 'EN_RECAPADO' ? 'receive' : 'send' })}
                  onInspection={(t) => setInspectionTire(t)}
                  onViewHistory={(t) => setTimelineTireId(t.id)}
                  onEdit={(t) => {
                    setEditTireData(t);
                    setShowTireModal(true);
                  }}
                  onShowQR={(t) => setTimelineTireId(t.id)}
                />
              ))}
            </div>
          );
        })()}
      </div>

      {/* MODALS */}
      {showTireModal && (
        <TireModal
          tire={editTireData}
          onClose={() => {
            setShowTireModal(false);
            setEditTireData(null);
          }}
        />
      )}

      {installTireModal && (
        <TireInstallModal
          tire={installTireModal.tire}
          vehicles={vehicles}
          mode={installTireModal.mode}
          initialPosition={installTireModal.posicion}
          initialVehicleId={installTireModal.vehicleId}
          onClose={() => setInstallTireModal(null)}
        />
      )}

      {retreadTireModal && (
        <TireRetreadModal
          tire={retreadTireModal.tire}
          mode={retreadTireModal.mode}
          onClose={() => setRetreadTireModal(null)}
        />
      )}

      {inspectionTire && (
        <TireInspectionModal
          tire={inspectionTire}
          onClose={() => setInspectionTire(null)}
        />
      )}

      {timelineTireId && (
        <TireTimelineModal
          tireId={timelineTireId}
          onClose={() => setTimelineTireId(null)}
        />
      )}

      {axleMapVehicleId && (
        <VehicleAxleMapModal
          vehicles={vehicles}
          initialVehicleId={axleMapVehicleId}
          onClose={() => setAxleMapVehicleId(null)}
          onMountTire={(vId, pos) => {
            const unassignedTire = tiresData?.data?.find((t: any) => t.status === 'EN_DEPOSITO');
            if (unassignedTire) {
              setAxleMapVehicleId(null);
              setInstallTireModal({ tire: unassignedTire, mode: 'install', vehicleId: vId, posicion: pos });
            } else {
              toast.error('No hay neumáticos en depósito para montar. Registre o desmonte uno primero.');
            }
          }}
        />
      )}
    </div>
  );
}
