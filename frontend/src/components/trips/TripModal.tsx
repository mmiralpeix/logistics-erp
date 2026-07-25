'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tripsApi, vehiclesApi, driversApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Map, Clock, AlertTriangle, FileText, Calculator, FileCheck, Truck, Container, Lock, Scale, CalendarCheck } from 'lucide-react';
import { useEffect } from 'react';
import { formatMoney, formatDate } from '@/lib/utils';

export function TripModal({ trip, onClose, onSave }: { trip?: any; onClose: () => void; onSave?: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!trip;
  const isLocked = isEdit && (trip?.status === 'EN_CURSO' || trip?.status === 'FINALIZADO');

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-select'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: drivers } = useQuery({ queryKey: ['drivers-select'], queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });

  const formatDateTimeInput = (d?: any) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const initialValues = trip
    ? {
        ...trip,
        fechaSalidaProgramada: formatDateTimeInput(trip.fechaSalidaProgramada),
        fechaLlegadaEstimada: formatDateTimeInput(trip.fechaLlegadaEstimada),
        fechaSalidaReal: formatDateTimeInput(trip.fechaSalidaReal),
        fechaLlegadaReal: formatDateTimeInput(trip.fechaLlegadaReal),
      }
    : {
        status: 'PENDIENTE',
        tipoCarga: 'SALMUERA',
        esCargaPeligrosa: false,
        esMineria: false,
        esDistribucion: false,
        duracionEstimadaHoras: 8,
        esperaEnDestinoHoras: 2,
        descansosConductorHoras: 2,
      };

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: initialValues,
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
    onSuccess: (res: any) => {
      const num = res.data?.numero || trip?.numero || '';
      toast.success(isEdit ? `Viaje ${num} actualizado correctamente` : `Viaje ${num} creado exitosamente`);
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['gantt'] });
      qc.invalidateQueries({ queryKey: ['uncertified-trips'] });
      qc.invalidateQueries({ queryKey: ['uncertified-trips-count'] });
      onSave?.();
      onClose();
    },
    onError: (err: any) => {
      console.error('Error al guardar viaje:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al guardar el viaje');
    },
  });

  const onSubmit = (data: any) => {
    // If locked, preserve original operational IDs so they are not overwritten by disabled form controls
    const payload = isLocked
      ? {
          ...data,
          origen: trip.origen,
          destino: trip.destino,
          clientId: trip.clientId,
          vehicleId: trip.vehicleId,
          trailerId: trip.trailerId,
          driverId: trip.driverId,
        }
      : data;

    mutation.mutate(payload);
  };

  const onInvalid = (errors: any) => {
    console.warn('Errores de validación en el formulario:', errors);
    const fieldNames = Object.keys(errors).join(', ');
    toast.error(`Por favor completá los campos obligatorios: ${fieldNames}`);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEdit ? `Editar Viaje ${trip.numero || ''}` : 'Planificar Nuevo Viaje'}
              </h2>
              {isLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Ruta y recursos bloqueados (Viaje en curso/finalizado). Podés actualizar remito, balanza y fechas reales.
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-6">
          {/* LOCKED OPERATIONAL SUMMARY HEADER IF IN_COURSE OR FINALIZED */}
          {isLocked ? (
            <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Datos Operativos Consolidados
                </span>
                <span className="badge badge-purple text-xs font-bold">{trip.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm pt-1">
                <div>
                  <p className="text-xs text-slate-400">Ruta</p>
                  <p className="font-bold text-slate-900 dark:text-white">{trip.origen} ➔ {trip.destino}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Cliente</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{trip.client?.razonSocial || 'Sin cliente'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Conductor & Dominio</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{trip.driver?.lastName} ({trip.vehicle?.patente})</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Route */}
              <div className="col-span-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-300 flex items-center gap-2">
                  <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Ruta & Cliente
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Origen *</label>
                    <input {...register('origen', { required: !isEdit })} className="input" placeholder="Ciudad, Provincia" />
                  </div>
                  <div>
                    <label className="label">Destino *</label>
                    <input {...register('destino', { required: !isEdit })} className="input" placeholder="Ciudad, Provincia" />
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
                  <Truck className="w-4 h-4 text-emerald-600 dark:text-green-400" /> Tractor / Camión *
                </label>
                <select {...register('vehicleId', { required: !isEdit })} className="input font-semibold">
                  <option value="">Seleccionar Tractor / Camión...</option>
                  {powerUnits?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo} ({v.tipo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Container className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Equipo Enganchado
                </label>
                <select {...register('trailerId')} className="input font-semibold">
                  <option value="">Sin equipo remolcado</option>
                  {trailers?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo} ({v.tipo})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="label">Conductor Asignado *</label>
                <select {...register('driverId', { required: !isEdit })} className="input font-medium">
                  <option value="">Seleccionar conductor...</option>
                  {drivers?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName} — LIC: {d.licenciaTipo}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* EDITABLE BALANZA & REMITO SECTION (PRIMARY HIGHLIGHT) */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" /> Datos de Carga en Balanza & Remito
              </h3>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Completar al cargar / pesar camión</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label font-bold text-slate-900 dark:text-slate-100">N° de Remito de Carga</label>
                <input
                  {...register('numeroRemito')}
                  className="input font-mono font-bold uppercase text-base border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900"
                  placeholder="ej: 00006-00000720"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">Remito físico emitido en balanza u origen</p>
              </div>

              <div>
                <label className="label font-bold text-slate-900 dark:text-slate-100">Peso Real Balanza (kg)</label>
                <input
                  {...register('pesoCarga')}
                  type="number"
                  step="any"
                  className="input font-mono font-bold text-base border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300"
                  placeholder="ej: 34500 (KG en báscula)"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pesoCargaKg > 0 ? `Neto: ${(pesoCargaKg / 1000).toFixed(2)} Toneladas` : 'Ingrese kg netos de balanza'}
                </p>
              </div>

              <div className="col-span-2">
                <label className="label">N° Orden de Compra (OC Cliente)</label>
                <input
                  {...register('numeroOCCliente')}
                  className="input font-semibold uppercase"
                  placeholder="ej: 4500000980 - 2"
                />
              </div>
            </div>
          </div>

          {/* REAL DATES & TRAVEL DAYS CONTROL */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 space-y-3">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" /> Fechas Reales & Control de Días de Viaje
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="label">Salida Programada</label>
                <input {...register('fechaSalidaProgramada')} type="datetime-local" className="input" />
              </div>
              <div>
                <label className="label">Fecha Carga / Salida Real</label>
                <input {...register('fechaSalidaReal')} type="datetime-local" className="input" />
                <p className="text-[10px] text-slate-400 mt-0.5">Momento real de carga/salida</p>
              </div>
              <div>
                <label className="label">Fecha Llegada Real (Descarga)</label>
                <input {...register('fechaLlegadaReal')} type="datetime-local" className="input" />
                <p className="text-[10px] text-slate-400 mt-0.5">Momento real de llegada/descarga</p>
              </div>
            </div>
          </div>

          {/* Cargo Type & Rate Calculation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de Carga</label>
              <select {...register('tipoCarga')} className="input font-semibold">
                <option value="SALMUERA">🧪 SALMUERA / LÍQUIDOS MINEROS</option>
                <option value="CARRETON">🚜 CARRETON / MAQUINARIA PESADA</option>
                <option value="GENERAL">📦 MERCADERÍA GENERAL / SIDER</option>
                <option value="PELIGROSA">⚠ CARGA PELIGROSA / UN1203</option>
              </select>
            </div>

            <div>
              <label className="label">Estado del Viaje</label>
              <select {...register('status')} className="input font-semibold">
                <option value="PENDIENTE">Pendiente</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="label font-bold text-slate-900 dark:text-slate-100">Tarifa Acordada Total ($)</label>
              <input {...register('tarifaAcordada')} type="number" step="any" className="input text-lg font-bold text-blue-600 dark:text-blue-400" placeholder="0.00" />
            </div>

            {/* Salmuera & Excess Rate Calculation Panel */}
            {activeContract && (
              <div className="col-span-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                  <span className="flex items-center gap-1.5"><Calculator className="w-4 h-4" /> Desglose por Contrato ({activeContract.numero})</span>
                  <span className="text-sm font-extrabold">{formatMoney(calculatedTotalRate)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-700 dark:text-slate-300 pt-1">
                  <div>Base garantizada: <strong>{(minWeightKg / 1000).toFixed(0)} Tn</strong> → {formatMoney(baseRate)}</div>
                  <div>Excedente: <strong className="text-amber-600 dark:text-amber-400">+{excessTn.toFixed(1)} Tn (+{excessKg.toLocaleString('es-AR')} kg)</strong></div>
                  <div>Monto Extra: <strong className="text-emerald-600 dark:text-green-400 font-bold">+{formatMoney(excessAmount)}</strong></div>
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="label">Notas & Observaciones de Balanza</label>
              <textarea {...register('notas')} rows={2} className="input resize-none" placeholder="Observaciones del remito, ticket de balanza, datos de chofer..." />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              {isSubmitting || mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar Viaje' : 'Crear Viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
