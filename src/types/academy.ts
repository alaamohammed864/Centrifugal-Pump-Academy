export type InfoSourceTag = 'source' | 'clarification' | 'professional';

export interface TaggedParagraph {
  tag: InfoSourceTag;
  title?: string;
  text: string;
}

export interface MiniReviewQuestion {
  q: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
}

export interface Lesson {
  id: number;
  slug: string;
  title: string;
  englishTitle: string;
  level: 'مبتدئ' | 'متوسط' | 'متقدم';
  sourcePages: string;
  moduleGroup: string;
  simpleDef: TaggedParagraph;
  engineeringExp: TaggedParagraph[];
  oilFieldImportance: string;
  howItWorks: string;
  operationalExamples: string[];
  commonErrors: string[];
  fieldSymptoms: string[];
  englishTerms: { en: string; ar: string }[];
  relatedGlbModel?: GlbModelId;
  reviewQuestions: MiniReviewQuestion[];
}

export type GlbModelId =
  | 'complete_pump'
  | 'exploded_pump'
  | 'impeller_types'
  | 'bearings_loads'
  | 'mechanical_seal'
  | 'cavitation_model'
  | 'water_hammer'
  | 'alignment_model';

export interface PumpPartInfo {
  id: string;
  nodeName: string;
  arName: string;
  enName: string;
  category: 'ثابت' | 'متحرك' | 'إحكام' | 'تشغيل';
  functionDesc: string;
  howItWorks: string;
  failureSymptoms: string[];
  maintenanceChecks: string[];
  relatedLessonIds: number[];
}

export type QuestionDifficulty = 'أساسي' | 'متوسط' | 'متقدم' | 'خبير';
export type QuestionRole = 'operator' | 'maintenance' | 'rotating_expert';

export interface MsqQuestion {
  id: string;
  chapterId: number;
  chapterTitle: string;
  difficulty: QuestionDifficulty;
  role: QuestionRole;
  category: string;
  prompt: string;
  options: string[];
  correctIndices: number[];
  optionRationales: string[];
  concept: string;
  sourceTag: InfoSourceTag;
}

export interface TroubleCause {
  cause: string;
  verificationMethod: string;
  measurementTools: string;
  correctiveAction: string;
  successCheck: string;
}

export interface TroubleGuide {
  id: string;
  pdfIndex?: number;
  title: string;
  englishTitle: string;
  description: string;
  fieldSymptoms: string[];
  safetyPrecautions: string[];
  causes: TroubleCause[];
  sourcePages: string;
}

export interface DiagnosticTestStep {
  id: string;
  label: string;
  tool: string;
  finding: string;
  revealsClue: string;
}

export interface DiagnosticMission {
  id: string;
  title: string;
  unitTag: string;
  scenario: string;
  initialReadings: { label: string; value: string; status: 'normal' | 'warn' | 'danger' }[];
  tests: DiagnosticTestStep[];
  possibleDiagnoses: {
    id: string;
    label: string;
    isCorrect: boolean;
    requiredTestIds: string[];
    explanation: string;
    correctivePlan: string;
  }[];
  safetyNote: string;
}

export interface MaintenanceTask {
  id: string;
  period: 'daily' | 'monthly' | 'quarterly' | 'halfyear' | 'annual';
  periodLabel: string;
  task: string;
  reason: string;
  method: string;
  indicator: string;
  acceptanceRef: string;
  actionOnFault: string;
  sourceRef: string;
}

export interface GlossaryTerm {
  id: string;
  ar: string;
  en: string;
  category: string;
  definition: string;
  sourceTag: InfoSourceTag;
}

export interface AbbreviationItem {
  abbr: string;
  fullEn: string;
  ar: string;
  meaning: string;
}

export interface ComparisonItem {
  id: string;
  title: string;
  columns: string[];
  rows: { aspect: string; values: string[] }[];
}

export interface CaseStudy {
  id: string;
  title: string;
  facilityType: string;
  problem: string;
  readings: string;
  analysis: string;
  resolution: string;
  lessonsLearned: string[];
}

export interface UserProgress {
  completedLessons: number[];
  favorites: string[]; // 'lesson-1', 'question-Q001'
  notes: Record<string, string>;
  completedPmTasks: string[];
  pmLog: { taskId: string; taskName: string; timestamp: string; note: string }[];
  examHistory: {
    id: string;
    mode: string;
    date: string;
    scorePct: number;
    correctCount: number;
    totalCount: number;
    weakChapters: number[];
  }[];
  lastLessonId: number;
  studyModeHideAnswers: boolean;
}
