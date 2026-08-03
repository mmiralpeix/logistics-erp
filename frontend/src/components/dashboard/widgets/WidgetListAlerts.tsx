'use client';
import { formatDate } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, Truck, User } from 'lucide-react';
import Link from 'next/link';

interface WidgetListAlertsProps {
  alerts?: {
    vehicles?: any[];
    drivers?: any[];
  };
}

export function WidgetListAlerts({ alerts }: WidgetListAlertsProps) {
  const vehicleAlerts = alerts?.vehicles || [];
  const driverAlerts = alerts?.drivers || [];
  const total = vehicleAlerts.length + driverAlerts.length;

  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
            Alertas de Vencimiento ERP
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Licencias, VTV/ITV y Seguros próximos a vencer
          </p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
          {total} Alertas
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 flex-1">
        {total === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            🎉 No hay alertas de vencimientos pendientes
          </div>
        ) : (
          <>
            {vehicleAlerts.map((v: any) => (
              <div
                key={v.id}
                className="p-3 bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Vehículo {v.patente}
                    </span>
                    <p className="text-red-600 dark:text-red-400 text-[11px] font-bold">
                      {v.alertReason || 'Vencimiento de documentación / seguro'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/vehicles"
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                >
                  Ver Ficha
                </Link>
              </div>
            ))}

            {driverAlerts.map((d: any) => (
              <div
                key={d.id}
                className="p-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {d.firstName} {d.lastName} (DNI: {d.dni})
                    </span>
                    <p className="text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                      {d.alertReason || 'Vencimiento de licencia o psicofísico'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/drivers"
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold"
                >
                  Ver Chofer
                </Link>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
