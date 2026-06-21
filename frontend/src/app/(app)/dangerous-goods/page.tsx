'use client';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, Package, FileText } from 'lucide-react';

const CLASE_COLORS: Record<string, string> = {
  CLASE_1: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CLASE_2: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CLASE_3: 'bg-red-500/20 text-red-300 border-red-500/30',
  CLASE_4: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  CLASE_5: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30',
  CLASE_6: 'bg-green-500/20 text-green-300 border-green-500/30',
  CLASE_7: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  CLASE_8: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  CLASE_9: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const CLASE_LABELS: Record<string, string> = {
  CLASE_1: 'Clase 1 — Explosivos',
  CLASE_2: 'Clase 2 — Gases',
  CLASE_3: 'Clase 3 — Líquidos Inflamables',
  CLASE_4: 'Clase 4 — Sólidos Inflamables',
  CLASE_5: 'Clase 5 — Comburentes/Peróxidos',
  CLASE_6: 'Clase 6 — Tóxicos/Infecciosos',
  CLASE_7: 'Clase 7 — Material Radiactivo',
  CLASE_8: 'Clase 8 — Corrosivos',
  CLASE_9: 'Clase 9 — Varios',
};

export default function DangerousGoodsPage() {
  const { data: declarations, isLoading } = useQuery({
    queryKey: ['dangerous-goods'],
    queryFn: () => api.get('/dangerous-goods').then((r) => r.data),
  });

  const { data: clases } = useQuery({
    queryKey: ['dangerous-goods-clases'],
    queryFn: () => api.get('/dangerous-goods/clases').then((r) => r.data),
  });

  const compliant = declarations?.filter((d: any) => d.cumpleNormativa).length ?? 0;
  const nonCompliant = declarations?.filter((d: any) => !d.cumpleNormativa).length ?? 0;

  return (
    <div>
      <Header
        title="Cargas Peligrosas"
        subtitle="Gestión de mercancías peligrosas — Decreto 779/95 / Resolución ST 195/97"
      />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <Package className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-white">{declarations?.length ?? 0}</p>
            <p className="text-sm text-slate-400">Declaraciones totales</p>
          </div>
          <div className="stat-card">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-white">{compliant}</p>
            <p className="text-sm text-slate-400">Cumplen normativa</p>
          </div>
          <div className="stat-card">
            <XCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-2xl font-bold text-white">{nonCompliant}</p>
            <p className="text-sm text-slate-400">Requieren atención</p>
          </div>
        </div>

        {/* Clases de Riesgo ONU */}
        <div className="card p-6">
          <h3 className="section-title mb-4">Clases de Riesgo ONU</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {clases?.map((clase: any) => (
              <div key={clase.clase} className={`border rounded-lg p-3 ${CLASE_COLORS[clase.clase] || 'bg-slate-700/30 text-slate-300'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">Clase {clase.codigo}</span>
                </div>
                <p className="font-medium text-xs">{clase.nombre}</p>
                <p className="text-xs opacity-70 mt-1">{clase.descripcion}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Declaraciones */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="section-title">Declaraciones de Mercancías Peligrosas</h3>
            <span className="badge badge-yellow flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Decreto 779/95
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Cargando declaraciones...</div>
          ) : declarations?.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay declaraciones de cargas peligrosas registradas.</p>
              <p className="text-sm mt-1">Las declaraciones se crean al registrar viajes con carga peligrosa.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3 text-left">Viaje</th>
                  <th className="px-4 py-3 text-left">N° ONU</th>
                  <th className="px-4 py-3 text-left">Mercancía</th>
                  <th className="px-4 py-3 text-left">Clase</th>
                  <th className="px-4 py-3 text-left">Hoja Seg.</th>
                  <th className="px-4 py-3 text-left">Equipo</th>
                  <th className="px-4 py-3 text-left">Permisos</th>
                  <th className="px-4 py-3 text-left">Normativa</th>
                </tr>
              </thead>
              <tbody>
                {declarations?.map((d: any) => (
                  <tr key={d.id} className="table-row">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{d.trip?.numero}</p>
                      <p className="text-xs text-slate-400">{d.trip?.origen} → {d.trip?.destino}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-orange-300">UN{d.numeroONU}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200">{d.nombreTecnico || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge border text-xs ${CLASE_COLORS[d.clase] || ''}`}>
                        {CLASE_LABELS[d.clase] || d.clase}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.hojaSeguridad
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      {d.equipoObligatorio
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      {d.permisosCompletos
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-4 py-3">
                      {d.cumpleNormativa
                        ? <span className="badge badge-green flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Cumple</span>
                        : <span className="badge badge-red flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" />No cumple</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Marco Normativo */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="section-title">Marco Normativo Argentino</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              { norm: 'Decreto 779/95', desc: 'Reglamentación del Transporte de Mercancías Peligrosas por Carretera. Establece clasificación, embalaje, etiquetado, documentación y capacitación obligatoria.' },
              { norm: 'Resolución ST 195/97', desc: 'Complementa el Decreto 779/95. Define procedimientos específicos para conductores, certificados y controles en ruta.' },
              { norm: 'Habilitación Conductores', desc: 'Obligatoria para todas las clases. Requiere curso de capacitación, certificado vigente y aprobación psicofísica especial.' },
              { norm: 'Documentación Obligatoria', desc: 'Carta de Porte, Hoja de Seguridad (MSDS), Declaración de Mercancías Peligrosas e instrucciones de seguridad para la tripulación.' },
            ].map((item) => (
              <div key={item.norm} className="bg-slate-800/50 rounded-lg p-4">
                <p className="font-semibold text-blue-300 mb-1">{item.norm}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
