import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { generatePerformanceCurves, RATED_RPM } from '../engine/pumpPhysics';

export const CurvesView: React.FC = () => {
  const [rpm, setRpm] = useState<number>(RATED_RPM);
  const [valveOpenPct, setValveOpenPct] = useState<number>(78);
  const [diameterRatio, setDiameterRatio] = useState<number>(1.0);
  const [showSeries, setShowSeries] = useState<boolean>(false);
  const [showParallel, setShowParallel] = useState<boolean>(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  const data = useMemo(
    () => generatePerformanceCurves(rpm, valveOpenPct, diameterRatio),
    [rpm, valveOpenPct, diameterRatio],
  );

  // Unit conversions for display
  const qMult = unitSystem === 'metric' ? 1 : 4.402868; // m3/h -> GPM
  const hMult = unitSystem === 'metric' ? 1 : 3.28084; // m -> ft
  const pMult = unitSystem === 'metric' ? 1 : 1.341022; // kW -> HP
  const qUnit = unitSystem === 'metric' ? 'm³/h' : 'GPM';
  const hUnit = unitSystem === 'metric' ? 'm' : 'ft';
  const pUnit = unitSystem === 'metric' ? 'kW' : 'HP';

  // SVG plot geometry
  const W = 680;
  const H = 340;
  const padL = 56;
  const padR = 54;
  const padT = 24;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxQ = Math.max(320, data.points[data.points.length - 1]?.qM3h ?? 340);
  const maxHeadAxis = showSeries ? 180 : 110;

  const xPos = (q: number) => padL + (q / maxQ) * plotW;
  const yHead = (h: number) => padT + plotH - (Math.min(maxHeadAxis, h) / maxHeadAxis) * plotH;
  const yPct = (pct: number) => padT + plotH - (Math.min(100, pct) / 100) * plotH;

  const pathFor = (fn: (p: (typeof data.points)[number]) => { x: number; y: number }) =>
    data.points
      .map((pt, i) => {
        const { x, y } = fn(pt);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  const op = data.operatingPoint;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-sm font-bold text-slate-900 sm:text-base dark:text-white">
          مختبر منحنيات الأداء (H-Q ونقطة BEP ومنحنى النظام)
        </h1>
        <span className="font-en text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
          Pump Performance Curves
        </span>
      </div>
      <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-900 dark:text-sky-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        <div>
          <strong>منحنيات أداء تعليمية تفاعلية (Illustrative Curves):</strong> تحاكي علاقة العلو والكفاءة والقدرة وNPSHr ومنحنى النظام وتقاطع نقطة التشغيل ونقطة BEP (تطبيقاً لص 90–101 في المرجع).
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-4">
        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <label htmlFor="curve-rpm">السرعة (RPM)</label>
            <span className="font-mono-num text-sky-600 dark:text-sky-400">{rpm}</span>
          </div>
          <input
            id="curve-rpm"
            type="range"
            min={1450}
            max={3300}
            step={50}
            value={rpm}
            onChange={(e) => setRpm(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <label htmlFor="curve-valve">فتحة صمام الدفع (منحنى النظام)</label>
            <span className="font-mono-num text-sky-600 dark:text-sky-400">{valveOpenPct}%</span>
          </div>
          <input
            id="curve-valve"
            type="range"
            min={18}
            max={100}
            value={valveOpenPct}
            onChange={(e) => setValveOpenPct(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold">
            <label htmlFor="curve-dia">نسبة قطر الدفاعة (Trim)</label>
            <span className="font-mono-num text-sky-600 dark:text-sky-400">{Math.round(diameterRatio * 100)}%</span>
          </div>
          <input
            id="curve-dia"
            type="range"
            min={0.8}
            max={1.0}
            step={0.02}
            value={diameterRatio}
            onChange={(e) => setDiameterRatio(Number(e.target.value))}
            className="w-full accent-sky-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSeries((s) => !s)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              showSeries ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            ربط توالي Series
          </button>
          <button
            type="button"
            onClick={() => setShowParallel((s) => !s)}
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              showParallel ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            ربط توازي Parallel
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem((u) => (u === 'metric' ? 'imperial' : 'metric'))}
            className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            {unitSystem === 'metric' ? 'الوحدات: متري (m³/h, m)' : 'الوحدات: إمبراطوري (GPM, ft)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Interactive SVG Chart */}
        <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 dark:border-slate-800 lg:col-span-8">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="منحنيات أداء مضخة الطرد المركزي">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const y = padT + plotH * (1 - f);
              const hVal = Math.round(maxHeadAxis * f * hMult);
              const pctVal = Math.round(100 * f);
              return (
                <g key={f}>
                  <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
                  <text x={padL - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
                    {hVal}
                  </text>
                  <text x={W - padR + 8} y={y + 4} textAnchor="start" fill="#34d399" fontSize="10">
                    {pctVal}%
                  </text>
                </g>
              );
            })}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const qVal = Math.round(maxQ * f * qMult);
              const x = padL + plotW * f;
              return (
                <g key={f}>
                  <line x1={x} y1={padT} x2={x} y2={H - padB} stroke="#1e293b" strokeWidth="1" />
                  <text x={x} y={H - padB + 16} textAnchor="middle" fill="#94a3b8" fontSize="10">
                    {qVal}
                  </text>
                </g>
              );
            })}

            {/* Axes Labels */}
            <text x={padL} y={14} fill="#38bdf8" fontSize="10" fontWeight="bold">
              العلو ({hUnit})
            </text>
            <text x={W - padR} y={14} textAnchor="end" fill="#34d399" fontSize="10" fontWeight="bold">
              الكفاءة %
            </text>
            <text x={W / 2} y={H - 6} textAnchor="middle" fill="#cbd5e1" fontSize="11">
              معدل التصريف ({qUnit})
            </text>

            {/* Curves */}
            <path d={pathFor((p) => ({ x: xPos(p.qM3h), y: yHead(p.headSingle) }))} fill="none" stroke="#38bdf8" strokeWidth="3" />
            <path
              d={data.points
                .filter((p) => p.headSingle > 0 || p.qM3h === 0)
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(p.qM3h).toFixed(1)} ${yPct(p.efficiency).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
            />
            <path
              d={data.points
                .filter((p) => p.headSingle > 0 || p.qM3h === 0)
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(p.qM3h).toFixed(1)} ${yHead(p.powerKw * 1.4).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
              strokeDasharray="5 3"
            />
            <path d={pathFor((p) => ({ x: xPos(p.qM3h), y: yHead(p.npshR * 4) }))} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2 3" />
            <path
              d={data.points
                .filter((p) => p.systemHead <= maxHeadAxis * 1.02)
                .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(p.qM3h).toFixed(1)} ${yHead(p.systemHead).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />

            {showSeries && (
              <path d={pathFor((p) => ({ x: xPos(p.qM3h), y: yHead(p.headSeries) }))} fill="none" stroke="#fb923c" strokeWidth="2.2" strokeDasharray="6 3" />
            )}
            {showParallel && (
              <path d={pathFor((p) => ({ x: xPos(p.qM3h), y: yHead(p.headParallel) }))} fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeDasharray="6 3" />
            )}

            {/* BEP Vertical Marker */}
            <line
              x1={xPos(data.bepQ)}
              y1={padT}
              x2={xPos(data.bepQ)}
              y2={H - padB}
              stroke="#34d399"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={xPos(data.bepQ)} cy={yHead(data.bepHead)} r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
            <text x={xPos(data.bepQ) + 10} y={yHead(data.bepHead) + 16} fill="#6ee7b7" fontSize="10" fontWeight="bold">
              BEP
            </text>

            {/* Operating Point Marker */}
            <circle cx={xPos(op.qM3h)} cy={yHead(op.headM)} r="6.5" fill="#fbbf24" stroke="#0f172a" strokeWidth="2" />
            <text x={xPos(op.qM3h) - 10} y={yHead(op.headM) - 12} textAnchor="end" fill="#fde68a" fontSize="10" fontWeight="bold">
              نقطة التشغيل
            </text>
          </svg>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3 px-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-sky-400" /> منحنى العلو H-Q</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-emerald-400" /> الكفاءة η%</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-amber-400" /> منحنى النظام System Curve</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-violet-400" /> القدرة Power (مقيّسة)</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-rose-400" /> NPSHr (×4 مقيّس)</span>
            {showSeries && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-orange-400" /> توالي Series</span>}
            {showParallel && <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-cyan-400" /> توازي Parallel</span>}
          </div>
        </div>

        {/* Operating Point Summary Card */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="border-b border-slate-200 pb-2 text-sm font-bold dark:border-slate-800">
            قراءات نقطة التشغيل مقابل BEP
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span>التصريف الفعلي (Q)</span>
              <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                {(op.qM3h * qMult).toFixed(1)} {qUnit}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span>العلو المتولد (Head)</span>
              <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                {(op.headM * hMult).toFixed(1)} {hUnit}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span>الكفاءة عند نقطة التشغيل</span>
              <span
                className={`font-mono-num font-bold ${
                  op.eff >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {op.eff}% {op.eff >= 70 ? '(يحقق معيار ≥70%)' : '(دون 70%)'}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span>القدرة التقديرية (BHP)</span>
              <span className="font-mono-num font-bold">
                {(op.powerKw * pMult).toFixed(1)} {pUnit}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/70">
              <span>NPSHr المطلوب</span>
              <span className="font-mono-num font-bold text-rose-600 dark:text-rose-400">
                {(op.npshR * hMult).toFixed(2)} {hUnit}
              </span>
            </div>
            <div className="flex justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <span>تدفق BEP التصميمي</span>
              <span className="font-mono-num font-bold text-emerald-700 dark:text-emerald-300">
                {(data.bepQ * qMult).toFixed(1)} {qUnit}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <strong>قاعدة هندسية (ص 92 و99–101):</strong> عند الربط على التوالي يُجمع الضغط، وعند الربط على التوازي يُجمع التدفق، ويُراعى تقاطع منحنى النظام بحيث تعمل المضخة قرب BEP وبكفاءة لا تقل عن 70%.
          </div>
        </div>
      </div>
    </div>
  );
};
