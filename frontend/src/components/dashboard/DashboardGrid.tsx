'use client';
import { useState } from 'react';
import { UserWidgetItem, WIDGET_CATALOG } from '@/lib/dashboard-widgets.registry';
import { ArrowUp, ArrowDown, EyeOff, Maximize2, Minimize2, Trash2, Plus, Move } from 'lucide-react';

interface DashboardGridProps {
  widgets: UserWidgetItem[];
  isEditing: boolean;
  onUpdateWidgets: (widgets: UserWidgetItem[]) => void;
  onOpenAddModal: () => void;
  childrenMap: Record<string, React.ReactNode>;
}

export function DashboardGrid({
  widgets,
  isEditing,
  onUpdateWidgets,
  onOpenAddModal,
  childrenMap,
}: DashboardGridProps) {
  const visibleWidgets = (widgets || [])
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const updated = [...visibleWidgets];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Recalculate order numbers
    const newWidgets = widgets.map((w) => {
      const idx = updated.findIndex((u) => u.id === w.id);
      if (idx !== -1) {
        return { ...w, order: idx + 1 };
      }
      return w;
    });

    onUpdateWidgets(newWidgets);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visibleWidgets.length) return;

    const updated = [...visibleWidgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate order numbers
    const newWidgets = widgets.map((w) => {
      const idx = updated.findIndex((u) => u.id === w.id);
      if (idx !== -1) {
        return { ...w, order: idx + 1 };
      }
      return w;
    });

    onUpdateWidgets(newWidgets);
  };

  const handleChangeWidth = (id: string, newWidth: '1col' | '2col' | 'full') => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, width: newWidth } : w));
    onUpdateWidgets(updated);
  };

  const handleRemove = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: false } : w));
    onUpdateWidgets(updated);
  };

  const getWidthClass = (width: '1col' | '2col' | 'full') => {
    switch (width) {
      case '1col':
        return 'col-span-1';
      case '2col':
        return 'col-span-1 md:col-span-2';
      case 'full':
        return 'col-span-1 sm:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map((w, index) => {
          const catalogItem = WIDGET_CATALOG[w.widgetType];
          const content = childrenMap[w.widgetType];
          if (!content) return null;

          const isBeingDragged = draggedIndex === index;
          const isDragTarget = dragOverIndex === index && draggedIndex !== index;

          return (
            <div
              key={w.id}
              draggable={isEditing}
              onDragStart={(e) => isEditing && handleDragStart(e, index)}
              onDragOver={(e) => isEditing && handleDragOver(e, index)}
              onDrop={(e) => isEditing && handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`${getWidthClass(w.width)} transition-all relative ${
                isEditing ? 'cursor-grab active:cursor-grabbing hover:shadow-xl' : ''
              } ${
                isBeingDragged ? 'opacity-40 scale-95 border-2 border-dashed border-blue-500' : ''
              } ${
                isDragTarget ? 'ring-4 ring-blue-500 rounded-2xl scale-[1.02] bg-blue-100/50 dark:bg-blue-900/50' : ''
              } ${
                isEditing && !isBeingDragged && !isDragTarget
                  ? 'ring-2 ring-blue-500/50 rounded-2xl p-1 bg-blue-50/20 dark:bg-blue-950/20'
                  : ''
              }`}
            >
              {/* Editing Controls Overlay Bar */}
              {isEditing && (
                <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded-xl mb-2 flex items-center justify-between shadow-lg text-xs animate-fade-in backdrop-blur-sm z-10 cursor-grab">
                  <div className="flex items-center gap-2">
                    <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span className="font-extrabold text-[11px] truncate max-w-[140px]" title="Arrastrá para reordenar">
                      {catalogItem?.title || w.widgetType}
                    </span>
                    <span className="text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                      Arrastrá
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Width options */}
                    <button
                      type="button"
                      onClick={() => handleChangeWidth(w.id, '1col')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        w.width === '1col' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="1 Columna"
                    >
                      1/4
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeWidth(w.id, '2col')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        w.width === '2col' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="2 Columnas"
                    >
                      2/4
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeWidth(w.id, 'full')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        w.width === 'full' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Ancho Completo"
                    >
                      Full
                    </button>

                    {/* Move Up / Down */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      title="Mover arriba / izquierda"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === visibleWidgets.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                      title="Mover abajo / derecha"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemove(w.id)}
                      className="p-1 text-red-400 hover:text-red-300 ml-1"
                      title="Ocultar de Dashboard"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Actual Widget Visual Content */}
              {content}
            </div>
          );
        })}
      </div>

      {/* Add Widget Button at the bottom in Edit Mode */}
      {isEditing && (
        <div className="p-6 border-2 border-dashed border-blue-400 dark:border-blue-800/60 rounded-2xl bg-blue-50/30 dark:bg-blue-950/20 text-center space-y-2">
          <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
            ¿Querés agregar más paneles o cambiar métricas en pantalla?
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary py-2 px-5 text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Widget desde el Catálogo</span>
          </button>
        </div>
      )}
    </div>
  );
}
