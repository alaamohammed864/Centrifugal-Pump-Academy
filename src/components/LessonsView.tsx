import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Search,
  Star,
} from 'lucide-react';
import type { GlbModelId, InfoSourceTag, Lesson, PumpPartInfo, UserProgress } from '../types/academy';
import { LESSONS } from '../data/lessons';
import { Pump2DSchematic } from './Pump2DSchematic';

interface LessonsViewProps {
  selectedLessonId: number;
  onSelectLesson: (id: number) => void;
  progress: UserProgress;
  onToggleComplete: (lessonId: number) => void;
  onToggleFavorite: (key: string) => void;
  onSaveNote: (key: string, text: string) => void;
  onOpen3DModel: (modelId: GlbModelId) => void;
}

const TAG_LABELS: Record<InfoSourceTag, { label: string; cls: string }> = {
  source: {
    label: 'من المصدر (شركة نفط البصرة)',
    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  clarification: {
    label: 'توضيح هندسي إضافي',
    cls: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  professional: {
    label: 'إضافة احترافية ميدانية',
    cls: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
};

export const LessonsView: React.FC<LessonsViewProps> = ({
  selectedLessonId,
  onSelectLesson,
  progress,
  onToggleComplete,
  onToggleFavorite,
  onSaveNote,
  onOpen3DModel,
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('الكل');
  const [showPumpMap, setShowPumpMap] = useState<boolean>(false);
  const [mapPart, setMapPart] = useState<PumpPartInfo | null>(null);
  const [miniQuizChoices, setMiniQuizChoices] = useState<Record<number, number[]>>({});
  const [miniQuizChecked, setMiniQuizChecked] = useState<Record<number, boolean>>({});

  const lesson: Lesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedLessonId) ?? LESSONS[0],
    [selectedLessonId],
  );

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return LESSONS.filter((l) => {
      if (levelFilter !== 'الكل' && l.level !== levelFilter) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.englishTitle.toLowerCase().includes(q) ||
        l.moduleGroup.toLowerCase().includes(q)
      );
    });
  }, [search, levelFilter]);

  const isCompleted = progress.completedLessons.includes(lesson.id);
  const favKey = `lesson-${lesson.id}`;
  const isFavorite = progress.favorites.includes(favKey);
  const noteVal = progress.notes[favKey] ?? '';

  const toggleMiniOption = (qIdx: number, optIdx: number) => {
    setMiniQuizChoices((prev) => {
      const curr = prev[qIdx] ?? [];
      const next = curr.includes(optIdx) ? curr.filter((x) => x !== optIdx) : [...curr, optIdx];
      return { ...prev, [qIdx]: next };
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <BookOpen className="h-4 w-4 text-sky-500" />
          <span>المنهج الهندسي المتكامل (27 درساً مرتبطاً بالدراسة المرجعية)</span>
        </div>
        <button
          type="button"
          onClick={() => setShowPumpMap((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
            showPumpMap
              ? 'bg-sky-600 text-white'
              : 'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          <Compass className="h-3.5 w-3.5 shrink-0" />
          <span>{showPumpMap ? 'إخفاء خريطة المضخة التفاعلية' : 'خريطة المضخة التفاعلية (اضغط على الجزء)'}</span>
        </button>
      </div>

      {/* Clickable Pump Map (Optional Expandable) */}
      {showPumpMap && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Pump2DSchematic selectedPartId={mapPart?.id ?? null} onSelectPart={(p) => setMapPart(p)} />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 lg:col-span-4">
            {mapPart ? (
              <div className="space-y-2 text-xs">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{mapPart.arName}</div>
                <div className="font-en text-[11px] text-sky-600 dark:text-sky-400">{mapPart.enName}</div>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>الوظيفة: </strong>
                  {mapPart.functionDesc}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>كيف يعمل: </strong>
                  {mapPart.howItWorks}
                </p>
                {mapPart.relatedLessonIds[0] && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLesson(mapPart.relatedLessonIds[0]);
                      setShowPumpMap(false);
                    }}
                    className="mt-2 w-full rounded-md bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-500"
                  >
                    الانتقال للدرس {mapPart.relatedLessonIds[0]}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اضغط على أي جزء في المقطع الهندسي أو الأزرار أسفله لعرض تفاصيله والانتقال إلى درسه مباشرة.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Mobile Quick Lesson Switcher */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="mobile-lesson-select" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">
            الانتقال السريع بين الدروس (27 درساً):
          </label>
          <select
            id="mobile-lesson-select"
            value={lesson.id}
            onChange={(e) => {
              onSelectLesson(Number(e.target.value));
              setMiniQuizChoices({});
              setMiniQuizChecked({});
            }}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {LESSONS.map((l) => (
              <option key={l.id} value={l.id}>
                #{String(l.id).padStart(2, '0')} — {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* Curriculum List Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 lg:col-span-4">
          <div className="mb-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في الـ 27 درساً..."
                className="w-full rounded-md border border-slate-300 bg-slate-50 py-1.5 pr-8 pl-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="تصفية حسب المستوى"
              className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <option value="الكل">كل المستويات</option>
              <option value="مبتدئ">مبتدئ</option>
              <option value="متوسط">متوسط</option>
              <option value="متقدم">متقدم</option>
            </select>
          </div>

          <div className="max-h-[210px] space-y-1.5 overflow-y-auto pl-1 lg:max-h-[640px]">
            {filteredLessons.map((item) => {
              const active = item.id === lesson.id;
              const done = progress.completedLessons.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectLesson(item.id);
                    setMiniQuizChoices({});
                    setMiniQuizChecked({});
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg border p-2.5 text-right transition-colors ${
                    active
                      ? 'border-sky-500 bg-sky-500/10 text-slate-900 dark:text-white'
                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono-num font-bold text-sky-600 dark:text-sky-400">
                        #{String(item.id).padStart(2, '0')}
                      </span>
                      <span>· {item.moduleGroup}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs font-bold">{item.title}</div>
                    <div className="font-en truncate text-[10px] text-slate-500">{item.englishTitle}</div>
                  </div>
                  {done && <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Lesson Reader */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono-num rounded bg-sky-500/15 px-2 py-0.5 font-bold text-sky-700 dark:text-sky-300">
                  الدرس {lesson.id} من 27
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  المستوى: {lesson.level}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  مرجع الدراسة: {lesson.sourcePages}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">{lesson.title}</h1>
              <div className="font-en text-xs font-medium text-sky-600 dark:text-sky-400">{lesson.englishTitle}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {lesson.relatedGlbModel && (
                <button
                  type="button"
                  onClick={() => onOpen3DModel(lesson.relatedGlbModel!)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>عرض النموذج 3D GLB</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleFavorite(favKey)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-xs font-semibold ${
                  isFavorite
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    : 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                <span>{isFavorite ? 'في المفضلة' : 'مفضلة'}</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleComplete(lesson.id)}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isCompleted ? 'مكتمل ✓' : 'تحديد كمكتمل'}</span>
              </button>
            </div>
          </div>

          {/* Simple Definition */}
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">التعريف الهندسي المبسط</h2>
              <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${TAG_LABELS[lesson.simpleDef.tag].cls}`}>
                {TAG_LABELS[lesson.simpleDef.tag].label}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{lesson.simpleDef.text}</p>
          </section>

          {/* Deep Engineering Paragraphs with Explicit Attribution Tags */}
          <section className="space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">الشرح الهندسي المتخصص</h2>
            {lesson.engineeringExp.map((block, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                    {block.title || `محور هندسي ${idx + 1}`}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${TAG_LABELS[block.tag].cls}`}>
                    {TAG_LABELS[block.tag].label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{block.text}</p>
              </div>
            ))}
          </section>

          {/* Oil Field Importance & How It Works */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="mb-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                الأهمية في المنشآت النفطية
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{lesson.oilFieldImportance}</p>
            </section>
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
              <h2 className="mb-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">آلية العمل الهندسية</h2>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{lesson.howItWorks}</p>
            </section>
          </div>

          {/* Operational Examples, Common Errors, Field Symptoms */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <section className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
              <h3 className="mb-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">أمثلة تشغيلية واقعية</h3>
              <ul className="list-disc space-y-1 pr-4 text-xs text-slate-700 dark:text-slate-300">
                {lesson.operationalExamples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
              <h3 className="mb-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">الأخطاء الشائعة</h3>
              <ul className="list-disc space-y-1 pr-4 text-xs text-slate-700 dark:text-slate-300">
                {lesson.commonErrors.map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-lg border border-rose-500/25 bg-rose-500/5 p-3">
              <h3 className="mb-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">علامات الخلل الميدانية</h3>
              <ul className="list-disc space-y-1 pr-4 text-xs text-slate-700 dark:text-slate-300">
                {lesson.fieldSymptoms.map((sy, i) => (
                  <li key={i}>{sy}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* English Terms */}
          <section>
            <h2 className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">المصطلحات الإنجليزية المقابلة:</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {lesson.englishTerms.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="text-slate-700 dark:text-slate-200">{t.ar}</span>
                  <span className="font-en font-semibold text-sky-600 dark:text-sky-400">{t.en}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Mini Review Questions */}
          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">أسئلة مراجعة سريعة للدرس (اختيار متعدد)</h2>
            {lesson.reviewQuestions.map((rq, qIdx) => {
              const selected = miniQuizChoices[qIdx] ?? [];
              const checked = Boolean(miniQuizChecked[qIdx]);
              const isExact =
                checked &&
                selected.length === rq.correctIndices.length &&
                rq.correctIndices.every((c) => selected.includes(c));
              return (
                <div key={qIdx} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">{rq.q}</div>
                  <div className="space-y-1.5">
                    {rq.options.map((opt, oIdx) => {
                      const isSel = selected.includes(oIdx);
                      const isRight = rq.correctIndices.includes(oIdx);
                      return (
                        <label
                          key={oIdx}
                          className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                            checked
                              ? isRight
                                ? 'border-emerald-500/60 bg-emerald-500/10'
                                : isSel
                                  ? 'border-rose-500/60 bg-rose-500/10'
                                  : 'border-slate-200 dark:border-slate-800'
                              : isSel
                                ? 'border-sky-500 bg-sky-500/10'
                                : 'border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            disabled={checked}
                            onChange={() => toggleMiniOption(qIdx, oIdx)}
                            className="accent-sky-600"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setMiniQuizChecked((p) => ({ ...p, [qIdx]: true }))}
                      className="rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-500"
                    >
                      تحقق من الإجابة
                    </button>
                    {checked && (
                      <span className={`text-xs font-bold ${isExact ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isExact ? 'إجابة مطابقة تماماً ✓' : 'تحتاج لمراجعة الخيارات الصحيحة كاملة'}
                      </span>
                    )}
                  </div>
                  {checked && (
                    <div className="rounded bg-slate-100 p-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {rq.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Personal Notes */}
          <section>
            <label htmlFor="lesson-note" className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">
              ملاحظاتك الهندسية الشخصية على هذا الدرس (تحفظ تلقائياً محلياً):
            </label>
            <textarea
              id="lesson-note"
              rows={2}
              value={noteVal}
              onChange={(e) => onSaveNote(favKey, e.target.value)}
              placeholder="سجّل ملاحظاتك الميدانية أو نقاط التذكير هنا..."
              className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </section>

          {/* Prev / Next Lesson Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              type="button"
              disabled={lesson.id <= 1}
              onClick={() => onSelectLesson(Math.max(1, lesson.id - 1))}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
              <span>الدرس السابق</span>
            </button>
            <button
              type="button"
              disabled={lesson.id >= 27}
              onClick={() => onSelectLesson(Math.min(27, lesson.id + 1))}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              <span>الدرس التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
