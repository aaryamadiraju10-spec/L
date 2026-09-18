import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Calculator,
  Camera,
  GraduationCap,
  Layers,
  Database,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Mic,
  Printer,
  FileDown,
  Brain,
  Zap,
  MessageSquare,
  ArrowRight,
  Flame,
  Award,
} from 'lucide-react';
import { MathView } from '../utils/katexRender';

interface HelpSectionProps {
  onNavigateTab: (tab: any) => void;
  onOpenChat: (prompt?: string) => void;
  onOpenDocs: () => void;
}

interface FaqItem {
  question: string;
  category: string;
  answer: string;
  latex?: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: 'Do I need an account or sign in to use the Math Formula Calculator?',
    category: 'General & Access',
    answer:
      'No! The Formula Calculator is 100% free and does not require an account or login. You can calculate complex equations (Cardano Cubic equations, 3x3 Cramer systems, 2nd-order ODEs, Relativistic Physics) with complete step-by-step mathematical proofs immediately. Accounts are only needed for AI-cloud features like Curriculum OCR, Mini-Exam Generation, and the AI Tutor.',
  },
  {
    question: 'How does High Thinking Mode work in the deduction engine?',
    category: 'Calculator',
    answer:
      'High Thinking Mode activates Gemini deep mathematical reasoning. Instead of just giving the numeric result, the engine constructs a full pedagogical proof, explains intermediate substitutions, highlights common pitfalls (e.g., extraneous roots, division by zero), and presents alternative notations.',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  },
  {
    question: 'Can I use MathFormula Studio offline without an internet connection?',
    category: 'Offline & Sync',
    answer:
      'Yes! MathFormula Studio features an offline-first architecture. Formula derivations have a built-in client-side mathematics solver (for quadratics, derivatives, integrals, trigonometric laws, kinematics, and linear algebra), and flashcard progress is stored in local storage. Once you reconnect, calculations can be synchronized to the SQLite backend database.',
  },
  {
    question: 'How does the Curriculum OCR & 10-Question Diagnostic Plan work?',
    category: 'Curriculum & OCR',
    answer:
      'You take a photo of your textbook syllabus or curriculum table of contents (or load our pre-configured sample). Gemini OCR extracts the topics and key units, formulates a 10-question diagnostic evaluation test, and calculates your score out of 10. Based on your score, it generates an adaptive 4-week student roadmap with targeted weekly drills.',
  },
  {
    question: 'How do I export my calculations and study plans to PDF or CSV?',
    category: 'Export & Printing',
    answer:
      'Every major section includes "Preview", "PDF", and "CSV" buttons. Clicking "Preview" opens our authentic Paper Simulation modal where you can inspect formatting and raw table grids before writing to disk. PDF exports trigger standard browser print dialogs formatted specifically for 8.5x11 paper.',
  },
  {
    question: 'How do I compile the exported Swift iOS and Android APK source code?',
    category: 'Mobile Projects',
    answer:
      'From the navbar, click "Swift iOS (.zip)" or "Android APK (.zip)". The downloaded zip contains a standalone, production-ready mobile project. For iOS, open the folder in Xcode and press Run (Cmd+R). For Android, open in Android Studio or run ./gradlew assembleDebug in terminal to generate an APK.',
  },
  {
    question: 'How does voice math recognition work?',
    category: 'Voice Input',
    answer:
      'Click the microphone button next to the formula input or inside the AI Tutor chat. Speak your equation aloud (e.g., "x squared minus 5x plus 6 equals 0"). The web speech engine will convert your speech into mathematical LaTeX expressions automatically.',
  },
  {
    question: 'How does the Leitner Spaced Repetition flashcard system work?',
    category: 'Flashcards',
    answer:
      'Flashcards are categorized into progressive mastery levels (Level 0 through Level 5). When you rate a card "Easy", its review interval doubles. If you rate it "Again", it returns to Level 0 for same-day reinforcement. This optimizes memory retention with minimal study time.',
  },
];

