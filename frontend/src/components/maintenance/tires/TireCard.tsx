'use client';
import { getTireStatusBadge, getTireDepthInfo, formatPositionLabel, formatCPK } from '@/lib/tire-utils';
import { formatDate, formatMoney } from '@/lib/utils';
import { QrCode, Truck, RefreshCw, Eye, Wrench, ShieldAlert, ArrowRightLeft, History, Edit2, AlertCircle } from 'lucide-react';

interface TireCardProps {
  tire: any;
  onInstall: (tire: any) => void;
  onDismount: (tire: any) => void;
  onRotate: (tire: any) => void;
  onRetread: (tire: any) => void;
  onInspection: (tire: any) => void;
  onViewHistory: (tire: any) => void;
  onEdit: (tire: any) => void;
  onShowQR: (tire: any) => void;
}

export function TireCard({
  tire,
  onInstall,
  onDismount,
  onRotate,
  onRetread,
  onInspection,
  onViewHistory,
  onEdit,
  onShowQR,
}: TireCardProps) {
  const badge = getTireStatusBadge(tire.status);
  const depthInfo = getTireDepthInfo(tire.profundidadActualMm, tire.profundidadInicialMm);

  return (
    <div className={`card p-5 hover:shadow-md transition-all border space-y-4 ${
      depthInfo.status === 'CRITICO' && tire.status !== 'DADO_DE_BAJA'
        ? 'border-red-300 dark:border-red-900 bg-red-50/20 dark:bg-red-950/10'
        : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Header: Code, QR, Status */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onShowQR(tire)}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 rounded-xl transition-colors"
            title="Ver Código QR del Neumático"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-900 dark:text-white text-base">
                {tire.codigoInterno}
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded">
                {tire.medida}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {tire.marca} {tire.modelo} • Serie: <span className="font-mono">{tire.numeroSerie}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`px-2.5 py-1 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${badge.badgeClass}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dotClass}`} />
            <span>{badge.label}</span>
          </div>

          <button
            type="button"
            onClick={() => onEdit(tire)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Editar especificaciones"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Vehicle / Position Badge */}
      {tire.vehicle ? (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs">
          <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {tire.vehicle.patente}
          </span>
          <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
            {formatPositionLabel(tire.posicion)}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs">
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            📍 En Depósito Central (Sin Asignar)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {tire.tipo}
          </span>
        </div>
      )}

      {/* Depth & Pressure Progress Bar */}
      <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            Profundidad Banda: <span className={depthInfo.textClass}>{tire.profundidadActualMm} mm</span>
            <span className="text-slate-400 font-normal">/ {tire.profundidadInicialMm} mm</span>
          </span>
          <span className="font-mono font-bold text-slate-600 dark:text-slate-400 text-[11px]">
            Presión: {tire.presionActualPsi || tire.presionRecomendadaPsi} PSI
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${depthInfo.colorClass}`}
            style={{ width: `${depthInfo.percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
          <span className="font-medium">
            Recapados: <span className="font-extrabold text-purple-600 dark:text-purple-400">{tire.cantidadRecapados}</span> / {tire.maxRecapadosPermitidos} máx
          </span>
          <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
            CPK: {formatCPK(tire.cpk)}
          </span>
        </div>
      </div>

      {/* Footer Specs & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onViewHistory(tire)}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-blue-500" />
          <span>Ver Timeline Histórico</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Inspection Action */}
          <button
            type="button"
            onClick={() => onInspection(tire)}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
            title="Medir profundidad y presión"
          >
            <Eye className="w-3 h-3 text-emerald-500" /> Inspección
          </button>

          {/* Mount/Dismount Action */}
          {tire.status === 'INSTALADO' ? (
            <>
              <button
                type="button"
                onClick={() => onRotate(tire)}
                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                title="Rotar posición en vehículo"
              >
                <ArrowRightLeft className="w-3 h-3" /> Rotar
              </button>

              <button
                type="button"
                onClick={() => onDismount(tire)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                title="Desmontar neumático a depósito"
              >
                Desmontar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onInstall(tire)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              title="Instalar en vehículo"
            >
              <Truck className="w-3 h-3" /> Montar
            </button>
          )}

          {/* Retread Action */}
          {tire.status !== 'EN_RECAPADO' && tire.cantidadRecapados < tire.maxRecapadosPermitidos && (
            <button
              type="button"
              onClick={() => onRetread(tire)}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              title="Enviar a recapado"
            >
              <RefreshCw className="w-3 h-3" /> Recapado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
