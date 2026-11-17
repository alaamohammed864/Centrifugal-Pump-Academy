import React, { useMemo, useState } from 'react';
import { AlertOctagon, CheckCircle2, ClipboardCheck, Search, ShieldAlert, Wrench } from 'lucide-react';
import { DIAGNOSTIC_MISSIONS, TROUBLE_GUIDES } from '../data/troubleshooting';

export const TroubleshootingView: React.FC = () => {
  const [subTab, setSubTab] = useState<'tables' | 'missions'>('tables');
  const [search, setSearch] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>(TROUBLE_GUIDES[0].id);

  // Interactive Mission State ("أنت مهندس الصيانة")
  const [missionIdx, setMissionIdx] = useState<number>(0);
  const [runTests, setRunTests] = useState<Record<string, boolean>>({});
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);
  const [submittedMission, setSubmittedMission] = useState<boolean>(false);

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TROUBLE_GUIDES;
    return TROUBLE_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.englishTitle.toLowerCase().includes(q) ||
        g.causes.some((c) => c.cause.toLowerCase().includes(q) || c.correctiveAction.toLowerCase().includes(q)),
    );
  }, [search]);

  const activeGuide = useMemo(
    () => filteredGuides.find((g) => g.id === selectedGuideId) ?? filteredGuides[0] ?? TROUBLE_GUIDES[0],
    [filteredGuides, selectedGuideId],
  );

  const mission = DIAGNOSTIC_MISSIONS[missionIdx];
  const executedTestIds = Object.keys(runTests).filter((k) => runTests[k]);
  const chosenDiag = mission.possibleDiagnoses.find((d) => d.id === selectedDiagId) ?? null;

  const selectMission = (idx: number) => {
    setMissionIdx(idx);
    setRunTests({});
    setSelectedDiagId(null);
    setSubmittedMission(false);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTab('tables')}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold sm:flex-initial ${
              subTab === 'tables'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Wrench className="h-3.5 w-3.5 shrink-0" />
            <span>جداول الأعطال المرجعية (ص 138–145)</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('missions')}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold sm:flex-initial ${
              subTab === 'missions'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
            <span>مختبر «أنت مهندس الصيانة» التفاعلي</span>
          </button>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {subTab === 'tables' ? '8 جداول مرجعية + دليل مواسير السحب والدفع' : '6 مهام تشخيص ميداني خطوة بخطوة'}
        </span>
      </div>

      {subTab === 'tables' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Fault Categories Sidebar */}
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن عطل أو سبب أو أداة قياس..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 py-1.5 pr-8 pl-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              {filteredGuides.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGuideId(g.id)}
                  className={`w-full rounded-lg border p-2.5 text-right transition-colors ${
                    activeGuide.id === g.id
                      ? 'border-sky-500 bg-sky-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400">
                    <span>{g.pdfIndex ? `جدول الأعطال #${g.pdfIndex}` : 'دليل موسع'}</span>
                    <span>{g.sourcePages}</span>
                  </div>
                  <div className="mt-0.5 text-xs font-bold">{g.title}</div>
                  <div className="font-en text-[10px] text-slate-500">{g.englishTitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Guide View */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
            <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">{activeGuide.sourcePages}</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeGuide.title}</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{activeGuide.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <AlertOctagon className="h-3.5 w-3.5" />
                  <span>الأعراض الميدانية الملاحظة</span>
                </div>
                <ul className="list-disc space-y-1 pr-4 text-xs text-slate-700 dark:text-slate-300">
                  {activeGuide.fieldSymptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>احتياطات السلامة والعزل (LOTO)</span>
                </div>
                <ul className="list-disc space-y-1 pr-4 text-xs text-slate-700 dark:text-slate-300">
                  {activeGuide.safetyPrecautions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                الأسباب الهندسية المحتملة وخطوات التحقق والمعالجة:
              </h4>
              {activeGuide.causes.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div className="mb-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                    {idx + 1}. {c.cause}
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 dark:text-slate-300 md:grid-cols-2">
                    <div>
                      <strong className="text-slate-900 dark:text-white">طريقة التحقق: </strong>
                      {c.verificationMethod}
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-white">أدوات القياس: </strong>
                      {c.measurementTools}
                    </div>
                    <div>
                      <strong className="text-emerald-700 dark:text-emerald-300">الإجراء العلاجي: </strong>
                      {c.correctiveAction}
                    </div>
                    <div>
                      <strong className="text-sky-700 dark:text-sky-300">مؤشر نجاح الإصلاح: </strong>
                      {c.successCheck}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Diagnostic Missions ("أنت مهندس الصيانة") */
        <div className="space-y-4">
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 pb-3.5 sm:flex-wrap sm:overflow-visible dark:border-slate-800 dark:bg-slate-900">
            {DIAGNOSTIC_MISSIONS.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectMission(idx)}
                className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
                  missionIdx === idx
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                المهمة {idx + 1}: {m.unitTag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Step 1 & 2: Scenario + Required Field Tests */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
              <div>
                <div className="font-mono-num text-xs font-bold text-amber-600 dark:text-amber-400">
                  {mission.unitTag}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{mission.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{mission.scenario}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {mission.initialReadings.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-lg border p-2.5 text-xs ${
                      r.status === 'danger'
                        ? 'border-rose-500/40 bg-rose-500/10'
                        : r.status === 'warn'
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-emerald-500/40 bg-emerald-500/10'
                    }`}
                  >
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">{r.label}</div>
                    <div className="font-mono-num mt-0.5 font-bold text-slate-900 dark:text-white">{r.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-sky-700 dark:text-sky-300">
                  الخطوة 1: نفّذ الفحوصات الميدانية لجمع الأدلة قبل إقرار التشخيص ({executedTestIds.length}/
                  {mission.tests.length}):
                </div>
                <div className="space-y-2">
                  {mission.tests.map((test) => {
                    const done = Boolean(runTests[test.id]);
                    return (
                      <div
                        key={test.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{test.label}</div>
                            <div className="text-[11px] text-slate-500">الأداة: {test.tool}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRunTests((prev) => ({ ...prev, [test.id]: true }))}
                            disabled={done}
                            className={`whitespace-nowrap rounded px-2.5 py-1 text-xs font-semibold ${
                              done
                                ? 'bg-emerald-600 text-white'
                                : 'bg-sky-600 text-white hover:bg-sky-500'
                            }`}
                          >
                            {done ? 'تم الفحص ✓' : 'إجراء الفحص'}
                          </button>
                        </div>
                        {done && (
                          <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs dark:border-slate-800">
                            <div className="text-slate-800 dark:text-slate-200">
                              <strong>النتيجة المقاسة: </strong>
                              {test.finding}
                            </div>
                            <div className="text-sky-700 dark:text-sky-300">
                              <strong>الدلالة الهندسية: </strong>
                              {test.revealsClue}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Diagnosis Selection + Corrective Plan */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                الخطوة 2: اختر التشخيص الهندسي الصحيح بناءً على نتائج الفحوصات:
              </div>

              {executedTestIds.length === 0 && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  تنبيه هندسي: يجب تنفيذ فحص ميداني واحد على الأقل من العمود المجاور قبل اعتماد التشخيص النهائي.
                </div>
              )}

              <div className="space-y-2">
                {mission.possibleDiagnoses.map((d) => (
                  <label
                    key={d.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-xs ${
                      selectedDiagId === d.id
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`diag-${mission.id}`}
                      checked={selectedDiagId === d.id}
                      onChange={() => setSelectedDiagId(d.id)}
                      className="mt-0.5 accent-sky-600"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{d.label}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                disabled={!selectedDiagId || executedTestIds.length === 0}
                onClick={() => setSubmittedMission(true)}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                اعتماد التقرير التشخيصي وخطة الصيانة
              </button>

              {submittedMission && chosenDiag && (
                <div
                  className={`space-y-2 rounded-lg border p-3.5 text-xs ${
                    chosenDiag.isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-rose-500/50 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {chosenDiag.isCorrect
                        ? 'تشخيص هندسي سليم مدعوم بالأدلة!'
                        : 'التشخيص غير دقيق — راجع نتائج الفحوصات الميدانية'}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">{chosenDiag.explanation}</p>
                  <div className="rounded bg-white/80 p-2.5 text-slate-900 dark:bg-slate-950/70 dark:text-slate-100">
                    <strong>خطة المعالجة المعتمدة: </strong>
                    {chosenDiag.correctivePlan}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-800 dark:text-rose-200">
                <strong>إرشاد سلامة: </strong>
                {mission.safetyNote}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
