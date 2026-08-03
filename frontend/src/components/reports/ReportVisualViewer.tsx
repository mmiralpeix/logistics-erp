'use client';
import { ReportConfig } from './ReportTemplateBuilderModal';
import { formatMoney } from '@/lib/utils';
import { Printer, Download, ArrowLeft, Building2, Truck, ShieldAlert, Fuel, Award } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface Props {
  config: ReportConfig;
  data: any;
  onBack: () => void;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function ReportVisualViewer({ config, data, onBack }: Props) {
  const financialData = [
    { mes: 'Ene', facturacion: 14500000, costos: 9800000 },
    { mes: 'Feb', facturacion: 16200000, costos: 10500000 },
    { mes: 'Mar', facturacion: 15800000, costos: 10100000 },
    { mes: 'Abr', facturacion: 18400000, costos: 11200000 },
    { mes: 'May', facturacion: 19100000, costos: 12000000 },
    { mes: 'Jun', facturacion: 21500000, costos: 13100000 },
  ];

  const fleetData = [
    { name: 'Disponibles', value: 18 },
    { name: 'En Viaje', value: 12 },
    { name: 'En Taller', value: 5 },
  ];

  const fuelData = [
    { semana: 'Sem 1', rendimiento: 3.1 },
    { semana: 'Sem 2', rendimiento: 3.3 },
    { semana: 'Sem 3', rendimiento: 3.4 },
    { semana: 'Sem 4', rendimiento: 3.6 },
  ];

  const tireHealth = [
    { codigo: 'T-000001', marca: 'Pirelli', vehiculo: 'AH551ZH', salud: 85, mm: 11.2 },
    { codigo: 'T-000002', marca: 'Michelin', vehiculo: 'AH551ZF', salud: 92, mm: 12.5 },
    { codigo: 'T-000003', marca: 'Bridgestone', vehiculo: 'AH551ZI', salud: 64, mm: 7.8 },
    { codigo: 'T-000004', marca: 'Goodyear', vehiculo: 'AH551ZJ', salud: 45, mm: 5.2 },
  ];

  const themeClass =
    config.theme === 'blue' ? 'border-t-blue-600' :
    config.theme === 'emerald' ? 'border-t-emerald-600' :
    config.theme === 'purple' ? 'border-t-purple-600' : 'border-t-slate-800';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <button onClick={onBack} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Volver a Ajustes
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF Corporativo
          </button>
        </div>
      </div>

      {/* Printable Visual Report Document */}
      <div className={`card p-8 bg-white dark:bg-slate-900 space-y-8 border-t-8 ${themeClass} shadow-xl max-w-5xl mx-auto print:shadow-none print:p-0 print:border-none`}>
        {/* Document Header with Branding Logos */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            {config.companyLogo ? (
              <img src={config.companyLogo} alt="Company Logo" className="h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                LP
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{config.reportTitle}</h1>
              <p className="text-xs text-slate-500 font-medium">{config.reportSubtitle}</p>
            </div>
          </div>

          {config.clientLogo && (
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Preparado para</span>
              <img src={config.clientLogo} alt="Client Logo" className="h-10 object-contain ml-auto" />
            </div>
          )}
        </div>

        {/* Module 1: KPI Summary */}
        {config.showKpiSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Facturación Total</span>
              <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">$109.9M</span>
              <span className="text-[11px] text-emerald-600 font-bold">▲ +14.2% vs previo</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Costos Operativos</span>
              <span className="text-xl font-black text-rose-600 block mt-1">$66.7M</span>
              <span className="text-[11px] text-slate-500">60.6% de margen neto</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Eficiencia Diésel</span>
              <span className="text-xl font-black text-blue-600 block mt-1">3.4 km/l</span>
              <span className="text-[11px] text-emerald-600 font-bold">Promedio de flota</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Salud de Neumáticos</span>
              <span className="text-xl font-black text-emerald-600 block mt-1">91.4%</span>
              <span className="text-[11px] text-slate-500">50 neumáticos montados</span>
            </div>
          </div>
        )}

        {/* Module 2: Financial Evolution Chart */}
        {config.showFinancialChart && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Evolución de Facturación vs Costos ($ ARS)</h3>
            <div className="h-64 card p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                  <Legend />
                  <Bar dataKey="facturacion" name="Facturación Bruta" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costos" name="Costos Directos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Module 3 & 4: Fleet Distribution & Fuel Efficiency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {config.showFleetChart && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Distribución de Flota Pesada</h3>
              <div className="h-56 card p-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fleetData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" label>
                      {fleetData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {config.showFuelChart && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Tendencia de Eficiencia Diésel (km/l)</h3>
              <div className="h-56 card p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={fuelData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="semana" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} domain={[2.5, 4.0]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rendimiento" name="Rendimiento (km/l)" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Module 5: Tire Health Indicators */}
        {config.showTireChart && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Estado & Salud de Neumáticos Críticos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {tireHealth.map((t) => (
                <div key={t.codigo} className="p-3 card space-y-2 border-l-4 border-l-blue-600">
                  <div className="flex justify-between font-bold">
                    <span>{t.codigo} ({t.marca})</span>
                    <span className="text-blue-600">{t.salud}% Salud ({t.mm} mm)</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${t.salud >= 70 ? 'bg-emerald-500' : t.salud >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${t.salud}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between text-[11px] text-slate-400">
          <span>LogisticsPro ERP — Generado automáticamente</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}
