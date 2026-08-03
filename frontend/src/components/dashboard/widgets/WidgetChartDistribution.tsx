'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from '@/lib/theme';
import { PieChart as PieIcon } from 'lucide-react';

interface WidgetChartDistributionProps {
  tripDistribution?: any[];
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function WidgetChartDistribution({ tripDistribution }: WidgetChartDistributionProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rawDist = tripDistribution || [];
  const filteredDist = rawDist.filter((d: any) => d.count > 0);

  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Distribución de Viajes por Estado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Proporción operativa de la flota
          </p>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredDist}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              nameKey="status"
            >
              {filteredDist.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#475569' : '#CBD5E1',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-700 dark:text-slate-300 font-semibold">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
