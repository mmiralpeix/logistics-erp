'use client';
import { Zap, Calculator } from 'lucide-react';
import { formatMoney, formatWeight } from '@/lib/utils';

export function FinancialsSection({
  register,
  margenWatch,
  handleAutoCalculateCost,
  activeContract,
  calculatedTotalRate,
  minWeightKg,
  baseRate,
  excessTn,
  excessKg,
  excessAmount,
}: {
  register: any;
  margenWatch: number;
  handleAutoCalculateCost: () => void;
  activeContract?: any;
  calculatedTotalRate?: number | null;
  minWeightKg: number;
  baseRate: number;
  excessTn: number;
  excessKg: number;
  excessAmount: number;
}) {
  return (
    <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {/* Tarifa Acordada */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tarifa Acordada ($)
          </label>
          <input
            {...register('tarifaAcordada')}
            type="number"
            step="any"
            className="input w-full text-sm font-bold text-blue-600 dark:text-blue-400"
            placeholder="0.00"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Facturación al cliente</span>
        </div>

        {/* Costo Estimado */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Costo Estimado ($)
            </label>
            <button
              type="button"
              onClick={handleAutoCalculateCost}
              className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 border border-amber-500/20"
              title="Calcular costo automáticamente en base a la distancia en KM"
            >
              <Zap className="w-3 h-3" /> Auto por KM
            </button>
          </div>
          <input
            {...register('costoTotal')}
            type="number"
            step="any"
            className="input w-full text-sm font-bold text-slate-900 dark:text-white"
            placeholder="0.00"
          />
          <span className="text-[10px] text-slate-400 mt-1 block">Combustible, peajes, chofer</span>
        </div>

        {/* Margen Bruto */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Margen Bruto ($)
          </label>
          <div className={`input w-full text-sm font-black flex items-center ${
            margenWatch >= 0
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
          }`}>
            {formatMoney(margenWatch)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tarifa - Costo</span>
        </div>
      </div>

      {/* Desglose por Contrato */}
      {activeContract && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-600" /> Desglose por Contrato ({activeContract.numero})
            </span>
            <span className="text-sm font-extrabold">{formatMoney(calculatedTotalRate)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-slate-700 dark:text-slate-300 pt-1 text-[11px]">
            <div>Base garantizada: <strong>{formatWeight(minWeightKg)}</strong> → {formatMoney(baseRate)}</div>
            <div>Excedente: <strong className="text-amber-600 dark:text-amber-400">+{formatWeight(excessKg)}</strong></div>
            <div>Monto Extra: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatMoney(excessAmount)}</strong></div>
          </div>
        </div>
      )}

      {/* Fondos de Reserva Personalizados por Viaje */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>💰</span> Fondos de Reserva por Viaje (Opcional)
          </label>
          <span className="text-[10px] text-slate-400">Dejar vacío para usar 13% y 11% global</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              🛠️ % Reserva Mantenimiento
            </label>
            <input
              {...register('pctMaintenanceOverride')}
              type="number"
              step="0.5"
              min="0"
              max="50"
              className="input w-full text-xs font-bold"
              placeholder="13.0% (Global por defecto)"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              🛞 % Reserva Neumáticos
            </label>
            <input
              {...register('pctTiresOverride')}
              type="number"
              step="0.5"
              min="0"
              max="50"
              className="input w-full text-xs font-bold"
              placeholder="11.0% (Global por defecto)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
