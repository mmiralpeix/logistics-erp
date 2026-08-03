'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { getTireDepthInfo, formatPositionLabel } from '@/lib/tire-utils';
import { X, Truck, LayoutGrid, Plus, AlertCircle, CircleDot } from 'lucide-react';

interface VehicleAxleMapModalProps {
  vehicles?: any[];
  initialVehicleId?: string;
  onClose: () => void;
  onMountTire: (vehicleId: string, posicion: string) => void;
}

export function VehicleAxleMapModal({
  vehicles,
  initialVehicleId,
  onClose,
  onMountTire,
}: VehicleAxleMapModalProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialVehicleId || vehicles?.[0]?.id || ''
  );

  const { data: positionsData, isLoading } = useQuery({
    queryKey: ['vehicle-axle-positions', selectedVehicleId],
    queryFn: () => selectedVehicleId ? tiresApi.getVehiclePositions(selectedVehicleId).then((r) => r.data) : Promise.resolve(null),
    enabled: !!selectedVehicleId,
  });

  const getPositionTire = (posId: string) => {
    return positionsData?.positionsMap?.find((p: any) => p.id === posId)?.tire || null;
  };

  const renderWheelBox = (posId: string, label: string) => {
    const tire = getPositionTire(posId);
    const depthInfo = tire ? getTireDepthInfo(tire.profundidadActualMm, tire.profundidadInicialMm) : null;

    return (
      <div
        className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[100px] transition-all shadow-sm ${
          tire
            ? depthInfo?.bgClass || 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            : 'bg-slate-50/60 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
            {posId}
          </span>
          {tire && (
            <span className={`w-2.5 h-2.5 rounded-full ${depthInfo?.colorClass}`} title={depthInfo?.label} />
          )}
        </div>

        {tire ? (
          <div className="my-1 space-y-0.5">
            <p className="font-mono font-black text-xs text-slate-900 dark:text-white">
              {tire.codigoInterno}
            </p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold truncate">
              {tire.marca} ({tire.medida})
            </p>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className={`font-extrabold ${depthInfo?.textClass}`}>{tire.profundidadActualMm} mm</span>
              <span className="text-slate-500 font-mono">{tire.presionActualPsi || tire.presionRecomendadaPsi} PSI</span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onMountTire(selectedVehicleId, posId)}
            className="my-auto py-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Montar
          </button>
        )}

        <span className="text-[9px] text-slate-400 font-medium truncate block">
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Mapa Visual de Ejes y Neumáticos por Vehículo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualización gráfica interactiva de posiciones de ruedas y nivel de desgaste
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30 dark:bg-slate-900/30">
          {/* Vehicle Selector */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Seleccionar Vehículo:
            </span>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="input text-sm font-bold flex-1 py-1.5 bg-slate-50 dark:bg-slate-900"
            >
              {vehicles?.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.patente} — {v.marca} {v.modelo} ({v.tipo || 'TRACTOR'})
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium">
              Cargando esquema de ejes del vehículo...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Diagram Graphic Layout */}
              <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                {/* EJE 1: DIRECCIONAL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                    <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
                      EJE 1 — DIRECCIONAL (FRENTE)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">2 Neumáticos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderWheelBox('E1_IZQ', 'Eje 1 Izquierda')}
                    {renderWheelBox('E1_DER', 'Eje 1 Derecha')}
                  </div>
                </div>

                {/* EJE 2: TRACCIÓN INTERMEDIO */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                      EJE 2 — TRACCIÓN (DUAL INTERMEDIO)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">4 Neumáticos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {renderWheelBox('E2_IZQ_EXT', 'Eje 2 Izq Ext')}
                    {renderWheelBox('E2_IZQ_INT', 'Eje 2 Izq Int')}
                    {renderWheelBox('E2_DER_INT', 'Eje 2 Der Int')}
                    {renderWheelBox('E2_DER_EXT', 'Eje 2 Der Ext')}
                  </div>
                </div>

                {/* EJE 3: TRACCIÓN TRASERO */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                    <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                      EJE 3 — TRACCIÓN (DUAL TRASERO)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">4 Neumáticos</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {renderWheelBox('E3_IZQ_EXT', 'Eje 3 Izq Ext')}
                    {renderWheelBox('E3_IZQ_INT', 'Eje 3 Izq Int')}
                    {renderWheelBox('E3_DER_INT', 'Eje 3 Der Int')}
                    {renderWheelBox('E3_DER_EXT', 'Eje 3 Der Ext')}
                  </div>
                </div>

                {/* RUEDAS AUXILIARES */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1">
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                      RUEDAS AUXILIARES / AUXILIO
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">2 Neumáticos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {renderWheelBox('AUXILIAR_1', 'Rueda Auxiliar 1')}
                    {renderWheelBox('AUXILIAR_2', 'Rueda Auxiliar 2')}
                  </div>
                </div>
              </div>

              {/* References Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Profundidad Buena (&gt;6.0 mm)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> Atención / Desgaste (3.0-6.0 mm)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Crítico / Reemplazar (&lt;3.0 mm)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
