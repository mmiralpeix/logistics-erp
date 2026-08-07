'use client';
import { formatDate, getExpiryBadge } from '@/lib/utils';

interface ExpiryCellProps {
  date: string | Date | null | undefined;
  extra?: string;
  na?: boolean;
}

export function ExpiryCell({ date, extra, na = false }: ExpiryCellProps) {
  if (na) {
    return (
      <div className="flex flex-col items-center text-center gap-0.5">
        <span className="badge-gray">N/A</span>
      </div>
    );
  }

  const b = getExpiryBadge(date);
  return (
    <div className="flex flex-col items-center text-center gap-0.5">
      {extra && <span className="badge badge-gray text-xs">{extra}</span>}
      <span className={b.cls}>{b.label}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(date)}</span>
    </div>
  );
}
