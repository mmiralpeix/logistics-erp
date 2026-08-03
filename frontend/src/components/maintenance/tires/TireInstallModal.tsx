'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tiresApi } from '@/lib/api';
import { formatPositionLabel } from '@/lib/tire-utils';
import { X, Truck, Warehouse, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TireInstallModalProps {
  tire: any;
  vehicles?: any[];
  mode: 'install' | 'dismount';
  initialPosition?: string;
  initialVehicleId?: string;
  onClose: () => void;
  onSave?: () => void;
}

export function TireInstallModal({
  tire,
  vehicles,
  mode,
  initialPosition,
  initialVehicleId,
  onClose,
  onSave,
}: TireInstallModalProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    vehicleId: initialVehicleId || tire?.vehicleId || vehicles?.[0]?.id || '',
    posicion: initialPosition || tire?.posicion || 'E1_IZQ',
    kilometrajeVehiculo: 0,
    profundidadMm: tire?.profundidadActualMm || 14.0,
    presionPsi: tire?.presionActualPsi || 110,
    motivo: '',
  });

  const installMutation = useMutation({
    mutationFn: (data: any) => tiresApi.install(tire.id, data),
    onSuccess: () => {
      toast.success(`Neumático ${tire.codigoInterno} montado en vehículo`);
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['vehicle-axle-positions'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al montar el neumático');
    },
  });

  const dismountMutation = useMutation({
    mutationFn: (data: any) => tiresApi.dismount(tire.id, data),
    onSuccess: () => {
      toast.success(`Neumático ${tire.codigoInterno} desmontado a depósito`);
      qc.invalidateQueries({ queryKey: ['maintenance-tires'] });
      qc.invalidateQueries({ queryKey: ['vehicle-axle-positions'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al desmontar el neumático');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'install') {
      if (!form.vehicleId || !form.posicion) {
        toast.error('Seleccione el vehículo y la posición de instalación');
        return;
      }
      installMutation.mutate(form);
    } else {
      dismountMutation.mutate(form);
    }
  };

  const positionsList = [
    { id: 'E1_IZQ', label: 'Eje 1 Izquierda (Direccional)' },
    { id: 'E1_DER', label: 'Eje 1 Derecha (Direccional)' },
    { id: 'E2_IZQ_EXT', label: 'Eje 2 Izq Exterior (Tracción)' },
    { id: 'E2_IZQ_INT', label: 'Eje 2 Izq Interior (Tracción)' },
    { id: 'E2_DER_INT', label: 'Eje 2 Der Interior (Tracción)' },
    { id: 'E2_DER_EXT', label: 'Eje 2 Der Exterior (Tracción)' },
    { id: 'E3_IZQ_EXT', label: 'Eje 3 Izq Exterior (Tracción)' },
    { id: 'E3_IZQ_INT', label: 'Eje 3 Izq Interior (Tracción)' },
    { id: 'E3_DER_INT', label: 'Eje 3 Der Interior (Tracción)' },
    { id: 'E3_DER_EXT', label: 'Eje 3 Der Exterior (Tracción)' },
    { id: 'AUXILIAR_1', label: 'Rueda Auxiliar 1' },
    { id: 'AUXILIAR_2', label: 'Rueda Auxiliar 2' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              {mode === 'install' ? <Truck className="w-5 h-5" /> : <Warehouse className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {mode === 'install' ? `Montar Neumático ${tire.codigoInterno}` : `Desmontar Neumático ${tire.codigoInterno}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tire.marca} {tire.modelo} ({tire.medida})
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'install' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Vehículo Destino *
                </label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  className="input w-full text-sm font-bold"
                >
                  {vehicles?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} — {v.marca} {v.modelo} ({v.tipo || 'TRACTOR'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Posición del Eje *
                </label>
                <select
                  value={form.posicion}
                  onChange={(e) => setForm((f) => ({ ...f, posicion: e.target.value }))}
                  className="input w-full text-sm font-bold text-blue-600 dark:text-blue-400"
                >
                  {positionsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                ⚠️ Desmonte a Depósito Central
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                El neumático será retirado del vehículo <span className="font-bold">{tire.vehicle?.patente}</span> (Posición: {formatPositionLabel(tire.posicion)}) e ingresará al depósito como stock disponible.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Observaciones / Motivo
            </label>
            <input
              type="text"
              placeholder="Ej: Cambio preventivo de neumáticos por rotación"
              value={form.motivo}
              onChange={(e) => setForm((f) => ({ ...f, motivo: e.target.value }))}
              className="input w-full text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary py-2 px-4 text-xs">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={installMutation.isPending || dismountMutation.isPending}
              className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {installMutation.isPending || dismountMutation.isPending
                  ? 'Procesando...'
                  : mode === 'install'
                  ? 'Confirmar Montaje'
                  : 'Confirmar Desmonte'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
