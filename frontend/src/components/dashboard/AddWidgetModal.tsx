'use client';
import { useState } from 'react';
import { WIDGET_CATALOG, WidgetCatalogItem, UserWidgetItem } from '@/lib/dashboard-widgets.registry';
import { X, Plus, Check, LayoutGrid, BarChart3, List, Zap, CircleDot } from 'lucide-react';

interface AddWidgetModalProps {
  currentWidgets: UserWidgetItem[];
  onAddWidget: (widgetType: string) => void;
  onClose: () => void;
}

export function AddWidgetModal({ currentWidgets, onAddWidget, onClose }: AddWidgetModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const activeWidgetTypes = new Set(currentWidgets.map((w) => w.widgetType));

  const catalogList = Object.values(WIDGET_CATALOG).filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Catálogo de Widgets del Dashboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccioná e incorporá nuevos widgets configurables a tu pantalla de control
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {[
            { key: 'all', label: 'Todos', icon: LayoutGrid },
            { key: 'kpi', label: 'Indicadores KPI', icon: CircleDot },
            { key: 'chart', label: 'Gráficos Analíticos', icon: BarChart3 },
            { key: 'list', label: 'Listas & Monitor', icon: List },
            { key: 'quick_action', label: 'Accesos Rápidos', icon: Zap },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  activeCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Catalog Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/30 dark:bg-slate-900/30 grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalogList.map((item) => {
            const isAdded = activeWidgetTypes.has(item.type);
            return (
              <div
                key={item.type}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  isAdded
                    ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {item.defaultWidth}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                    Categoría: {item.category}
                  </span>
                  {isAdded ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> En Dashboard
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddWidget(item.type)}
                      className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Añadir Widget
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
