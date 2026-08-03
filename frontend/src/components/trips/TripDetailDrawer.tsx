'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import {
  X, MapPin, Truck, User, Building2, Calendar, Clock, DollarSign,
  FileText, ShieldCheck, Flame, Layers, Award, AlertCircle
} from 'lucide-react';

interface TripDetailDrawerProps {
  tripId: string | null;
  onClose: () => void;
}

export function TripDetailDrawer({ tripId, onClose }: TripDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'route' | 'resources' | 'cargo' | 'financials'>('route');

  const { data, isLoading } = useQuery({
    queryKey: ['trip-summary-360', tripId],
    queryFn: () => tripsApi.getSummary360(tripId!).then((r) => r.data),
    enabled: !!tripId,
  });

  if (!tripId) return null;

  const trip = data?.trip;
  const fin = data?.financials;
  const costs = trip?.costs || [];
  const checkpoints = trip?.checkpoints || [];
  const dangerousGoods = trip?.dangerousGoods;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{trip?.numero || 'Cargando...'}</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {trip?.status}
                </span>
                {trip?.esCargaPeligrosa && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" /> Carga Peligrosa (Dec. 779/95)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Cliente: <strong className="text-slate-800 dark:text-slate-200">{trip?.client?.razonSocial || 'S/D'}</strong> • Contrato: {trip?.contract?.numero || 'Spot'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs font-bold bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('route')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'route' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Bitácora de Ruta & Tiempos
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'resources' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Recursos Asignados
          </button>
          <button
            onClick={() => setActiveTab('cargo')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'cargo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Carga & Documentación
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'financials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Finanzas & Gastos Directos ({costs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Cargando expediente 360° del viaje...</div>
          ) : activeTab === 'route' ? (
            <div className="space-y-6">
              {/* Route Summary Card */}
              <div className="card p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs text-blue-300 font-bold uppercase tracking-wider">
                  <span>Itinerario de Ruta</span>
                  <span>{trip?.distanciaKm ? `${trip.distanciaKm} km` : 'Ruta Estándar'}</span>
                </div>
                <div className="flex items-center justify-between text-base font-black">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span>{trip?.origen}</span>
                  </div>
                  <span className="text-blue-400 text-xs font-mono">➔ ➔ ➔</span>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-400" />
                    <span>{trip?.destino}</span>
                  </div>
                </div>
              </div>

              {/* Times & Lead Time Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Salida Programada</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-1">
                    {new Date(trip?.fechaSalidaProgramada).toLocaleString()}
                  </span>
                </div>

                <div className="card p-4 border-l-4 border-l-purple-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Llegada Estimada</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-1">
                    {new Date(trip?.fechaLlegadaEstimada).toLocaleString()}
                  </span>
                </div>

                <div className="card p-4 border-l-4 border-l-emerald-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Lead Time Total</span>
                  <span className="text-sm font-extrabold text-emerald-600 block mt-1">
                    {trip?.leadTimeTotal ? `${trip.leadTimeTotal} hs` : '24 hs'}
                  </span>
                  <span className="text-[11px] text-slate-500">Incluye esperas ({trip?.esperaEnDestinoHoras}h) y descansos ({trip?.descansosConductorHoras}h)</span>
                </div>
              </div>

              {/* Checkpoints Timeline */}
              {checkpoints.length > 0 && (
                <div className="card p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Puntos de Control Alcanzados (Checkpoints)</h3>
                  <div className="space-y-2">
                    {checkpoints.map((cp: any, idx: number) => (
                      <div key={cp.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{cp.nombre}</span>
                          <span className="text-slate-500 font-medium">({cp.ubicacion})</span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          {cp.real ? `Alcanzado: ${new Date(cp.real).toLocaleTimeString()}` : `Estimado: ${new Date(cp.estimado).toLocaleTimeString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'resources' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Vehicle */}
              <div className="card p-5 space-y-2 border-l-4 border-l-blue-600">
                <span className="text-[10px] font-black uppercase text-slate-500">Unidad Motriz Asignada</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {trip?.vehicle ? `${trip.vehicle.patente} (${trip.vehicle.marca} ${trip.vehicle.modelo})` : trip?.carrierVehicle?.patente || 'S/D'}
                </p>
                <p className="text-xs text-slate-500">Odómetro actual: {trip?.vehicle?.kilometraje?.toLocaleString() || 0} km</p>
              </div>

              {/* Trailer */}
              <div className="card p-5 space-y-2 border-l-4 border-l-purple-600">
                <span className="text-[10px] font-black uppercase text-slate-500">Semirremolque / Cisterna</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {trip?.trailer ? `${trip.trailer.patente} (${trip.trailer.modelo})` : 'Sin remolcado'}
                </p>
              </div>

              {/* Driver */}
              <div className="card p-5 space-y-2 border-l-4 border-l-emerald-600">
                <span className="text-[10px] font-black uppercase text-slate-500">Conductor Titular</span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  {trip?.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : trip?.carrierDriver ? `${trip.carrierDriver.firstName} ${trip.carrierDriver.lastName}` : 'S/D'}
                </p>
                <p className="text-xs text-slate-500">Licencia: {trip?.driver?.licenciaNumero || 'S/D'}</p>
              </div>

              {/* Operator */}
              {trip?.carrier && (
                <div className="card p-5 space-y-2 border-l-4 border-l-indigo-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Transportista Subcontratado</span>
                  <p className="text-base font-black text-slate-900 dark:text-white">{trip.carrier.razonSocial}</p>
                  <p className="text-xs text-slate-500">CUIT: {trip.carrier.cuit}</p>
                </div>
              )}
            </div>
          ) : activeTab === 'cargo' ? (
            <div className="space-y-6">
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Manifiesto de Carga & Remito</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Tipo de Carga</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{trip?.tipoCarga || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Peso Bruto</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{trip?.pesoCarga ? `${(trip.pesoCarga / 1000).toFixed(1)} Tn` : 'S/D'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Número de Remito</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{trip?.numeroRemito || 'S/D'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Orden de Compra Cliente (OC)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{trip?.numeroOCCliente || 'S/D'}</span>
                  </div>
                </div>
              </div>

              {dangerousGoods && (
                <div className="card p-5 space-y-3 border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>Declaración de Carga Peligrosa (Decreto 779/95)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-slate-500 block">Número ONU:</span> <strong>{dangerousGoods.numeroONU}</strong></div>
                    <div><span className="text-slate-500 block">Clase:</span> <strong>{dangerousGoods.clase}</strong></div>
                    <div><span className="text-slate-500 block">Nombre Técnico:</span> <strong>{dangerousGoods.nombreTecnico}</strong></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Financials & Expenses */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Tarifa Acordada Flete</span>
                  <span className="text-xl font-black text-blue-600 block mt-1">{formatMoney(fin?.tarifa)}</span>
                </div>
                <div className="card p-4 border-l-4 border-l-rose-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Costos Directos Totales</span>
                  <span className="text-xl font-black text-rose-600 block mt-1">{formatMoney(fin?.costoDirectoTotal)}</span>
                </div>
                <div className="card p-4 border-l-4 border-l-emerald-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Margen Bruto Operativo</span>
                  <span className="text-xl font-black text-emerald-600 block mt-1">{fin?.margenBrutoPct}%</span>
                </div>
              </div>

              {/* Expenses table */}
              <div className="card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="table-header">
                      <th className="p-3 text-left">Categoría</th>
                      <th className="p-3 text-left">Descripción</th>
                      <th className="p-3 text-left">Comprobante</th>
                      <th className="p-3 text-right">Monto ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-400">Sin costos directos rendidos</td></tr>
                    ) : (
                      costs.map((c: any) => (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{c.categoria}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{c.descripcion}</td>
                          <td className="p-3 text-slate-500 font-mono">{c.comprobante || 'S/D'}</td>
                          <td className="p-3 text-right font-bold text-rose-600">{formatMoney(c.monto)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
