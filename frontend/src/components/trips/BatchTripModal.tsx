'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi, vehiclesApi, driversApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Plus, Trash2, Truck, UserCheck, ShieldAlert, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

interface BatchTripModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

export function BatchTripModal({ onClose, onSave, isLoading }: BatchTripModalProps) {
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: vehicles } = useQuery({ queryKey: ['vehicles-select'], queryFn: () => vehiclesApi.getAll({ limit: 100 }).then((r) => r.data.data) });
  const { data: drivers } = useQuery({ queryKey: ['drivers-select'], queryFn: () => driversApi.getAll({ limit: 100 }).then((r) => r.data.data) });

  const [form, setForm] = useState<any>({
    origen: '',
    destino: '',
    fechaSalidaProgramada: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
    duracionEstimadaHoras: 12,
    esperaEnDestinoHoras: 2,
    descansosConductorHoras: 8,
    distanciaKm: 450,
    tipoCarga: 'Carga General',
    descripcionCarga: 'Transporte de mercadería en convoy',
    tarifaGenerica: 450000,
    pesoCargaGenericoKg: 30000,
    esCargaPeligrosa: false,
    notas: '',
  });

  const [assignments, setAssignments] = useState<any[]>([
    { vehicleId: '', driverId: '', trailerId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { vehicleId: '', driverId: '', trailerId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { vehicleId: '', driverId: '', trailerId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { vehicleId: '', driverId: '', trailerId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
  ]);

  const setField = (key: string, value: any) => {
    setForm((f: any) => {
      const updated = { ...f, [key]: value };
      // Actualizar tarifa por omisión en asignaciones si se cambia la tarifa genérica
      if (key === 'tarifaGenerica' && value) {
        setAssignments((prev) =>
          prev.map((a) => ({
            ...a,
            tarifaAcordada: a.tarifaAcordada === f.tarifaGenerica || !a.tarifaAcordada ? Number(value) : a.tarifaAcordada,
          }))
        );
      }
      return updated;
    });
  };

  const updateAssignment = (index: number, key: string, value: any) => {
    setAssignments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addAssignmentRow = () => {
    setAssignments((prev) => [
      ...prev,
      {
        vehicleId: '',
        driverId: '',
        trailerId: '',
        numeroRemito: '',
        numeroOCCliente: '',
        tarifaAcordada: form.tarifaGenerica || 0,
      },
    ]);
  };

  const removeAssignmentRow = (index: number) => {
    if (assignments.length <= 1) {
      toast.error('El convoy debe tener al menos 1 unidad asignada');
      return;
    }
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const totalConvoyTariff = assignments.reduce((acc, curr) => acc + (Number(curr.tarifaAcordada) || Number(form.tarifaGenerica) || 0), 0);

  const handleSubmit = () => {
    if (!form.origen || !form.destino || !form.fechaSalidaProgramada) {
      toast.error('Complete Origen, Destino y Fecha de Salida');
      return;
    }

    const invalidRow = assignments.find((a) => !a.vehicleId || !a.driverId);
    if (invalidRow) {
      toast.error('Cada camión del convoy debe tener un Vehículo y Conductor seleccionados');
      return;
    }

    onSave({
      ...form,
      assignments,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Programar Despacho en Convoy (Multi-Unidad)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Emisión en lote de viajes simultáneos hacia un mismo destino</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg">✕</button>
        </div>

        {/* Form Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Sección 1: Ruta y Condiciones Generales */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              1. Datos de Ruta y Condiciones de Carga
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Cliente</label>
                <select value={form.clientId || ''} onChange={(e) => setField('clientId', e.target.value)} className="input">
                  <option value="">Seleccionar cliente...</option>
                  {clients?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.razonSocial} (CUIT: {c.cuit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Origen *</label>
                <input type="text" value={form.origen} onChange={(e) => setField('origen', e.target.value)} className="input" placeholder="Ej: Rosario, Santa Fe" />
              </div>

              <div>
                <label className="label">Destino *</label>
                <input type="text" value={form.destino} onChange={(e) => setField('destino', e.target.value)} className="input" placeholder="Ej: San Lorenzo, Terminal 6" />
              </div>

              <div>
                <label className="label">Fecha y Hora de Salida *</label>
                <input type="datetime-local" value={form.fechaSalidaProgramada} onChange={(e) => setField('fechaSalidaProgramada', e.target.value)} className="input" />
              </div>

              <div>
                <label className="label">Duración Estimada (Horas)</label>
                <input type="number" value={form.duracionEstimadaHoras} onChange={(e) => setField('duracionEstimadaHoras', Number(e.target.value))} className="input" />
              </div>

              <div>
                <label className="label">Distancia Estimada (Km)</label>
                <input type="number" value={form.distanciaKm} onChange={(e) => setField('distanciaKm', Number(e.target.value))} className="input" />
              </div>

              <div>
                <label className="label">Tipo de Carga</label>
                <input type="text" value={form.tipoCarga} onChange={(e) => setField('tipoCarga', e.target.value)} className="input" placeholder="Ej: Graneles / Combustible / Minerales" />
              </div>

              <div>
                <label className="label">Tarifa Estándar por Unidad ($)</label>
                <input type="number" value={form.tarifaGenerica} onChange={(e) => setField('tarifaGenerica', Number(e.target.value))} className="input" placeholder="450000" />
              </div>

              <div>
                <label className="label">Peso Estimado por Unidad (Kg)</label>
                <input type="number" value={form.pesoCargaGenericoKg} onChange={(e) => setField('pesoCargaGenericoKg', Number(e.target.value))} className="input" placeholder="30000" />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.esCargaPeligrosa} onChange={(e) => setField('esCargaPeligrosa', e.target.checked)} className="rounded text-blue-600" />
                Carga Peligrosa (Decreto 779/95)
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.esMineria} onChange={(e) => setField('esMineria', e.target.checked)} className="rounded text-blue-600" />
                Operación Minera
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.esDistribucion} onChange={(e) => setField('esDistribucion', e.target.checked)} className="rounded text-blue-600" />
                Distribución Capilar
              </label>
            </div>
          </div>

          {/* Sección 2: Tabla de Asignación de Unidades en Convoy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Asignación de Camiones, Conductores y Remitos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Remitos y N° OC independientes por cada unidad del convoy</p>
              </div>

              <button onClick={addAssignmentRow} type="button" className="btn-secondary text-xs flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar Camión al Convoy
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-3 py-2.5 text-center w-8">#</th>
                    <th className="px-3 py-2.5 text-left">Camión / Vehículo *</th>
                    <th className="px-3 py-2.5 text-left">Conductor *</th>
                    <th className="px-3 py-2.5 text-left">Semirremolque</th>
                    <th className="px-3 py-2.5 text-left">N° Remito (Independiente)</th>
                    <th className="px-3 py-2.5 text-left">N° OC Cliente</th>
                    <th className="px-3 py-2.5 text-left w-28">Tarifa ($)</th>
                    <th className="px-3 py-2.5 text-center w-10">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                  {assignments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-center font-bold text-slate-500">{idx + 1}</td>

                      {/* Select Vehículo */}
                      <td className="px-2 py-2">
                        <select
                          value={item.vehicleId}
                          onChange={(e) => updateAssignment(idx, 'vehicleId', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar Camión...</option>
                          {vehicles?.map((v: any) => (
                            <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                          ))}
                        </select>
                      </td>

                      {/* Select Conductor */}
                      <td className="px-2 py-2">
                        <select
                          value={item.driverId}
                          onChange={(e) => updateAssignment(idx, 'driverId', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar Conductor...</option>
                          {drivers?.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                          ))}
                        </select>
                      </td>

                      {/* Select Acoplado/Semirremolque */}
                      <td className="px-2 py-2">
                        <select
                          value={item.trailerId}
                          onChange={(e) => updateAssignment(idx, 'trailerId', e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">(Ninguno / N/A)</option>
                          {vehicles?.filter((v: any) => v.tipo?.includes('SEMI') || v.tipo === 'ACOPLADO' || v.tipo === 'BATEA').map((v: any) => (
                            <option key={v.id} value={v.id}>{v.patente} ({v.tipo})</option>
                          ))}
                        </select>
                      </td>

                      {/* N° Remito Independiente */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.numeroRemito}
                          onChange={(e) => updateAssignment(idx, 'numeroRemito', e.target.value)}
                          placeholder={`REM-${1000 + idx}`}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                        />
                      </td>

                      {/* N° OC Cliente */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={item.numeroOCCliente}
                          onChange={(e) => updateAssignment(idx, 'numeroOCCliente', e.target.value)}
                          placeholder="OC-9921"
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                        />
                      </td>

                      {/* Tarifa ($) */}
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.tarifaAcordada}
                          onChange={(e) => updateAssignment(idx, 'tarifaAcordada', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium"
                        />
                      </td>

                      {/* Acciones */}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => removeAssignmentRow(idx)}
                          type="button"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                          title="Quitar camión"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer con Resumen y Acciones */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Camiones Convoy</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{assignments.length} Unidades</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tarifa Total Convoy</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(totalConvoyTariff)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isLoading} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex items-center gap-2">
              {isLoading ? (
                <span>Emitiendo Convoy...</span>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>Emitir Convoy ({assignments.length} Viajes)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
