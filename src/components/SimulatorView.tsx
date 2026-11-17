import React, { useMemo, useState } from 'react';
import { AlertTriangle, Gauge, Info, Play, Power, RotateCcw } from 'lucide-react';
import {
  SCENARIO_PRESETS,
  simulatePumpOperation,
  type PumpScenarioId,
  type PumpSimInputs,
} from '../engine/pumpPhysics';

export const SimulatorView: React.FC = () => {
  const [inputs, setInputs] = useState<PumpSimInputs>({
    isRunning: true,
    rpm: 2950,
    suctionValvePct: 100,
    dischargeValvePct: 78,
    tankLevelM: 4.2,
    fluidTempC: 35,
    airIngressPct: 0,
    fluidDensityKgM3: 860,
    scenarioId: 'normal',
  });

  const out = useMemo(() => simulatePumpOperation(inputs), [inputs]);

  const applyScenario = (id: PumpScenarioId) => {
    const preset = SCENARIO_PRESETS[id];
    setInputs((prev) => ({
      ...prev,
      ...preset.inputs,
      scenarioId: id,
    }));
  };

  const zoneColors: Record<string, string> = {
    bep_zone: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    stopped: 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    shutoff: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    min_flow: 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    runout: 'border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300',
    cavitation: 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    air_bound: 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };

  const tankFillPct = Math.min(100, Math.max(8, (inputs.tankLevelM / 6) * 100));

  return (
    <div className="space-y-4">
      {/* Educational Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-900 dark:text-sky-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        <div>
          <strong>نموذج محاكاة تعليمي (Illustrative Educational Model):</strong> الأرقام والمقاييس المعروضة مبنية على علاقات هيدروليكية تقريبية لتوضيح سلوك مضخات الطرد المركزي، ولا تمثل بيانات اختبار معملية لمضخة حقلية حقيقية أو بديلاً عن منحنيات المصنّع (OEM).
        </div>
      </div>

      {/* 7 Preset Scenarios */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          سيناريوهات تشغيلية جاهزة (7 حالات تعليمية):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SCENARIO_PRESETS) as PumpScenarioId[]).map((sid) => {
            const p = SCENARIO_PRESETS[sid];
            const active = inputs.scenarioId === sid;
            return (
              <button
                key={sid}
                type="button"
                onClick={() => applyScenario(sid)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Controls Column */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">لوحة التحكم التشغيلية</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputs((s) => ({ ...s, isRunning: !s.isRunning }))}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold text-white ${
                  inputs.isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {inputs.isRunning ? <Power className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{inputs.isRunning ? 'إيقاف المضخة' : 'تشغيل المضخة'}</span>
              </button>
              <button
                type="button"
                onClick={() => applyScenario('normal')}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-rpm">سرعة الدوران (RPM)</label>
                <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">{inputs.rpm} RPM</span>
              </div>
              <input
                id="sim-rpm"
                type="range"
                min={600}
                max={3400}
                step={50}
                value={inputs.rpm}
                onChange={(e) => setInputs((s) => ({ ...s, rpm: Number(e.target.value), scenarioId: undefined }))}
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-suction">فتحة صمام السحب (Suction Valve)</label>
                <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                  {inputs.suctionValvePct}%
                </span>
              </div>
              <input
                id="sim-suction"
                type="range"
                min={5}
                max={100}
                value={inputs.suctionValvePct}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, suctionValvePct: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-discharge">فتحة صمام الدفع (Discharge Valve)</label>
                <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                  {inputs.dischargeValvePct}%
                </span>
              </div>
              <input
                id="sim-discharge"
                type="range"
                min={0}
                max={100}
                value={inputs.dischargeValvePct}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, dischargeValvePct: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-tank">منسوب الخزان الساحب (Tank Level)</label>
                <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                  {inputs.tankLevelM.toFixed(2)} m
                </span>
              </div>
              <input
                id="sim-tank"
                type="range"
                min={0.2}
                max={6.0}
                step={0.1}
                value={inputs.tankLevelM}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, tankLevelM: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-sky-600"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-temp">درجة حرارة السائل (Fluid Temp)</label>
                <span className="font-mono-num font-bold text-amber-600 dark:text-amber-400">
                  {inputs.fluidTempC} °C
                </span>
              </div>
              <input
                id="sim-temp"
                type="range"
                min={15}
                max={105}
                value={inputs.fluidTempC}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, fluidTempC: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div>
              <div className="mb-1 flex justify-between">
                <label htmlFor="sim-air">نسبة تسرب الهواء في السحب (Air Ingress)</label>
                <span className="font-mono-num font-bold text-rose-600 dark:text-rose-400">
                  {inputs.airIngressPct}%
                </span>
              </div>
              <input
                id="sim-air"
                type="range"
                min={0}
                max={90}
                value={inputs.airIngressPct}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, airIngressPct: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          {/* Animated SVG Process Mimic */}
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 dark:border-slate-800">
            <svg viewBox="0 0 360 115" className="w-full" aria-label="رسم توضيحي لمسار السحب والخزان والمضخة">
              {/* Suction Tank */}
              <rect x="14" y="16" width="66" height="84" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <rect
                x="16"
                y={100 - tankFillPct * 0.8}
                width="62"
                height={tankFillPct * 0.8 - 2}
                fill={out.cavitationRisk === 'severe' ? '#f59e0b' : '#0284c7'}
                fillOpacity="0.65"
              />
              <text x="47" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9">
                خزان السحب
              </text>

              {/* Suction Pipe & Valve */}
              <line x1="80" y1="78" x2="185" y2="78" stroke="#38bdf8" strokeWidth="7" />
              <polygon points="118,68 138,88 138,68 118,88" fill="#cbd5e1" />
              <text x="128" y="62" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                سحب {inputs.suctionValvePct}%
              </text>

              {/* Pump Casing */}
              <circle
                cx="205"
                cy="74"
                r="22"
                fill={out.cavitationRisk === 'severe' ? '#991b1b' : '#1e40af'}
                stroke="#60a5fa"
                strokeWidth="2"
              />
              <text x="205" y="78" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                PUMP
              </text>

              {/* Discharge Pipe & Valve */}
              <path d="M 218 52 L 218 28 L 340 28" fill="none" stroke="#34d399" strokeWidth="6" />
              <polygon points="270,20 288,36 288,20 270,36" fill="#cbd5e1" />
              <text x="279" y="15" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                دفع {inputs.dischargeValvePct}%
              </text>

              {/* Flow indicator text */}
              <text x="315" y="56" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                {out.flowM3h} m³/h
              </text>
              <text x="315" y="72" textAnchor="middle" fill="#fbbf24" fontSize="10">
                {out.differentialPressureBar} bar
              </text>
            </svg>
          </div>
        </div>

        {/* Live Telemetry + Explanation Column */}
        <div className="space-y-4 lg:col-span-7">
          {/* Status Banner */}
          <div className={`rounded-xl border p-4 ${zoneColors[out.operatingZone] || zoneColors.bep_zone}`}>
            <div className="flex items-center gap-2 text-sm font-bold">
              {(out.cavitationRisk !== 'none' || out.operatingZone === 'air_bound' || out.operatingZone === 'shutoff') && (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <span>{out.statusAr}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed">{out.causeEffectAr}</p>
          </div>

          {/* 8 Live Telemetry Gauges */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'معدل التصريف (Flow)', val: `${out.flowM3h}`, unit: 'm³/h', sub: `BEP: ${out.bepFlowM3h}` },
              { label: 'العلو الكلي (Head)', val: `${out.headM}`, unit: 'm', sub: `ΔP: ${out.differentialPressureBar} bar` },
              { label: 'ضغط السحب', val: `${out.suctionPressureBar}`, unit: 'bar', sub: `NPSHa: ${out.npshAvailableM} m` },
              { label: 'ضغط الدفع', val: `${out.dischargePressureBar}`, unit: 'bar', sub: `NPSHr: ${out.npshRequiredM} m` },
              { label: 'قدرة العمود', val: `${out.shaftPowerKw}`, unit: 'kW', sub: `هيدروليكية: ${out.hydraulicPowerKw} kW` },
              { label: 'الكفاءة التقديرية', val: `${out.efficiencyPct}%`, unit: '', sub: out.efficiencyPct >= 70 ? 'نطاق مقبول (≥70%)' : 'خارج الكفاءة المثلى' },
              { label: 'حرارة بيت المحامل', val: `${out.bearingTempC}°C`, unit: '', sub: out.bearingTempC > 75 ? 'سخونة مرتفعة' : 'ضمن المعتاد' },
              { label: 'الاهتزاز التشخيصي', val: `${out.vibrationMmS}`, unit: 'mm/s', sub: out.vibrationMmS > 4.5 ? 'اهتزاز خطر' : 'مستقر' },
            ].map((g) => (
              <div
                key={g.label}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <Gauge className="h-3.5 w-3.5 text-sky-500" />
                  <span>{g.label}</span>
                </div>
                <div className="font-mono-num mt-1.5 text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                  {g.val}{' '}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{g.unit}</span>
                </div>
                <div className="font-mono-num mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{g.sub}</div>
              </div>
            ))}
          </div>

          {/* NPSH Safety Margin Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
              <span>توازن هامش السحب لمنع التكهف (NPSHa مقابل NPSHr)</span>
              <span className="font-mono-num text-sky-600 dark:text-sky-400">
                الهامش الصافي = {(out.npshAvailableM - out.npshRequiredM).toFixed(2)} m
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>المتاح (NPSHa)</span>
                  <span className="font-mono-num">{out.npshAvailableM} m</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(100, (out.npshAvailableM / 15) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>المطلوب (NPSHr)</span>
                  <span className="font-mono-num">{out.npshRequiredM} m</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all ${
                      out.npshRequiredM > out.npshAvailableM ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (out.npshRequiredM / 15) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
