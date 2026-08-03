export interface TireStatusBadgeInfo {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function getTireStatusBadge(status?: string): TireStatusBadgeInfo {
  switch (status) {
    case 'INSTALADO':
      return {
        label: 'Instalado',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotClass: 'bg-emerald-500 animate-pulse',
      };
    case 'EN_DEPOSITO':
      return {
        label: 'En Depósito',
        badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dotClass: 'bg-blue-500',
      };
    case 'EN_RECAPADO':
      return {
        label: 'En Recapado',
        badgeClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-bold',
        dotClass: 'bg-purple-500 animate-bounce',
      };
    case 'EN_REPARACION':
      return {
        label: 'En Reparación',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    case 'FUERA_DE_SERVICIO':
    case 'DADO_DE_BAJA':
      return {
        label: status === 'DADO_DE_BAJA' ? 'Dado de Baja' : 'Fuera de Servicio',
        badgeClass: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
        dotClass: 'bg-red-500',
      };
    default:
      return {
        label: 'Desconocido',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getTireDepthInfo(currentMm: number, initialMm: number = 14) {
  const depth = Number(currentMm || 0);
  const percentage = Math.min(100, Math.max(0, Math.round((depth / Math.max(1, initialMm)) * 100)));

  if (depth <= 3.0) {
    return {
      depth,
      percentage,
      colorClass: 'bg-red-500',
      textClass: 'text-red-600 dark:text-red-400 font-extrabold',
      bgClass: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
      label: 'Crítico / Reemplazo (<3.0 mm)',
      status: 'CRITICO',
    };
  } else if (depth <= 6.0) {
    return {
      depth,
      percentage,
      colorClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400 font-bold',
      bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      label: 'Atención / Desgaste Medio (3.0-6.0 mm)',
      status: 'ATENCION',
    };
  } else {
    return {
      depth,
      percentage,
      colorClass: 'bg-emerald-500',
      textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      label: 'Bueno (>6.0 mm)',
      status: 'BUENO',
    };
  }
}

export function formatPositionLabel(pos?: string): string {
  if (!pos) return 'Sin Posición';
  const labels: Record<string, string> = {
    E1_IZQ: 'Eje 1 Izq (Direccional)',
    E1_DER: 'Eje 1 Der (Direccional)',
    E2_IZQ_EXT: 'Eje 2 Izq Ext (Tracción)',
    E2_IZQ_INT: 'Eje 2 Izq Int (Tracción)',
    E2_DER_INT: 'Eje 2 Der Int (Tracción)',
    E2_DER_EXT: 'Eje 2 Der Ext (Tracción)',
    E3_IZQ_EXT: 'Eje 3 Izq Ext (Tracción)',
    E3_IZQ_INT: 'Eje 3 Izq Int (Tracción)',
    E3_DER_INT: 'Eje 3 Der Int (Tracción)',
    E3_DER_EXT: 'Eje 3 Der Ext (Tracción)',
    AUXILIAR_1: 'Auxiliar 1',
    AUXILIAR_2: 'Auxiliar 2',
  };
  return labels[pos] || pos;
}

export function formatCPK(cpk?: number): string {
  if (cpk === undefined || cpk === null) return '$0.000/km';
  return `$${cpk.toFixed(4)}/km`;
}
