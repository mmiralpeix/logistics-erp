'use client';
import { useQuery } from '@tanstack/react-query';
import { gpsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { Satellite, Wifi, WifiOff, MapPin, Gauge, Clock } from 'lucide-react';

export default function GpsPage() {
  const { data: positions, isLoading, refetch } = useQuery({
    queryKey: ['gps-positions'],
    queryFn: () => gpsApi.getPositions().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: devices } = useQuery({
    queryKey: ['gps-devices'],
    queryFn: () => gpsApi.getDevices().then((r) => r.data),
  });

  const activeCount = positions?.filter((p: any) => p.lastUpdate && new Date(p.lastUpdate) > new Date(Date.now() - 60 * 60000)).length || 0;

  return (
    <div>
      <Header
        title="Rastreo GPS en Tiempo Real"
        subtitle="Posición y estado de vehículos con dispositivos GPS"
        actions={
          <button onClick={() => refetch()} className="btn-secondary">
            <Satellite className="w-4 h-4" /> Actualizar posiciones
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <Satellite className="w-5 h-5 text-blue-400" />
            <p className="text-2xl font-bold text-white">{devices?.length || 0}</p>
            <p className="text-sm text-slate-400">Dispositivos registrados</p>
          </div>
          <div className="stat-card">
            <Wifi className="w-5 h-5 text-green-400" />
            <p className="text-2xl font-bold text-white">{activeCount}</p>
            <p className="text-sm text-slate-400">Activos (última hora)</p>
          </div>
          <div className="stat-card">
            <WifiOff className="w-5 h-5 text-red-400" />
            <p className="text-2xl font-bold text-white">{(devices?.length || 0) - activeCount}</p>
            <p className="text-sm text-slate-400">Sin señal</p>
          </div>
        </div>

        {/* Integration info */}
        <div className="card p-5">
          <h3 className="section-title mb-3 flex items-center gap-2"><Satellite className="w-4 h-4 text-blue-400" /> Integración GPS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {['Teltonika', 'Garmin', 'Traccar', 'Google Maps'].map((provider) => (
              <div key={provider} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-center">
                <p className="text-sm font-medium text-white">{provider}</p>
                <span className="badge badge-green text-xs mt-1">Habilitado</span>
              </div>
            ))}
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300 font-medium">Webhook para dispositivos GPS:</p>
            <code className="text-xs text-blue-400 font-mono">POST /api/gps/webhook/:deviceId</code>
            <p className="text-xs text-slate-400 mt-1">Body: {'{"lat": -45.86, "lon": -67.49, "speed": 85, "event": "moving"}'}</p>
          </div>
        </div>

        {/* Vehicle positions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="section-title">Posiciones en Tiempo Real</h3>
            <p className="text-xs text-slate-500 mt-0.5">Actualización automática cada 30 segundos</p>
          </div>
          <div className="divide-y divide-slate-700/50">
            {isLoading ? (
              <div className="text-center py-12 text-slate-400">Cargando posiciones GPS...</div>
            ) : positions?.length === 0 ? (
              <div className="text-center py-12">
                <Satellite className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No hay dispositivos GPS activos</p>
              </div>
            ) : positions?.map((device: any) => {
              const minutesAgo = device.lastUpdate ? Math.floor((Date.now() - new Date(device.lastUpdate).getTime()) / 60000) : null;
              const isOnline = minutesAgo !== null && minutesAgo < 60;
              const activeTrip = device.vehicle?.trips?.[0];
              return (
                <div key={device.id} className="px-5 py-4 flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-white">{device.vehicle?.patente}</span>
                      <span className="text-xs text-slate-400">{device.vehicle?.marca} {device.vehicle?.modelo}</span>
                      <span className={`badge ${isOnline ? 'badge-green' : 'badge-gray'} text-[10px]`}>{isOnline ? 'En línea' : 'Sin señal'}</span>
                      <span className="badge badge-gray text-[10px]">{device.proveedor}</span>
                    </div>
                    {activeTrip && (
                      <p className="text-xs text-blue-400">
                        Viaje activo: {activeTrip.numero} · {activeTrip.driver?.firstName} {activeTrip.driver?.lastName} · {activeTrip.client?.razonSocial}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs space-y-1 flex-shrink-0">
                    {device.lastLat && (
                      <p className="flex items-center gap-1 text-slate-400 justify-end">
                        <MapPin className="w-3 h-3" /> {device.lastLat.toFixed(4)}, {device.lastLon.toFixed(4)}
                      </p>
                    )}
                    {device.lastSpeed !== null && (
                      <p className="flex items-center gap-1 text-slate-400 justify-end">
                        <Gauge className="w-3 h-3" /> {device.lastSpeed} km/h
                      </p>
                    )}
                    {minutesAgo !== null && (
                      <p className="flex items-center gap-1 text-slate-500 justify-end">
                        <Clock className="w-3 h-3" />
                        {minutesAgo === 0 ? 'Ahora mismo' : `Hace ${minutesAgo} min`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map placeholder */}
        <div className="card p-6 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-blue-400/50" />
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Mapa Interactivo</h3>
          <p className="text-sm text-slate-400 mb-3">Para activar el mapa interactivo, configura tu API Key de Google Maps en las variables de entorno.</p>
          <code className="text-xs text-blue-400 bg-slate-900/50 px-3 py-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-api-key</code>
        </div>
      </div>
    </div>
  );
}
