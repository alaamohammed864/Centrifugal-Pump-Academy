import React from 'react';
import { Activity, Award, BookOpen, Box, Home, SearchX } from 'lucide-react';
import type { WorkspaceTab } from './DashboardHome';

interface NotFoundViewProps {
  invalidPath?: string;
  onNavigate: (tab: WorkspaceTab, lessonId?: number) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ invalidPath, onNavigate }) => {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="font-mono-num text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
        HTTP 404 — المسار غير موجود
      </div>
      <h1
        id="not-found-heading"
        className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white"
      >
        الصفحة المطلوبة غير متوفرة في الأكاديمية
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        {invalidPath
          ? `المسار (${invalidPath}) غير صحيح أو تم نقله. استخدم الروابط المباشرة أدناه للوصول إلى الأقسام الهندسية المعتمدة.`
          : 'الرابط الذي طلبته غير موجود. يمكنك الانتقال مباشرة إلى الصفحة الرئيسية أو أحد المختبرات التعليمية.'}
      </p>

      <nav aria-label="روابط استرداد الصفحة" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-sky-500"
        >
          <Home className="h-4 w-4" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('lessons', 1)}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <BookOpen className="h-4 w-4 text-sky-500" />
          <span>المنهج الهندسي (27 درساً)</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('lab3d')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <Box className="h-4 w-4 text-indigo-500" />
          <span>مختبر النماذج 3D GLB</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('simulator')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <Activity className="h-4 w-4 text-emerald-500" />
          <span>محاكي تشغيل المضخة</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('exams')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 sm:col-span-2 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        >
          <Award className="h-4 w-4 text-rose-500" />
          <span>مركز اختبارات الكفاءة الهندسية (162 سؤالاً)</span>
        </button>
      </nav>
    </section>
  );
};
