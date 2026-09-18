import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Calculator,
  Camera,
  GraduationCap,
  Database,
  Smartphone,
  Wifi,
  ShieldCheck,
  Code,
  Layers,
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeDocSection, setActiveDocSection] = useState('overview');

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', title: 'System Architecture', icon: Layers },
    { id: 'calculator', title: 'Formula Calculator', icon: Calculator },
    { id: 'curriculum', title: 'Curriculum OCR & 10-Q Plan', icon: Camera },
    { id: 'exams', title: 'Exam Prep & Grading', icon: GraduationCap },
    { id: 'database', title: 'SQLite Database Schema', icon: Database },
    { id: 'mobile', title: 'Swift iOS & APK Packages', icon: Smartphone },
    { id: 'sync', title: 'Offline & Cloud Sync', icon: Wifi },
    { id: 'reports', title: 'Parent Reports & Export', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col h-[85vh] w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Technical Documentation &amp; Component Manual
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-zinc-100 p-3 dark:border-zinc-800 space-y-1 overflow-y-auto hidden sm:block">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveDocSection(s.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                    activeDocSection === s.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Doc Content Area */}
          <div className="flex-1 overflow-y-auto p-6 text-xs text-zinc-700 dark:text-zinc-300 space-y-4 leading-relaxed">
            {activeDocSection === 'overview' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">MathFormula Studio Architecture</h3>
                <p>
                  MathFormula Studio is an educational math application combining client-side React with a full-stack
                  Express server, SQLite relational database persistence, and Google Gemini AI reasoning models.
                </p>
                <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 space-y-2">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Core Capabilities:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Multi-step mathematical deduction engine with KaTeX LaTeX rendering.</li>
                    <li>High Thinking reasoning mode for complex proofs and derivations.</li>
                    <li>OCR curriculum scanning that analyzes textbook syllabi and administers a 10-question test.</li>
                    <li>Personalized 4-week student course roadmaps calibrated to scores out of 10.</li>
                    <li>School/Board, Textbook, and Grade-targeted mini-exam preparation.</li>
                    <li>Offline-first architecture with local cache and SQL database cloud syncing.</li>
                    <li>Export packages: Swift iOS Xcode project zip, Android APK Kotlin Gradle zip, CSV, and PDF.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeDocSection === 'calculator' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Formula Calculator Component</h3>
                <p>
                  <strong>File:</strong> <code>src/components/FormulaCalculator.tsx</code>
                </p>
                <p>
                  Accepts standard mathematical equations (e.g. quadratics, derivatives, integrals, trigonometric laws)
                  and passes them to <code>/api/solve</code>.
                </p>
                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 font-mono text-[11px]">
                  POST /api/solve &#123; formulaName, expression, variables, useHighThinking, userId &#125;
                </div>
                <p>
                  <strong>High Thinking Mode:</strong> When enabled, requests Gemini deep mathematical reasoning for
                  pedagogical step-by-step proofs, common pitfalls, and alternative notations.
                </p>
              </div>
            )}

            {activeDocSection === 'curriculum' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Curriculum OCR &amp; 10-Q Plan</h3>
                <p>
                  <strong>File:</strong> <code>src/components/CurriculumScanner.tsx</code>
                </p>
                <p>
                  Integrates hardware camera access via <code>navigator.mediaDevices.getUserMedia</code>, file upload, or
                  pre-configured syllabus templates.
                </p>
                <p>
                  <strong>Workflow:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Takes snapshot of curriculum or syllabus image.</li>
                  <li>Performs multimodal OCR via <code>gemini-3.8-flash</code> to extract topics and structure.</li>
                  <li>Generates an interactive 10-question diagnostic evaluation.</li>
                  <li>Computes student score out of 10 in real-time.</li>
                  <li>Synthesizes an adaptive 4-week course roadmap customized to the diagnostic score.</li>
                </ol>
              </div>
            )}

            {activeDocSection === 'exams' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Exam Preparation Suite</h3>
                <p>
                  <strong>File:</strong> <code>src/components/ExamPreparation.tsx</code>
                </p>
                <p>
                  Allows users to target their specific educational board (AP College Board, IB, Cambridge, CBSE), textbook
                  (Stewart Calculus, Larson, OpenStax), grade level, and chapter.
                </p>
                <p>
                  Generates 5 or 10 question mini-exams, provides real-time scoring, highlights misconceptions, and
                  passes weak areas directly to the AI Tutor for conversational remediation.
                </p>
              </div>
            )}

            {activeDocSection === 'database' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">SQLite Database Schema</h3>
                <p>
                  <strong>File:</strong> <code>server/db.ts</code>
                </p>
                <div className="rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-emerald-400 space-y-2">
                  <div>-- Users Table:</div>
                  <div>CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, ...);</div>
                  <div>-- Calculations History Table:</div>
                  <div>CREATE TABLE calculations (id TEXT PRIMARY KEY, user_id TEXT, title TEXT, ...);</div>
                  <div>-- Curriculums &amp; 10-Q Plans Table:</div>
                  <div>CREATE TABLE curriculums (id TEXT PRIMARY KEY, user_id TEXT, score_out_of_10 INTEGER, ...);</div>
                  <div>-- Mini-Exams Table:</div>
                  <div>CREATE TABLE exams (id TEXT PRIMARY KEY, user_id TEXT, score INTEGER, ...);</div>
                </div>
              </div>
            )}

            {activeDocSection === 'mobile' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Swift iOS &amp; APK Mobile Exports</h3>
                <p>
                  <strong>Files:</strong> <code>server/exportCode.ts</code>, <code>src/utils/exportFiles.ts</code>
                </p>
                <p>
                  Users can download standalone mobile project archives ready for compilation:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Swift Project (.zip):</strong> Complete Xcode project written in native SwiftUI, featuring
                    FormulaSolverView, step cards, and offline history models.
                  </li>
                  <li>
                    <strong>Android APK Source (.zip):</strong> Complete Android Studio Kotlin project with Jetpack
                    Compose, Gradle build files (<code>build.gradle.kts</code>), AndroidManifest.xml, and build instructions
                    to compile into an APK using <code>./gradlew assembleDebug</code>.
                  </li>
                </ul>
              </div>
            )}

            {activeDocSection === 'sync' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Offline Support &amp; Cloud Sync</h3>
                <p>
                  <strong>File:</strong> <code>src/utils/storage.ts</code>
                </p>
                <p>
                  When internet is unavailable, calculations and exam drafts are saved to <code>localStorage</code>.
                  Once connectivity resumes, the background sync engine pushes offline records to the SQLite database
                  via <code>/api/calculations/sync</code>.
                </p>
              </div>
            )}

            {activeDocSection === 'reports' && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Parent Reports &amp; Exports</h3>
                <p>
                  <strong>File:</strong> <code>src/components/ParentReportModal.tsx</code>
                </p>
                <p>
                  Generates an official academic progress report showing diagnostic performance, weekly completion rates,
                  tutor observations, and export options to printable PDF or CSV spreadsheets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
