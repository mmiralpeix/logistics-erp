'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientsApi, vehiclesApi, driversApi, carriersApi } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { CARGO_TYPES } from '@/lib/constants';
import { Plus, Trash2, Truck, UserCheck, ShieldAlert, Layers, MapPin, Calendar, DollarSign, FileCheck, FileText, Container, Building2 } from 'lucide-react';
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
  const { data: carriers } = useQuery({ queryKey: ['carriers-select'], queryFn: () => carriersApi.getAll({ limit: 100 }).then((r) => r.data.data) });

  const [form, setForm] = useState<any>({
    origen: '',
    destino: '',
    fechaSalidaProgramada: new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
    duracionEstimadaHoras: 12,
    esperaEnDestinoHoras: 2,
    descansosConductorHoras: 8,
    distanciaKm: 450,
    tipoCarga: '',
    descripcionCarga: 'Transporte de mercadería en convoy',
    tarifaGenerica: 450000,
    pesoCargaGenericoKg: 30000,
    esCargaPeligrosa: false,
    esMineria: false,
    esDistribucion: false,
    notas: '',
  });

  const [assignments, setAssignments] = useState<any[]>([
    { tipoOperacion: 'PROPIA', vehicleId: '', driverId: '', trailerId: '', carrierId: '', carrierVehicleId: '', carrierDriverId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { tipoOperacion: 'PROPIA', vehicleId: '', driverId: '', trailerId: '', carrierId: '', carrierVehicleId: '', carrierDriverId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { tipoOperacion: 'SUBCONTRATADA_TOTAL', vehicleId: '', driverId: '', trailerId: '', carrierId: '', carrierVehicleId: '', carrierDriverId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
    { tipoOperacion: 'SUBCONTRATADA_TOTAL', vehicleId: '', driverId: '', trailerId: '', carrierId: '', carrierVehicleId: '', carrierDriverId: '', numeroRemito: '', numeroOCCliente: '', tarifaAcordada: 450000 },
  ]);

  const setField = (key: string, value: any) => {
    setForm((f: any) => {
      const updated = { ...f, [key]: value };
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

  const addAssignmentRow = (tipo: string = 'PROPIA', carrierId: string = '') => {
    setAssignments((prev) => [
      ...prev,
      {
        tipoOperacion: tipo,
        vehicleId: '',
        driverId: '',
        trailerId: '',
        carrierId,
        carrierVehicleId: '',
        carrierDriverId: '',
        subcontractorFee: form.tarifaGenerica || 0,
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
  const totalWeightTon = (assignments.length * (form.pesoCargaGenericoKg || 30000)) / 1000;

  const handleSubmit = () => {
    if (!form.origen || !form.destino || !form.fechaSalidaProgramada) {
      toast.error('Por favor ingrese Origen, Destino y Fecha de Salida');
      return;
    }

    const invalidRow = assignments.find((a) => {
      if (a.tipoOperacion === 'SUBCONTRATADA_TOTAL') {
        return !a.carrierId;
      }
      if (a.tipoOperacion === 'TRACCION_TERCERO_SEMI_PROPIO') {
        return !a.carrierId || !a.trailerId;
      }
      return !a.vehicleId || !a.driverId;
    });

    if (invalidRow) {
      toast.error('Por favor complete las asignaciones requeridas de cada camión (Flota Propia: Camión y Conductor / Subcontratado: Operador / Enganche Mixto: Operador y Semi Propio)');
      return;
    }

    onSave({
      ...form,
      assignments,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in max-w-7xl w-full max-h-[92vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Programar Despacho en Convoy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Emisión simultánea de viajes agrupados (Flota propia + Operadores logísticos subcontratados + Enganches)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Unidades</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{assignments.length} Camiones</span>
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Carga Est.</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{totalWeightTon} Tn</span>
              </div>
            </div>

            <button onClick={onClose} aria-label="Cerrar ventana" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Sección 1: Ruta y Condiciones Generales */}
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                1. Datos de Ruta y Condiciones de Carga
              </h3>
              <span className="text-xs text-slate-400">Paso 1 de 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6">
                <label className="label font-semibold">Cliente *</label>
                <select value={form.clientId || ''} onChange={(e) => setField('clientId', e.target.value)} className="input py-2">
                  <option value="">Seleccionar cliente de la cartera...</option>
                  {clients?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.razonSocial} (CUIT: {c.cuit})</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Origen *</label>
                <input type="text" value={form.origen} onChange={(e) => setField('origen', e.target.value)} className="input py-2" placeholder="Ej: Rosario, Santa Fe" />
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Destino *</label>
                <input type="text" value={form.destino} onChange={(e) => setField('destino', e.target.value)} className="input py-2" placeholder="Ej: San Lorenzo, Terminal 6" />
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Fecha y Hora Salida *</label>
                <input type="datetime-local" value={form.fechaSalidaProgramada} onChange={(e) => setField('fechaSalidaProgramada', e.target.value)} className="input py-2" />
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Duración Est. (Horas)</label>
                <input type="number" value={form.duracionEstimadaHoras} onChange={(e) => setField('duracionEstimadaHoras', Number(e.target.value))} className="input py-2" />
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Distancia Est. (Km)</label>
                <input type="number" value={form.distanciaKm} onChange={(e) => setField('distanciaKm', Number(e.target.value))} className="input py-2" />
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Tarifa Base por Unidad ($)</label>
                <input type="number" value={form.tarifaGenerica} onChange={(e) => setField('tarifaGenerica', Number(e.target.value))} className="input py-2 font-bold text-emerald-600 dark:text-emerald-400" placeholder="450000" />
              </div>

              <div className="lg:col-span-4">
                <label className="label font-semibold">Tipo de Carga</label>
                <select
                  value={form.tipoCarga}
                  onChange={(e) => setField('tipoCarga', e.target.value)}
                  className="input py-2 bg-white dark:bg-slate-900 font-medium w-full"
                >
                  <option value="">Seleccionar tipo de carga...</option>
                  {!CARGO_TYPES.some((c) => c.value === form.tipoCarga) && form.tipoCarga && (
                    <option value={form.tipoCarga}>{form.tipoCarga}</option>
                  )}
                  {CARGO_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="label font-semibold">Peso Estimado / Unidad (Kg)</label>
                <input type="number" value={form.pesoCargaGenericoKg} onChange={(e) => setField('pesoCargaGenericoKg', Number(e.target.value))} className="input py-2" placeholder="30000" />
              </div>

              <div className="lg:col-span-5">
                <label className="label font-semibold">Descripción General de Carga</label>
                <input type="text" value={form.descripcionCarga} onChange={(e) => setField('descripcionCarga', e.target.value)} className="input py-2" placeholder="Detalle adicional..." />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.esCargaPeligrosa} onChange={(e) => setField('esCargaPeligrosa', e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                <span>Carga Peligrosa (Decreto 779/95)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.esMineria} onChange={(e) => setField('esMineria', e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                <span>Operación Minera</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.esDistribucion} onChange={(e) => setField('esDistribucion', e.target.checked)} className="rounded text-blue-600 w-4 h-4" />
                <span>Distribución Capilar</span>
              </label>
            </div>
          </div>

          {/* Sección 2: Tabla de Asignación de Unidades en Convoy (Flota Propia + Subcontratados + Enganche Mixto) */}
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2. Composición de Unidades del Convoy (Flota Propia & Operadores Logísticos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Combiná camiones de tu flota propia, operadores externos (SGL) o enganches mixtos</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Preajuste masivo:</span>
                <button
                  type="button"
                  onClick={() => setAssignments((prev) => prev.map((a) => ({ ...a, tipoOperacion: 'PROPIA' })))}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors"
                >
                  Flota Propia
                </button>
                <button
                  type="button"
                  onClick={() => setAssignments((prev) => prev.map((a) => ({ ...a, tipoOperacion: 'SUBCONTRATADA_TOTAL' })))}
                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold transition-colors"
                >
                  100% Subcontratado
                </button>
              </div>
            </div>

            {/* Table Container with Horizontal Scroll */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-xs min-w-[1150px]">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                    <th className="px-3 py-3 text-center w-10">#</th>
                    <th className="px-3 py-3 text-left w-44">Modalidad</th>
                    <th className="px-3 py-3 text-left min-w-[220px]">
                      <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-600" /> Camión / Operador *</span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[200px]">
                      <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Conductor / Chofer</span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[180px]">
                      <span className="flex items-center gap-1"><Container className="w-3.5 h-3.5 text-purple-600" /> Remolque / Semi</span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[120px]">
                      <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-indigo-600" /> N° Remito</span>
                    </th>
                    <th className="px-3 py-3 text-left min-w-[130px]">
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Tarifa ($)</span>
                    </th>
                    <th className="px-3 py-3 text-center w-12">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 bg-white dark:bg-slate-900">
                  {assignments.map((item, idx) => {
                    const isCarrier = item.tipoOperacion === 'SUBCONTRATADA_TOTAL';
                    const isMixed = item.tipoOperacion === 'TRACCION_TERCERO_SEMI_PROPIO';
                    const selectedCarrier = carriers?.find((c: any) => c.id === item.carrierId);

                    return (
                      <tr key={idx} className={`hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors ${isCarrier ? 'bg-purple-50/20 dark:bg-purple-950/10' : isMixed ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                        {/* Numeral Pill */}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center mx-auto ${isCarrier ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : isMixed ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
                            {idx + 1}
                          </span>
                        </td>

                        {/* Modalidad Switch */}
                        <td className="px-2 py-2.5">
                          <select
                            value={item.tipoOperacion || 'PROPIA'}
                            onChange={(e) => updateAssignment(idx, 'tipoOperacion', e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
                          >
                            <option value="PROPIA">Flota Propia</option>
                            <option value="SUBCONTRATADA_TOTAL">Subcontratado 100%</option>
                            <option value="TRACCION_TERCERO_SEMI_PROPIO">Enganche Mixto</option>
                          </select>
                        </td>

                        {/* Camión / Asignación */}
                        <td className="px-2 py-2.5">
                          {isCarrier || isMixed ? (
                            <div className="space-y-1">
                              <select
                                value={item.carrierId || ''}
                                onChange={(e) => updateAssignment(idx, 'carrierId', e.target.value)}
                                className="w-full px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-bold text-purple-900 dark:text-purple-200"
                              >
                                <option value="">Seleccionar Operador (Carrier)...</option>
                                {carriers?.map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.razonSocial}</option>
                                ))}
                              </select>

                              {isCarrier && selectedCarrier?.vehicles?.length > 0 && (
                                <select
                                  value={item.carrierVehicleId || ''}
                                  onChange={(e) => updateAssignment(idx, 'carrierVehicleId', e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded text-[11px]"
                                >
                                  <option value="">Camión del Operador...</option>
                                  {selectedCarrier.vehicles.map((v: any) => (
                                    <option key={v.id} value={v.id}>{v.patente} ({v.tipo || 'TRACTOR'})</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          ) : (
                            <select
                              value={item.vehicleId}
                              onChange={(e) => updateAssignment(idx, 'vehicleId', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                            >
                              <option value="">Elegir Camión de Flota...</option>
                              {vehicles?.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Conductor / Chofer */}
                        <td className="px-2 py-2.5">
                          {isCarrier || isMixed ? (
                            selectedCarrier?.drivers?.length > 0 ? (
                              <select
                                value={item.carrierDriverId || ''}
                                onChange={(e) => updateAssignment(idx, 'carrierDriverId', e.target.value)}
                                className="w-full px-3 py-1.5 bg-purple-50/50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-medium"
                              >
                                <option value="">Chofer del Operador...</option>
                                {selectedCarrier.drivers.map((d: any) => (
                                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={item.subcontractorName || ''}
                                onChange={(e) => updateAssignment(idx, 'subcontractorName', e.target.value)}
                                placeholder="Nombre Chofer Tercero"
                                className="w-full px-3 py-1.5 bg-purple-50/50 dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-medium"
                              />
                            )
                          ) : (
                            <select
                              value={item.driverId}
                              onChange={(e) => updateAssignment(idx, 'driverId', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white"
                            >
                              <option value="">Elegir Conductor Propio...</option>
                              {drivers?.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Semirremolque */}
                        <td className="px-2 py-2.5">
                          <select
                            value={item.trailerId}
                            onChange={(e) => updateAssignment(idx, 'trailerId', e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded-lg text-xs font-medium ${isMixed ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 font-bold text-amber-900 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'}`}
                          >
                            <option value="">{isMixed ? 'Seleccionar Semi Propio *' : '(Sin Semirremolque)'}</option>
                            {vehicles?.filter((v: any) => v.tipo?.includes('SEMI') || v.tipo === 'ACOPLADO' || v.tipo === 'BATEA').map((v: any) => (
                              <option key={v.id} value={v.id}>{v.patente} ({v.tipo})</option>
                            ))}
                          </select>
                        </td>

                        {/* N° Remito Independiente */}
                        <td className="px-2 py-2.5">
                          <input
                            type="text"
                            value={item.numeroRemito}
                            onChange={(e) => updateAssignment(idx, 'numeroRemito', e.target.value)}
                            placeholder={`REM-${1000 + idx}`}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                          />
                        </td>

                        {/* Tarifa ($) */}
                        <td className="px-2 py-2.5">
                          <input
                            type="number"
                            value={item.tarifaAcordada}
                            onChange={(e) => updateAssignment(idx, 'tarifaAcordada', Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400"
                          />
                        </td>

                        {/* Acciones */}
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => removeAssignmentRow(idx)}
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Quitar camión del convoy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Quick Add Bar for Mixed Convoy Assembly */}
              <div className="p-3 bg-slate-100/90 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" /> Añadir unidades rápido al convoy:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addAssignmentRow('PROPIA')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                  >
                    + Camión Flota Propia
                  </button>
                  <button
                    type="button"
                    onClick={() => addAssignmentRow('SUBCONTRATADA_TOTAL')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                  >
                    + Camión de Operador Logístico
                  </button>
                  <button
                    type="button"
                    onClick={() => addAssignmentRow('TRACCION_TERCERO_SEMI_PROPIO')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                  >
                    + Enganche Mixto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Resumen Ejecutivo y Acciones */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold block">Camiones en Convoy</span>
                <span className="text-base font-extrabold text-blue-900 dark:text-blue-100">{assignments.length} Unidades</span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-bold block">Tarifa Total Convoy</span>
                <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">{formatMoney(totalConvoyTariff)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={isLoading} className="btn-secondary py-2.5 px-5">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={isLoading} className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-md">
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
