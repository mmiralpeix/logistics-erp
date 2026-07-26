'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tripsApi, vehiclesApi, driversApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Map, Clock, FileText, Calculator, FileCheck, Truck, Container, Lock, Scale, CalendarCheck, DollarSign, Zap, User, Building2 } from 'lucide-react';
import { useEffect } from 'react';
import { formatMoney } from '@/lib/utils';

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
        tarifaAcordada: trip.tarifaAcordada ? Math.round(Number(trip.tarifaAcordada)) : '',
        costoTotal: trip.costoTotal ? Math.round(Number(trip.costoTotal)) : '',
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
      const roundedRate = Math.round(calculatedTotalRate);
      const roundedExcessAmount = Math.round(excessAmount);
      setValue('tarifaAcordada', roundedRate);
      setValue('pesoExcedenteKg', Math.round(excessKg));
      setValue('montoExcedente', roundedExcessAmount);
    }
  }, [selectedContractId, pesoCargaKg, activeContract?.id]);

  const handleAutoCalculateCost = () => {
    const km = Number(watch('distanciaKm')) || 0;
    if (!km) {
      toast.error('Ingrese los KM de la ruta para calcular el costo');
      return;
    }
    // Formula: Gasoil 35L/100km a $1.150/L + $150/km en peajes/viáticos
    const fuelCost = (km / 100) * 35 * 1150;
    const tollAndDriverCost = km * 150;
    const totalEstCost = Math.round(fuelCost + tollAndDriverCost);
    setValue('costoTotal', totalEstCost);
    toast.success(`Costo estimado pre-calculado para ${km} km: ${formatMoney(totalEstCost)}`);
  };

  const duracion = watch('duracionEstimadaHoras') || 0;
  const espera = watch('esperaEnDestinoHoras') || 0;
  const descanso = watch('descansosConductorHoras') || 0;
  const totalLeadTime = Number(duracion) + Number(espera) + Number(descanso);

  const tarifaWatch = Number(watch('tarifaAcordada')) || 0;
  const costoWatch = Number(watch('costoTotal')) || 0;
  const margenWatch = tarifaWatch - costoWatch;

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
    // Sanitize nested relational objects from initialValues before sending to API
    const {
      client, contract, vehicle, trailer, driver, dispatcher,
      costs, checkpoints, documents, incidents, invoiceItems, fuelLogs,
      _count, createdAt, updatedAt, certification, ...cleanData
    } = data;

    const payload = isLocked
      ? {
          ...cleanData,
          origen: trip.origen,
          destino: trip.destino,
          clientId: trip.clientId,
          vehicleId: trip.vehicleId,
          trailerId: trip.trailerId,
          driverId: trip.driverId,
        }
      : cleanData;

    mutation.mutate(payload);
  };

  const onInvalid = (errors: any) => {
    console.warn('Errores de validación en el formulario:', errors);
    const fieldNames = Object.keys(errors).join(', ');
    toast.error(`Por favor completá los campos obligatorios: ${fieldNames}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                {isEdit ? `Editar Viaje ${trip.numero || ''}` : 'Planificar Nuevo Viaje'}
              </h2>
              {isLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5" /> Ruta y recursos bloqueados (Viaje en curso/finalizado). Podés actualizar remito, balanza y fechas reales.
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Seccion 1: Cliente & Contrato */}
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

          {/* Seccion 2: Vehículos & Conductor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Unidad Tractora / Camión *
              </label>
              <select {...register('vehicleId', { required: true })} className="input w-full text-sm font-medium" disabled={isLocked}>
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
              <select {...register('driverId', { required: true })} className="input w-full text-sm font-medium" disabled={isLocked}>
                <option value="">Seleccionar conductor...</option>
                {drivers?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} {d.habilitadoCargasPeligrosas ? '⚡ (Hab. Peligrosas)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Seccion 3: Ruta & Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Origen *
              </label>
              <input {...register('origen', { required: true })} className="input w-full text-sm" placeholder="Ej: Salta" disabled={isLocked} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Destino *
              </label>
              <input {...register('destino', { required: true })} className="input w-full text-sm" placeholder="Ej: Mariana" disabled={isLocked} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha y Hora de Salida *
              </label>
              <input {...register('fechaSalidaProgramada', { required: true })} type="datetime-local" className="input w-full text-sm" disabled={isLocked} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Llegada Estimada
                </label>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {totalLeadTime}h Lead Time Total
                </span>
              </div>
              <input {...register('fechaLlegadaEstimada')} type="datetime-local" className="input w-full text-sm" disabled={isLocked} />
            </div>

            {/* Fechas Reales */}
            <div>
              <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" /> Salida Real
              </label>
              <input {...register('fechaSalidaReal')} type="datetime-local" className="input w-full text-sm border-emerald-300 dark:border-emerald-700/50" />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CalendarCheck className="w-3.5 h-3.5" /> Llegada Real
              </label>
              <input {...register('fechaLlegadaReal')} type="datetime-local" className="input w-full text-sm border-emerald-300 dark:border-emerald-700/50" />
            </div>
          </div>

          {/* Seccion 4: Documentos & Carga (Con recuadro naranja destacado para Remito) */}
          <div className="col-span-2 p-3.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-sm space-y-3">
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
              <input {...register('tipoCarga')} className="input w-full text-sm" placeholder="SALMUERA" />
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

          {/* Seccion 5: Bloque Financiero Impecable (Tarifa, Costo Estimado & Margen Bruto) */}
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
                  <div>Base garantizada: <strong>{(minWeightKg / 1000).toFixed(0)} Tn</strong> → {formatMoney(baseRate)}</div>
                  <div>Excedente: <strong className="text-amber-600 dark:text-amber-400">+{excessTn.toFixed(1)} Tn (+{excessKg.toLocaleString('es-AR')} kg)</strong></div>
                  <div>Monto Extra: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">+{formatMoney(excessAmount)}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Notas & Observaciones de Balanza
            </label>
            <textarea {...register('notas')} rows={2} className="input w-full text-sm resize-none" placeholder="Observaciones del remito, ticket de balanza, datos de chofer..." />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-sm px-5 py-2">
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Planificar Viaje'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
