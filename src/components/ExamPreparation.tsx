import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Clock,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { MiniExamData, ExamEvaluation } from '../types';
import { recordExamCompleted } from '../utils/gamification';

interface ExamPreparationProps {
  userId?: string;
  onOpenChatWithTopic: (topic: string) => void;
  onExamCompleted?: () => void;
}

const SCHOOLS = [
  'AP College Board (US)',
  'IB World School (International Baccalaureate)',
  'Cambridge Assessment (IGCSE / A-Level)',
  'Standard US Public / Private High School',
  'CBSE / ICSE Board',
  'Australian National Curriculum',
  'University / College Undergraduate',
];

const TEXTBOOKS = [
  'James Stewart - Calculus Early Transcendentals',
  'Ron Larson - Precalculus with Limits',
  'OpenStax - Algebra & Trigonometry',
  'Pearson - Common Core Mathematics',
  'Art of Problem Solving (AoPS) - Volume 1 & 2',
  'Hall & Knight - Higher Algebra',
];

const GRADES = [
  'Grade 8 (Pre-Algebra)',
  'Grade 9 (Algebra I)',
  'Grade 10 (Geometry & Algebra II)',
  'Grade 11 (Pre-Calculus & Trigonometry)',
  'Grade 12 (AP Calculus AB/BC & Statistics)',
  'College Sophomore (Linear Algebra & Multivariable)',
];

const CHAPTERS = [
  'Quadratic Equations & Polynomial Functions',
  'Exponential & Logarithmic Functions',
  'Limits, Continuity & Asymptotes',
  'Derivatives & Related Rates of Change',
  'Integration Techniques & Definite Integrals',
  'Trigonometric Identities & Law of Sines/Cosines',
  'Sequences, Series & Taylor Polynomials',
  'Probability, Combinatorics & Normal Distributions',
  'Vectors, Matrices & Systems of Linear Equations',
];

