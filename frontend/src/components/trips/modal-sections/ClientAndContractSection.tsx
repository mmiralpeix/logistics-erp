'use client';
import { formatMoney } from '@/lib/utils';

export function ClientAndContractSection({
  register,
  isLocked,
  clients,
  selectedClientId,
  clientContracts,
  activeContract,
}: {
  register: any;
  isLocked: boolean;
  clients?: any[];
  selectedClientId?: string;
  clientContracts?: any[];
  activeContract?: any;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
          Cliente *
        </label>
        <select {...register('clientId', { required: true })} className="input w-full text-sm font-medium" disabled={isLocked}>
          <option value="">Seleccionar cliente...</option>
          {clients?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.razonSocial}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Contrato Corporativo
          </label>
          {activeContract && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              Base: {formatMoney(activeContract.tarifaBase)}
            </span>
          )}
        </div>
        <select {...register('contractId')} className="input w-full text-sm font-medium" disabled={isLocked || !selectedClientId}>
          <option value="">{selectedClientId ? 'Sin contrato específico' : 'Seleccione cliente primero...'}</option>
          {clientContracts?.map((c: any) => (
            <option key={c.id} value={c.id}>#{c.numero} — {c.descripcion || 'Contrato Estándar'}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
