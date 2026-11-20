import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Box,
  CalendarCheck,
  Compass,
  Home,
  LineChart,
  Moon,
  Sun,
  Wrench,
} from 'lucide-react';
import type { GlbModelId, UserProgress } from './types/academy';
import type { SimulatorPumpType } from './engine/pumpPhysics';
import { DashboardHome, type WorkspaceTab } from './components/DashboardHome';
import { LessonsView } from './components/LessonsView';
import { Pump3DViewport } from './components/Pump3DViewport';
import { SimulatorView } from './components/SimulatorView';
import { CurvesView } from './components/CurvesView';
import { TroubleshootingView } from './components/TroubleshootingView';
import { ExamCenterView } from './components/ExamCenterView';
import { MaintenanceView } from './components/MaintenanceView';
import { ToolsView } from './components/ToolsView';
import { SplashScreen } from './components/SplashScreen';
import { shouldSkipSplash } from './engine/splashUtils';

const STORAGE_KEY = 'centrifugal_pump_academy_v1';

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: [],
  favorites: [],
  notes: {},
  completedPmTasks: [],
  pmLog: [],
  examHistory: [],
  lastLessonId: 1,
  studyModeHideAnswers: true,
};

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

const NAV_ITEMS: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'lessons', label: 'الدروس (27)', icon: BookOpen },
  { id: 'lab3d', label: 'مختبر 3D GLB', icon: Box },
  { id: 'simulator', label: 'محاكي التشغيل', icon: Activity },
  { id: 'curves', label: 'المنحنيات', icon: LineChart },
  { id: 'troubleshooting', label: 'الأعطال', icon: Wrench },
  { id: 'exams', label: 'الاختبارات', icon: Award },
  { id: 'maintenance', label: 'الصيانة', icon: CalendarCheck },
  { id: 'tools', label: 'الأدوات والقاموس', icon: Compass },
];

export interface AppProps {
  isStandaloneHtml?: boolean;
}

