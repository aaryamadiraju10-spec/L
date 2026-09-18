import React from 'react';
import { Lock, Sparkles, Brain, ArrowRight, Calculator, CheckCircle2, Shield } from 'lucide-react';

interface AiAuthGateProps {
  toolName: string;
  description: string;
  features: string[];
  onOpenAuth: () => void;
  onGoToCalculator: () => void;
}

export const AiAuthGate: React.FC<AiAuthGateProps> = ({
  toolName,
  description,
  features,
  onOpenAuth,
  onGoToCalculator,
}) => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
          <Lock className="h-8 w-8" />
        </div>

        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Account Required for AI Tools</span>
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Sign In to Unlock {toolName}
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>

        {/* Informative notice about calculator being free */}
        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <Calculator className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-950 dark:text-emerald-100">
                Formula Calculator is 100% Free Without Login
              </div>
              <p className="mt-0.5 text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                You can calculate the most complex equations (Cubic Cardano, 3x3 Cramer, 2nd-order ODEs, Relativistic Physics) with full step-by-step mathematical proofs anytime without signing in.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mx-auto mt-8 max-w-md space-y-2.5 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            What you unlock with an account:
          </div>
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="btn-gate-open-auth"
            onClick={onOpenAuth}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
          >
            <span>Sign In or Register (Free)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            id="btn-gate-go-calculator"
            onClick={onGoToCalculator}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
          >
            <Calculator className="h-4 w-4 text-zinc-500" />
            <span>Use Free Math Calculator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
