'use client';
import { useState } from 'react';
import { FileCheck, Lock, Unlock } from 'lucide-react';
import { CARGO_TYPES } from '@/lib/constants';

export function CargoAndDocsSection({
  register,
  watch,
  pesoCargaKg,
  activeContract,
  selectedContractId,
}: {
  register: any;
  watch: any;
  pesoCargaKg: number;
  activeContract?: any;
  selectedContractId?: string;
}) {
  const [isOcUnlocked, setIsOcUnlocked] = useState(false);

  const hasContract = !!selectedContractId && !!activeContract;
  const isOcLocked = hasContract && !isOcUnlocked;

  return (
    <div className="space-y-4">
      {/* Recuadro destacado para Remito y OC */}
      <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Documentación de Ruta & Ticket de Balanza</span>
          </div>
          {hasContract && (
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300 dark:border-amber-700/50">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Contrato #{activeContract.numero}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
              N° Remito Digital / Balanza
            </label>
            <input
              {...register('numeroRemito')}
              className="input w-full text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-amber-300 dark:border-amber-700/60 focus:border-amber-500 focus:ring-amber-500"
              placeholder="00001-00007000"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                N° Orden de Compra (OC)
              </label>
              {hasContract && (
                <button
                  type="button"
                  onClick={() => setIsOcUnlocked(!isOcUnlocked)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                  title={isOcUnlocked ? 'Bloquear y vincular a datos de Contrato' : 'Desbloquear para modificar número de OC'}
                >
                  {isOcUnlocked ? (
                    <>
                      <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">Modo Manual</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>Modificar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                {...register('numeroOCCliente')}
                readOnly={isOcLocked}
                className={`input w-full text-sm font-mono font-bold border-amber-300 dark:border-amber-700/60 focus:border-amber-500 focus:ring-amber-500 transition-all ${
                  isOcLocked
                    ? 'bg-amber-100/70 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 cursor-not-allowed select-none pr-8'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                }`}
                placeholder="OC N°4500004664-4"
              />
              {isOcLocked && (
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
              )}
            </div>
            {isOcLocked && (
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-1 font-medium">
                🔒 Bloqueada por Contrato Corporativo. Hacé clic en &quot;Modificar&quot; para cambiar.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tipo de Carga
          </label>
          <select
            {...register('tipoCarga')}
            className="input w-full text-sm bg-white dark:bg-slate-900 font-medium"
          >
            <option value="">Seleccionar tipo de carga...</option>
            {!CARGO_TYPES.some((c) => c.value === watch('tipoCarga')) && watch('tipoCarga') && (
              <option value={watch('tipoCarga')}>{watch('tipoCarga')}</option>
            )}
            {CARGO_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Peso Carga (kg)
            </label>
            {pesoCargaKg > 0 && (
              <span className="text-[11px] font-bold text-slate-500">{(pesoCargaKg / 1000).toFixed(1)} Tn</span>
            )}
          </div>
          <input {...register('pesoCarga')} type="number" className="input w-full text-sm" placeholder="32550" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Distancia Estimada (KM)
          </label>
          <input {...register('distanciaKm')} type="number" className="input w-full text-sm" placeholder="1200" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Clasificación Especial
          </label>
          <select {...register('esCargaPeligrosa')} className="input w-full text-sm">
            <option value="false">Carga General Estándar</option>
            <option value="true">⚠ CARGA PELIGROSA / UN</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Estado del Viaje
          </label>
          <select {...register('status')} className="input w-full text-sm font-semibold">
            <option value="PENDIENTE">Pendiente</option>
            <option value="PROGRAMADO">Programado</option>
            <option value="EN_CURSO">En Curso</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>
    </div>
  );
}
