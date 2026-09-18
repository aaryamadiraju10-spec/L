import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Zap,
  BarChart2,
  RotateCcw,
  Eye,
  Flame,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { CalculationResult, UserAccount, ExportPreviewPayload } from '../types';
import { exportCalculationsToCSV, exportProgressReportToCSV } from '../utils/exportFiles';
import { ExportPreviewModal } from './ExportPreviewModal';
import { getGamificationProfile, GamificationProfile } from '../utils/gamification';

interface ProgressDashboardProps {
  user: UserAccount | null;
  calculations: CalculationResult[];
  onOpenParentReport: () => void;
  onOpenCalculation?: (calc: CalculationResult) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  user,
  calculations,
  onOpenParentReport,
  onOpenCalculation,
}) => {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [gamification, setGamification] = useState<GamificationProfile>(getGamificationProfile());

  // Export Preview Modal State
  const [previewPayload, setPreviewPayload] = useState<ExportPreviewPayload | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  useEffect(() => {
    // Refresh gamification profile
    setGamification(getGamificationProfile());

    // Fetch user exams from backend database
    setIsLoadingExams(true);
    fetch(`/api/exams/user?userId=${user?.id || 'guest'}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.exams) {
          setExams(data.exams);
        }
      })
      .catch((err) => console.warn('Could not load exams:', err))
      .finally(() => setIsLoadingExams(false));
  }, [user]);

  const handleOpenFullReportPreview = () => {
    setPreviewPayload({
      type: 'progress_report',
      title: 'Student Academic Progress Report',
      progressData: {
        calculations,
        exams,
        user,
      },
      filenameBase: `academic_progress_report_${user?.username || 'student'}`,
    });
    setIsPreviewModalOpen(true);
  };

  const handleOpenHistoryPreview = () => {
    setPreviewPayload({
      type: 'calculation_history',
      title: 'Calculation Deduction History',
      historyList: calculations,
      filenameBase: `math_calculations_log_${calculations.length}_items`,
    });
    setIsPreviewModalOpen(true);
  };

  // Compute stats
  const totalCalcs = calculations.length;
  const averageExamScore =
    exams.length > 0
      ? Math.round(exams.reduce((acc, ex) => acc + (ex.score || 0), 0) / exams.length)
      : 85;

  const unlockedBadgesCount = gamification.badges.filter((b) => b.unlocked).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Student Analytics &amp; Mastery Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track formula applications, exam readiness ratings, spaced-repetition badges, and export verified dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-preview-progress-report"
            onClick={handleOpenFullReportPreview}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
            title="Inspect formatted printable dossier and CSV spreadsheet before export"
          >
            <Eye className="h-4 w-4 text-blue-600" />
            <span>Preview Report</span>
          </button>
          <button
            id="btn-open-parent-report"
            onClick={onOpenParentReport}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Generate Parent Report</span>
          </button>
        </div>
      </div>

      {/* GAMIFICATION XP & LEVEL STATUS BAR */}
      <div className="my-6 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-yellow-500/10 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-xl shadow-lg shadow-amber-500/30">
              L{gamification.level}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Level {gamification.level}: {gamification.levelTitle}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>{gamification.streakDays} Day Streak</span>
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {gamification.totalXp} Total XP earned &bull; {gamification.nextLevelXp - gamification.totalXp} XP until Level {gamification.level + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {unlockedBadgesCount} / {gamification.badges.length} Badges Unlocked
            </span>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-4">
          {(() => {
            const currentLevelFloor = (gamification.level - 1) * 200;
            const progressInLevel = Math.max(0, gamification.totalXp - currentLevelFloor);
            const percent = Math.min(100, Math.round((progressInLevel / 200) * 100));
            return (
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>Level {gamification.level} Progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* BADGES & DIGITAL ACHIEVEMENTS SHOWCASE */}
      <div className="my-6 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Digital Achievements &amp; Mastery Badges
            </h2>
          </div>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {unlockedBadgesCount} Completed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
          {gamification.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl p-3 text-center border transition-all ${
                b.unlocked
                  ? 'border-amber-200 bg-amber-50/50 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20'
                  : 'border-zinc-100 bg-zinc-50/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/40'
              }`}
            >
              <div className="text-2xl mb-1">
                {b.icon || (
                  b.iconName === 'Calculator' ? '🧮' :
                  b.iconName === 'Award' ? '🏆' :
                  b.iconName === 'Flame' ? '🔥' :
                  b.iconName === 'Brain' ? '🧠' :
                  b.iconName === 'FileCheck' ? '📋' :
                  b.iconName === 'Mic' ? '🎙️' :
                  b.iconName === 'BookOpen' ? '📖' : '✨'
                )}
              </div>
              <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                {b.title}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                {b.description}
              </p>
              <div className="mt-2 text-[10px] font-semibold text-zinc-400">
                {b.unlocked ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Unlocked</span>
                ) : (
                  <span>
                    {b.progress}/{b.maxProgress} {b.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 my-6">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Formulas Solved</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <BookOpen className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">{totalCalcs}</div>
          <p className="mt-1 text-xs text-zinc-400">Step-by-step proofs recorded in database</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Diagnostic Readiness</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-50">{averageExamScore}%</div>
          <p className="mt-1 text-xs text-zinc-400">Calculated across mini-exams</p>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">Student Profile</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
            {user?.fullName || user?.username || 'Guest Student'}
          </div>
          <p className="mt-1 text-xs text-zinc-400 truncate">
            {user?.school || 'Westwood Academy'} &bull; {user?.grade || 'Grade 11'}
          </p>
        </div>
      </div>

      {/* Calculations History Table with Export Buttons */}
      <div className="my-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Formula Deduction History ({calculations.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Persisted in SQLite database and accessible offline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-preview-calc-history"
              onClick={handleOpenHistoryPreview}
              className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
              title="Preview calculation history in PDF & CSV table grid"
            >
              <Eye className="h-3.5 w-3.5 text-blue-600" />
              <span>Preview History</span>
            </button>
            <button
              id="btn-export-all-calcs-csv"
              onClick={() => exportCalculationsToCSV(calculations)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              title="Export all calculations to CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Formula Title</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Category</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Expression</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Result</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Solved Date</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {calculations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-400">
                    No calculations logged yet. Solve a formula in the Calculator to populate history.
                  </td>
                </tr>
              ) : (
                calculations.map((calc) => (
                  <tr
                    key={calc.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{calc.title}</td>
                    <td className="p-3 text-zinc-500">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {calc.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {calc.expression}
                    </td>
                    <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400 max-w-xs truncate">
                      {calc.result}
                    </td>
                    <td className="p-3 text-zinc-400 text-[11px]">
                      {new Date(calc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {onOpenCalculation && (
                        <button
                          onClick={() => onOpenCalculation(calc)}
                          className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          View Steps
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini-Exams History Table */}
      <div className="my-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Diagnostic Mini-Exams History ({exams.length})
            </h2>
            <p className="text-xs text-zinc-500">
              Exam scores recorded directly into SQLite database for academic verification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Exam Title</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Academic Grade</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Chapter / Topic</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Questions</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Score</th>
                <th className="p-3 font-semibold text-zinc-600 dark:text-zinc-400">Date Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-400">
                    No mini-exams completed yet. Visit Exam Prep to take a targeted assessment.
                  </td>
                </tr>
              ) : (
                exams.map((ex, i) => (
                  <tr key={i} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{ex.title}</td>
                    <td className="p-3 text-zinc-500">{ex.grade}</td>
                    <td className="p-3 text-zinc-600 dark:text-zinc-300">{ex.chapter}</td>
                    <td className="p-3 text-zinc-500">{ex.total_questions || 5} Questions</td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {ex.score}%
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400 text-[11px]">
                      {new Date(ex.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        payload={previewPayload}
      />
    </div>
  );
};
