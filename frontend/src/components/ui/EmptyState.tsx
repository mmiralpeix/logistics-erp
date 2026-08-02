'use client';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 ${className}`}>
      <div className="p-4 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}
