'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme';
import { formatMoney } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

interface WidgetChartMonthlyProps {
  monthlyChart?: any[];
}

export function WidgetChartMonthly({ monthlyChart }: WidgetChartMonthlyProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? '#334155' : '#E2E8F0';

  return (
    <div className="card p-5 space-y-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Evolución de Facturación Mensual vs Costos Operativos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparativa de ingresos y gastos por período
          </p>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyChart || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="mes" stroke={axisColor} fontSize={11} tickLine={false} />
            <YAxis stroke={axisColor} fontSize={11} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? '#475569' : '#CBD5E1',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatMoney(value), '']}
            />
            <Bar dataKey="facturacion" name="Facturación" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="costos" name="Costos" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
