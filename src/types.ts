export interface UserAccount {
  id: string;
  username: string;
  fullName?: string;
  school?: string;
  grade?: string;
  textbook?: string;
  email?: string;
}

export interface CalculationStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathExpression: string;
  tip?: string;
}

export interface CalculationRecord {
  id: string;
  title: string;
  formula?: string;
  expression: string;
  variables: Record<string, string | number>;
  result: string;
  steps: CalculationStep[];
  category: string;
  summary?: string;
  alternativeForms?: string[];
  keyConcepts?: string[];
  createdAt: string;
}

export interface DiagnosticQuizItem {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  userAnswer?: number;
}

export interface WeeklyStudyPlan {
  week: number;
  theme: string;
  goals: string[];
  recommendedExercises: string[];
  completed?: boolean;
}

export interface CurriculumPlan {
  ocrText: string;
  curriculumTitle: string;
  gradeLevel: string;
  subject: string;
  keyUnits: string[];
  diagnosticQuiz: DiagnosticQuizItem[];
  suggestedWeeklyPlan: WeeklyStudyPlan[];
  masteryScoreEstimate: number;
}

export interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  formulaRequired?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  userSelectedOption?: number;
}

export interface MiniExamData {
  id?: string;
  title: string;
  grade: string;
  chapter: string;
  book?: string;
  questions: ExamQuestion[];
}

export interface ExamEvaluation {
  scorePercent: number;
  gradeBand: string;
  strengths: string[];
  weaknesses: string[];
  targetedStudyAdvice: string;
  recommendedFormulasToReview: string[];
  parentSummary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  text?: string;
  timestamp: string;
}

// ==========================================
// EXPORT PREVIEW MODAL
// ==========================================
export type ExportTargetType =
  | 'calculation'
  | 'calculation_history'
  | 'study_plan'
  | 'progress_report'
  | 'exam_result';

export interface ExportPreviewPayload {
  type: ExportTargetType;
  title: string;
  filenameBase: string;
  calculation?: CalculationRecord;
  historyList?: CalculationRecord[];
  studyPlan?: CurriculumPlan;
  examData?: {
    exam: MiniExamData;
    evaluation: ExamEvaluation;
  };
  progressData?: {
    calculations: CalculationRecord[];
    exams: any[];
    user?: UserAccount | null;
  };
}

// ==========================================
// FLASHCARD & SPACED REPETITION (SRS)
// ==========================================
export type MasteryState = 'new' | 'learning' | 'review' | 'mastered';
export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardItem {
  id: string;
  title: string;
  frontPrompt: string;
  backAnswer: string;
  mathExpression?: string;
  category: string;
  source: 'history' | 'curriculum' | 'default';
  keyConcepts?: string[];
  tip?: string;
  intervalDays: number;
  easeFactor: number; // default ~2.5 (SM-2 style)
  repetitions: number;
  lastReviewed?: string;
  nextReviewDate: string; // ISO date string
  masteryState: MasteryState;

  // Compatibility fields
  latexFront?: string;
  latexBack?: string;
  repetitionLevel?: number;
  hint?: string;
  explanation?: string;
  derivation?: string;
}

// ==========================================
// GAMIFICATION & DIGITAL BADGES
// ==========================================
export interface DigitalBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  icon?: string;
  category: 'solver' | 'exam' | 'streak' | 'recall' | 'mastery' | 'feature';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  unit: string;
  xpReward: number;
}

export interface GamificationProfile {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  levelTitle: string;
  streakDays: number;
  lastActiveDate: string;
  badges: DigitalBadge[];
  calculationsCount: number;
  examsCompletedCount: number;
  perfectScoresCount: number;
  flashcardsReviewedCount: number;
  voiceQueriesCount: number;
  curriculumScansCount: number;
}

export type AppTab =
  | 'calculator'
  | 'curriculum'
  | 'exam'
  | 'exams'
  | 'flashcards'
  | 'dashboard'
  | 'sql'
  | 'help'
  | 'settings';

export interface AppSettings {
  mathDisplayMode: 'block' | 'inline';
  decimalPrecision: number; // 2, 4, 6, 8, -1 (exact/fraction)
  angleUnit: 'rad' | 'deg';
  notationStyle: 'standard' | 'scientific' | 'engineering';
  stepVerbosity: 'detailed' | 'standard' | 'compact';
  katexFontSize: 'sm' | 'base' | 'lg' | 'xl';
  copyFormat: 'latex' | 'latex-delimiters' | 'markdown' | 'plaintext';
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  speechLanguage: string;
  autoSolveOnVoice: boolean;
  solverMode: 'hybrid' | 'offline-only' | 'cloud-preferred';
  autoSyncCloud: boolean;
}

export type CalculationResult = CalculationRecord;
export type MathFlashcard = FlashcardItem;

export interface FormulaPreset {
  id?: string;
  name: string;
  category: string;
  expression?: string;
  latexTemplate?: string;
  sampleVariables?: Record<string, any>;
  defaultVariables?: Record<string, any>;
}
