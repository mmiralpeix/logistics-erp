'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { carriersApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import {
  X, Building2, Truck, UserCheck, MapPin, Phone, Mail, DollarSign,
  FileText, ShieldCheck, ShieldAlert, Award
} from 'lucide-react';

interface CarrierDetailDrawerProps {
  carrierId: string | null;
  onClose: () => void;
}

export function CarrierDetailDrawer({ carrierId, onClose }: CarrierDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'vehicles' | 'drivers' | 'trips'>('info');

  const { data, isLoading } = useQuery({
    queryKey: ['carrier-summary-360', carrierId],
    queryFn: () => carriersApi.getSummary360(carrierId!).then((r) => r.data),
    enabled: !!carrierId,
  });

  if (!carrierId) return null;

  const carrier = data?.carrier;
  const stats = data?.stats;
  const trips = data?.trips || [];
  const vehicles = carrier?.vehicles || [];
  const drivers = carrier?.drivers || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{carrier?.razonSocial || 'Cargando...'}</h2>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Operador Subcontratado
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                CUIT: {carrier?.cuit || 'Sin CUIT'} • Contacto: {carrier?.contacto || 'S/D'}
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
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'info' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'}`}
          >
            Información Institucional
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'vehicles' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'}`}
          >
            Flota Subcontratada ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'drivers' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'}`}
          >
            Nómina de Choferes ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`py-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'trips' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'}`}
          >
            Historial de Fletes & Viajes ({trips.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Cargando expediente 360° del operador...</div>
          ) : activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 border-l-4 border-l-purple-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Unidades Subcontratadas</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                    {stats?.totalVehiculosActivos} equipos
                  </span>
                  <span className="text-[11px] text-slate-500">Tractores, Semis y Carretones</span>
                </div>

                <div className="card p-4 border-l-4 border-l-blue-600">
                  <span className="text-[10px] font-black uppercase text-slate-500">Conductores Autorizados</span>
                  <span className="text-xl font-black text-blue-600 block mt-1">
                    {stats?.totalChoferesActivos} choferes
                  </span>
                  <span className="text-[11px] text-slate-500">Nómina habilitada</span>
                </div>

                <div className="card p-4 border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-black uppercase text-slate-500">Total Fletes Contratados</span>
                  <span className="text-xl font-black text-emerald-600 block mt-1">
                    {formatMoney(stats?.totalFletePactado)}
                  </span>
                  <span className="text-[11px] text-slate-500">Acumulado en {stats?.totalViajesCompletados} viajes</span>
                </div>
              </div>

              {/* Company Details */}
              <div className="card p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Datos Institucionales & Legales</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Domicilio Comercial</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{carrier?.domicilio || 'Sin domicilio'}, {carrier?.ciudad}, {carrier?.provincia}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Teléfono / Email</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{carrier?.telefono || 'S/D'} • {carrier?.email || 'S/D'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-semibold">Notas y Observaciones</span>
                    <span className="text-slate-600 dark:text-slate-400">{carrier?.notas || 'Sin notas'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'vehicles' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v: any) => (
                  <div key={v.id} className="card p-4 space-y-2 border-l-4 border-l-purple-600">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{v.patente}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700">
                        {v.tipo || 'CAMION'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{v.marca} {v.modelo} ({v.anio || 'S/F'})</p>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">VTV / ITV:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {v.vencimientoITV ? new Date(v.vencimientoITV).toLocaleDateString() : 'Sin registrar'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'drivers' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {drivers.map((d: any) => (
                  <div key={d.id} className="card p-4 space-y-2 border-l-4 border-l-blue-600">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">{d.firstName} {d.lastName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        DNI {d.dni}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Licencia: N° {d.licenciaNumero || 'S/D'}</p>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400">Vencimiento Licencia:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {d.licenciaVencimiento ? new Date(d.licenciaVencimiento).toLocaleDateString() : 'S/D'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Trips & Fletes */
            <div className="card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 text-left">Número Viaje</th>
                    <th className="p-3 text-left">Origen ➔ Destino</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Dominio</th>
                    <th className="p-3 text-right">Flete Pactado ($)</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t: any) => (
                    <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{t.numero}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{t.origen} ➔ {t.destino}</td>
                      <td className="p-3 text-slate-500 font-medium">{t.client?.razonSocial || 'S/D'}</td>
                      <td className="p-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{t.carrierVehicle?.patente || 'S/D'}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatMoney(t.subcontractorFee || t.tarifaAcordada || 0)}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
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
