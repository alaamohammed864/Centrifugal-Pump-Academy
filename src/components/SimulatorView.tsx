import React, { useMemo, useState } from 'react';
import { AlertTriangle, Box, Gauge, Info, Play, Power, RotateCcw } from 'lucide-react';
import type { GlbModelId } from '../types/academy';
import {
  PUMP_TYPE_PROFILES,
  SCENARIO_PRESETS,
  simulatePumpOperation,
  type PumpScenarioId,
  type PumpSimInputs,
  type SimulatorPumpType,
} from '../engine/pumpPhysics';

interface SimulatorViewProps {
  onOpen3DModel?: (modelId: GlbModelId) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ onOpen3DModel }) => {
  const [pumpTypeFilter, setPumpTypeFilter] = useState<'all' | 'dynamic' | 'pd'>('all');
  const [inputs, setInputs] = useState<PumpSimInputs>({
    isRunning: true,
    pumpType: 'centrifugal_radial',
    rpm: PUMP_TYPE_PROFILES.centrifugal_radial.defaultRpm,
    suctionValvePct: 100,
    dischargeValvePct: 78,
    tankLevelM: 4.2,
    fluidTempC: 35,
    airIngressPct: 0,
    fluidDensityKgM3: 860,
    fluidViscosityCst: 5,
    scenarioId: 'normal',
  });

  const activePumpType: SimulatorPumpType = inputs.pumpType ?? 'centrifugal_radial';
  const activeProfile = PUMP_TYPE_PROFILES[activePumpType] ?? PUMP_TYPE_PROFILES.centrifugal_radial;

  const visiblePumpTypes = useMemo(() => {
    const all = Object.values(PUMP_TYPE_PROFILES);
    if (pumpTypeFilter === 'all') return all;
    return all.filter((p) => p.category === pumpTypeFilter);
  }, [pumpTypeFilter]);

  const out = useMemo(() => simulatePumpOperation(inputs), [inputs]);

  const selectPumpType = (typeId: SimulatorPumpType) => {
    const prof = PUMP_TYPE_PROFILES[typeId];
    setInputs((prev) => ({
      ...prev,
      pumpType: typeId,
      rpm: prof.defaultRpm,
      scenarioId: undefined,
    }));
  };

  const applyScenario = (id: PumpScenarioId) => {
    const preset = SCENARIO_PRESETS[id];
    const nextRpm =
      id === 'low_rpm'
        ? Math.round(activeProfile.defaultRpm * 0.65)
        : id === 'normal'
          ? activeProfile.defaultRpm
          : (preset.inputs.rpm ? Math.round((preset.inputs.rpm / 2950) * activeProfile.defaultRpm) : activeProfile.defaultRpm);

    setInputs((prev) => ({
      ...prev,
      ...preset.inputs,
      pumpType: activePumpType,
      rpm: nextRpm,
      fluidViscosityCst: prev.fluidViscosityCst ?? 5,
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
    overpressure: 'border-rose-600/80 bg-rose-600/15 text-rose-800 dark:text-rose-200',
  };

  const tankFillPct = Math.min(100, Math.max(8, (inputs.tankLevelM / 6) * 100));

  return (
    <div className="space-y-4">
      {/* Educational Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-900 dark:text-sky-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        <div>
          <strong>نموذج محاكاة تعليمي (Illustrative Educational Model):</strong> الأرقام والمقاييس المعروضة مبنية على علاقات هيدروليكية تقريبية لتوضيح سلوك المضخات الديناميكية ومضخات الإزاحة الموجبة من الدراسة المرجعية، ولا تمثل بيانات اختبار معملية لمضخة حقلية أو بديلاً عن منحنيات المصنّع (OEM).
        </div>
      </div>

      {/* Pump Type Selector Card (All 12 Types from PDF) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">اختر نوع المضخة (12 نوعاً من الدراسة):</span>
            {(
              [
                ['all', 'الكل (12)'],
                ['dynamic', 'مضخات ديناميكية / طرد مركزي (7)'],
                ['pd', 'مضخات الإزاحة الموجبة PD (5)'],
              ] as const
            ).map(([cat, lbl]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setPumpTypeFilter(cat)}
                className={`rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                  pumpTypeFilter === cat
                    ? 'bg-slate-900 text-white dark:bg-sky-500/20 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          {onOpen3DModel && (
            <button
              type="button"
              onClick={() => onOpen3DModel(activeProfile.relatedGlbModel)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-500"
            >
              <Box className="h-3.5 w-3.5" />
              <span>عرض النموذج في مختبر 3D GLB</span>
            </button>
          )}
        </div>

        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {visiblePumpTypes.map((pt) => {
            const active = pt.id === activePumpType;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => selectPumpType(pt.id)}
                className={`shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? pt.category === 'pd'
                      ? 'border-amber-500 bg-amber-600 text-white'
                      : 'border-sky-500 bg-sky-600 text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {pt.arName}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950/70">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">{activeProfile.arName}</span>
              <span className="font-en text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                ({activeProfile.enName})
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  activeProfile.category === 'pd'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                }`}
              >
                {activeProfile.category === 'pd' ? 'إزاحة موجبة Positive Displacement' : 'ديناميكية Dynamic'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
              {activeProfile.desc} — <strong>التطبيق النموذجي:</strong> {activeProfile.typicalApp}.
            </p>
          </div>
        </div>
      </div>

      {/* 7 Preset Scenarios */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          سيناريوهات تشغيلية جاهزة (7 حالات تعليمية تُطبّق على النوع المختار):
        </div>
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {(Object.keys(SCENARIO_PRESETS) as PumpScenarioId[]).map((sid) => {
            const p = SCENARIO_PRESETS[sid];
            const active = inputs.scenarioId === sid;
            return (
              <button
                key={sid}
                type="button"
                onClick={() => applyScenario(sid)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
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
                <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                  {inputs.rpm} RPM <span className="text-[10px] text-slate-400">(الاسمي {activeProfile.defaultRpm})</span>
                </span>
              </div>
              <input
                id="sim-rpm"
                type="range"
                min={activeProfile.minRpm}
                max={activeProfile.maxRpm}
                step={25}
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
                <label htmlFor="sim-discharge">
                  فتحة صمام الدفع (Discharge Valve)
                  {activeProfile.category === 'pd' && (
                    <span className="mr-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      (احذر الخنق مع PD!)
                    </span>
                  )}
                </label>
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
                <label htmlFor="sim-visc">لزوجة المائع (Fluid Viscosity — نفط خفيف إلى ثقيل)</label>
                <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                  {inputs.fluidViscosityCst ?? 5} cSt
                </span>
              </div>
              <input
                id="sim-visc"
                type="range"
                min={1}
                max={600}
                step={5}
                value={inputs.fluidViscosityCst ?? 5}
                onChange={(e) =>
                  setInputs((s) => ({ ...s, fluidViscosityCst: Number(e.target.value), scenarioId: undefined }))
                }
                className="w-full accent-emerald-600"
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
            <svg viewBox="0 0 360 120" className="w-full" aria-label="رسم توضيحي لمسار السحب والخزان والمضخة">
              {/* Suction Tank */}
              <rect x="14" y="18" width="66" height="84" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
              <rect
                x="16"
                y={102 - tankFillPct * 0.8}
                width="62"
                height={tankFillPct * 0.8 - 2}
                fill={out.cavitationRisk === 'severe' ? '#f59e0b' : '#0284c7'}
                fillOpacity="0.65"
              />
              <text x="47" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9">
                خزان السحب
              </text>

              {/* Suction Pipe & Valve */}
              <line x1="80" y1="80" x2="185" y2="80" stroke="#38bdf8" strokeWidth="7" />
              <polygon points="118,70 138,90 138,70 118,90" fill="#cbd5e1" />
              <text x="128" y="64" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                سحب {inputs.suctionValvePct}%
              </text>

              {/* Pump Body (Circle for Centrifugal, Rounded Square for PD) */}
              {activeProfile.category === 'pd' ? (
                <rect
                  x="182"
                  y="54"
                  width="46"
                  height="44"
                  rx="8"
                  fill={out.reliefValveOpen ? '#991b1b' : '#92400e'}
                  stroke="#fbbf24"
                  strokeWidth="2"
                />
              ) : (
                <circle
                  cx="205"
                  cy="76"
                  r="22"
                  fill={out.cavitationRisk === 'severe' ? '#991b1b' : '#1e40af'}
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
              )}
              <text x="205" y="80" textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="bold">
                {activeProfile.category === 'pd' ? 'PD PUMP' : 'CENT. PUMP'}
              </text>

              {/* Discharge Pipe & Valve */}
              <path d="M 218 54 L 218 28 L 340 28" fill="none" stroke="#34d399" strokeWidth="6" />
              <polygon points="270,20 288,36 288,20 270,36" fill="#cbd5e1" />
              <text x="279" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="8">
                دفع {inputs.dischargeValvePct}%
              </text>

              {/* PD Safety Relief Valve Bypass Loop */}
              {activeProfile.category === 'pd' && (
                <>
                  <path
                    d="M 238 28 L 238 106 L 145 106 L 145 80"
                    fill="none"
                    stroke={out.reliefValveOpen ? '#ef4444' : '#475569'}
                    strokeWidth={out.reliefValveOpen ? '3' : '1.5'}
                    strokeDasharray={out.reliefValveOpen ? '4 2' : undefined}
                  />
                  <rect
                    x="228"
                    y="96"
                    width="22"
                    height="16"
                    rx="3"
                    fill={out.reliefValveOpen ? '#dc2626' : '#1e293b'}
                    stroke={out.reliefValveOpen ? '#fca5a5' : '#64748b'}
                  />
                  <text
                    x="192"
                    y="116"
                    textAnchor="middle"
                    fill={out.reliefValveOpen ? '#fca5a5' : '#94a3b8'}
                    fontSize="8"
                  >
                    {out.reliefValveOpen ? 'صمام الأمان مفتوح! PRV OPEN' : 'صمام الأمان (PRV مغلق)'}
                  </text>
                </>
              )}

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
              {(out.cavitationRisk !== 'none' ||
                out.operatingZone === 'air_bound' ||
                out.operatingZone === 'shutoff' ||
                out.operatingZone === 'overpressure') && <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>{out.statusAr}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed">{out.causeEffectAr}</p>
          </div>

          {/* 8 Live Telemetry Gauges */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: 'معدل التصريف (Flow)',
                val: `${out.flowM3h}`,
                unit: 'm³/h',
                sub: `${activeProfile.category === 'pd' ? 'الاسمي' : 'BEP'}: ${out.bepFlowM3h}`,
              },
              { label: 'العلو الكلي (Head)', val: `${out.headM}`, unit: 'm', sub: `ΔP: ${out.differentialPressureBar} bar` },
              { label: 'ضغط السحب', val: `${out.suctionPressureBar}`, unit: 'bar', sub: `NPSHa: ${out.npshAvailableM} m` },
              { label: 'ضغط الدفع', val: `${out.dischargePressureBar}`, unit: 'bar', sub: `NPSHr: ${out.npshRequiredM} m` },
              { label: 'قدرة العمود', val: `${out.shaftPowerKw}`, unit: 'kW', sub: `هيدروليكية: ${out.hydraulicPowerKw} kW` },
              {
                label: 'الكفاءة التقديرية',
                val: `${out.efficiencyPct}%`,
                unit: '',
                sub: out.efficiencyPct >= 70 ? 'نطاق مقبول (≥70%)' : 'خارج الكفاءة المثلى',
              },
              {
                label: 'حرارة بيت المحامل',
                val: `${out.bearingTempC}°C`,
                unit: '',
                sub: out.bearingTempC > 75 ? 'سخونة مرتفعة' : 'ضمن المعتاد',
              },
              {
                label: 'الاهتزاز التشخيصي',
                val: `${out.vibrationMmS}`,
                unit: 'mm/s',
                sub: out.vibrationMmS > 4.5 ? 'اهتزاز خطر' : 'مستقر',
              },
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
