import React from 'react';
import type { PumpPartInfo } from '../types/academy';
import { PUMP_PARTS_CATALOG } from '../data/lessons';

interface Pump2DSchematicProps {
  selectedPartId: string | null;
  onSelectPart: (part: PumpPartInfo) => void;
}

const HOTSPOTS: {
  partId: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}[] = [
  { partId: 'suction_pipe', label: 'خط السحب', x: 35, y: 125, w: 95, h: 50 },
  { partId: 'wear_ring', label: 'حلقة التآكل', x: 132, y: 120, w: 34, h: 60 },
  { partId: 'volute_casing', label: 'الغلاف الحلزوني', x: 155, y: 72, w: 125, h: 150 },
  { partId: 'impeller', label: 'الدفاعة', x: 185, y: 105, w: 68, h: 86 },
  { partId: 'discharge_pipe', label: 'خط الدفع', x: 205, y: 12, w: 58, h: 64 },
  { partId: 'mechanical_seal', label: 'السداد الميكانيكي والحشوات', x: 280, y: 118, w: 56, h: 64 },
  { partId: 'shaft', label: 'عمود الإدارة', x: 245, y: 140, w: 225, h: 20 },
  { partId: 'bearing_housing', label: 'بيت المحامل', x: 342, y: 108, w: 96, h: 84 },
  { partId: 'bearings', label: 'المحامل', x: 355, y: 128, w: 72, h: 44 },
  { partId: 'coupling', label: 'القارنة', x: 470, y: 124, w: 46, h: 52 },
  { partId: 'electric_motor', label: 'المحرك الكهربائي', x: 522, y: 78, w: 175, h: 144 },
  { partId: 'baseplate', label: 'القاعدة المعدنية', x: 120, y: 242, w: 585, h: 28 },
];

