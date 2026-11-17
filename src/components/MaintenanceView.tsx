import React, { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, Download, Info, Printer } from 'lucide-react';
import type { MaintenanceTask, UserProgress } from '../types/academy';
import { MAINTENANCE_TASKS } from '../data/maintenance';

interface MaintenanceViewProps {
  progress: UserProgress;
  onTogglePmTask: (taskId: string, taskName: string, note?: string) => void;
}

const PERIOD_LABELS: { id: MaintenanceTask['period'] | 'all'; label: string }[] = [
  { id: 'all', label: 'جميع الفترات' },
  { id: 'daily', label: 'يومي (كل 8 ساعات)' },
  { id: 'monthly', label: 'شهري' },
  { id: 'quarterly', label: 'فصلي (كل 3 أشهر)' },
  { id: 'halfyear', label: 'نصف سنوي (كل 6 أشهر)' },
  { id: 'annual', label: 'سنوي (العمرة)' },
];

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ progress, onTogglePmTask }) => {
  const [period, setPeriod] = useState<MaintenanceTask['period'] | 'all'>('all');
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const filteredTasks = useMemo(
    () => (period === 'all' ? MAINTENANCE_TASKS : MAINTENANCE_TASKS.filter((t) => t.period === period)),
    [period],
  );

  const completedCount = progress.completedPmTasks.length;
  const pct = Math.round((completedCount / MAINTENANCE_TASKS.length) * 100);

  const exportTrainingLog = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      disclaimer: 'سجل تدريبي تعليمي مبني على دراسة شركة نفط البصرة — يُعدل ميدانياً حسب دليل الصانع OEM.',
      completionPct: pct,
      completedTaskIds: progress.completedPmTasks,
      logs: progress.pmLog,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pump_pm_training_log.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <strong>ملاحظة الصيانة الميدانية:</strong> هذا الجدول مستمد من دراسة شركة نفط البصرة (ص 133–136)، وتُعدّل الفترات وحدود القبول فعلياً حسب توصيات المصنّع (OEM) وحرجية المضخة وظروف التشغيل.
        </div>
      </div>

      {/* Progress & Filter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            <span>منظومة الصيانة الوقائية التدريبية ({completedCount}/{MAINTENANCE_TASKS.length} مهمة)</span>
          </div>
          <div className="mt-2 h-2 w-64 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportTrainingLog}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تصدير سجل الصيانة JSON</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold ${
              period === p.id
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Checklist Cards */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const checked = progress.completedPmTasks.includes(t.id);
          return (
            <div
              key={t.id}
              className={`rounded-xl border p-4 transition-colors ${
                checked
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => onTogglePmTask(t.id, t.task, draftNotes[t.id])}
                    aria-label={`تبديل حالة ${t.task}`}
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-400 bg-white dark:bg-slate-950'
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded bg-sky-500/15 px-2 py-0.5 font-bold text-sky-700 dark:text-sky-300">
                        {t.periodLabel}
                      </span>
                      <span className="text-slate-500">{t.sourceRef}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.task}</h3>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 dark:text-slate-300 md:grid-cols-3">
                <div>
                  <strong className="text-slate-900 dark:text-white">السبب الهندسي: </strong>
                  {t.reason}
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-white">طريقة الفحص والمؤشر: </strong>
                  {t.method} ({t.indicator})
                </div>
                <div>
                  <strong className="text-emerald-700 dark:text-emerald-300">معيار القبول: </strong>
                  {t.acceptanceRef}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-amber-700 dark:text-amber-300">
                  <strong>عند وجود خلل: </strong>
                  {t.actionOnFault}
                </span>
                <input
                  type="text"
                  value={draftNotes[t.id] ?? ''}
                  onChange={(e) => setDraftNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                  placeholder="ملاحظة فنية للتوثيق (اختياري)..."
                  className="mr-auto w-full rounded border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs md:w-64 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
