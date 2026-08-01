'use client';
import { FileCheck } from 'lucide-react';
import { CARGO_TYPES } from '@/lib/constants';

export function CargoAndDocsSection({
  register,
  watch,
  pesoCargaKg,
}: {
  register: any;
  watch: any;
  pesoCargaKg: number;
}) {
  return (
    <div className="space-y-4">
      {/* Recuadro destacado para Remito y OC */}
      <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
          <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Documentación de Ruta & Ticket de Balanza</span>
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
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
              N° Orden de Compra (OC)
            </label>
            <input
              {...register('numeroOCCliente')}
              className="input w-full text-sm font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-amber-300 dark:border-amber-700/60 focus:border-amber-500 focus:ring-amber-500"
              placeholder="OC N°4500004664-4"
            />
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
