'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Clock, Plus, Mail, CheckCircle2, PauseCircle, Send, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReportSchedulesList() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    titulo: 'Informe Semanal Operativo de Transporte',
    categoria: 'OPERACIONES',
    frecuencia: 'SEMANAL_LUNES',
    destinatarios: 'gerencia@empresa.com, operaciones@empresa.com',
    formato: 'PDF',
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => reportsApi.getSchedules().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => reportsApi.createSchedule(data),
    onSuccess: () => {
      toast.success('Envío automático programado exitosamente');
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
      setShowModal(false);
    },
    onError: () => toast.error('Error al programar envío automático'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => reportsApi.toggleSchedule(id),
    onSuccess: () => {
      toast.success('Estado de programación actualizado');
      qc.invalidateQueries({ queryKey: ['report-schedules'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
              Programación Automática de Reportes por Correo
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Despacho automático de informes gerenciales en PDF/Excel a los correos indicados
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" /> Programar Nuevo Envío
        </button>
      </div>

      {/* Schedules Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Informe / Asunto</th>
              <th className="px-4 py-3 text-left">Frecuencia</th>
              <th className="px-4 py-3 text-left">Formato</th>
              <th className="px-4 py-3 text-left">Destinatarios</th>
              <th className="px-4 py-3 text-left">Próximo Envío</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  Cargando envíos programados...
                </td>
              </tr>
            ) : !schedules || schedules.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  No hay envíos automáticos programados actualmente.
                </td>
              </tr>
            ) : (
              schedules.map((item: any) => (
                <tr key={item.id} className="table-row">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {item.titulo}
                    <p className="text-[11px] text-slate-400 font-normal">{item.categoria}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-gray text-xs font-bold">
                      {item.frecuencia === 'SEMANAL_LUNES'
                        ? '📅 Semanal (Todos los Lunes 8:00 AM)'
                        : item.frecuencia === 'MENSUAL_DIA_1'
                        ? '🗓️ Mensual (Día 1 de cada Mes)'
                        : item.frecuencia}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                    {item.formato}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate font-medium">
                    {item.destinatarios}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatDate(item.proximoEnvio)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge text-xs font-bold ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {item.isActive ? '🟢 Activo' : '⚪ Pausado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate(item.id)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                    >
                      {item.isActive ? 'Pausar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    Programar Envío Automático
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Generación periódica y envío por correo electrónico
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Asunto / Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="input w-full text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Frecuencia *
                  </label>
                  <select
                    value={form.frecuencia}
                    onChange={(e) => setForm((f) => ({ ...f, frecuencia: e.target.value }))}
                    className="input w-full text-xs font-semibold"
                  >
                    <option value="SEMANAL_LUNES">Semanal (Todos los Lunes)</option>
                    <option value="MENSUAL_DIA_1">Mensual (Día 1 de cada Mes)</option>
                    <option value="DIARIO">Diario (Todos los Días 8:00 AM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Formato *
                  </label>
                  <select
                    value={form.formato}
                    onChange={(e) => setForm((f) => ({ ...f, formato: e.target.value }))}
                    className="input w-full text-xs font-bold"
                  >
                    <option value="PDF">Documento PDF</option>
                    <option value="EXCEL">Planilla Excel (.xlsx)</option>
                    <option value="CSV">Archivo CSV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Destinatarios (Separados por coma) *
                </label>
                <input
                  type="text"
                  value={form.destinatarios}
                  onChange={(e) => setForm((f) => ({ ...f, destinatarios: e.target.value }))}
                  className="input w-full text-xs font-mono"
                  placeholder="ejemplo@empresa.com, direccion@empresa.com"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary py-2 px-4 text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary py-2 px-5 text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4" />
                  <span>{createMutation.isPending ? 'Guardando...' : 'Programar Envío'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
