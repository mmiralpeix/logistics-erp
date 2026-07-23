'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tripsApi, vehiclesApi, driversApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Map, Clock, AlertTriangle, FileText, Calculator, FileCheck, Truck, Container } from 'lucide-react';
import { useEffect } from 'react';
import { formatMoney } from '@/lib/utils';

export function TripModal({ trip, onClose }: { trip?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!trip;

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-select'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: drivers } = useQuery({ queryKey: ['drivers-select'], queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: trip || {
      status: 'PENDIENTE', tipoCarga: 'SALMUERA', esCargaPeligrosa: false, esMineria: false, esDistribucion: false,
      duracionEstimadaHoras: 8, esperaEnDestinoHoras: 2, descansosConductorHoras: 2,
    },
  });

  const selectedClientId = watch('clientId');
  const selectedContractId = watch('contractId');
  const pesoCargaKg = Number(watch('pesoCarga')) || 0;
  const tipoCargaSelected = watch('tipoCarga');

  // Filter vehicles: Power units vs Trailers
  const powerUnits = vehicles?.filter((v: any) => ['CAMION', 'TRACTOR', 'CAMIONETA', 'EQUIPO_ESPECIAL'].includes(v.tipo)) || vehicles;
  const trailers = vehicles?.filter((v: any) => ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA', 'BITREN', 'CISTERNA', 'VOLQUETE', 'ACOPLADO'].includes(v.tipo)) || vehicles;

  // Fetch contracts for the selected client
  const { data: clientContracts } = useQuery({
    queryKey: ['client-contracts', selectedClientId],
    queryFn: () => selectedClientId ? clientsApi.getContracts(selectedClientId).then((r) => r.data) : Promise.resolve([]),
    enabled: !!selectedClientId,
  });

  const activeContract = clientContracts?.find((c: any) => c.id === selectedContractId) || clientContracts?.[0];

  // Automatic calculation of base rate + excess tonnage
  const baseRate = activeContract?.tarifaBase || 0;
  const minWeightKg = activeContract?.pesoMinimoKg || 30000;
  const excessRatePerTn = activeContract?.tarifaExcedentePorTn || 0;

  const excessKg = Math.max(0, pesoCargaKg - minWeightKg);
  const excessTn = excessKg / 1000;
  const excessAmount = excessTn * excessRatePerTn;
  const calculatedTotalRate = activeContract ? baseRate + excessAmount : null;

  useEffect(() => {
    if (activeContract && calculatedTotalRate !== null) {
      setValue('tarifaAcordada', calculatedTotalRate);
      setValue('pesoExcedenteKg', excessKg);
      setValue('montoExcedente', excessAmount);
    }
  }, [selectedContractId, pesoCargaKg, activeContract?.id]);

  const duracion = watch('duracionEstimadaHoras') || 0;
  const espera = watch('esperaEnDestinoHoras') || 0;
  const descanso = watch('descansosConductorHoras') || 0;
  const totalLeadTime = Number(duracion) + Number(espera) + Number(descanso);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? tripsApi.update(trip.id, data) : tripsApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Viaje actualizado' : 'Viaje creado exitosamente');
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['gantt'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al guardar viaje'),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Editar Viaje' : 'Planificar Nuevo Viaje'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Route */}
            <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 flex items-center gap-2"><Map className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Ruta</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Origen *</label>
                  <input {...register('origen', { required: true })} className="input" placeholder="Ciudad, Provincia" />
                </div>
                <div>
                  <label className="label">Destino *</label>
                  <input {...register('destino', { required: true })} className="input" placeholder="Ciudad, Provincia" />
                </div>
                <div>
                  <label className="label">Distancia (km)</label>
                  <input {...register('distanciaKm')} type="number" className="input" placeholder="850" />
                </div>
                <div>
                  <label className="label">Cliente</label>
                  <select {...register('clientId')} className="input font-medium">
                    <option value="">Sin cliente asignado</option>
                    {clients?.map((c: any) => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
                  </select>
                </div>
              </div>

              {/* OC / Contract selection */}
              {selectedClientId && clientContracts && clientContracts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="label flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <FileText className="w-4 h-4" /> Órden de Compra Marco (OC)
                  </label>
                  <select {...register('contractId')} className="input font-semibold bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                    <option value="">Sin Órden Marco asignada (Usar OC directa de Viaje)</option>
                    {clientContracts.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.numero} — {c.descripcion} (Mín: {(c.pesoMinimoKg / 1000).toFixed(0)} Tn @ {formatMoney(c.tarifaBase)} + {formatMoney(c.tarifaExcedentePorTn)}/Tn extra)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Resources: Tractor + Hooked Semi/Carreton */}
            <div>
              <label className="label flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-green-400" /> Tractor / Camión (Unidad Motriz) *
              </label>
              <select {...register('vehicleId', { required: true })} className="input font-semibold">
                <option value="">Seleccionar Tractor / Camión...</option>
                {powerUnits?.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo} ({v.tipo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Container className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Equipo Enganchado (Semi / Cisterna / Carretón)
              </label>
              <select {...register('trailerId')} className="input font-semibold">
                <option value="">Sin equipo remolcado (o Selección posterior)</option>
                {trailers?.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo} ({v.tipo})</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="label">Conductor Asignado *</label>
              <select {...register('driverId', { required: true })} className="input font-medium">
                <option value="">Seleccionar conductor...</option>
                {drivers?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — LIC: {d.licenciaTipo}</option>
                ))}
              </select>
            </div>

            {/* Documentation Block: Remito & OC */}
            <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Documentación Comercial de Respaldo
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">N° de Remito de Carga</label>
                  <input {...register('numeroRemito')} className="input font-semibold uppercase" placeholder="R-0001-00014892" />
                  <p className="text-[11px] text-slate-500 mt-0.5">Remito de balanza o de carga en origen</p>
                </div>
                <div>
                  <label className="label">N° Órden de Compra (OC del Cliente)</label>
                  <input {...register('numeroOCCliente')} className="input font-semibold uppercase" placeholder="OC-BBC-4091 (Opcional)" />
                  <p className="text-[11px] text-slate-500 mt-0.5">Si la empresa la entrega días después, se puede cargar luego</p>
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-green-400" /> Lead Time Multidía
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="label">Salida programada *</label>
                  <input {...register('fechaSalidaProgramada', { required: true })} type="datetime-local" className="input" />
                </div>
                <div>
                  <label className="label">Duración de ruta (h)</label>
                  <input {...register('duracionEstimadaHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Espera en destino (h)</label>
                  <input {...register('esperaEnDestinoHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
                <div>
                  <label className="label">Descansos conductor (h)</label>
                  <input {...register('descansosConductorHoras')} type="number" step="0.5" className="input" min="0" />
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Ruta: <strong>{duracion}h</strong> · Espera: <strong>{espera}h</strong> · Descanso: <strong>{descanso}h</strong></span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Lead Time: {totalLeadTime}h ({(totalLeadTime / 24).toFixed(1)} días)</span>
              </div>
            </div>

            {/* Cargo & Excess Rate Calculation */}
            <div>
              <label className="label">Tipo de Carga *</label>
              <select {...register('tipoCarga', { required: true })} className="input font-semibold">
                <option value="SALMUERA">🧪 SALMUERA / LÍQUIDOS MINEROS</option>
                <option value="CARRETON">🚜 CARRETON / MAQUINARIA PESADA</option>
                <option value="GENERAL">📦 MERCADERÍA GENERAL / SIDER</option>
                <option value="PELIGROSA">⚠ CARGA PELIGROSA / UN1203</option>
              </select>
            </div>
            <div>
              <label className="label">Peso Real de Balanza (kg) *</label>
              <input {...register('pesoCarga')} type="number" step="any" className="input font-bold text-slate-900 dark:text-white" placeholder="34500.5" />
              <p className="text-[11px] text-slate-500 mt-0.5">Ej: 34500.5 kg = 34.5 Tn</p>
            </div>

            <div className="col-span-2">
              <label className="label">Tarifa Acordada Total ($)</label>
              <input {...register('tarifaAcordada')} type="number" step="any" className="input text-lg font-bold text-blue-600 dark:text-blue-400" placeholder="380000.20" />
            </div>

            {/* Salmuera & Excess Tonnage Calculator Panel */}
            {activeContract && (
              <div className="col-span-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                  <span className="flex items-center gap-1.5"><Calculator className="w-4 h-4" /> Desglose de Tarifa por Órden de Compra ({activeContract.numero})</span>
                  <span className="text-sm font-extrabold">{formatMoney(calculatedTotalRate)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-700 dark:text-slate-300 pt-1">
                  <div>Base garantizada: <strong>{(minWeightKg / 1000).toFixed(0)} Tn</strong> → {formatMoney(baseRate)}</div>
                  <div>Excedente {tipoCargaSelected}: <strong className="text-amber-600 dark:text-amber-400">+{excessTn.toFixed(1)} Tn (+{excessKg.toLocaleString('es-AR')} kg)</strong></div>
                  <div>Monto Excedente a Cobrar: <strong className="text-emerald-600 dark:text-green-400 font-bold">+{formatMoney(excessAmount)}</strong> (@ {formatMoney(excessRatePerTn)}/Tn)</div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Estado del Viaje</label>
              <select {...register('status')} className="input">
                <option value="PENDIENTE">Pendiente</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            {/* Special flags */}
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('esCargaPeligrosa')} type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Cargas Peligrosas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input {...register('esMineria')} type="checkbox" className="w-4 h-4 text-amber-600 rounded" />
                <span className="text-xs text-slate-700 dark:text-slate-300">Minería</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="label">Descripción de carga</label>
              <textarea {...register('descripcionCarga')} rows={2} className="input resize-none" placeholder="Mercadería a transportar, salmuera de pozo, etc..." />
            </div>
            <div className="col-span-2">
              <label className="label">Notas</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Instrucciones especiales, ticket de balanza..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Viaje' : 'Crear Viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