export default function App({ isStandaloneHtml = false }: AppProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const t = sp.get('tab') as WorkspaceTab | null;
      if (t && NAV_ITEMS.some((i) => i.id === t)) return t;
      if (sp.get('autostart') === '1') return 'lab3d';
    }
    return 'home';
  });

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showSplash, setShowSplash] = useState<boolean>(() =>
    typeof window !== 'undefined' ? !shouldSkipSplash(window.location.search) : true
  );
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(() => loadProgress().lastLessonId || 1);
  const [selected3DModel, setSelected3DModel] = useState<GlbModelId>('complete_pump');
  const [selectedSimulatorType, setSelectedSimulatorType] = useState<SimulatorPumpType>('centrifugal_radial');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore quota errors
    }
  }, [progress]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  const handleNavigate = (tab: WorkspaceTab, lessonId?: number) => {
    setActiveTab(tab);
    if (lessonId) {
      setSelectedLessonId(lessonId);
      setProgress((p) => ({ ...p, lastLessonId: lessonId }));
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleOpen3DModel = (modelId: GlbModelId) => {
    setSelected3DModel(modelId);
    setActiveTab('lab3d');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleOpenSimulator = (pumpType: SimulatorPumpType) => {
    setSelectedSimulatorType(pumpType);
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleSelectLesson = (id: number) => {
    setSelectedLessonId(id);
    setProgress((p) => ({ ...p, lastLessonId: id }));
  };

  const handleToggleComplete = (lessonId: number) => {
    setProgress((p) => {
      const exists = p.completedLessons.includes(lessonId);
      const completedLessons = exists
        ? p.completedLessons.filter((x) => x !== lessonId)
        : [...p.completedLessons, lessonId].sort((a, b) => a - b);
      return { ...p, completedLessons };
    });
  };

  const handleToggleFavorite = (key: string) => {
    setProgress((p) => {
      const exists = p.favorites.includes(key);
      const favorites = exists ? p.favorites.filter((x) => x !== key) : [...p.favorites, key];
      return { ...p, favorites };
    });
  };

  const handleSaveNote = (key: string, text: string) => {
    setProgress((p) => ({ ...p, notes: { ...p.notes, [key]: text } }));
  };

  const handleTogglePmTask = (taskId: string, taskName: string, note = '') => {
    setProgress((p) => {
      const exists = p.completedPmTasks.includes(taskId);
      const completedPmTasks = exists
        ? p.completedPmTasks.filter((x) => x !== taskId)
        : [...p.completedPmTasks, taskId];
      const pmLog = !exists
        ? [{ taskId, taskName, timestamp: new Date().toISOString(), note }, ...p.pmLog].slice(0, 100)
        : p.pmLog;
      return { ...p, completedPmTasks, pmLog };
    });
  };

  const handleSaveExamResult = (entry: UserProgress['examHistory'][number]) => {
    setProgress((p) => ({
      ...p,
      examHistory: [entry, ...p.examHistory].slice(0, 25),
    }));
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {/* Top 3-Zone Navigation Bar (Single-Row Desktop, Responsive Scrollable on Mobile) */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-3 py-2 sm:px-4">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="flex min-w-0 shrink-0 items-center gap-2 text-right"
          >
            <span className="flex h-9 w-14 shrink-0 overflow-hidden rounded-lg border border-sky-500/40 bg-slate-950 shadow-sm">
              <img
                src="/assets/aistudio/___________________________________________________________a200d03d.png"
                alt="شعار أكاديمية مضخات الطرد المركزي"
                className="h-full w-full object-cover object-center"
              />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex flex-col">
                <span className="whitespace-nowrap text-xs font-bold text-slate-900 dark:text-white sm:text-[13px]">
                  أكاديمية مضخات الطرد المركزي
                </span>
                <span className="font-en whitespace-nowrap text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                  | Centrifugal Pump Academy
                </span>
              </div>
            </div>
          </button>

          {/* Zone 2: Horizontal Navigation Tabs (Single line labels) */}
          <nav aria-label="التنقل الرئيسي" className="hidden min-w-0 items-center gap-0.5 overflow-x-auto lg:flex xl:gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors xl:px-2.5 xl:text-xs ${
                    active
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Theme Toggle + Progress Pill */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-mono-num hidden rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-700 sm:inline-block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {progress.completedLessons.length}/27 درس
            </span>
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Compact Horizontal Strip */}
        <nav
          aria-label="التنقل على الهاتف"
          className="flex items-center gap-1.5 overflow-x-auto border-t border-slate-200 px-3 py-2 lg:hidden dark:border-slate-800"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`inline-flex min-h-[34px] shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-5 sm:py-5">
        {activeTab === 'home' && (
          <DashboardHome progress={progress} onNavigate={handleNavigate} isStandaloneHtml={isStandaloneHtml} />
        )}
        {activeTab === 'lessons' && (
          <LessonsView
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
            progress={progress}
            onToggleComplete={handleToggleComplete}
            onToggleFavorite={handleToggleFavorite}
            onSaveNote={handleSaveNote}
            onOpen3DModel={handleOpen3DModel}
          />
        )}
        {activeTab === 'lab3d' && (
          <Pump3DViewport
            initialModelId={selected3DModel}
            onJumpToLesson={(id) => handleNavigate('lessons', id)}
            onOpenInSimulator={handleOpenSimulator}
          />
        )}
        {activeTab === 'simulator' && (
          <SimulatorView initialPumpType={selectedSimulatorType} onOpen3DModel={handleOpen3DModel} />
        )}
        {activeTab === 'curves' && <CurvesView />}
        {activeTab === 'troubleshooting' && <TroubleshootingView />}
        {activeTab === 'exams' && (
          <ExamCenterView
            progress={progress}
            onSaveExamResult={handleSaveExamResult}
            onToggleFavorite={handleToggleFavorite}
            onToggleStudyHideAnswers={() =>
              setProgress((p) => ({ ...p, studyModeHideAnswers: !p.studyModeHideAnswers }))
            }
            onJumpToLesson={(id) => handleNavigate('lessons', id)}
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceView progress={progress} onTogglePmTask={handleTogglePmTask} />
        )}
        {activeTab === 'tools' && <ToolsView />}
      </main>

      {/* Footer */}
      <footer className="no-print mt-6 border-t border-slate-200 bg-white px-3 py-3.5 text-center text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            تطوير وإعداد: <strong dir="ltr" className="font-en font-bold text-sky-600 dark:text-sky-400">ENG ALAA MOHAMMED</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy</span>
          <span aria-hidden="true">·</span>
          <span>مبنية على دراسة وتقييم الأداء لمضخات الطرد المركزي – شركة نفط البصرة</span>
        </div>
      </footer>
    </div>
  );
}
