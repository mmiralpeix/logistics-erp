'use client';

interface TrailerDiagramProps {
  tipo?: string;
  largoM?: number | null;
  anchoM?: number | null;
  alturaM?: number | null;
  cantidadEjes?: number | null;
}

const PX_PER_M = 20;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function TrailerDiagram({ tipo, largoM, anchoM, alturaM, cantidadEjes }: TrailerDiagramProps) {
  const largo = largoM || 13.6;
  const alto = alturaM || 4.0;
  const ancho = anchoM || 2.6;
  const ejes = cantidadEjes || 3;

  const bodyW = clamp(largo * PX_PER_M, 180, 320);
  const scale = bodyW / largo;
  const sideH = clamp(alto * scale, 40, 90);
  const topH = clamp(ancho * scale, 24, 60);

  const isCisterna = tipo === 'SEMI_CISTERNA' || tipo === 'CISTERNA';
  const isFlatbed = tipo === 'BATEA' || tipo === 'CARRETON';

  const originX = 64;
  const sideBodyY = 20;
  const sideGroundY = sideBodyY + sideH + 20;
  const wheelR = 10;
  const wheelsRightMargin = 45;
  const wheelSpacing = 22;
  const topY = sideGroundY + 46;
  const svgWidth = originX + bodyW + 30;
  const svgHeight = topY + topH + 26;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto max-w-md mx-auto"
      role="img"
      aria-label="Esquema de dimensiones del remolque"
    >
      {/* VISTA LATERAL */}
      <g>
        <line x1={originX - 20} y1={sideGroundY} x2={originX + bodyW + 20} y2={sideGroundY} className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" />

        {isCisterna ? (
          <rect x={originX} y={sideBodyY} width={bodyW} height={sideH} rx={sideH / 2} className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
        ) : isFlatbed ? (
          <rect x={originX} y={sideGroundY - wheelR - 12} width={bodyW} height="10" rx="2" className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
        ) : (
          <rect x={originX} y={sideBodyY} width={bodyW} height={sideH} rx="4" className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" />
        )}

        {/* pata de apoyo / enganche kingpin */}
        <path
          d={`M ${originX} ${sideGroundY - 22} L ${originX - 18} ${sideGroundY - 8} L ${originX} ${sideGroundY - 8} Z`}
          className="fill-slate-400 dark:fill-slate-500"
        />

        {/* ejes / ruedas */}
        {Array.from({ length: ejes }).map((_, i) => (
          <circle
            key={i}
            cx={originX + bodyW - wheelsRightMargin - i * wheelSpacing}
            cy={sideGroundY}
            r={wheelR}
            className="fill-slate-600 dark:fill-slate-400"
          />
        ))}

        {/* cota Alto */}
        <g className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1">
          <line x1={originX - 34} y1={sideBodyY} x2={originX - 34} y2={sideGroundY} />
          <line x1={originX - 38} y1={sideBodyY} x2={originX - 30} y2={sideBodyY} />
          <line x1={originX - 38} y1={sideGroundY} x2={originX - 30} y2={sideGroundY} />
        </g>
        <text x={originX - 40} y={(sideBodyY + sideGroundY) / 2} textAnchor="end" dominantBaseline="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold">
          Alto {alturaM ? `${alturaM}m` : 'N/D'}
        </text>

        {/* cota Largo */}
        <g className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1">
          <line x1={originX} y1={sideGroundY + 16} x2={originX + bodyW} y2={sideGroundY + 16} />
          <line x1={originX} y1={sideGroundY + 12} x2={originX} y2={sideGroundY + 20} />
          <line x1={originX + bodyW} y1={sideGroundY + 12} x2={originX + bodyW} y2={sideGroundY + 20} />
        </g>
        <text x={originX + bodyW / 2} y={sideGroundY + 30} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold">
          Largo {largoM ? `${largoM}m` : 'N/D'}
        </text>
      </g>

      {/* VISTA SUPERIOR (para Ancho) */}
      <g>
        <rect x={originX} y={topY} width={bodyW} height={topH} rx="3" className="fill-blue-50 dark:fill-blue-950/30 stroke-blue-600 dark:stroke-blue-400" strokeWidth="1.5" strokeDasharray="4 2" />

        <g className="stroke-slate-400 dark:stroke-slate-500" strokeWidth="1">
          <line x1={originX - 34} y1={topY} x2={originX - 34} y2={topY + topH} />
          <line x1={originX - 38} y1={topY} x2={originX - 30} y2={topY} />
          <line x1={originX - 38} y1={topY + topH} x2={originX - 30} y2={topY + topH} />
        </g>
        <text x={originX - 40} y={topY + topH / 2} textAnchor="end" dominantBaseline="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-semibold">
          Ancho {anchoM ? `${anchoM}m` : 'N/D'}
        </text>
        <text x={originX + bodyW / 2} y={topY + topH / 2} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 dark:fill-slate-500 text-[9px] font-semibold uppercase tracking-wider">
          Vista Superior
        </text>
      </g>
    </svg>
  );
}