const LATEX_CHEATSHEET = [
  { name: 'Fractions', latex: '\\frac{a}{b}', code: '\\frac{a}{b}' },
  { name: 'Square Root', latex: '\\sqrt{x}', code: '\\sqrt{x}' },
  { name: 'N-th Root', latex: '\\sqrt[n]{x}', code: '\\sqrt[n]{x}' },
  { name: 'Powers & Subscripts', latex: 'x_1^2 + y_2^3', code: 'x_1^2 + y_2^3' },
  { name: 'Definite Integral', latex: '\\int_{a}^{b} f(x)\\,dx', code: '\\int_{a}^{b} f(x)\\,dx' },
  { name: 'Derivative', latex: '\\frac{df}{dx}', code: '\\frac{df}{dx}' },
  { name: 'Summation', latex: '\\sum_{i=1}^{n} i^2', code: '\\sum_{i=1}^{n} i^2' },
  { name: 'Limit', latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1', code: '\\lim_{x \\to 0} \\frac{\\sin x}{x}' },
  { name: 'Greek Letters', latex: '\\alpha, \\beta, \\theta, \\lambda, \\pi', code: '\\alpha, \\beta, \\theta, \\lambda, \\pi' },
  { name: 'Matrices', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
];

export const HelpSection: React.FC<HelpSectionProps> = ({
  onNavigateTab,
  onOpenChat,
  onOpenDocs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(FAQ_LIST.map((f) => f.category)))];

  const filteredFaqs = FAQ_LIST.filter((f) => {
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    const matchesSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <HelpCircle className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Help Center &amp; User Manual
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Everything you need to master MathFormula Studio: tutorials, feature guides, FAQs, and LaTeX reference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChat('Hello! Can you guide me through how to use MathFormula Studio?')}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ask AI Tutor</span>
          </button>
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            <span>Technical Docs</span>
          </button>
        </div>
      </div>

      {/* Quick Feature Navigation Cards */}
      <div className="my-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Feature Guides &amp; Direct Shortcuts
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Calculator */}
          <div
            onClick={() => onNavigateTab('calculator')}
            className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors dark:bg-blue-950/60 dark:text-blue-400">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Formula Calculator</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Step-by-step proofs, KaTeX preview, voice input, and offline mathematics solving.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>100% Free • No login required</span>
            </span>
          </div>

          {/* Card 2: Curriculum OCR */}
          <div
            onClick={() => onNavigateTab('curriculum')}
            className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors dark:bg-indigo-950/60 dark:text-indigo-400">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Curriculum OCR &amp; Plan</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-600 transition-colors" />
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Camera scanner extracts syllabus topics, runs 10-Q diagnostic, and creates 4-week roadmap.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3 w-3" />
              <span>Adaptive Scoring out of 10</span>
            </span>
          </div>

          {/* Card 3: Exam Prep */}
          <div
            onClick={() => onNavigateTab('exams')}
            className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors dark:bg-emerald-950/60 dark:text-emerald-400">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Targeted Exam Prep</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Configure AP, IB, Cambridge, or high school boards with your exact textbook &amp; chapter.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Award className="h-3 w-3" />
              <span>Instant AI Grading &amp; Review</span>
            </span>
          </div>

          {/* Card 4: Spaced Repetition */}
          <div
            onClick={() => onNavigateTab('flashcards')}
            className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-all hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors dark:bg-amber-950/60 dark:text-amber-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Formula Flashcards</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-600 transition-colors" />
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Active recall Leitner flashcards with LaTeX formulas, derivations, and spaced reviews.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <Flame className="h-3 w-3" />
              <span>XP &amp; Streak Multipliers</span>
            </span>
          </div>
        </div>
      </div>

      {/* LaTeX & Math Notation Cheat Sheet */}
      <div className="my-8 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Interactive LaTeX &amp; Mathematical Syntax Cheat Sheet
            </h2>
          </div>
          <span className="text-xs text-zinc-400">Click any code to copy</span>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {LATEX_CHEATSHEET.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCopyCode(item.code)}
              className="rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-3 hover:border-blue-300 hover:bg-blue-50/30 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-blue-800 transition-all cursor-pointer flex flex-col justify-between"
              title="Click to copy LaTeX code"
            >
              <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                {item.name}
              </div>
              <div className="my-2 text-center overflow-x-auto">
                <MathView math={item.latex} displayMode={false} />
              </div>
              <div className="mt-2 flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                <span className="truncate max-w-[120px]">{item.code}</span>
                <span className="text-blue-600 font-sans font-semibold">
                  {copiedCode === item.code ? 'Copied!' : 'Copy'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) with Search & Filtering */}
      <div className="my-8 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>Frequently Asked Questions &amp; Answers</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Clear solutions to common inquiries about formulas, offline sync, exams, and accounts.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No matching help topics found. Try a different search term or ask the AI Tutor directly.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/40 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {faq.question}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-200/40 dark:border-zinc-800/60">
                      <p>{faq.answer}</p>
                      {faq.latex && (
                        <div className="my-2 rounded-lg bg-white p-3 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-center overflow-x-auto">
                          <MathView math={faq.latex} displayMode={true} />
                        </div>
                      )}
                      <div className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        Category: {faq.category}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Still Need Help Banner */}
      <div className="my-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-6 text-zinc-900 dark:border-blue-900/50 dark:from-zinc-900 dark:to-blue-950/20 dark:text-zinc-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold">Have a complex mathematical problem or proof?</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Our AI Math Tutor can break down any theorem, clarify textbook misunderstandings, or create custom practice problems in real time.
            </p>
          </div>
          <button
            onClick={() => onOpenChat()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Launch AI Tutor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