export const Pump2DSchematic: React.FC<Pump2DSchematicProps> = ({ selectedPartId, onSelectPart }) => {
  const selectById = (partId: string) => {
    const found = PUMP_PARTS_CATALOG.find((p) => p.id === partId);
    if (found) onSelectPart(found);
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-xs text-slate-400">
        خريطة المضخة التفاعلية (2D): اضغط على أي جزء في المقطع الهندسي لمعرفة وظيفته وأعطاله وصيانته.
      </div>
      <svg
        viewBox="0 0 740 290"
        className="w-full rounded-lg border border-slate-700 bg-slate-950"
        role="img"
        aria-label="خريطة تفاعلية لمكونات مضخة الطرد المركزي"
      >
        {/* Grid lines */}
        <defs>
          <pattern id="engGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="740" height="290" fill="url(#engGrid)" />

        {/* Baseplate */}
        <rect
          x="120"
          y="242"
          width="585"
          height="28"
          rx="4"
          fill={selectedPartId === 'baseplate' ? '#0369a1' : '#334155'}
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {/* Suction Pipe */}
        <path
          d="M 35 128 L 145 128 L 145 172 L 35 172 Z"
          fill={selectedPartId === 'suction_pipe' ? '#0284c7' : '#1e3a5f'}
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <text x="88" y="155" textAnchor="middle" fill="#e0f2fe" fontSize="11">
          سحب ←
        </text>

        {/* Discharge Pipe */}
        <rect
          x="208"
          y="14"
          width="52"
          height="64"
          fill={selectedPartId === 'discharge_pipe' ? '#0284c7' : '#1e3a5f'}
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <text x="234" y="45" textAnchor="middle" fill="#e0f2fe" fontSize="11">
          ↑ دفع
        </text>

        {/* Volute Casing */}
        <ellipse
          cx="218"
          cy="148"
          rx="64"
          ry="74"
          fill={selectedPartId === 'volute_casing' ? '#0ea5e9' : '#1d4ed8'}
          fillOpacity="0.45"
          stroke="#60a5fa"
          strokeWidth="2.5"
        />

        {/* Wear Ring */}
        <rect
          x="140"
          y="120"
          width="16"
          height="60"
          rx="3"
          fill={selectedPartId === 'wear_ring' ? '#f59e0b' : '#b45309'}
          stroke="#fcd34d"
          strokeWidth="1.5"
        />

        {/* Impeller */}
        <circle
          cx="218"
          cy="148"
          r="38"
          fill={selectedPartId === 'impeller' ? '#f59e0b' : '#d97706'}
          fillOpacity="0.88"
          stroke="#fde68a"
          strokeWidth="2"
        />
        <path
          d="M 218 114 Q 240 130 248 148 M 218 182 Q 196 166 188 148 M 184 148 Q 200 126 218 118"
          fill="none"
          stroke="#78350f"
          strokeWidth="2.2"
        />

        {/* Shaft */}
        <rect
          x="218"
          y="141"
          width="305"
          height="14"
          fill={selectedPartId === 'shaft' ? '#38bdf8' : '#94a3b8'}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {/* Mechanical Seal / Stuffing Box */}
        <rect
          x="282"
          y="122"
          width="52"
          height="52"
          rx="4"
          fill={selectedPartId === 'mechanical_seal' ? '#10b981' : '#065f46'}
          stroke="#34d399"
          strokeWidth="1.5"
        />

        {/* Bearing Housing & Bearings */}
        <rect
          x="342"
          y="108"
          width="96"
          height="82"
          rx="6"
          fill={selectedPartId === 'bearing_housing' ? '#0284c7' : '#334155'}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        <rect x="372" y="190" width="36" height="52" fill="#334155" stroke="#64748b" />
        <circle
          cx="362"
          cy="148"
          r="13"
          fill={selectedPartId === 'bearings' ? '#38bdf8' : '#cbd5e1'}
          stroke="#0f172a"
          strokeWidth="2"
        />
        <circle
          cx="418"
          cy="148"
          r="13"
          fill={selectedPartId === 'bearings' ? '#38bdf8' : '#cbd5e1'}
          stroke="#0f172a"
          strokeWidth="2"
        />

        {/* Coupling */}
        <rect
          x="472"
          y="125"
          width="42"
          height="46"
          rx="4"
          fill={selectedPartId === 'coupling' ? '#ef4444' : '#991b1b'}
          stroke="#fca5a5"
          strokeWidth="1.5"
        />

        {/* Electric Motor */}
        <rect
          x="524"
          y="80"
          width="172"
          height="138"
          rx="8"
          fill={selectedPartId === 'electric_motor' ? '#0369a1' : '#1e293b'}
          stroke="#38bdf8"
          strokeWidth="2"
        />
        {[96, 114, 132, 150, 168, 186].map((yPos) => (
          <line key={yPos} x1="542" y1={yPos} x2="678" y2={yPos} stroke="#475569" strokeWidth="2" />
        ))}
        <rect x="550" y="218" width="24" height="24" fill="#334155" />
        <rect x="646" y="218" width="24" height="24" fill="#334155" />
        <text x="610" y="148" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold">
          MOTOR
        </text>

        {/* Interactive Click Targets */}
        {HOTSPOTS.map((h) => (
          <g
            key={h.partId}
            className="cursor-pointer"
            onClick={() => selectById(h.partId)}
          >
            <rect
              x={h.x}
              y={h.y}
              width={h.w}
              height={h.h}
              fill="transparent"
              stroke={selectedPartId === h.partId ? '#38bdf8' : 'transparent'}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <title>{h.label}</title>
          </g>
        ))}
      </svg>

      {/* Quick Part Pill Buttons under SVG for easy touch selection on Android */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PUMP_PARTS_CATALOG.map((part) => (
          <button
            key={part.id}
            type="button"
            onClick={() => onSelectPart(part)}
            className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedPartId === part.id
                ? 'border-sky-500 bg-sky-600 text-white'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-sky-400'
            }`}
          >
            {part.arName}
          </button>
        ))}
      </div>
    </div>
  );
};
