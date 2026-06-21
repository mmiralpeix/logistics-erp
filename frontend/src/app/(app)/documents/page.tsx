'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { formatDate, getExpiryBadge } from '@/lib/utils';
import { FileText, AlertTriangle, Upload, Search } from 'lucide-react';

export default function DocumentsPage() {
  const [filter, setFilter] = useState({ vehicleId: '', driverId: '', tipo: '' });

  const { data: docs } = useQuery({
    queryKey: ['documents', filter],
    queryFn: () => api.get('/documents', { params: filter }).then((r) => r.data),
  });

  const { data: expiring } = useQuery({
    queryKey: ['documents-expiring'],
    queryFn: () => api.get('/documents/expiring').then((r) => r.data),
  });

  return (
    <div>
      <Header title="Gestión Documental" subtitle="Documentos de vehículos, conductores y viajes" />
      <div className="p-6 space-y-6">
        {expiring && expiring.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> Documentos por vencer (próximos 30 días)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {expiring.map((doc: any) => (
                <div key={doc.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                  <p className="text-xs font-medium text-amber-300">{doc.nombre}</p>
                  <p className="text-xs text-amber-400/70">{doc.vehicle?.patente || `${doc.driver?.firstName} ${doc.driver?.lastName}`}</p>
                  <p className="text-xs text-amber-500">{formatDate(doc.fechaVencimiento)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h3 className="section-title">Documentos</h3>
            <div className="text-xs text-slate-400">Formatos soportados: PDF, JPG, PNG, DOC</div>
          </div>
          <div className="p-5">
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400 font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
              <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, DOC — Máximo 50MB</p>
            </div>
          </div>
          <div className="divide-y divide-slate-700/50">
            {docs?.map((doc: any) => {
              const badge = getExpiryBadge(doc.fechaVencimiento);
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{doc.nombre}</p>
                    <p className="text-xs text-slate-400">{doc.tipo} · {doc.fileName}</p>
                  </div>
                  <div className="text-right">
                    {doc.fechaVencimiento && (
                      <>
                        <span className={badge.cls}>{badge.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(doc.fechaVencimiento)}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {(!docs || docs.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p>No hay documentos cargados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
