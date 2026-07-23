'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi } from '@/lib/api';
import { formatDate, TRIP_STATUS_MAP } from '@/lib/utils';
import { addDays, format, startOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const BAR_COLORS: Record<string, string> = {
  PENDIENTE: '#64748B', PROGRAMADO: '#2563EB', EN_CURSO: '#10B981',
  DEMORADO: '#F59E0B', FINALIZADO: '#8B5CF6', CANCELADO: '#EF4444',
};

const HOUR_WIDTH = 40;
const ROW_HEIGHT = 52;
const DAYS_TO_SHOW = 14;

export function GanttView() {
  const qc = useQueryClient();
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const endDate = addDays(startDate, DAYS_TO_SHOW - 1);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['gantt', startDate.toISOString()],
    queryFn: () => tripsApi.getGantt(startDate.toISOString(), addDays(endDate, 1).toISOString()).then((r) => r.data),
    refetchInterval: 60000,
  });

  const totalWidth = DAYS_TO_SHOW * 24 * HOUR_WIDTH;
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const startMs = startDate.getTime();

  function xFromDate(date: Date) {
    return ((date.getTime() - startMs) / (1000 * 60 * 60)) * HOUR_WIDTH;
  }

  function widthFromRange(start: Date, end: Date) {
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(hours * HOUR_WIDTH, 40);
  }

  const nowX = xFromDate(new Date());

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    (trips || []).forEach((trip: any) => {
      const key = trip.vehicle?.patente || 'Sin asignar';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(trip);
    });
    return Array.from(map.entries());
  }, [trips]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="card">
      {/* Gantt Header controls */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Planificación de Viajes - Vista Gantt</h3>
          <span className="badge badge-blue">{format(startDate, 'dd MMM', { locale: es })} → {format(endDate, 'dd MMM yyyy', { locale: es })}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStartDate((d) => addDays(d, -7))} className="btn-secondary py-1 px-2">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setStartDate(startOfDay(new Date()))} className="btn-secondary py-1 px-3 text-xs">Hoy</button>
          <button onClick={() => setStartDate((d) => addDays(d, 7))} className="btn-secondary py-1 px-2">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => qc.invalidateQueries({ queryKey: ['gantt'] })} className="btn-secondary py-1 px-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${totalWidth + 180}px` }}>
          {/* Day headers */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="w-44 flex-shrink-0 px-4 py-2 text-xs text-slate-500 font-semibold border-r border-slate-200 dark:border-slate-700">Vehículo</div>
            <div className="relative" style={{ width: totalWidth }}>
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="absolute border-r border-slate-200 dark:border-slate-700 px-2 py-2"
                  style={{ left: xFromDate(day), width: 24 * HOUR_WIDTH }}
                >
                  <span className={`text-xs font-semibold ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {format(day, 'EEE dd/MM', { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hour markers */}
          <div className="flex border-b border-slate-200 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-900/30">
            <div className="w-44 flex-shrink-0 border-r border-slate-200 dark:border-slate-700" />
            <div className="relative" style={{ width: totalWidth, height: 20 }}>
              {Array.from({ length: DAYS_TO_SHOW * 24 }).map((_, i) => (
                i % 6 === 0 && (
                  <div key={i} className="absolute text-[10px] text-slate-500 dark:text-slate-600" style={{ left: i * HOUR_WIDTH + 2, top: 3 }}>
                    {String(i % 24).padStart(2, '0')}h
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Rows */}
          {grouped.length === 0 ? (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <p className="text-sm">No hay viajes en el período seleccionado</p>
            </div>
          ) : grouped.map(([vehiclePlate, vehicleTrips]) => (
            <div key={vehiclePlate} className="flex border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors" style={{ height: ROW_HEIGHT }}>
              <div className="w-44 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 px-3 flex items-center">
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-200">{vehiclePlate}</p>
                  <p className="text-[10px] text-slate-500">{vehicleTrips[0]?.vehicle?.marca} {vehicleTrips[0]?.vehicle?.modelo}</p>
                </div>
              </div>
              <div className="relative flex-1 overflow-hidden" style={{ width: totalWidth }}>
                {/* Grid lines */}
                {days.map((day) => (
                  <div key={day.toISOString()} className="absolute top-0 bottom-0 border-r border-slate-200/50 dark:border-slate-700/30" style={{ left: xFromDate(day) }} />
                ))}
                {/* Now line */}
                {nowX > 0 && nowX < totalWidth && (
                  <div className="absolute top-0 bottom-0 w-px bg-red-500/60 z-10" style={{ left: nowX }}>
                    <div className="absolute -top-0 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                )}
                {/* Trip bars */}
                {vehicleTrips.map((trip: any) => {
                  const start = new Date(trip.fechaSalidaProgramada);
                  const end = new Date(trip.fechaLlegadaEstimada);
                  const left = Math.max(0, xFromDate(start));
                  const width = widthFromRange(start, end);
                  const color = BAR_COLORS[trip.status] || '#64748B';
                  const isDelayed = trip.status === 'DEMORADO';

                  return (
                    <div
                      key={trip.id}
                      className="gantt-bar group"
                      style={{ left, width, backgroundColor: color, opacity: trip.status === 'CANCELADO' ? 0.4 : 1, border: isDelayed ? '1px solid #F59E0B' : 'none' }}
                      title={`${trip.numero}: ${trip.origen} → ${trip.destino}\nSalida: ${formatDate(trip.fechaSalidaProgramada)}\nLlegada Est.: ${formatDate(trip.fechaLlegadaEstimada)}\nLead Time: ${trip.leadTimeTotal}h`}
                    >
                      <span className="text-[10px] font-semibold">{trip.numero}</span>
                      <span className="text-[10px] ml-1 opacity-80 hidden group-hover:inline">{trip.origen?.split(',')[0]} → {trip.destino?.split(',')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">Leyenda:</span>
        {Object.entries(TRIP_STATUS_MAP).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: BAR_COLORS[key] }} />
            <span>{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-px h-4 bg-red-500/60" />
          <span>Ahora</span>
        </div>
      </div>
    </div>
  );
}
