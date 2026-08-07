'use client';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { tripsApi, vehiclesApi, driversApi, clientsApi, carriersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Map, Lock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatMoney, formatOCNumber } from '@/lib/utils';
import { OperationModeSection } from './modal-sections/OperationModeSection';
import { ClientAndContractSection } from './modal-sections/ClientAndContractSection';
import { FleetAssignmentSection } from './modal-sections/FleetAssignmentSection';
import { RouteAndDatesSection } from './modal-sections/RouteAndDatesSection';
import { CargoAndDocsSection } from './modal-sections/CargoAndDocsSection';
import { FinancialsSection } from './modal-sections/FinancialsSection';

export function TripModal({ trip, onClose, onSave }: { trip?: any; onClose: () => void; onSave?: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!trip;
  const isLocked = isEdit && (trip?.status === 'EN_CURSO' || trip?.status === 'FINALIZADO');

  const { data: vehicles } = useQuery({ queryKey: ['vehicles-select'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: drivers } = useQuery({ queryKey: ['drivers-select'], queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: carriers } = useQuery({ queryKey: ['carriers-select'], queryFn: () => carriersApi.getAll({ limit: 100 }).then((r) => r.data.data) });

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
        tipoCarga: '',
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

  const selectedCarrierId = watch('carrierId');
  const { data: carrierVehicles } = useQuery({
    queryKey: ['carrier-vehicles', selectedCarrierId],
    queryFn: () => selectedCarrierId ? carriersApi.getVehicles(selectedCarrierId).then((r) => r.data) : Promise.resolve([]),
    enabled: !!selectedCarrierId,
  });
  const { data: carrierDrivers } = useQuery({
    queryKey: ['carrier-drivers', selectedCarrierId],
    queryFn: () => selectedCarrierId ? carriersApi.getDrivers(selectedCarrierId).then((r) => r.data) : Promise.resolve([]),
    enabled: !!selectedCarrierId,
  });

  const powerUnits = vehicles?.filter((v: any) => ['CAMION', 'TRACTOR', 'CAMIONETA', 'EQUIPO_ESPECIAL'].includes(v.tipo)) || vehicles;
  const trailers = vehicles?.filter((v: any) => ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA', 'BITREN', 'CISTERNA', 'VOLQUETE', 'ACOPLADO'].includes(v.tipo)) || vehicles;

  const { data: clientContracts } = useQuery({
    queryKey: ['client-contracts', selectedClientId],
    queryFn: () => selectedClientId ? clientsApi.getContracts(selectedClientId).then((r) => r.data) : Promise.resolve([]),
    enabled: !!selectedClientId,
  });

  const activeContract = selectedContractId ? clientContracts?.find((c: any) => c.id === selectedContractId) : undefined;

  const baseRate = activeContract?.tarifaBase || 0;
  const minWeightKg = activeContract?.pesoMinimoKg || 30000;
  const excessRatePerTn = activeContract?.tarifaExcedentePorTn || 0;

  const excessKg = Math.max(0, pesoCargaKg - minWeightKg);
  const excessTn = excessKg / 1000;
  const excessAmount = excessTn * excessRatePerTn;
  const calculatedTotalRate = activeContract ? baseRate + excessAmount : null;

  // La tarifa se recalcula sola en base al contrato mientras el usuario no la haya
  // tocado a mano. En cuanto la edita manualmente, dejamos de pisar su valor - y
  // volvemos a recalcular solo si cambia de contrato (elección deliberada).
  const [tarifaOverridden, setTarifaOverridden] = useState(false);
  useEffect(() => {
    setTarifaOverridden(false);
  }, [selectedContractId]);

  useEffect(() => {
    if (activeContract) {
      if (calculatedTotalRate !== null && !tarifaOverridden) {
        const roundedRate = Math.round(calculatedTotalRate);
        setValue('tarifaAcordada', roundedRate);
      }
      if (calculatedTotalRate !== null) {
        const roundedExcessAmount = Math.round(excessAmount);
        setValue('pesoExcedenteKg', Math.round(excessKg));
        setValue('montoExcedente', roundedExcessAmount);
      }
      if (activeContract.numero) {
        setValue('numeroOCCliente', formatOCNumber(activeContract.numero));
      }
    }
  }, [selectedContractId, pesoCargaKg, activeContract, calculatedTotalRate, excessAmount, excessKg, tarifaOverridden, setValue]);

  const handleUseCalculatedRate = () => {
    if (calculatedTotalRate !== null) {
      setValue('tarifaAcordada', Math.round(calculatedTotalRate));
      setTarifaOverridden(false);
    }
  };

  const handleAutoCalculateCost = () => {
    const km = Number(watch('distanciaKm')) || 0;
    if (!km) {
      toast.error('Ingrese los KM de la ruta para calcular el costo');
      return;
    }
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
    const {
      id: _id, client, contract, vehicle, trailer, driver, dispatcher,
      costs, checkpoints, documents, incidents, invoiceItems, fuelLogs,
      _count, createdAt, updatedAt, certification, ...cleanData
    } = data;

    if (!cleanData.trailerId) cleanData.trailerId = null;
    if (!cleanData.contractId) cleanData.contractId = null;
    if (!cleanData.clientId) cleanData.clientId = null;

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

    ['clientId', 'contractId', 'vehicleId', 'trailerId', 'driverId', 'carrierId', 'carrierDriverId', 'carrierVehicleId', 'carrierTrailerId'].forEach((k) => {
      if (payload[k] === '') payload[k] = undefined;
    });

    mutation.mutate(payload);
  };

  const onInvalid = (errors: any) => {
    console.warn('Errores de validación en el formulario:', errors);
    const fieldNames = Object.keys(errors).join(', ');
    toast.error(`Por favor completá los campos obligatorios: ${fieldNames}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-4 overflow-y-auto flex-1">
          <OperationModeSection
            register={register}
            watch={watch}
            setValue={setValue}
            carriers={carriers || []}
            selectedCarrierId={selectedCarrierId}
            carrierVehicles={carrierVehicles}
            carrierDrivers={carrierDrivers}
            qc={qc}
          />

          <ClientAndContractSection
            register={register}
            isLocked={isLocked}
            clients={clients}
            selectedClientId={selectedClientId}
            clientContracts={clientContracts}
            activeContract={activeContract}
          />

          <FleetAssignmentSection
            register={register}
            watch={watch}
            isLocked={isLocked}
            powerUnits={powerUnits}
            trailers={trailers}
            drivers={drivers}
          />

          <RouteAndDatesSection
            register={register}
            isLocked={isLocked}
            totalLeadTime={totalLeadTime}
          />

          <CargoAndDocsSection
            register={register}
            watch={watch}
            pesoCargaKg={pesoCargaKg}
            activeContract={activeContract}
            selectedContractId={selectedContractId}
          />

          <FinancialsSection
            register={register}
            margenWatch={margenWatch}
            handleAutoCalculateCost={handleAutoCalculateCost}
            activeContract={activeContract}
            calculatedTotalRate={calculatedTotalRate}
            minWeightKg={minWeightKg}
            baseRate={baseRate}
            excessTn={excessTn}
            excessKg={excessKg}
            excessAmount={excessAmount}
            tarifaOverridden={tarifaOverridden}
            onTarifaManualEdit={() => setTarifaOverridden(true)}
            onUseCalculatedRate={handleUseCalculatedRate}
          />

          <div className="pt-2">
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
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
              {(isSubmitting || mutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEdit ? 'Guardar Cambios' : 'Planificar Viaje'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
