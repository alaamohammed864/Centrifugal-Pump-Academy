import React, { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Box,
  CalendarCheck,
  Download,
  LineChart,
  Play,
  Search,
  Wrench,
} from 'lucide-react';
import type { UserProgress } from '../types/academy';
import { LESSONS } from '../data/lessons';
import { QUESTIONS } from '../data/questions';
import { TROUBLE_GUIDES } from '../data/troubleshooting';
import { MAINTENANCE_TASKS } from '../data/maintenance';
import { GLOSSARY_TERMS } from '../data/toolsData';

export type WorkspaceTab =
  | 'home'
  | 'lessons'
  | 'lab3d'
  | 'simulator'
  | 'curves'
  | 'troubleshooting'
  | 'exams'
  | 'maintenance'
  | 'tools';

interface DashboardHomeProps {
  progress: UserProgress;
  onNavigate: (tab: WorkspaceTab, lessonId?: number) => void;
  isStandaloneHtml?: boolean;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  progress,
  onNavigate,
  isStandaloneHtml = false,
}) => {
  const [globalQuery, setGlobalQuery] = useState('');

  const completedPct = Math.round((progress.completedLessons.length / LESSONS.length) * 100);
  const pmPct = Math.round((progress.completedPmTasks.length / MAINTENANCE_TASKS.length) * 100);
  const avgScore =
    progress.examHistory.length > 0
      ? Math.round(progress.examHistory.reduce((s, e) => s + e.scorePct, 0) / progress.examHistory.length)
      : null;

  const engineerTier =
    completedPct >= 80 && (avgScore ?? 0) >= 80
      ? 'خبير معدات دوارة (Rotating Expert)'
      : completedPct >= 40
        ? 'مهندس صيانة وتشغيل متقدم'
        : 'مهندس قيد التأهيل الميداني';

  const lastLesson = LESSONS.find((l) => l.id === progress.lastLessonId) ?? LESSONS[0];

  const searchHits = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (q.length < 2) return null;
    const lessonHits = LESSONS.filter(
      (l) => l.title.toLowerCase().includes(q) || l.englishTitle.toLowerCase().includes(q),
    ).slice(0, 5);
    const faultHits = TROUBLE_GUIDES.filter(
      (g) => g.title.toLowerCase().includes(q) || g.englishTitle.toLowerCase().includes(q),
    ).slice(0, 4);
    const termHits = GLOSSARY_TERMS.filter(
      (t) => t.ar.toLowerCase().includes(q) || t.en.toLowerCase().includes(q),
    ).slice(0, 4);
    return { lessonHits, faultHits, termHits };
  }, [globalQuery]);

  const latestExam = progress.examHistory[0];

  return (
    <div className="space-y-5">
      {/* Compact Command-Center Academy Header (Not a marketing landing page) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col-reverse items-stretch justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
              منصة التدريب والمحاكاة الهندسية — مرجع دراسة شركة نفط البصرة (146 صفحة)
            </div>
            <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-2xl dark:text-white">
              أكاديمية مضخات الطرد المركزي <span className="text-slate-400">|</span>{' '}
              <span dir="ltr" className="font-en text-base font-semibold text-sky-600 dark:text-sky-400 sm:text-xl">
                Centrifugal Pump Academy
              </span>
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              منهج متكامل من 27 درساً، 17 نموذجاً ثلاثي الأبعاد بصيغة GLB، محاكي تشغيل تفاعلي، منحنيات الأداء، مختبر «أنت مهندس الصيانة»، وبنك اختبارات يضم {QUESTIONS.length} سؤال اختيار متعدد.
            </p>
            <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
              <span>إعداد وتطوير المنصة:</span>
              <span dir="ltr" className="font-en font-bold tracking-wide">ENG ALAA MOHAMMED</span>
            </div>

            <div className="mt-3 flex w-full flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('lessons', lastLesson.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 sm:flex-initial"
              >
                <Play className="h-3.5 w-3.5" />
                <span>متابعة الدرس {lastLesson.id}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('lab3d')}
                className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 sm:flex-initial"
              >
                <Box className="h-3.5 w-3.5 text-sky-500" />
                <span>مختبر 3D GLB</span>
              </button>
              {!isStandaloneHtml && (
                <a
                  href="/Centrifugal_Pump_Academy.html"
                  download="Centrifugal_Pump_Academy.html"
                  className="inline-flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-600/50 bg-emerald-600/10 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-300 sm:w-auto"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تحميل ملف HTML واحد المستقل</span>
                </a>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 overflow-hidden rounded-xl border border-sky-500/35 bg-slate-950 shadow-md lg:w-[340px]">
            <img
              src="/assets/aistudio/___________________________________________________________a200d03d.png"
              alt="الشعار والهوية البصرية لأكاديمية مضخات الطرد المركزي"
              className="aspect-video w-full object-cover object-center"
            />
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="بحث شامل في الدروس، الأعطال، والمصطلحات (مثال: التكهف، السداد، Reverse Dial، BEP)..."
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pr-9 pl-3 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {searchHits && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950 md:grid-cols-3">
            <div>
              <div className="mb-1 font-bold text-sky-600 dark:text-sky-400">الدروس ({searchHits.lessonHits.length})</div>
              {searchHits.lessonHits.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onNavigate('lessons', l.id)}
                  className="block w-full truncate rounded px-2 py-1 text-right hover:bg-sky-500/10"
                >
                  {l.id}. {l.title}
                </button>
              ))}
            </div>
            <div>
              <div className="mb-1 font-bold text-amber-600 dark:text-amber-400">الأعطال ({searchHits.faultHits.length})</div>
              {searchHits.faultHits.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onNavigate('troubleshooting')}
                  className="block w-full truncate rounded px-2 py-1 text-right hover:bg-amber-500/10"
                >
                  {g.title}
                </button>
              ))}
            </div>
            <div>
              <div className="mb-1 font-bold text-emerald-600 dark:text-emerald-400">القاموس ({searchHits.termHits.length})</div>
              {searchHits.termHits.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onNavigate('tools')}
                  className="block w-full truncate rounded px-2 py-1 text-right hover:bg-emerald-500/10"
                >
                  {t.ar} ({t.en})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Telemetry Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">إنجاز المنهج الدراسي</div>
          <div className="font-mono-num mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">{completedPct}%</div>
          <div className="text-[11px] text-slate-500">{progress.completedLessons.length} من 27 درساً</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">متوسط الاختبارات</div>
          <div className="font-mono-num mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">{progress.examHistory.length} اختباراً منجزاً</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">الصيانة الوقائية</div>
          <div className="font-mono-num mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{pmPct}%</div>
          <div className="text-[11px] text-slate-500">{progress.completedPmTasks.length} من {MAINTENANCE_TASKS.length} مهمة</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">تصنيف الكفاءة الحالي</div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{engineerTier}</div>
          <div className="text-[11px] text-slate-500">{progress.favorites.length} عناصر في المفضلة</div>
        </div>
      </div>

      {/* 7 Core Platform Workspaces Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            tab: 'lessons' as const,
            title: 'المنهج التعليمي (27 درساً)',
            desc: 'شرح مبسط وهندسي متدرج من التمهيد حتى جداول الأعطال مع توثيق صفحات الدراسة.',
            icon: BookOpen,
            accent: 'text-sky-500',
          },
          {
            tab: 'lab3d' as const,
            title: 'مختبر النماذج ثلاثية الأبعاد GLB',
            desc: '17 نموذج CAD/GLB حقيقي مع حركات Operate، تفكيك الأجزاء، الدفاعات، المضخات متعددة المراحل والإزاحة الموجبة، والمحاذاة.',
            icon: Box,
            accent: 'text-indigo-500',
          },
          {
            tab: 'simulator' as const,
            title: 'محاكي تشغيل المضخة التفاعلي',
            desc: 'تحكم بالسرعة والصمامات ومنسوب الخزان والهواء وراقب الضغط والتدفق والتكهف حياً.',
            icon: Activity,
            accent: 'text-emerald-500',
          },
          {
            tab: 'curves' as const,
            title: 'مختبر منحنيات الأداء (BEP & H-Q)',
            desc: 'استكشف نقطة التشغيل ومنحنى النظام والربط على التوالي والتوازي بالمتري والإمبراطوري.',
            icon: LineChart,
            accent: 'text-cyan-500',
          },
          {
            tab: 'troubleshooting' as const,
            title: 'تشخيص الأعطال و«أنت مهندس الصيانة»',
            desc: 'جميع جداول الأعطال الـ 8 من المصدر + 6 مهام تحقيق ميداني بالأدوات والاختبارات.',
            icon: Wrench,
            accent: 'text-amber-500',
          },
          {
            tab: 'exams' as const,
            title: `مركز اختبارات MSQ (${QUESTIONS.length} سؤالاً)`,
            desc: 'اختبارات حسب الفصل، شاملة، موقتة، وحسب التخصص مع تصحيح صارم وتفسير لكل خيار.',
            icon: Award,
            accent: 'text-rose-500',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.tab}
              type="button"
              onClick={() => onNavigate(card.tab)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-right transition-colors hover:border-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${card.accent}`} />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{card.title}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{card.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Bottom Row: PM & Tools Shortcut + Weak Chapters */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <CalendarCheck className="h-4 w-4 text-emerald-500" />
              <span>الصيانة الوقائية والحاسبة والقاموس الهندسي</span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              تصفح جداول الصيانة اليومية والسنوية، حاسبات الضغط والقدرة والتماثل، ومقارنات التصميم.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onNavigate('maintenance')}
              className="whitespace-nowrap rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              الصيانة الوقائية
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tools')}
              className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              الأدوات والقاموس
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-bold text-slate-900 dark:text-white">توصيات المراجعة الشخصية</div>
          {latestExam && latestExam.weakChapters.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300">نقاط تحتاج تقوية من آخر اختبار ({latestExam.scorePct}%):</span>
              {latestExam.weakChapters.slice(0, 4).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => onNavigate('lessons', ch)}
                  className="rounded bg-amber-600 px-2.5 py-1 font-semibold text-white hover:bg-amber-500"
                >
                  مراجعة درس {ch}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              أكمل اختباراً واحداً في «مركز الاختبارات» لتظهر لك توصيات الفصول الضعيفة والقوية تلقائياً.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
