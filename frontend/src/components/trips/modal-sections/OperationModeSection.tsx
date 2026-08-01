'use client';
import { Truck, Container, Building2 } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { carriersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export function OperationModeSection({
  register,
  watch,
  setValue,
  carriers,
  selectedCarrierId,
  carrierVehicles,
  carrierDrivers,
  qc,
}: {
  register: any;
  watch: any;
  setValue: any;
  carriers: any[];
  selectedCarrierId?: string;
  carrierVehicles?: any[];
  carrierDrivers?: any[];
  qc: any;
}) {
  const tipoOp = watch('tipoOperacion') || 'PROPIA';

  return (
    <div className="p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Modalidad de Operación Logística *
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setValue('tipoOperacion', 'PROPIA')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            tipoOp === 'PROPIA'
              ? 'bg-white dark:bg-slate-900 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Truck className="w-3.5 h-3.5" />
            <span>Flota Propia</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tractor + Semi + Chofer Propio</p>
        </button>

        <button
          type="button"
          onClick={() => setValue('tipoOperacion', 'TRACCION_TERCERO_SEMI_PROPIO')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            tipoOp === 'TRACCION_TERCERO_SEMI_PROPIO'
              ? 'bg-white dark:bg-slate-900 border-purple-500 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Container className="w-3.5 h-3.5" />
            <span>Enganche Mixto</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Tractor Externo + Semi Propio</p>
        </button>

        <button
          type="button"
          onClick={() => setValue('tipoOperacion', 'SUBCONTRATADA_TOTAL')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            tipoOp === 'SUBCONTRATADA_TOTAL'
              ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Subcontratado 100%</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Operador Logístico Externo</p>
        </button>
      </div>

      {/* Carrier Panel if not PROPIA */}
      {(tipoOp === 'SUBCONTRATADA_TOTAL' || tipoOp === 'TRACCION_TERCERO_SEMI_PROPIO') && (
        <div className="pt-2 space-y-3 border-t border-slate-200 dark:border-slate-700 mt-2 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Operador Logístico *
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    const name = prompt('Nombre del Operador Logístico (ej: Transportes Salta SRL):');
                    if (name?.trim()) {
                      try {
                        const res = await carriersApi.create({ razonSocial: name.trim() });
                        toast.success('Operador creado exitosamente');
                        qc.invalidateQueries({ queryKey: ['carriers-select'] });
                        qc.invalidateQueries({ queryKey: ['carriers'] });
                        setValue('carrierId', res.data.id);
                      } catch {
                        toast.error('Error al crear operador');
                      }
                    }
                  }}
                  className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
                >
                  + Nuevo Operador
                </button>
              </div>
              <select
                {...register('carrierId')}
                className="input w-full text-sm font-semibold border-purple-300 dark:border-purple-700"
              >
                <option value="">Seleccionar operador...</option>
                {carriers?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.razonSocial}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Flete a Pagar ($)
                </label>
                {Number(watch('tarifaAcordada') || 0) > 0 && Number(watch('subcontractorFee') || 0) > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Spread: {formatMoney(Number(watch('tarifaAcordada') || 0) - Number(watch('subcontractorFee') || 0))}
                  </span>
                )}
              </div>
              <input
                {...register('subcontractorFee')}
                type="number"
                step="any"
                onChange={(e) => {
                  const fee = Number(e.target.value) || 0;
                  setValue('subcontractorFee', fee);
                  setValue('costoTotal', fee);
                }}
                className="input w-full text-sm font-bold text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Carrier resources */}
          {selectedCarrierId && (
            <div className="grid grid-cols-3 gap-3 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Chofer
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const name = prompt('Nombre y Apellido del Chofer (ej: Juan Pérez):');
                      if (name?.trim()) {
                        const parts = name.trim().split(' ');
                        const firstName = parts[0];
                        const lastName = parts.slice(1).join(' ') || '-';
                        try {
                          const res = await carriersApi.createDriver(selectedCarrierId, { firstName, lastName });
                          toast.success('Chofer agregado al operador');
                          qc.invalidateQueries({ queryKey: ['carrier-drivers', selectedCarrierId] });
                          setValue('carrierDriverId', res.data.id);
                        } catch {
                          toast.error('Error al agregar chofer');
                        }
                      }
                    }}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + Agregar
                  </button>
                </div>
                <select {...register('carrierDriverId')} className="input w-full text-sm border-purple-300 dark:border-purple-700">
                  <option value="">Seleccionar chofer...</option>
                  {carrierDrivers?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Camión / Tractor
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const patente = prompt('Patente del Camión/Tractor (ej: AA123CD):');
                      if (patente?.trim()) {
                        try {
                          const res = await carriersApi.createVehicle(selectedCarrierId, { patente: patente.trim().toUpperCase(), tipo: 'TRACTOR' });
                          toast.success('Vehículo agregado al operador');
                          qc.invalidateQueries({ queryKey: ['carrier-vehicles', selectedCarrierId] });
                          setValue('carrierVehicleId', res.data.id);
                        } catch {
                          toast.error('Error al agregar vehículo');
                        }
                      }
                    }}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + Agregar
                  </button>
                </div>
                <select {...register('carrierVehicleId')} className="input w-full text-sm border-purple-300 dark:border-purple-700">
                  <option value="">Seleccionar vehículo...</option>
                  {carrierVehicles?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.patente} {v.tipo ? `(${v.tipo.replace('_', ' ')})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Semi / Acoplado
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const patente = prompt('Patente del Semi/Acoplado (ej: AB987XY):');
                      if (patente?.trim()) {
                        try {
                          const res = await carriersApi.createVehicle(selectedCarrierId, { patente: patente.trim().toUpperCase(), tipo: 'SEMIRREMOLQUE' });
                          toast.success('Semi agregado al operador');
                          qc.invalidateQueries({ queryKey: ['carrier-vehicles', selectedCarrierId] });
                          setValue('carrierTrailerId', res.data.id);
                        } catch {
                          toast.error('Error al agregar semi');
                        }
                      }
                    }}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    + Agregar
                  </button>
                </div>
                <select {...register('carrierTrailerId')} className="input w-full text-sm border-purple-300 dark:border-purple-700">
                  <option value="">Sin remolque</option>
                  {carrierVehicles?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.patente} {v.tipo ? `(${v.tipo.replace('_', ' ')})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
