import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, BookMarked, Calculator, Factory, Info, Search, Tags } from 'lucide-react';
import {
  calcAffinityBySpeed,
  calcHydrostaticPressure,
  calcPumpPowers,
  convertUnitValue,
} from '../engine/pumpPhysics';
import { ABBREVIATIONS, CASE_STUDIES, COMPARISONS, GLOSSARY_TERMS } from '../data/toolsData';

type ToolSubTab = 'calc' | 'compare' | 'glossary' | 'abbr' | 'cases';

export const ToolsView: React.FC = () => {
  const [tab, setTab] = useState<ToolSubTab>('calc');

  // Calculator States
  const [rho, setRho] = useState(860);
  const [heightM, setHeightM] = useState(45);
  const [flowM3h, setFlowM3h] = useState(180);
  const [pumpEff, setPumpEff] = useState(76);
  const [motorEff, setMotorEff] = useState(94);

  const [n1, setN1] = useState(2950);
  const [n2, setN2] = useState(2400);
  const [q1, setQ1] = useState(180);
  const [h1, setH1] = useState(55);
  const [p1, setP1] = useState(32);

  // Unit Converter
  const [uCat, setUCat] = useState<'pressure' | 'flow' | 'power' | 'head'>('pressure');
  const [uVal, setUVal] = useState(5);
  const [uFrom, setUFrom] = useState('bar');
  const [uTo, setUTo] = useState('psi');

  // Glossary Search
  const [gSearch, setGSearch] = useState('');
  const [gCat, setGCat] = useState('الكل');

  const unitChoices: Record<'pressure' | 'flow' | 'power' | 'head', string[]> = {
    pressure: ['bar', 'kPa', 'Pa', 'psi', 'mH2O'],
    flow: ['m3/h', 'L/s', 'L/min', 'GPM', 'bbl_d'],
    power: ['kW', 'W', 'HP', 'MW'],
    head: ['m', 'ft', 'cm', 'mm'],
  };

  const hydroRes = useMemo(() => calcHydrostaticPressure(rho, heightM), [rho, heightM]);
  const powerRes = useMemo(
    () => calcPumpPowers(flowM3h, heightM, rho, pumpEff, motorEff),
    [flowM3h, heightM, rho, pumpEff, motorEff],
  );
  const affRes = useMemo(() => calcAffinityBySpeed(q1, h1, p1, n1, n2), [q1, h1, p1, n1, n2]);
  const convRes = useMemo(() => convertUnitValue(uCat, uVal, uFrom, uTo), [uCat, uVal, uFrom, uTo]);

  const categories = useMemo(
    () => ['الكل', ...Array.from(new Set(GLOSSARY_TERMS.map((t) => t.category)))],
    [],
  );

  const filteredGlossary = useMemo(() => {
    const q = gSearch.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((t) => {
      if (gCat !== 'الكل' && t.category !== gCat) return false;
      if (!q) return true;
      return (
        t.ar.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [gSearch, gCat]);

  const handleCatChange = (nextCat: 'pressure' | 'flow' | 'power' | 'head') => {
    setUCat(nextCat);
    const opts = unitChoices[nextCat];
    setUFrom(opts[0]);
    setUTo(opts[1]);
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 sm:flex-wrap sm:overflow-visible dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            ['calc', 'الحاسبة الهندسية والتحويلات', Calculator],
            ['compare', 'المقارنات الهندسية', ArrowLeftRight],
            ['glossary', 'القاموس العربي–الإنجليزي', BookMarked],
            ['abbr', 'قاموس الاختصارات', Tags],
            ['cases', 'دراسات حالة تعليمية', Factory],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
              tab === id
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'calc' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs text-sky-900 dark:text-sky-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
            <span>
              <strong>أداة حسابية تعليمية:</strong> تُستخدم لتوضيح العلاقات الرياضية في الدراسة (معادلة الضغط الاستاتيكي، القدرة الهيدروليكية، قوانين التماثل، وتحويل الوحدات) ولا تغني عن حسابات التصميم الهندسي المعتمدة.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Hydrostatic & Pump Powers */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. حاسبة الضغط الإستاتيكي والقدرة الهيدروليكية وقدرة العمود
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">الكثافة ρ (kg/m³)</span>
                  <input
                    type="number"
                    value={rho}
                    onChange={(e) => setRho(Number(e.target.value) || 0)}
                    className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">العلو H (m)</span>
                  <input
                    type="number"
                    value={heightM}
                    onChange={(e) => setHeightM(Number(e.target.value) || 0)}
                    className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">التدفق Q (m³/h)</span>
                  <input
                    type="number"
                    value={flowM3h}
                    onChange={(e) => setFlowM3h(Number(e.target.value) || 0)}
                    className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">كفاءة المضخة (%)</span>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={pumpEff}
                    onChange={(e) => setPumpEff(Number(e.target.value) || 10)}
                    className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-slate-600 dark:text-slate-400">كفاءة المحرك (%)</span>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={motorEff}
                    onChange={(e) => setMotorEff(Number(e.target.value) || 10)}
                    className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
                  <div className="text-[11px] text-slate-500">الضغط (P = ρgh)</div>
                  <div className="font-mono-num font-bold text-sky-600 dark:text-sky-400">{hydroRes.bar} bar</div>
                  <div className="font-mono-num text-[10px] text-slate-500">{hydroRes.psi} psi</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
                  <div className="text-[11px] text-slate-500">القدرة الهيدروليكية</div>
                  <div className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                    {powerRes.hydraulicKw} kW
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
                  <div className="text-[11px] text-slate-500">قدرة العمود (BHP)</div>
                  <div className="font-mono-num font-bold text-amber-600 dark:text-amber-400">
                    {powerRes.shaftKw} kW
                  </div>
                  <div className="font-mono-num text-[10px] text-slate-500">{powerRes.shaftHp} HP</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-950">
                  <div className="text-[11px] text-slate-500">القدرة الكهربائية</div>
                  <div className="font-mono-num font-bold text-slate-900 dark:text-white">
                    {powerRes.electricalKw} kW
                  </div>
                </div>
              </div>
            </div>

            {/* Affinity Laws + Unit Converter */}
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. قوانين التماثل عند تغير السرعة (Affinity Laws: N, N², N³)
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                  <label>
                    <span className="mb-1 block text-slate-500">N₁ (RPM)</span>
                    <input type="number" value={n1} onChange={(e) => setN1(Number(e.target.value) || 1)} className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-500">N₂ (RPM)</span>
                    <input type="number" value={n2} onChange={(e) => setN2(Number(e.target.value) || 0)} className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-500">Q₁ (m³/h)</span>
                    <input type="number" value={q1} onChange={(e) => setQ1(Number(e.target.value) || 0)} className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-500">H₁ (m)</span>
                    <input type="number" value={h1} onChange={(e) => setH1(Number(e.target.value) || 0)} className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                  <label>
                    <span className="mb-1 block text-slate-500">P₁ (kW)</span>
                    <input type="number" value={p1} onChange={(e) => setP1(Number(e.target.value) || 0)} className="font-mono-num w-full rounded border border-slate-300 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-950" />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-slate-50 p-2 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">التدفق الجديد Q₂</div>
                    <div className="font-mono-num font-bold text-sky-600 dark:text-sky-400">{affRes.q2} m³/h</div>
                  </div>
                  <div className="rounded bg-slate-50 p-2 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">العلو الجديد H₂</div>
                    <div className="font-mono-num font-bold text-amber-600 dark:text-amber-400">{affRes.h2} m</div>
                  </div>
                  <div className="rounded bg-slate-50 p-2 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">القدرة الجديدة P₂</div>
                    <div className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                      {affRes.p2Kw} kW
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. محول الوحدات الهندسية للمضخات</h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <select
                    value={uCat}
                    onChange={(e) => handleCatChange(e.target.value as typeof uCat)}
                    className="rounded border border-slate-300 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="pressure">الضغط (Pressure)</option>
                    <option value="flow">التدفق (Flow)</option>
                    <option value="power">القدرة (Power)</option>
                    <option value="head">العلو/الطول (Head)</option>
                  </select>
                  <input
                    type="number"
                    value={uVal}
                    onChange={(e) => setUVal(Number(e.target.value) || 0)}
                    className="font-mono-num rounded border border-slate-300 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                  <select
                    value={uFrom}
                    onChange={(e) => setUFrom(e.target.value)}
                    className="font-en rounded border border-slate-300 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {unitChoices[uCat].map((u) => (
                      <option key={u} value={u}>
                        من: {u}
                      </option>
                    ))}
                  </select>
                  <select
                    value={uTo}
                    onChange={(e) => setUTo(e.target.value)}
                    className="font-en rounded border border-slate-300 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {unitChoices[uCat].map((u) => (
                      <option key={u} value={u}>
                        إلى: {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="font-mono-num rounded-lg bg-sky-500/10 p-2.5 text-center text-sm font-bold text-sky-700 dark:text-sky-300">
                  {uVal} {uFrom} = {convRes} {uTo}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          {COMPARISONS.map((cmp) => (
            <div
              key={cmp.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white">
                {cmp.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/50">
                      {cmp.columns.map((c, i) => (
                        <th key={i} className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-100">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {cmp.rows.map((r, ri) => (
                      <tr key={ri}>
                        <td className="px-4 py-2.5 font-semibold text-sky-700 dark:text-sky-300">{r.aspect}</td>
                        {r.values.map((v, vi) => (
                          <td key={vi} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'glossary' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={gSearch}
                onChange={(e) => setGSearch(e.target.value)}
                placeholder="ابحث في المصطلحات بالعربية أو الإنجليزية..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 py-1.5 pr-8 pl-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <select
              value={gCat}
              onChange={(e) => setGCat(e.target.value)}
              className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredGlossary.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.ar}</div>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t.category}
                  </span>
                </div>
                <div className="font-en text-xs font-semibold text-sky-600 dark:text-sky-400">{t.en}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'abbr' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ABBREVIATIONS.map((a) => (
            <div
              key={a.abbr}
              className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono-num font-en text-base font-bold text-sky-600 dark:text-sky-400">
                  {a.abbr}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{a.ar}</span>
              </div>
              <div className="font-en text-[11px] text-slate-500">{a.fullEn}</div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{a.meaning}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'cases' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <strong>ملاحظة:</strong> الحالات التالية هي سيناريوهات تطبيقية تعليمية مصممة لربط القواعد الهندسية بواقع العمل النفطي دون نسبتها إلى حوادث مسجلة بعينها في المصدر.
          </div>
          {CASE_STUDIES.map((cs) => (
            <div
              key={cs.id}
              className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">{cs.facilityType}</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{cs.title}</h3>
              <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                  <strong>المشكلة: </strong>
                  {cs.problem}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                  <strong>القراءات المسجلة: </strong>
                  {cs.readings}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                  <strong>التحليل الهندسي: </strong>
                  {cs.analysis}
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-900 dark:text-emerald-200">
                  <strong>المعالجة: </strong>
                  {cs.resolution}
                </div>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <strong>الدروس المستفادة:</strong>
                <ul className="mt-1 list-disc space-y-0.5 pr-4">
                  {cs.lessonsLearned.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
