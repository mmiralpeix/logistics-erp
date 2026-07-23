import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null, fmt = 'dd/MM/yyyy') {
  if (!date) return '-';
  return format(new Date(date), fmt, { locale: es });
}

export function formatDateTime(date: string | Date | null) {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatRelative(date: string | Date | null) {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatMoney(amount: number | null | undefined, currency = 'ARS') {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('es-AR').format(n);
}

export function isExpired(date: string | Date | null) {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
}

export function isExpiringSoon(date: string | Date | null, days = 30) {
  if (!date) return false;
  const d = new Date(date);
  return isAfter(d, new Date()) && isBefore(d, addDays(new Date(), days));
}

export function getExpiryStatus(date: string | Date | null): 'expired' | 'soon' | 'ok' | 'unknown' {
  if (!date) return 'unknown';
  if (isExpired(date)) return 'expired';
  if (isExpiringSoon(date)) return 'soon';
  return 'ok';
}

export function getExpiryBadge(date: string | Date | null) {
  const status = getExpiryStatus(date);
  if (status === 'expired') return { cls: 'badge-red', label: '⚠ Vencido' };
  if (status === 'soon') return { cls: 'badge-yellow', label: '⏰ Por vencer' };
  if (status === 'ok') return { cls: 'badge-green', label: 'Vigente' };
  return { cls: 'badge-gray', label: 'Sin fecha' };
}

export const TRIP_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: 'Pendiente', cls: 'badge-gray' },
  PROGRAMADO: { label: 'Programado', cls: 'badge-blue' },
  EN_CURSO: { label: 'En Curso', cls: 'badge-green' },
  DEMORADO: { label: 'Demorado', cls: 'badge-yellow' },
  FINALIZADO: { label: 'Finalizado', cls: 'badge-purple' },
  CANCELADO: { label: 'Cancelado', cls: 'badge-red' },
};

export const VEHICLE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'badge-green' },
  EN_VIAJE: { label: 'En Viaje', cls: 'badge-blue' },
  EN_MANTENIMIENTO: { label: 'En Mantenimiento', cls: 'badge-yellow' },
  FUERA_DE_SERVICIO: { label: 'Fuera de Servicio', cls: 'badge-red' },
  RESERVADO: { label: 'Reservado', cls: 'badge-orange' },
};

export const VEHICLE_TYPE_MAP: Record<string, string> = {
  CAMION: 'Camión Rígido',
  TRACTOR: 'Tractor de Carretera',
  SEMIRREMOLQUE: 'Semirremolque Sider / Baranda',
  SEMI_CISTERNA: 'Semi Cisterna',
  CARRETON: 'Carretón Pesado',
  BATEA: 'Batea Volcable',
  BITREN: 'Bitren / Escalado',
  CAMIONETA: 'Camioneta / Utilitario',
  EQUIPO_ESPECIAL: 'Grúa / Equipo Especial',
  CISTERNA: 'Cisterna Camión',
  VOLQUETE: 'Volquete',
  ACOPLADO: 'Acoplado',
};

export const MAINTENANCE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDIENTE: { label: 'Pendiente', cls: 'badge-yellow' },
  EN_CURSO: { label: 'En Curso', cls: 'badge-blue' },
  COMPLETADO: { label: 'Completado', cls: 'badge-green' },
  CANCELADO: { label: 'Cancelado', cls: 'badge-red' },
};

export const INVOICE_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  BORRADOR: { label: 'Borrador', cls: 'badge-gray' },
  EMITIDA: { label: 'Emitida', cls: 'badge-blue' },
  PAGADA: { label: 'Pagada', cls: 'badge-green' },
  VENCIDA: { label: 'Vencida', cls: 'badge-red' },
  ANULADA: { label: 'Anulada', cls: 'badge-gray' },
};
