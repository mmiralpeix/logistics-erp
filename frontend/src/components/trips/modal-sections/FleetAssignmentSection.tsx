'use client';

export function FleetAssignmentSection({
  register,
  watch,
  isLocked,
  powerUnits,
  trailers,
  drivers,
}: {
  register: any;
  watch: any;
  isLocked: boolean;
  powerUnits?: any[];
  trailers?: any[];
  drivers?: any[];
}) {
  const tipoOp = watch('tipoOperacion') || 'PROPIA';

  if (tipoOp === 'PROPIA') {
    return (
      <div className="grid grid-cols-2 gap-4 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl">
        <div className="col-span-2 text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
          Recursos Flota Propia *
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Unidad Tractora / Camión *
          </label>
          <select
            {...register('vehicleId', { required: true })}
            className="input w-full text-sm font-medium"
            disabled={isLocked}
          >
            <option value="">Seleccionar vehículo...</option>
            {powerUnits?.map((v: any) => (
              <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo} ({v.tipo})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Semi / Acoplado (Opcional)
          </label>
          <select {...register('trailerId')} className="input w-full text-sm font-medium" disabled={isLocked}>
            <option value="">Sin remolque (Solo chasis)</option>
            {trailers?.map((v: any) => (
              <option key={v.id} value={v.id}>{v.patente} — {v.tipo?.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Conductor Asignado *
          </label>
          <select
            {...register('driverId', { required: true })}
            className="input w-full text-sm font-medium"
            disabled={isLocked}
          >
            <option value="">Seleccionar conductor...</option>
            {drivers?.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.firstName} {d.lastName} {d.habilitadoCargasPeligrosas ? '⚡ (Hab. Peligrosas)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (tipoOp === 'TRACCION_TERCERO_SEMI_PROPIO') {
    return (
      <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl space-y-2">
        <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
          Remolque / Semi de Flota Propia (Enganche Mixto)
        </label>
        <select {...register('trailerId')} className="input w-full text-sm font-medium" disabled={isLocked}>
          <option value="">Seleccionar semi de nuestra flota...</option>
          {trailers?.map((v: any) => (
            <option key={v.id} value={v.id}>{v.patente} — {v.tipo?.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}
