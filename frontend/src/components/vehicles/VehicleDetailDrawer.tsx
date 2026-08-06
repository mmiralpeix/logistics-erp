'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi, reserveFundsApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import {
  X, Truck, Wrench, Fuel, CircleDot, FileText, ShieldAlert, ShieldCheck,
  Calendar, Activity, Gauge, MapPin, Award, Coins, ArrowUpRight, ArrowDownRight, Plus
} from 'lucide-react';

interface VehicleDetailDrawerProps {
  vehicleId: string | null;
  onClose: () => void;
}

export function VehicleDetailDrawer({ vehicleId, onClose }: VehicleDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'tech' | 'docs' | 'maintenance' | 'fuel' | 'tires' | 'trips'>('tech');

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-summary-360', vehicleId],
    queryFn: () => vehiclesApi.getSummary360(vehicleId!).then((r) => r.data),
    enabled: !!vehicleId,
  });

  const { data: fundsData, isLoading: isLoadingFunds } = useQuery({
    queryKey: ['asset-reserve-funds', vehicleId],
    queryFn: () => reserveFundsApi.getAssetSummary(vehicleId!).then((r) => r.data),
    enabled: !!vehicleId && activeTab === 'maintenance',
  });

  if (!vehicleId) return null;

  const vehicle = data?.vehicle;
  const metrics = data?.metrics;
  const trips = data?.trips || [];
  const maintenances = vehicle?.maintenances || [];
  const fuelLogs = vehicle?.fuelLogs || [];
  const tires = vehicle?.tires || [];
  const docs = vehicle?.documents || [];
  const isRemolcado = ['SEMIRREMOLQUE', 'SEMI_CISTERNA', 'CARRETON', 'BATEA', 'BITREN', 'ACOPLADO'].includes(vehicle?.tipo);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{vehicle?.patente || 'Cargando...'}</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {vehicle?.tipo}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                  vehicle?.status === 'DISPONIBLE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-amber-100 dark:bg-amber-950 text-amber-700'
                }`}>
                  {vehicle?.status}
                </span>
                {vehicle?.isThirdParty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 dark:bg-purple-950 text-purple-700">
                    TERCERIZADO ({vehicle?.empresa || 'Subcontratado'})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {vehicle?.marca} {vehicle?.modelo} ({vehicle?.anio}) • Odómetro: <strong className="text-slate-900 dark:text-white">{vehicle?.kilometraje?.toLocaleString()} km</strong>
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

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs font-bold bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tech')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tech' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Ficha Técnica
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Documentación & Legajo
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'maintenance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Mantenimientos en Taller ({maintenances.length})
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'fuel' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Telemetría Diésel
          </button>
          <button
            onClick={() => setActiveTab('tires')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tires' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Neumáticos Instalados ({tires.length})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
          >
            Historial de Viajes ({trips.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Cargando expediente 360° del vehículo...</div>
          ) : activeTab === 'tech' ? (
            <div className="space-y-6">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Próximo Service Preventivo</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                    en ~{metrics?.kmRestantesService?.toLocaleString()} km
                  </span>
                  <span className="text-[11px] text-slate-500">A los {metrics?.kmProximoService?.toLocaleString()} km</span>
                </div>

                <div className="card p-4 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-black uppercase text-slate-500">Rendimiento Diésel Promedio</span>
                  <span className="text-xl font-black text-emerald-600 block mt-1">
                    {metrics?.promedioKmL} km/l
                  </span>
                  <span className="text-[11px] text-slate-500">Basado en cargas registradas</span>
                </div>

                <div className="card p-4 border-l-4 border-l-purple-500">
                  <span className="text-[10px] font-black uppercase text-slate-500">Inversión en Mantenimiento</span>
                  <span className="text-xl font-black text-purple-600 block mt-1">
                    {formatMoney(metrics?.totalGastoMantenimiento)}
                  </span>
                  <span className="text-[11px] text-slate-500">Histórico acumulado</span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Especificaciones Técnicas del Chasis y Motor</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Número de Chasis / VIN</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle?.numeroChasis || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Número de Motor</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{vehicle?.numeroMotor || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Horas de Motor (Horómetro)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.horasMotor?.toLocaleString()} hs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Capacidad de Carga</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.capacidadKg ? `${(vehicle.capacidadKg / 1000).toFixed(1)} Tn` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Tipo de Carga Habilitada</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.tipoCarga || 'General'}</span>
                  </div>
                </div>
              </div>

              {isRemolcado && (
                <div className="card p-5 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Configuración del Remolque</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold">N° de Ejes</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.cantidadEjes || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Tara</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.tara ? `${vehicle.tara.toLocaleString()} kg` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Altura</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.alturaM ? `${vehicle.alturaM} m` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Largo</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{vehicle?.largoM ? `${vehicle.largoM} m` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'docs' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* VTV/ITV */}
                <div className="card p-4 space-y-2 border-l-4 border-l-blue-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Inspección Técnica (VTV / ITV)</span>
                    {vehicle?.vencimientoITV && new Date(vehicle.vencimientoITV) < new Date() ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">VENCIDO</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">VIGENTE</span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {vehicle?.vencimientoITV ? new Date(vehicle.vencimientoITV).toLocaleDateString() : 'Sin registrar'}
                  </p>
                </div>

                {/* Seguro */}
                <div className="card p-4 space-y-2 border-l-4 border-l-purple-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Póliza de Seguro</span>
                    {vehicle?.vencimientoSeguro && new Date(vehicle.vencimientoSeguro) < new Date() ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">VENCIDO</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">VIGENTE</span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {vehicle?.vencimientoSeguro ? new Date(vehicle.vencimientoSeguro).toLocaleDateString() : 'Sin registrar'}
                  </p>
                  <p className="text-[11px] text-slate-500">{vehicle?.aseguradora} (Póliza N° {vehicle?.numeroSeguro || 'S/D'})</p>
                </div>

                {/* CRIM */}
                <div className="card p-4 space-y-2 border-l-4 border-l-amber-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">CRIM</span>
                    {vehicle?.vencimientoCrim && new Date(vehicle.vencimientoCrim) < new Date() ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">VENCIDO</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">VIGENTE</span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {vehicle?.vencimientoCrim ? new Date(vehicle.vencimientoCrim).toLocaleDateString() : 'Sin registrar'}
                  </p>
                </div>

                {/* SENASA - solo unidades remolcadas */}
                {isRemolcado && (
                  <div className="card p-4 space-y-2 border-l-4 border-l-emerald-600">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SENASA</span>
                      {vehicle?.vencimientoSenasa && new Date(vehicle.vencimientoSenasa) < new Date() ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">VENCIDO</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">VIGENTE</span>
                      )}
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {vehicle?.vencimientoSenasa ? new Date(vehicle.vencimientoSenasa).toLocaleDateString() : 'Sin registrar'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'maintenance' ? (
            <div className="space-y-4">
              {/* Fondos de Reserva por Unidad (Resumen Financiero Taller) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div className="card p-4 border-l-4 border-l-blue-600 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                      🛠️ Fondo de Mantenimiento (13%)
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white block">
                    {formatMoney(fundsData?.maintenanceFund?.availableBalance || 0)}
                  </span>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span>Acumulado: <strong className="text-slate-700 dark:text-slate-300">{formatMoney(fundsData?.maintenanceFund?.accumulatedTotal || 0)}</strong></span>
                    <span>Gastado: <strong className="text-red-500">{formatMoney(fundsData?.maintenanceFund?.spentTotal || 0)}</strong></span>
                  </div>
                </div>

                <div className="card p-4 border-l-4 border-l-purple-600 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">
                      🛞 Fondo de Neumáticos (11%)
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white block">
                    {formatMoney(fundsData?.tiresFund?.availableBalance || 0)}
                  </span>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span>Acumulado: <strong className="text-slate-700 dark:text-slate-300">{formatMoney(fundsData?.tiresFund?.accumulatedTotal || 0)}</strong></span>
                    <span>Gastado: <strong className="text-red-500">{formatMoney(fundsData?.tiresFund?.spentTotal || 0)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Histórico de Órdenes de Trabajo en Taller ({maintenances.length})
                </h4>
              </div>

              {maintenances.map((m: any) => (
                <div key={m.id} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{m.numeroOT || 'OT-S/N'}</span>
                      <span className="text-slate-500 text-xs ml-2">({m.tipo})</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{m.descripcion}</p>
                    </div>
                    <span className="font-extrabold text-sm text-rose-600">{formatMoney(m.costoTotal || 0)}</span>
                  </div>

                  {m.items?.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400">Repuestos e insumos consumidos:</span>
                      {m.items.map((it: any) => (
                        <div key={it.id} className="flex justify-between font-medium">
                          <span>{it.cantidad}x {it.sparePart?.nombre || 'Insumo'}</span>
                          <span className="font-bold">{formatMoney(it.costoTotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : activeTab === 'fuel' ? (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="table-header">
                      <th className="p-3 text-left">Fecha</th>
                      <th className="p-3 text-left">Estación de Servicio</th>
                      <th className="p-3 text-right">Litros</th>
                      <th className="p-3 text-right">$/Litro</th>
                      <th className="p-3 text-right">Costo Total ($)</th>
                      <th className="p-3 text-right">Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((f: any) => (
                      <tr key={f.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{new Date(f.fecha).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{f.estacion}</td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">{f.litros} L</td>
                        <td className="p-3 text-right text-slate-500">${f.precioPorLitro}</td>
                        <td className="p-3 text-right font-bold text-blue-600">{formatMoney(f.costoTotal)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{f.rendimientoKmL} km/l</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'tires' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tires.map((t: any) => (
                  <div key={t.id} className="card p-4 space-y-2 border-l-4 border-l-indigo-600">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{t.codigoInterno}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 text-indigo-700">
                        {t.posicion || 'INSTALADO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{t.marca} {t.modelo} ({t.medida})</p>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Profundidad actual:</span>
                      <span className="font-black text-blue-600">{t.profundidadActualMm} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 text-left">Número Viaje</th>
                    <th className="p-3 text-left">Origen ➔ Destino</th>
                    <th className="p-3 text-left">Conductor</th>
                    <th className="p-3 text-right">Km Recorridos</th>
                    <th className="p-3 text-right">Tarifa ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((tr: any) => (
                    <tr key={tr.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{tr.numero}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{tr.origen} ➔ {tr.destino}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{tr.driver ? `${tr.driver.firstName} ${tr.driver.lastName}` : 'S/D'}</td>
                      <td className="p-3 text-right font-bold text-slate-700">{tr.distanciaKm} km</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatMoney(tr.tarifaAcordada)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
