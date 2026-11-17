import React, { useEffect, useMemo, useState } from 'react';
import { Award, CheckSquare, Clock, Eye, EyeOff, Printer, RotateCcw, Star } from 'lucide-react';
import type { MsqQuestion, UserProgress } from '../types/academy';
import { QUESTIONS } from '../data/questions';
import { LESSONS } from '../data/lessons';
import { gradeExam } from '../engine/pumpPhysics';

interface ExamCenterViewProps {
  progress: UserProgress;
  onSaveExamResult: (entry: UserProgress['examHistory'][number]) => void;
  onToggleFavorite: (key: string) => void;
  onToggleStudyHideAnswers: () => void;
  onJumpToLesson: (lessonId: number) => void;
}

type ExamMode =
  | 'chapter'
  | 'comprehensive'
  | 'random20'
  | 'timed15'
  | 'operator'
  | 'maintenance'
  | 'rotating_expert';

export const ExamCenterView: React.FC<ExamCenterViewProps> = ({
  progress,
  onSaveExamResult,
  onToggleFavorite,
  onToggleStudyHideAnswers,
  onJumpToLesson,
}) => {
  const [mode, setMode] = useState<ExamMode>('chapter');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [seedNonce, setSeedNonce] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(900);

  const activeQuestions: MsqQuestion[] = useMemo(() => {
    if (mode === 'chapter') {
      return QUESTIONS.filter((q) => q.chapterId === selectedChapter);
    }
    if (mode === 'comprehensive') {
      // Sample 54 questions (2 per chapter across all 27) for a realistic full-curriculum exam, plus option to filter
      const picks: MsqQuestion[] = [];
      for (let ch = 1; ch <= 27; ch++) {
        picks.push(...QUESTIONS.filter((q) => q.chapterId === ch).slice(0, 2));
      }
      return picks;
    }
    if (mode === 'operator') {
      return QUESTIONS.filter((q) => q.role === 'operator');
    }
    if (mode === 'maintenance') {
      return QUESTIONS.filter((q) => q.role === 'maintenance');
    }
    if (mode === 'rotating_expert') {
      return QUESTIONS.filter((q) => q.role === 'rotating_expert');
    }
    // random20 or timed15: deterministic shuffle keyed on seedNonce
    const copy = [...QUESTIONS];
    let s = seedNonce * 9301 + 49297;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, mode === 'timed15' ? 15 : 20);
  }, [mode, selectedChapter, seedNonce]);

  useEffect(() => {
    if (mode !== 'timed15' || submitted) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, submitted]);

  const resetExam = (nextMode: ExamMode = mode) => {
    setMode(nextMode);
    setAnswers({});
    setSubmitted(false);
    setSecondsLeft(900);
    setSeedNonce((n) => n + 1);
  };

  const toggleOption = (qId: string, optIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const curr = prev[qId] ?? [];
      const next = curr.includes(optIdx) ? curr.filter((x) => x !== optIdx) : [...curr, optIdx];
      return { ...prev, [qId]: next };
    });
  };

  const gradeSummary = useMemo(() => {
    if (!submitted) return null;
    return gradeExam(activeQuestions, answers);
  }, [submitted, activeQuestions, answers]);

  const handleSubmit = () => {
    setSubmitted(true);
    const res = gradeExam(activeQuestions, answers);
    onSaveExamResult({
      id: `exam-${Date.now()}`,
      mode,
      date: new Date().toISOString(),
      scorePct: res.scorePct,
      correctCount: res.exactCount,
      totalCount: res.totalCount,
      weakChapters: res.weakChapters,
    });
  };

  const answeredCount = activeQuestions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Mode Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              مركز اختبارات الكفاءات الهندسية (بنك من {QUESTIONS.length} سؤال اختيار متعدد MSQ)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              التصحيح الصارم: تُحسب الدرجة الكاملة للسؤال فقط عند تحديد جميع الإجابات الصحيحة دون اختيار أي خيار خاطئ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleStudyHideAnswers}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              {progress.studyModeHideAnswers ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{progress.studyModeHideAnswers ? 'وضع المذاكرة: الإجابات مخفية' : 'وضع المراجعة'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {(
            [
              ['chapter', 'اختبار فصل محدد'],
              ['comprehensive', 'اختبار شامل (54 سؤالاً)'],
              ['random20', 'تدريب عشوائي (20)'],
              ['timed15', 'اختبار موقّت (15 دقيقة)'],
              ['operator', 'مسار مشغل محطة'],
              ['maintenance', 'مسار مهندس/فني صيانة'],
              ['rotating_expert', 'مسار خبير المعدات الدوارة'],
            ] as [ExamMode, string][]
          ).map(([mId, lbl]) => (
            <button
              key={mId}
              type="button"
              onClick={() => resetExam(mId)}
              className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                mode === mId
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {mode === 'chapter' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="exam-chapter-select" className="text-xs font-semibold">
              اختر الفصل (من 1 إلى 27):
            </label>
            <select
              id="exam-chapter-select"
              value={selectedChapter}
              onChange={(e) => {
                setSelectedChapter(Number(e.target.value));
                setAnswers({});
                setSubmitted(false);
              }}
              className="w-full max-w-full rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs sm:w-auto sm:max-w-md dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {LESSONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id}. {l.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span>
            الأسئلة المجاب عنها:{' '}
            <strong className="font-mono-num text-sky-600 dark:text-sky-400">
              {answeredCount} / {activeQuestions.length}
            </strong>
          </span>
          {mode === 'timed15' && (
            <span className="inline-flex items-center gap-1 font-mono-num font-bold text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatClock(secondsLeft)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => resetExam(mode)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold dark:border-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>إعادة المحاولة</span>
          </button>
          {!submitted && (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>تصحيح الاختبار وعرض التفسيرات</span>
            </button>
          )}
        </div>
      </div>

      {/* Submitted Results Summary */}
      {submitted && gradeSummary && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Award className="h-6 w-6 text-emerald-500" />
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  النتيجة النهائية الصارمة: {gradeSummary.scorePct}% ({gradeSummary.exactCount} /{' '}
                  {gradeSummary.totalCount})
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {gradeSummary.scorePct >= 80
                    ? 'مستوى متميز في كفاءات مضخات الطرد المركزي!'
                    : gradeSummary.scorePct >= 60
                      ? 'مستوى جيد — راجع التفسيرات المفصلة للفصول ذات الأخطاء.'
                      : 'يوصى بمراجعة الدروس المحددة أدناه وإعادة المحاولة.'}
                </div>
              </div>
            </div>

            {gradeSummary.weakChapters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-300">دروس مقترحة للمراجعة:</span>
                {gradeSummary.weakChapters.slice(0, 5).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => onJumpToLesson(ch)}
                    className="rounded bg-amber-600 px-2 py-0.5 font-semibold text-white hover:bg-amber-500"
                  >
                    درس {ch}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Cards */}
      <div className="space-y-3">
        {activeQuestions.map((q, qIdx) => {
          const sel = answers[q.id] ?? [];
          const res = gradeSummary?.results[qIdx];
          const favKey = `question-${q.id}`;
          const isFav = progress.favorites.includes(favKey);
          const showRationales = submitted || !progress.studyModeHideAnswers;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-mono-num rounded bg-sky-500/15 px-2 py-0.5 font-bold text-sky-700 dark:text-sky-300">
                    {q.id}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    فصل {q.chapterId}: {q.chapterTitle}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {q.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {res && (
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        res.isExactMatch
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {res.isExactMatch ? 'مطابق بالكامل (1/1)' : 'غير مطابق (0/1)'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(favKey)}
                    aria-label="حفظ السؤال في المفضلة"
                    className="rounded p-1 text-slate-400 hover:text-amber-400"
                  >
                    <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                {qIdx + 1}. {q.prompt}
              </div>

              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  const isSel = sel.includes(oIdx);
                  const isRight = q.correctIndices.includes(oIdx);
                  return (
                    <div key={oIdx} className="space-y-1">
                      <label
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-colors ${
                          submitted
                            ? isRight
                              ? 'border-emerald-500/60 bg-emerald-500/10'
                              : isSel
                                ? 'border-rose-500/60 bg-rose-500/10'
                                : 'border-slate-200 dark:border-slate-800'
                            : isSel
                              ? 'border-sky-500 bg-sky-500/10'
                              : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          disabled={submitted}
                          onChange={() => toggleOption(q.id, oIdx)}
                          className="mt-0.5 accent-sky-600"
                        />
                        <span className="flex-1 text-slate-800 dark:text-slate-100">{opt}</span>
                      </label>
                      {submitted && showRationales && (
                        <div
                          className={`pr-6 text-[11px] ${
                            isRight ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {q.optionRationales[oIdx]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {submitted && (
                <div className="mt-2.5 rounded-md bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                  <strong>المفهوم الهندسي: </strong>
                  {q.concept}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
