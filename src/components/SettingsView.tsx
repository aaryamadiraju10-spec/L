import React, { useState, useId } from 'react';
import {
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Sun,
  Moon,
  Database,
  Cpu,
  Eye,
  Copy,
  Check,
  Languages,
  Zap,
  Info,
} from 'lucide-react';
import { AppSettings, UserAccount } from '../types';
import { MathView } from '../utils/katexRender';
import {
  DEFAULT_SETTINGS,
  saveStoredSettings,
  resetStoredSettings,
  playAudioFeedback,
  exportAllUserDataJson,
  importUserDataJson,
} from '../utils/settingsStorage';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenParentReport: () => void;
  onOpenDocs: () => void;
  onClearHistory: () => void;
  historyCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  currentUser,
  onOpenAuth,
  onOpenParentReport,
  onOpenDocs,
  onClearHistory,
  historyCount,
}) => {
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [customLatexTest, setCustomLatexTest] = useState(
    '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}'
  );
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const testEquationSelectId = useId();
  const testEquationInputId = useId();
  const importTextareaId = useId();

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    playAudioFeedback('toggle');
    const updated = saveStoredSettings({ [key]: value });
    onUpdateSettings(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all application and KaTeX render settings to defaults?')) {
      playAudioFeedback('delete');
      const defaults = resetStoredSettings();
      onUpdateSettings(defaults);
      showNotification('Settings have been restored to default values.');
    }
  };

  const handleExportBackup = () => {
    playAudioFeedback('success');
    const jsonStr = exportAllUserDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MathFormulaStudio-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Backup exported successfully as JSON.');
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    const ok = importUserDataJson(importJsonText);
    if (ok) {
      playAudioFeedback('success');
      showNotification('Data and settings restored successfully! Reloading configuration...');
      setShowImportModal(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      playAudioFeedback('delete');
      alert('Invalid backup JSON. Please verify the file content.');
    }
  };

  const handleCopySampleLatex = () => {
    let textToCopy = customLatexTest;
    if (settings.copyFormat === 'latex-delimiters') {
      textToCopy = `$$${customLatexTest}$$`;
    } else if (settings.copyFormat === 'markdown') {
      textToCopy = `$${customLatexTest}$`;
    }
    navigator.clipboard.writeText(textToCopy);
    playAudioFeedback('click');
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  // Preset test formulas for KaTeX preview sandbox
  const PRESET_FORMULAS = [
    {
      label: 'Gaussian Integral',
      latex: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
    },
    {
      label: 'Cardano Depressed Cubic Root',
      latex: 'x = \\sqrt[3]{-\\frac{q}{2} + \\sqrt{\\frac{q^2}{4} + \\frac{p^3}{27}}} + \\sqrt[3]{-\\frac{q}{2} - \\sqrt{\\frac{q^2}{4} + \\frac{p^3}{27}}}',
    },
    {
      label: 'Relativistic Energy-Momentum',
      latex: 'E^2 = (pc)^2 + (m_0 c^2)^2 \\implies \\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}',
    },
    {
      label: '3x3 Matrix Determinant',
      latex: '\\det(A) = \\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Sliders className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Settings &amp; Render Engine
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Fine-tune mathematical KaTeX notation, calculation precision, speech recognition, sound feedback, and persistent cloud sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-reset-settings"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-500" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* SECTION 1: KaTeX & Math Render Settings */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Mathematical &amp; KaTeX Typography
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Control how formulas, fractions, matrices, and deductions are formatted and rendered.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              KaTeX v0.16.11
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Math Display Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Default Math Display Mode
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Block mode centers equations on their own line with larger fractions and summations.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="btn-setting-display-block"
                  onClick={() => handleSettingChange('mathDisplayMode', 'block')}
                  className={`rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.mathDisplayMode === 'block'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'
                  }`}
                >
                  Block / Centered ($$...$$)
                </button>
                <button
                  type="button"
                  id="btn-setting-display-inline"
                  onClick={() => handleSettingChange('mathDisplayMode', 'inline')}
                  className={`rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.mathDisplayMode === 'inline'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'
                  }`}
                >
                  Inline ($...$)
                </button>
              </div>
            </div>

            {/* Decimal Precision */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Numerical Calculation Precision
                </label>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {settings.decimalPrecision === -1 ? 'Exact / Rational' : `${settings.decimalPrecision} Decimals`}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Determines rounding precision for roots, matrix determinants, and approximations.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {[2, 4, 6, 8, -1].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('decimalPrecision', val)}
                    className={`flex-1 rounded-xl py-2 text-xs font-semibold border transition-all cursor-pointer ${
                      settings.decimalPrecision === val
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                    }`}
                  >
                    {val === -1 ? 'Exact' : `${val}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Angle Unit */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Trigonometric Angle Measurement
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Active unit for evaluating $\sin(\theta)$, $\cos(\theta)$, $\tan(\theta)$, and phase angles.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSettingChange('angleUnit', 'rad')}
                  className={`rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.angleUnit === 'rad'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'
                  }`}
                >
                  Radians ($\pi$ rad)
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('angleUnit', 'deg')}
                  className={`rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.angleUnit === 'deg'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300'
                  }`}
                >
                  Degrees ($180^\circ$)
                </button>
              </div>
            </div>

            {/* Notation Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Number Representation
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Formatting style applied to output solutions and constant coefficients.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['standard', 'scientific', 'engineering'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleSettingChange('notationStyle', style)}
                    className={`rounded-xl py-2 px-1 text-center text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      settings.notationStyle === style
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Step Verbosity */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Deduction Step Verbosity
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Depth of explanation in step-by-step mathematical derivations.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['detailed', 'standard', 'compact'] as const).map((verb) => (
                  <button
                    key={verb}
                    type="button"
                    onClick={() => handleSettingChange('stepVerbosity', verb)}
                    className={`rounded-xl py-2 px-1 text-center text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      settings.stepVerbosity === verb
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                    }`}
                  >
                    {verb}
                  </button>
                ))}
              </div>
            </div>

            {/* LaTeX Clipboard Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                LaTeX Copy-to-Clipboard Format
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Format when copying formulas into external editors (Overleaf, Notion, Obsidian).
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleSettingChange('copyFormat', 'latex')}
                  className={`rounded-xl py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                    settings.copyFormat === 'latex'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  Raw LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('copyFormat', 'latex-delimiters')}
                  className={`rounded-xl py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                    settings.copyFormat === 'latex-delimiters'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  $$...$$ (Block)
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('copyFormat', 'markdown')}
                  className={`rounded-xl py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                    settings.copyFormat === 'markdown'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  $...$ (Markdown)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live KaTeX Render Sandbox */}
          <div className="mt-8 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4.5 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Live KaTeX Render Sandbox
                </span>
                <span className="text-[10px] text-zinc-400">
                  (Changes in settings reflect here in real-time)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor={testEquationSelectId} className="sr-only">
                  Select test equation
                </label>
                <select
                  id={testEquationSelectId}
                  onChange={(e) => setCustomLatexTest(e.target.value)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {PRESET_FORMULAS.map((f, i) => (
                    <option key={i} value={f.latex}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  id="btn-copy-preview-latex"
                  onClick={handleCopySampleLatex}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy LaTeX</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Render Canvas */}
            <div className="rounded-xl border border-zinc-200/60 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900 min-h-[90px] flex items-center justify-center overflow-x-auto shadow-inner">
              <MathView
                math={customLatexTest}
                displayMode={settings.mathDisplayMode === 'block'}
                className="text-zinc-900 dark:text-zinc-50 text-base"
              />
            </div>

            {/* Custom Input */}
            <div className="mt-3">
              <label htmlFor={testEquationInputId} className="block text-[10px] font-medium text-zinc-400 mb-1">
                Edit or paste custom LaTeX string to preview:
              </label>
              <input
                id={testEquationInputId}
                type="text"
                value={customLatexTest}
                onChange={(e) => setCustomLatexTest(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-mono text-xs text-zinc-800 focus:border-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: App Preferences & Micro-interactions */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  App Experience &amp; Interactions
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Theme selection, synthesized audio click effects, speech dictation, and solver engine.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Theme &amp; Appearance
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Synchronized across all calculation views, syllabus scans, and flashcard decks.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  id="btn-theme-light"
                  onClick={() => handleSettingChange('theme', 'light')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.theme === 'light'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  id="btn-theme-dark"
                  onClick={() => handleSettingChange('theme', 'dark')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  id="btn-theme-system"
                  onClick={() => handleSettingChange('theme', 'system')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.theme === 'system'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>System</span>
                </button>
              </div>
            </div>

            {/* Audio Feedback */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Audio Micro-Interactions
                </label>
                <button
                  type="button"
                  onClick={() => playAudioFeedback('success')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3" />
                  <span>Test Chime</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Web Audio synthesized tones on calculation solves, button clicks, and tab switches.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSettingChange('soundEnabled', true)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    settings.soundEnabled
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Sound Enabled</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('soundEnabled', false)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                    !settings.soundEnabled
                      ? 'border-zinc-400 bg-zinc-200 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <VolumeX className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Muted</span>
                </button>
              </div>
            </div>

            {/* Voice Dictation Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-blue-600" />
                <span>Speech Recognition Language</span>
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Language model used by the microphone icon for spoken mathematical formulas.
              </p>
              <select
                value={settings.speechLanguage}
                onChange={(e) => handleSettingChange('speechLanguage', e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="de-DE">German (Deutsch)</option>
                <option value="zh-CN">Chinese Mandarin (中文)</option>
              </select>
            </div>

            {/* Solver Architecture Preference */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                <span>Math Computation Engine</span>
              </label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Determines precedence between server Gemini AI reasoning and client-side offline engines.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSettingChange('solverMode', 'hybrid')}
                  className={`rounded-xl p-2.5 text-left text-xs font-semibold border transition-all cursor-pointer ${
                    settings.solverMode === 'hybrid'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <div>Hybrid (Cloud + Local)</div>
                  <div className="text-[10px] font-normal text-zinc-400 mt-0.5">
                    Fastest with Gemini &amp; offline fallback
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange('solverMode', 'offline-only')}
                  className={`rounded-xl p-2.5 text-left text-xs font-semibold border transition-all cursor-pointer ${
                    settings.solverMode === 'offline-only'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                >
                  <div>Offline-Only Mode</div>
                  <div className="text-[10px] font-normal text-zinc-400 mt-0.5">
                    Zero network requests; purely local
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Data Management, Backups & Cloud Sync */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Data Persistence &amp; Backup Sync
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Manage local calculations cache, database synchronization, and complete JSON backups.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SQLite &amp; Firestore Connected</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat: Saved Calculations */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="text-xs text-zinc-400">Cached Calculations</div>
              <div className="mt-1 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {historyCount}
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">Stored in offline browser storage &amp; SQLite</p>
            </div>

            {/* Stat: Cloud Sync Status */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="text-xs text-zinc-400">Cloud Sync Status</div>
              <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Active &amp; Verified</span>
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                Firestore DB: ai-studio-mathformulastudi...
              </p>
            </div>

            {/* Stat: Account Tier */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="text-xs text-zinc-400">Active Account</div>
              <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser ? currentUser.email || currentUser.username : 'Guest / Offline'}
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {currentUser ? 'Manage Account Profile' : 'Sign In / Register →'}
              </button>
            </div>
          </div>

          {/* Backup & Import Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              id="btn-export-backup-json"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Full JSON Backup</span>
            </button>

            <button
              type="button"
              id="btn-import-backup-json"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Import JSON Backup</span>
            </button>

            <button
              type="button"
              id="btn-open-parent-dossier"
              onClick={onOpenParentReport}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <Info className="h-4 w-4 text-amber-500" />
              <span>Open Parent Diagnostic Report</span>
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 rounded-xl border border-red-200/60 bg-red-50/40 p-4 dark:border-red-950/60 dark:bg-red-950/20">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Danger Zone: Local Cache Management</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="max-w-md text-[11px]">
                Purge all locally stored calculation logs and solution histories. This does not affect cloud backup files.
              </p>
              <button
                type="button"
                id="btn-clear-history-settings"
                onClick={() => {
                  if (window.confirm('Clear all saved calculation histories from offline storage?')) {
                    onClearHistory();
                    playAudioFeedback('delete');
                    showNotification('Calculation history cleared.');
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-xs cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear History Cache</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Import JSON Backup
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Paste your exported MathFormula Studio backup JSON string below to restore calculations, flashcard schedules, and preferences:
            </p>

            <div>
              <label htmlFor={importTextareaId} className="sr-only">
                JSON Backup string
              </label>
              <textarea
                id={importTextareaId}
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"version":"1.0","settings":{...},"calculations":[...]}'
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 focus:border-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportBackup}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
