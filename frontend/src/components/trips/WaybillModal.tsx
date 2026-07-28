'use client';
import { Truck, MapPin, Calendar, User, FileText, QrCode, Printer, X, ShieldCheck, Scale, Award } from 'lucide-react';
import { formatMoney } from '@/lib/utils';

interface WaybillModalProps {
  trip: any;
  onClose: () => void;
}

export function WaybillModal({ trip, onClose }: WaybillModalProps) {
  if (!trip) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Hoja de Ruta Oficial / Manifiesto de Carga
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Documento de tránsito y fiscalización para control en balanza y puesto de ruta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Document Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0">
          {/* Header & QR Code */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-black text-xl text-slate-900 tracking-tight">LogisticsPro ERP</span>
              </div>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Transportes Logísticos & Cargas Mineras S.A.</p>
              <p className="text-[11px] text-slate-500">CUIT: 30-71548962-9 | CUIT Transporte AFIP Habilitado</p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-sm font-black border border-slate-300">
                HOJA DE RUTA N° {trip.numero}
              </span>
              <p className="text-[11px] text-slate-500">Emisión: {new Date().toLocaleDateString('es-AR')}</p>
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center ml-auto mt-1 p-1">
                <QrCode className="w-10 h-10 text-slate-800" />
                <span className="text-[8px] font-mono font-bold text-slate-600">VALID-QR</span>
              </div>
            </div>
          </div>

          {/* Grid 1: Cliente & Ordenes */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Cliente Solicitante</p>
              <p className="font-extrabold text-sm text-slate-900">{trip.client?.razonSocial || 'Cliente General'}</p>
              <p className="text-slate-600 font-medium">CUIT: {trip.client?.cuit || '-'}</p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Documentación Comercial</p>
              <p className="font-semibold text-slate-800">
                Remito Digital N°: <span className="font-bold text-blue-700">{trip.numeroRemito || 'Pendiente'}</span>
              </p>
              <p className="font-semibold text-slate-800">
                Orden de Compra: <span className="font-bold text-slate-900">{trip.numeroOCCliente || trip.contract?.numero || 'S/N'}</span>
              </p>
            </div>
          </div>

          {/* Grid 2: Ruta & Fechas */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-2xl p-4 text-xs">
            <div className="space-y-2 border-r border-slate-200 pr-4">
              <p className="font-bold text-blue-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Tramo & Ruta Asignada
              </p>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Origen / Planta</p>
                <p className="font-bold text-sm text-slate-900">{trip.origen}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Destino / Yacimiento</p>
                <p className="font-bold text-sm text-slate-900">{trip.destino}</p>
              </div>
              {trip.distanciaKm && (
                <p className="text-[11px] font-semibold text-slate-600">Distancia Estimada: {trip.distanciaKm} km</p>
              )}
            </div>

            <div className="space-y-2 pl-2">
              <p className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tiempos & Horarios
              </p>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Salida Programada</p>
                <p className="font-bold text-slate-900">{formatDate(trip.fechaSalidaProgramada)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Llegada Estimada</p>
                <p className="font-bold text-slate-900">{formatDate(trip.fechaLlegadaEstimada)}</p>
              </div>
              <p className="text-[11px] font-semibold text-slate-600">Lead Time: {trip.leadTimeTotal || 12} horas</p>
            </div>
          </div>

          {/* Grid 3: Flota & Conductor */}
          <div className="border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
            <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-slate-700" /> Equipos & Conductor Asignado
            </p>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Unidad Tractora</p>
                <p className="font-black text-sm text-slate-900">Patente: {trip.vehicle?.patente}</p>
                <p className="text-[11px] text-slate-600">{trip.vehicle?.marca} {trip.vehicle?.modelo}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Semi / Remolque</p>
                <p className="font-black text-sm text-slate-900">
                  {trip.trailer ? `Patente: ${trip.trailer.patente}` : 'Sin Remolque'}
                </p>
                <p className="text-[11px] text-slate-600">{trip.trailer?.tipo?.replace('_', ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Chofer Designado</p>
                <p className="font-black text-sm text-slate-900">
                  {trip.driver?.firstName} {trip.driver?.lastName}
                </p>
                <p className="text-[11px] text-slate-600">Tel: {trip.driver?.telefono || '-'}</p>
              </div>
            </div>
          </div>

          {/* Grid 4: Especificaciones de Carga */}
          <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-2xl p-4 text-xs">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Carga & Tonelaje</p>
              <p className="font-bold text-slate-900">
                Tipo: <span className="text-blue-700">{trip.tipoCarga || 'General'}</span>
              </p>
              <p className="font-bold text-slate-900">
                Peso Declarado: <span className="text-slate-900">{trip.pesoCarga ? `${(trip.pesoCarga / 1000).toFixed(1)} Tn (${trip.pesoCarga.toLocaleString()} kg)` : '30.0 Tn'}</span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Clasificación Seguridad</p>
              <div className="flex items-center gap-2 pt-1">
                {trip.esCargaPeligrosa ? (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] border border-rose-300">
                    CARGA PELIGROSA ARBA / UN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] border border-emerald-300">
                    CARGA GENERAL ESTÁNDAR
                  </span>
                )}
                {trip.esMineria && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] border border-amber-300">
                    PROTOCOLO MINERO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Firma & Aclaración Chofer</p>
              <p className="text-[10px] text-slate-500">Conforme Recepción de Hoja de Ruta</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold text-slate-900">Firma & Sello Despacho / Balanza</p>
              <p className="text-[10px] text-slate-500">LogisticsPro ERP Control Operativo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
