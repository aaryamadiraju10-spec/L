import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Sparkles,
  Layers,
  ChevronRight,
  BookOpen,
  Brain,
  History,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  FileDown,
  RefreshCw,
  Eye,
  Mic,
  MicOff,
  Zap,
} from 'lucide-react';
import { CalculationResult, FormulaPreset, ExportPreviewPayload } from '../types';
import { MathView } from '../utils/katexRender';
import { solveFormulaLocally, DETAILED_PRESETS } from '../utils/localMathSolver';
import { exportCalculationToPDF, exportCalculationsToCSV } from '../utils/exportFiles';
import { ExportPreviewModal } from './ExportPreviewModal';
import { useSpeechRecognition } from '../utils/speechRecognition';
import { recordCalculationSolved, recordVoiceQueryUsed } from '../utils/gamification';

interface FormulaCalculatorProps {
  userId?: string;
  onSaveToHistory?: (calc: CalculationResult) => void;
  initialFormula?: { name: string; expression: string };
}

export const FormulaCalculator: React.FC<FormulaCalculatorProps> = ({
  userId,
  onSaveToHistory,
  initialFormula,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<any>(DETAILED_PRESETS[0]);
  const [expression, setExpression] = useState(DETAILED_PRESETS[0].latexTemplate);
  const [formulaName, setFormulaName] = useState(DETAILED_PRESETS[0].name);
  const [variableInputs, setVariableInputs] = useState<Record<string, number>>({
    a: 1,
    b: -5,
    c: 6,
  });
  const [useHighThinking, setUseHighThinking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Active solution result
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Export preview modal state
  const [previewPayload, setPreviewPayload] = useState<ExportPreviewPayload | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Speech Recognition hook for voice-to-math input
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Sync speech transcript into formula expression
  useEffect(() => {
    if (transcript) {
      setExpression(transcript);
    }
  }, [transcript]);

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        recordVoiceQueryUsed();
      }
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Sync initial formula if passed from flashcards or props
  useEffect(() => {
    if (initialFormula) {
      setFormulaName(initialFormula.name);
      setExpression(initialFormula.expression);
      // Find matching preset if exists
      const found = DETAILED_PRESETS.find((p: any) => p.name.toLowerCase() === initialFormula.name.toLowerCase());
      if (found) {
        setSelectedPreset(found);
      }
    }
  }, [initialFormula]);

  const handleSelectPreset = (preset: any) => {
    setSelectedPreset(preset);
    setFormulaName(preset.name);
    setExpression(preset.latexTemplate);
    setVariableInputs(preset.sampleVariables);
    setResult(null);
    setError(null);
  };

  const handleVariableChange = (varKey: string, val: string) => {
    const num = parseFloat(val);
    setVariableInputs((prev) => ({
      ...prev,
      [varKey]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSolve = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. First attempt Gemini AI solution
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulaName,
          expression,
          variables: variableInputs,
          useHighThinking,
          userId: userId || 'guest',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.result) {
        setResult(data.result);
        setActiveStepTab(1);
        recordCalculationSolved();
        if (onSaveToHistory) {
          onSaveToHistory(data.result);
        }
      } else {
        // Fallback: Use local math solver if server is offline or error occurs
        console.warn('Backend solve returned error or offline. Using local solver fallback.');
        const fallbackResult = solveFormulaLocally(formulaName, variableInputs);
        setResult(fallbackResult);
        setActiveStepTab(1);
        recordCalculationSolved();
        if (onSaveToHistory) {
          onSaveToHistory(fallbackResult);
        }
      }
    } catch (err: any) {
      console.warn('Network error during /api/solve. Using local fallback.', err);
      // Local fallback
      const fallbackResult = solveFormulaLocally(formulaName, variableInputs);
      setResult(fallbackResult);
      setActiveStepTab(1);
      recordCalculationSolved();
      if (onSaveToHistory) {
        onSaveToHistory(fallbackResult);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleOpenCalculationPreview = (calc: CalculationResult) => {
    setPreviewPayload({
      type: 'calculation',
      title: `${calc.title} Proof Breakdown`,
      calculation: calc,
      filenameBase: `${calc.title.toLowerCase().replace(/\W+/g, '_')}_solution`,
    });
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Page Title Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Formula Solver &amp; Mathematical Deduction Engine
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Step-by-step rigorous derivations with KaTeX rendering and deep reasoning.
          </p>
        </div>

        {/* High Thinking Toggle */}
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            id="toggle-high-thinking"
            type="button"
            onClick={() => setUseHighThinking(!useHighThinking)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              useHighThinking
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>High Thinking Mode</span>
            <span
              className={`ml-1 rounded-full px-1.5 py-0.2 text-[9px] uppercase tracking-wider ${
                useHighThinking ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
              }`}
            >
              {useHighThinking ? 'Active' : 'Off'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Preset Palette & Variable Inputs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Formulas Picker */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <span>Formula Presets Library</span>
              </h2>
              <span className="text-[11px] text-zinc-400">
                {DETAILED_PRESETS.length} Curated Equations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {DETAILED_PRESETS.map((preset: any) => {
                const isSelected = selectedPreset.name === preset.name;
                return (
                  <button
                    key={preset.name}
                    id={`btn-preset-${preset.name.toLowerCase().replace(/\W+/g, '-')}`}
                    onClick={() => handleSelectPreset(preset)}
                    className={`flex flex-col text-left rounded-xl p-2.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:border-blue-600 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium'
                        : 'border-zinc-100 bg-zinc-50/70 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-tight">{preset.name}</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">{preset.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mathematical Expression & Variables Form */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Formula Name &amp; Expression
                </label>
                {isSpeechSupported && (
                  <button
                    type="button"
                    id="btn-voice-input"
                    onClick={toggleVoiceInput}
                    className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                      isListening
                        ? 'bg-rose-100 text-rose-700 animate-pulse dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                    title="Speak math equation hands-free"
                  >
                    {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                  </button>
                )}
              </div>
              <input
                id="input-formula-name"
                type="text"
                value={formulaName}
                onChange={(e) => setFormulaName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Formula Name (e.g. Quadratic Formula)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mathematical Expression / LaTeX
              </label>
              <textarea
                id="input-formula-expression"
                rows={2}
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 resize-none"
                placeholder="e.g. ax^2 + bx + c = 0"
              />
            </div>

            {/* Real-time KaTeX Live Preview */}
            <div>
              <span className="block text-[11px] font-medium text-zinc-400 mb-1">Live LaTeX Render</span>
              <div className="rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/50 text-center overflow-x-auto min-h-[52px] flex items-center justify-center">
                <MathView math={expression || '...'} displayMode={true} />
              </div>
            </div>

            {/* Variable Inputs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Input Coefficients &amp; Variables
                </label>
                <span className="text-[11px] text-zinc-400">Values used in computation</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(variableInputs).map((vKey) => (
                  <div key={vKey} className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase font-mono">
                      {vKey}
                    </label>
                    <input
                      id={`input-var-${vKey}`}
                      type="number"
                      step="any"
                      value={variableInputs[vKey]}
                      onChange={(e) => handleVariableChange(vKey, e.target.value)}
                      className="w-full bg-transparent font-mono text-xs font-semibold text-zinc-900 outline-none dark:text-zinc-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Solve Action Button */}
            <button
              id="btn-solve-formula"
              onClick={handleSolve}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  <span>Computing Derivation with Gemini...</span>
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4" />
                  <span>Calculate &amp; Derive Step-by-Step</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Step-by-Step Proof Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Solution Summary Card */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <div>
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {result.category}
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{result.title}</h2>
                  </div>

                  {/* Actions: Export PDF, CSV & Preview */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-preview-calculation-export"
                      onClick={() => handleOpenCalculationPreview(result)}
                      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
                      title="Inspect PDF & CSV formatting before export"
                    >
                      <Eye className="h-3.5 w-3.5 text-blue-600" />
                      <span>Preview</span>
                    </button>
                    <button
                      id="btn-export-calc-pdf"
                      onClick={() => exportCalculationToPDF(result)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      title="Save Calculation as Printable PDF"
                    >
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      id="btn-export-calc-csv"
                      onClick={() => exportCalculationsToCSV([result])}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                      title="Export to CSV Spreadsheet"
                    >
                      <FileDown className="h-3.5 w-3.5 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>

                {/* Final Solved Result Highlight */}
                <div className="mt-4 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50/50 p-4 dark:from-zinc-950 dark:to-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      Solved Result
                    </div>
                    <div className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-50 font-mono">
                      {result.result}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.result)}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    {copiedResult ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Breakdown Cards */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Rigorous Step-by-Step Deduction ({result.steps.length} Steps)</span>
                  </h3>
                </div>

                {/* Step tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {result.steps.map((step: any) => (
                    <button
                      key={step.stepNumber}
                      onClick={() => setActiveStepTab(step.stepNumber)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        activeStepTab === step.stepNumber
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      Step {step.stepNumber}
                    </button>
                  ))}
                </div>

                {/* Active Step Details */}
                {result.steps
                  .filter((s: any) => s.stepNumber === activeStepTab)
                  .map((step: any) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 space-y-3 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {step.stepNumber}. {step.title}
                        </h4>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Stage {step.stepNumber} of {result.steps.length}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {step.explanation}
                      </p>

                      {/* Math Expression Rendering */}
                      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900 text-center overflow-x-auto">
                        <MathView math={step.mathExpression} displayMode={true} />
                      </div>

                      {step.tip && (
                        <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 flex items-start gap-2 border border-amber-200/60 dark:border-amber-900/50">
                          <span className="font-bold">💡 Pedagogical Tip:</span>
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}

                {/* Step navigation controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={activeStepTab <= 1}
                    onClick={() => setActiveStepTab(activeStepTab - 1)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 cursor-pointer"
                  >
                    Previous Step
                  </button>
                  <span className="text-xs text-zinc-400">
                    Step {activeStepTab} of {result.steps.length}
                  </span>
                  <button
                    disabled={activeStepTab >= result.steps.length}
                    onClick={() => setActiveStepTab(activeStepTab + 1)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-800 dark:text-zinc-400 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Calculator className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Awaiting Formula Derivation
              </h3>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                Select a preset formula on the left or customize equations with your own variables, then click
                &ldquo;Calculate &amp; Derive Step-by-Step&rdquo; to see the proof.
              </p>
            </div>
          )}
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