export const ExamPreparation: React.FC<ExamPreparationProps> = ({
  userId,
  onOpenChatWithTopic,
  onExamCompleted,
}) => {
  const [school, setSchool] = useState(SCHOOLS[0]);
  const [book, setBook] = useState(TEXTBOOKS[0]);
  const [grade, setGrade] = useState(GRADES[3]);
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [customChapter, setCustomChapter] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active exam state
  const [activeExam, setActiveExam] = useState<MiniExamData | null>(null);
  const [userSelections, setUserSelections] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<ExamEvaluation | null>(null);

  const handleGenerateExam = async () => {
    setIsLoading(true);
    setError(null);
    setActiveExam(null);
    setEvaluation(null);
    setUserSelections({});

    const selectedChapter = customChapter.trim() || chapter;

    try {
      const response = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          chapter: selectedChapter,
          book,
          school,
          questionCount,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate mini exam');
      }

      setActiveExam(data.exam);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not generate exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (qId: number, optionIdx: number) => {
    if (evaluation) return; // already submitted
    setUserSelections((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const handleSubmitExam = async () => {
    if (!activeExam) return;
    setIsSubmitting(true);
    setError(null);

    const userResponses = activeExam.questions.map((q) => {
      const selected = userSelections[q.id];
      return {
        question: q.question,
        selectedOption: selected !== undefined ? q.options[selected] : 'None',
        isCorrect: selected === q.correctAnswerIndex,
        topic: q.formulaRequired || activeExam.chapter,
      };
    });

    try {
      const response = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examTitle: activeExam.title,
          grade: activeExam.grade,
          chapter: activeExam.chapter,
          userResponses,
          userId: userId || 'guest',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit exam');
      }

      setEvaluation(data.evaluation);
      if (data.evaluation) {
        recordExamCompleted(data.evaluation.scorePercent, activeExam.questions.length);
      }
      if (onExamCompleted) {
        onExamCompleted();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error grading exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Targeted Exam Preparation &amp; Adaptive Mini-Exams
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Configure your specific school curriculum, textbook, grade, and chapter to generate targeted assessments with
          instant AI grading, weakness diagnosis, and personal tutor support.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Exam Setup Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Curriculum &amp; Exam Setup</span>
            </h2>

            {/* School / Board */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                School / Educational Board
              </label>
              <select
                id="select-exam-school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
              >
                {SCHOOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Textbook */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Curriculum Textbook
              </label>
              <select
                id="select-exam-textbook"
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
              >
                {TEXTBOOKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Grade / Academic Level
              </label>
              <select
                id="select-exam-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter / Topic */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Chapter / Examination Topic
              </label>
              <select
                id="select-exam-chapter"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 cursor-pointer"
              >
                {CHAPTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                placeholder="Or type custom chapter name..."
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Length of Mini-Exam
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuestionCount(5)}
                  className={`rounded-xl border p-2 text-xs font-semibold cursor-pointer ${
                    questionCount === 5
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800'
                  }`}
                >
                  5 Questions (Quick)
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionCount(10)}
                  className={`rounded-xl border p-2 text-xs font-semibold cursor-pointer ${
                    questionCount === 10
                      ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800'
                  }`}
                >
                  10 Questions (Full)
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              id="btn-generate-mini-exam"
              onClick={handleGenerateExam}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Tailored Exam...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4" />
                  <span>Generate Mini-Exam Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Exam and Results */}
        <div className="lg:col-span-8 space-y-6">
          {activeExam ? (
            <div className="space-y-6">
              {/* Exam Header */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {activeExam.grade}
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{activeExam.title}</h2>
                    <p className="text-xs text-zinc-500">
                      {activeExam.chapter} &bull; {book}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-500">
                      Progress: {Object.keys(userSelections).length}/{activeExam.questions.length}
                    </span>
                  </div>
                </div>

                {/* Evaluation Banner if completed */}
                {evaluation && (
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider font-semibold opacity-80">
                          Exam Performance Rating
                        </div>
                        <div className="text-2xl font-black">
                          {evaluation.scorePercent}% &bull; {evaluation.gradeBand}
                        </div>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                        <Award className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed opacity-95">
                      {evaluation.targetedStudyAdvice}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-white/20">
                      <button
                        onClick={() =>
                          onOpenChatWithTopic(
                            `I just finished the ${activeExam.title} with score ${evaluation.scorePercent}%. Can you help me practice the areas where I made mistakes?`
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat with AI Tutor on Mistakes</span>
                      </button>
                      <button
                        onClick={handleGenerateExam}
                        className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Take Another Exam</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {activeExam.questions.map((q, idx) => {
                  const selectedIdx = userSelections[q.id];
                  const isAnswered = selectedIdx !== undefined;
                  const isCorrect = isAnswered && selectedIdx === q.correctAnswerIndex;

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-zinc-900 ${
                        evaluation
                          ? isCorrect
                            ? 'border-emerald-200 dark:border-emerald-900/60'
                            : 'border-red-200 dark:border-red-900/60'
                          : 'border-zinc-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-zinc-500">
                            {q.difficulty} Difficulty
                          </span>
                        </div>
                        {q.formulaRequired && (
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            Formula: {q.formulaRequired}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 my-2 leading-relaxed">
                        {q.question}
                      </h3>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-3">
                        {q.options.map((opt, optIdx) => {
                          const isThisSelected = selectedIdx === optIdx;
                          const isThisCorrect = q.correctAnswerIndex === optIdx;

                          let style =
                            'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200';
                          if (evaluation) {
                            if (isThisCorrect) {
                              style =
                                'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold';
                            } else if (isThisSelected && !isThisCorrect) {
                              style =
                                'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/80 dark:text-red-200 line-through';
                            }
                          } else if (isThisSelected) {
                            style =
                              'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-200 font-semibold';
                          }

                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectAnswer(q.id, optIdx)}
                              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs transition-all ${style} cursor-pointer`}
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Detailed Solution Explanation */}
                      {evaluation && (
                        <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800">
                          <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            Step-by-step Mathematical Solution:
                          </div>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!evaluation && (
                <button
                  id="btn-submit-exam"
                  onClick={handleSubmitExam}
                  disabled={isSubmitting || Object.keys(userSelections).length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>Grading Exam &amp; Evaluating Weaknesses...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Submit Exam ({Object.keys(userSelections).length}/{activeExam.questions.length} answered)
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Configure Your Mini-Exam
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                Choose your school, textbook, grade, and chapter on the left, then click &ldquo;Generate Mini-Exam&rdquo;
                to test your understanding.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
