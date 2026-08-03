'use client';
import { formatDate, formatMoney, TRIP_STATUS_MAP } from '@/lib/utils';
import { MapPin, ArrowRight, Truck, User } from 'lucide-react';
import Link from 'next/link';

interface WidgetListTripsProps {
  trips?: any[];
}

export function WidgetListTrips({ trips }: WidgetListTripsProps) {
  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Monitor de Viajes Recientes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Últimas operaciones y trayectos en ruta
          </p>
        </div>
        <Link
          href="/trips"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 flex-1">
        {!trips || trips.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No hay viajes registrados recientemente
          </div>
        ) : (
          trips.map((trip: any) => {
            const statusInfo = TRIP_STATUS_MAP[trip.status] || { label: trip.status, cls: 'badge-gray' };
            return (
              <div
                key={trip.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {trip.numeroViaje}
                    </span>
                    <span className={statusInfo.cls}>{statusInfo.label}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {trip.origen} ➔ {trip.destino}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" /> {trip.vehicle?.patente || 'Sin Asignar'}
                    </span>
                    {trip.driver && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {trip.driver.firstName} {trip.driver.lastName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    {formatMoney(trip.tarifaCliente)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDate(trip.fechaSalida)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
