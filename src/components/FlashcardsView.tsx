import React, { useState, useEffect } from 'react';
import {
  Layers,
  RotateCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Sparkles,
  Trophy,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { MathFlashcard } from '../types';
import {
  DEFAULT_FLASHCARDS,
  getStoredFlashcards,
  updateFlashcardReview,
  resetFlashcardDeck,
} from '../utils/flashcardsData';
import { MathView } from '../utils/katexRender';
import { recordFlashcardReviewed } from '../utils/gamification';

interface FlashcardsViewProps {
  onOpenCalculatorWithFormula?: (formulaName: string, expr: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  onOpenCalculatorWithFormula,
}) => {
  const [cards, setCards] = useState<MathFlashcard[]>(getStoredFlashcards());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCards(getStoredFlashcards());
  }, []);

  const categories = ['All', ...Array.from(new Set(DEFAULT_FLASHCARDS.map((c) => c.category)))];

  const filteredCards =
    selectedCategory === 'All'
      ? cards
      : cards.filter((c) => c.category === selectedCategory);

  const currentCard: MathFlashcard | undefined = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
  };

  const handleRate = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    const updated = updateFlashcardReview(currentCard.id, quality);
    setCards(updated);
    recordFlashcardReviewed();
    handleNext();
  };

  const handleReset = () => {
    if (confirm('Reset flashcards progress and spaced-repetition intervals?')) {
      const fresh = resetFlashcardDeck();
      setCards(fresh);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  // Calculate mastery statistics
  const getRepLevel = (c: any) => c.repetitionLevel ?? c.repetitions ?? 0;
  const masteredCount = cards.filter((c) => getRepLevel(c) >= 4).length;
  const learningCount = cards.filter((c) => getRepLevel(c) > 0 && getRepLevel(c) < 4).length;
  const newCount = cards.filter((c) => getRepLevel(c) === 0).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Formula Flashcards &amp; Spaced Repetition
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Retain mathematical theorems, derivatives, integrals, and physics laws through progressive active recall.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-reset-flashcards"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            title="Reset spaced repetition stats"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Deck</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 my-5">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Mastered (L4+)</div>
          <div className="text-xl font-black text-emerald-900 dark:text-emerald-100">{masteredCount}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Learning (L1-3)</div>
          <div className="text-xl font-black text-amber-900 dark:text-amber-100">{learningCount}</div>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase">New (Unreviewed)</div>
          <div className="text-xl font-black text-blue-900 dark:text-blue-100">{newCount}</div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Flashcard Main Stage */}
      {currentCard ? (
        <div className="my-6">
          {/* Card progress counter */}
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-2 px-1">
            <span>
              Card {currentIndex + 1} of {filteredCards.length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Mastery Box: Level {getRepLevel(currentCard)}
            </span>
          </div>

          {/* 3D Flipping Card Container */}
          <div
            id="flashcard-card-stage"
            onClick={handleFlip}
            className="group relative min-h-[320px] w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer flex flex-col justify-between transition-all hover:border-amber-400/70 select-none"
          >
            {/* Front & Back indicator banner */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {currentCard.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
                <RotateCw className="h-3 w-3" />
                {isFlipped ? 'Back (Answer & Derivation)' : 'Front (Question) - Click to Flip'}
              </span>
            </div>

            {/* Content Display */}
            <div className="my-auto py-4 text-center">
              {!isFlipped ? (
                /* FRONT VIEW: Prompt / Formula Title / Hint */
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                    Recall Expression
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {currentCard.title}
                  </h3>
                  <div className="rounded-xl bg-zinc-50 p-4 font-mono text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-800 max-w-lg mx-auto">
                    <MathView
                      math={currentCard.latexFront || currentCard.mathExpression || currentCard.frontPrompt}
                      displayMode={true}
                    />
                  </div>
                  {(currentCard.hint || currentCard.tip) && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 italic">
                      💡 Hint: {currentCard.hint || currentCard.tip}
                    </div>
                  )}
                </div>
              ) : (
                /* BACK VIEW: Full Solution, Derivation & Tips */
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                    Verified Formula &amp; Expansion
                  </div>
                  <div className="rounded-xl bg-emerald-50/50 p-4 font-mono text-sm text-zinc-900 dark:bg-emerald-950/20 dark:text-zinc-100 border border-emerald-200 dark:border-emerald-900/50 max-w-xl mx-auto">
                    <MathView
                      math={currentCard.latexBack || currentCard.mathExpression || currentCard.backAnswer}
                      displayMode={true}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-lg mx-auto leading-relaxed whitespace-pre-line">
                    {currentCard.explanation || currentCard.backAnswer}
                  </p>
                  {(currentCard.derivation || currentCard.mathExpression) && (
                    <div className="rounded-lg bg-zinc-100 p-2.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono max-w-lg mx-auto">
                      Proof: {currentCard.derivation || currentCard.mathExpression}
                    </div>
                  )}
                  {onOpenCalculatorWithFormula && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCalculatorWithFormula(
                          currentCard.title,
                          currentCard.latexBack || currentCard.mathExpression || ''
                        );
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      <span>Open in Calculator</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Reminder */}
            <div className="text-center text-[10px] text-zinc-400 border-t border-zinc-100 pt-2 dark:border-zinc-800">
              Press Space or Click anywhere on the card to flip
            </div>
          </div>

          {/* Leitner Spaced-Repetition Rating Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Prev / Next controls */}
            <div className="flex items-center gap-2">
              <button
                id="btn-flashcard-prev"
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                id="btn-flashcard-next"
                onClick={handleNext}
                className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Recall feedback buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-rate-again"
                onClick={() => handleRate('again')}
                className="flex-1 sm:flex-none rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 cursor-pointer"
                title="Review again in 1 day"
              >
                Again (L0)
              </button>
              <button
                id="btn-rate-hard"
                onClick={() => handleRate('hard')}
                className="flex-1 sm:flex-none rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 cursor-pointer"
                title="Review in 2 days"
              >
                Hard (L1)
              </button>
              <button
                id="btn-rate-good"
                onClick={() => handleRate('good')}
                className="flex-1 sm:flex-none rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 cursor-pointer"
                title="Review in 4 days"
              >
                Good (L+1)
              </button>
              <button
                id="btn-rate-easy"
                onClick={() => handleRate('easy')}
                className="flex-1 sm:flex-none rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
                title="Review in 7+ days"
              >
                Easy (L+2)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 my-6">
          No flashcards found in category &ldquo;{selectedCategory}&rdquo;.
        </div>
      )}
    </div>
  );
};
