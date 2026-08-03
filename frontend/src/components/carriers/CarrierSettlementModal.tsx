'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carriersApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { X, DollarSign, FileText, CheckCircle2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  carrier: any;
  onClose: () => void;
}

export function CarrierSettlementModal({ carrier, onClose }: Props) {
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [retencionPct, setRetencionPct] = useState<number>(5);
  const [settlementResult, setSettlementResult] = useState<any>(null);
  const qc = useQueryClient();

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['carrier-summary-360', carrier.id],
    queryFn: () => carriersApi.getSummary360(carrier.id).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => carriersApi.createSettlement(carrier.id, { tripIds: selectedTrips, retencionPct }),
    onSuccess: (res) => {
      toast.success('Orden de liquidación generada exitosamente');
      setSettlementResult(res.data);
      qc.invalidateQueries({ queryKey: ['carrier-summary-360', carrier.id] });
    },
    onError: () => toast.error('Error al generar liquidación'),
  });

  const trips = summaryData?.trips || [];

  const toggleSelectTrip = (id: string) => {
    setSelectedTrips((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const subtotalSelected = trips
    .filter((t: any) => selectedTrips.includes(t.id))
    .reduce((sum: number, t: any) => sum + (t.subcontractorFee || t.tarifaAcordada || 0), 0);

  const montoRetencion = subtotalSelected * (retencionPct / 100);
  const netoALiquidar = subtotalSelected - montoRetencion;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Liquidación & Rendición de Fletes</h2>
              <p className="text-xs text-slate-500">Operador: {carrier.razonSocial} (CUIT {carrier.cuit || 'S/D'})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {settlementResult ? (
          /* Settlement Confirmation Ticket */
          <div className="p-6 space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-black text-emerald-900 dark:text-emerald-300">
                Liquidación {settlementResult.numeroLiquidacion} Emitida
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Se ha generado el resumen de pago por {settlementResult.resumen.cantidadViajes} fletes ejecutados.
              </p>
            </div>

            <div className="card p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50 font-mono">
              <div className="flex justify-between"><span>Subtotal Fletes:</span> <strong>{formatMoney(settlementResult.resumen.subtotalFlete)}</strong></div>
              <div className="flex justify-between text-rose-600"><span>Retención ({settlementResult.resumen.retencionPct}%):</span> <strong>-{formatMoney(settlementResult.resumen.montoRetencion)}</strong></div>
              <div className="flex justify-between text-base font-black text-emerald-600 border-t pt-2"><span>Neto a Pagar:</span> <strong>{formatMoney(settlementResult.resumen.netoALiquidar)}</strong></div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="btn-primary text-xs px-4 py-2">Cerrar</button>
            </div>
          </div>
        ) : (
          /* Form & Trips Selection */
          <div className="p-6 space-y-4 text-xs">
            <div className="space-y-2">
              <label className="label">Seleccionar Viajes para Liquidar</label>
              <div className="card overflow-hidden max-h-56 overflow-y-auto border">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="p-2.5 text-center">Sel.</th>
                      <th className="p-2.5 text-left">Número</th>
                      <th className="p-2.5 text-left">Origen ➔ Destino</th>
                      <th className="p-2.5 text-right">Flete ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-400">Cargando viajes...</td></tr>
                    ) : trips.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-400">Sin viajes asignados para liquidar</td></tr>
                    ) : (
                      trips.map((t: any) => (
                        <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedTrips.includes(t.id)}
                              onChange={() => toggleSelectTrip(t.id)}
                              className="w-4 h-4 rounded text-purple-600"
                            />
                          </td>
                          <td className="p-2.5 font-bold">{t.numero}</td>
                          <td className="p-2.5 text-slate-600">{t.origen} ➔ {t.destino}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">
                            {formatMoney(t.subcontractorFee || t.tarifaAcordada || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Retención / Comisión (%)</label>
                <input
                  type="number"
                  value={retencionPct}
                  onChange={(e) => setRetencionPct(Number(e.target.value))}
                  className="input"
                  placeholder="5"
                />
              </div>

              <div className="card p-3 bg-slate-50 dark:bg-slate-800/50 space-y-1 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-black">Neto a Liquidar</span>
                <span className="text-lg font-black text-emerald-600 block">{formatMoney(netoALiquidar)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
              <button
                onClick={() => mutation.mutate()}
                disabled={selectedTrips.length === 0 || mutation.isPending}
                className="btn-primary disabled:opacity-60 flex items-center gap-1.5"
              >
                {mutation.isPending ? 'Emitiendo...' : 'Generar Liquidación'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
