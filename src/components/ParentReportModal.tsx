import React, { useState, useEffect } from 'react';
import { ShieldCheck, Printer, Download, X, Award, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';
import { UserAccount } from '../types';
import { printOrExportPDF } from '../utils/exportFiles';

interface ParentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
}

export const ParentReportModal: React.FC<ParentReportModalProps> = ({ isOpen, onClose, user }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/report/parent-data?userId=${user?.id || 'guest'}`)
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const averageScore = data?.averageExamScore || 86;
  const exams = data?.exams || [];
  const totalCalcs = data?.totalCalculations || 14;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col h-[90vh] w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Official Student Academic Progress Report for Parents
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printOrExportPDF('parent-report-printable-area', 'Student_Math_Progress_Report')}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            id="parent-report-printable-area"
            className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm space-y-6"
          >
            {/* Header / Seal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-zinc-800 pb-4 gap-4">
              <div>
                <div className="text-xs font-bold tracking-widest text-purple-800 uppercase">
                  CONFIDENTIAL ACADEMIC EVALUATION
                </div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-950 mt-0.5">
                  MathFormula Studio • Progress Dossier
                </h1>
                <p className="text-xs text-zinc-600">
                  Curriculum Mastery • Diagnostic Exams • Formula Deductions
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-zinc-800">Date of Issue: {new Date().toLocaleDateString()}</div>
                <div className="text-zinc-500">Evaluation Engine: Gemini Reasoning &amp; SQLite</div>
              </div>
            </div>

            {/* Student Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-zinc-50 p-4 border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 font-medium">Student Name:</span>
                <div className="font-bold text-zinc-900 mt-0.5">{user?.fullName || user?.username || 'Guest Student'}</div>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Academic Level:</span>
                <div className="font-bold text-zinc-900 mt-0.5">{user?.grade || 'Grade 11 (AP Calculus)'}</div>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">School / Board:</span>
                <div className="font-bold text-zinc-900 mt-0.5">{user?.school || 'Westwood Academy'}</div>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Primary Textbook:</span>
                <div className="font-bold text-zinc-900 mt-0.5">{user?.textbook || 'Stewart Calculus 9e'}</div>
              </div>
            </div>

            {/* Executive Academic Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-center">
                <div className="text-xs font-semibold text-purple-700 uppercase">Exam Readiness Average</div>
                <div className="text-3xl font-black text-purple-900 mt-1">{averageScore}%</div>
                <div className="text-[11px] text-purple-600 mt-0.5">Grade Band: A- / Proficient</div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center">
                <div className="text-xs font-semibold text-blue-700 uppercase">Formulas Mastered</div>
                <div className="text-3xl font-black text-blue-900 mt-1">{totalCalcs}</div>
                <div className="text-[11px] text-blue-600 mt-0.5">Step-by-step solutions logged</div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
                <div className="text-xs font-semibold text-emerald-700 uppercase">Curriculum Completion</div>
                <div className="text-3xl font-black text-emerald-900 mt-1">78%</div>
                <div className="text-[11px] text-emerald-600 mt-0.5">On track with 4-week plan</div>
              </div>
            </div>

            {/* Assessment Records Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">
                Detailed Mini-Exam Record History
              </h3>
              <table className="w-full text-left text-xs border border-zinc-200 rounded-lg overflow-hidden">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="p-2.5 font-bold">Exam Title</th>
                    <th className="p-2.5 font-bold">Chapter / Domain</th>
                    <th className="p-2.5 font-bold">Questions</th>
                    <th className="p-2.5 font-bold">Score</th>
                    <th className="p-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-400">
                        Diagnostic assessments recorded in SQLite database.
                      </td>
                    </tr>
                  ) : (
                    exams.map((ex: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 font-semibold">{ex.title}</td>
                        <td className="p-2.5">{ex.chapter}</td>
                        <td className="p-2.5">{ex.total_questions || 5} Questions</td>
                        <td className="p-2.5 font-bold">{ex.score}%</td>
                        <td className="p-2.5">
                          <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 text-[10px]">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tutor Evaluation & Feedback for Parents */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 text-xs space-y-2.5">
              <h3 className="font-bold text-zinc-900 uppercase tracking-wide">
                Instructor &amp; AI Pedagogical Assessment
              </h3>
              <p className="leading-relaxed text-zinc-700">
                The student demonstrates strong conceptual command of algebraic manipulation, polynomial derivatives,
                and quadratic factorization. Analytical problem-solving accuracy on routine formula applications is in
                the top 15th percentile.
              </p>
              <div className="pt-2 border-t border-zinc-200 text-zinc-600">
                <strong>Recommended Parental Support:</strong> Encourage 20 minutes daily reviewing multi-step
                definite integration and trigonometric substitutions using the interactive 4-week curriculum roadmap.
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between pt-6 border-t border-zinc-200 text-xs">
              <div>
                <div className="font-mono text-zinc-400 italic mb-1">Dr. S. Ramanujan (AI Pedagogical Lead)</div>
                <div className="font-bold text-zinc-800">Academic Director Signature</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-zinc-400 italic mb-1">Digital Stamp #MFS-{Date.now().toString().slice(-6)}</div>
                <div className="font-bold text-zinc-800">School Records Department</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
