export type ScheduleStatus =
  | 'EN_RUTA'
  | 'PROXIMO_A_DESCANSO'
  | 'EXCEDIDO'
  | 'DESCANSANDO'
  | 'EXCEDIDO_DESCANSO'
  | 'SIN_TURNO';

export interface DriverScheduleMetrics {
  status: ScheduleStatus;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  modalidadLaboral: string;
  diasTrabajo: number;
  diasDescanso: number;
  fechaInicioTurno: Date | null;
  fechaRegreso: Date | null;
  fechaInicioDescanso: Date | null;
  diasEnRuta: number;
  diasRestantesTurno: number;
  diasEnDescanso: number;
  diasRestantesDescanso: number;
  porcentajeCompletado: number;
  proximoCambioEstado: Date | null;
  esExcedido: boolean;
}

export function calculateDriverScheduleStatus(driver: {
  modalidadLaboral?: string | null;
  diasTrabajo?: number | null;
  diasDescanso?: number | null;
  fechaInicioTurno?: Date | string | null;
  fechaRegreso?: Date | string | null;
  fechaInicioDescanso?: Date | string | null;
}, nowInput: Date = new Date()): DriverScheduleMetrics {
  const now = new Date(nowInput);
  now.setHours(0, 0, 0, 0);

  const modalidadLaboral = driver.modalidadLaboral || '21x7';
  let diasTrabajo = driver.diasTrabajo || 21;
  let diasDescanso = driver.diasDescanso || 7;

  // Parse standard modalidades if applicable
  if (modalidadLaboral === '21x7') {
    diasTrabajo = 21;
    diasDescanso = 7;
  } else if (modalidadLaboral === '14x7') {
    diasTrabajo = 14;
    diasDescanso = 7;
  } else if (modalidadLaboral === '28x14') {
    diasTrabajo = 28;
    diasDescanso = 14;
  }

  const parseDate = (d?: Date | string | null): Date | null => {
    if (!d) return null;
    const date = new Date(d);
    if (isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const fechaInicioTurno = parseDate(driver.fechaInicioTurno);
  const fechaRegreso = parseDate(driver.fechaRegreso);
  const fechaInicioDescanso = parseDate(driver.fechaInicioDescanso);

  let status: ScheduleStatus = 'SIN_TURNO';
  let statusLabel = 'Sin Turno Activo';
  let statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray' = 'gray';
  let diasEnRuta = 0;
  let diasRestantesTurno = 0;
  let diasEnDescanso = 0;
  let diasRestantesDescanso = 0;
  let porcentajeCompletado = 0;
  let proximoCambioEstado: Date | null = null;
  let esExcedido = false;

  const msPerDay = 24 * 60 * 60 * 1000;

  // Case A: Currently resting (fechaInicioDescanso is set)
  if (fechaInicioDescanso) {
    const diffMs = now.getTime() - fechaInicioDescanso.getTime();
    diasEnDescanso = Math.max(1, Math.floor(diffMs / msPerDay) + 1);
    diasRestantesDescanso = diasDescanso - diasEnDescanso;
    porcentajeCompletado = Math.min(100, Math.max(0, Math.round((diasEnDescanso / diasDescanso) * 100)));

    const nextWorkDate = new Date(fechaInicioDescanso);
    nextWorkDate.setDate(nextWorkDate.getDate() + diasDescanso);
    proximoCambioEstado = nextWorkDate;

    if (diasEnDescanso > diasDescanso) {
      status = 'EXCEDIDO_DESCANSO';
      statusLabel = `Descanso Excedido (${diasEnDescanso - diasDescanso}d ex)`;
      statusColor = 'red';
      esExcedido = true;
    } else {
      status = 'DESCANSANDO';
      statusLabel = `Descansando (Día ${diasEnDescanso} de ${diasDescanso})`;
      statusColor = 'blue';
    }
  }
  // Case B: Currently in work shift
  else if (fechaInicioTurno) {
    const referenceEnd = fechaRegreso || now;
    const diffMs = referenceEnd.getTime() - fechaInicioTurno.getTime();
    diasEnRuta = Math.max(1, Math.floor(diffMs / msPerDay) + 1);
    diasRestantesTurno = diasTrabajo - diasEnRuta;
    porcentajeCompletado = Math.min(100, Math.max(0, Math.round((diasEnRuta / diasTrabajo) * 100)));

    const estimatedRestStart = new Date(fechaInicioTurno);
    estimatedRestStart.setDate(estimatedRestStart.getDate() + diasTrabajo);
    proximoCambioEstado = estimatedRestStart;

    if (diasEnRuta > diasTrabajo) {
      status = 'EXCEDIDO';
      statusLabel = `Ruta Excedida (${diasEnRuta - diasTrabajo}d ex)`;
      statusColor = 'red';
      esExcedido = true;
    } else if (diasRestantesTurno <= 2) {
      status = 'PROXIMO_A_DESCANSO';
      statusLabel = `Próximo a Descanso (${diasRestantesTurno <= 0 ? 'Hoy' : `Restan ${diasRestantesTurno}d`})`;
      statusColor = 'yellow';
    } else {
      status = 'EN_RUTA';
      statusLabel = `En Ruta (Día ${diasEnRuta} de ${diasTrabajo})`;
      statusColor = 'green';
    }
  }

  return {
    status,
    statusLabel,
    statusColor,
    modalidadLaboral,
    diasTrabajo,
    diasDescanso,
    fechaInicioTurno,
    fechaRegreso,
    fechaInicioDescanso,
    diasEnRuta,
    diasRestantesTurno,
    diasEnDescanso,
    diasRestantesDescanso,
    porcentajeCompletado,
    proximoCambioEstado,
    esExcedido,
  };
}
