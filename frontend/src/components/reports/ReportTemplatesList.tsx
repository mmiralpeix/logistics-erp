'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { BookOpen, Star, FileText, Plus, Check, Play, Search, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportTemplatesListProps {
  onSelectTemplate: (template: any) => void;
}

export function ReportTemplatesList({ onSelectTemplate }: ReportTemplatesListProps) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');
  const [search, setSearch] = useState('');

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => reportsApi.getTemplates().then((r) => r.data),
  });

  const { data: savedReports, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['saved-reports'],
    queryFn: () => reportsApi.getSavedReports().then((r) => r.data),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.toggleFavoriteSavedReport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-reports'] });
    },
  });

  const filteredTemplates = templates?.filter((t: any) => {
    if (!search) return true;
    return (
      t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      t.categoria.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredSaved = savedReports?.filter((r: any) => {
    if (!search) return true;
    return (
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.categoria.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub Header & Search */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo de Plantillas Corporativas ({templates?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Biblioteca de Reportes Guardados ({savedReports?.length || 0})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar plantilla o reporte..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* TAB 1: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingTemplates ? (
            <div className="col-span-full text-center py-12 text-slate-400 text-xs">Cargando plantillas...</div>
          ) : (
            filteredTemplates?.map((t: any) => (
              <div
                key={t.id}
                className="card p-5 hover:shadow-md transition-all border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {t.categoria}
                    </span>
                    {t.isDefault && (
                      <span className="text-[10px] font-bold text-slate-400">Predeterminada ERP</span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                    {t.nombre}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.descripcion}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTemplate(t)}
                  className="btn-primary py-2 px-4 text-xs w-full flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Cargar esta Plantilla</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SAVED REPORTS */}
      {activeTab === 'saved' && (
        <div className="space-y-3">
          {isLoadingSaved ? (
            <div className="text-center py-12 text-slate-400 text-xs">Cargando reportes guardados...</div>
          ) : !filteredSaved || filteredSaved.length === 0 ? (
            <div className="card p-12 text-center text-slate-500 text-xs space-y-2">
              <Star className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold">No tenés reportes guardados en tu Biblioteca</p>
              <p className="text-slate-400">Diseñá un reporte y presioná &quot;Guardar en Biblioteca&quot;.</p>
            </div>
          ) : (
            filteredSaved.map((r: any) => (
              <div
                key={r.id}
                className="card p-4 flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteMutation.mutate(r.id)}
                    className="p-1.5 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        r.favorito ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {r.titulo}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Categoría: <strong className="text-blue-600 dark:text-blue-400">{r.categoria}</strong> • Período: {formatDate(r.periodoFrom)} al {formatDate(r.periodoTo)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Guardado: {formatDate(r.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTemplate({ nombre: r.titulo, categoria: r.categoria, configJson: r.filtrosJson })}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Reutilizar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
