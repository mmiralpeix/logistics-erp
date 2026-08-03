export interface ScheduleStatusBadgeInfo {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export function getScheduleStatusBadge(status?: string): ScheduleStatusBadgeInfo {
  switch (status) {
    case 'EN_RUTA':
      return {
        label: 'En Ruta',
        badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotClass: 'bg-emerald-500 animate-pulse',
        description: 'Cumpliendo turno de trabajo normal',
      };
    case 'PROXIMO_A_DESCANSO':
      return {
        label: 'Próximo a Descanso',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500 animate-ping',
        description: 'Restan 2 días o menos para ingresar a descanso',
      };
    case 'EXCEDIDO':
      return {
        label: 'Ruta Excedida',
        badgeClass: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 font-extrabold',
        dotClass: 'bg-red-600 animate-bounce',
        description: 'Excedió el tiempo límite en ruta según régimen',
      };
    case 'DESCANSANDO':
      return {
        label: 'Descansando',
        badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dotClass: 'bg-blue-500',
        description: 'En período de descanso / franco obligatorio',
      };
    case 'EXCEDIDO_DESCANSO':
      return {
        label: 'Descanso Excedido',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-extrabold',
        dotClass: 'bg-rose-600 animate-bounce',
        description: 'Superó los días de descanso y debe retomar turno',
      };
    default:
      return {
        label: 'Sin Turno',
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
        dotClass: 'bg-slate-400',
        description: 'Sin turno asignado actualmente',
      };
  }
}

export function formatEventTypeName(type: string): string {
  switch (type) {
    case 'INICIO_TURNO':
      return '🟢 Inicio de Turno';
    case 'REGRESO':
      return '🏁 Regreso a Base';
    case 'INICIO_DESCANSO':
      return '🔵 Inicio de Descanso';
    case 'FIN_DESCANSO':
      return '🚀 Fin de Descanso';
    case 'CAMBIO_MODALIDAD':
      return '⚙️ Cambio de Modalidad';
    default:
      return type;
  }
}
