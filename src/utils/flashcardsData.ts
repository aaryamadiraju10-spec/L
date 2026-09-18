import { FlashcardItem, CalculationRecord, CurriculumPlan, SrsRating } from '../types';
import { offlineStorage } from './storage';

const FLASHCARDS_STORAGE_KEY = 'mathformula_srs_flashcards_v1';

export const DEFAULT_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'card_cardano',
    title: "Cardano's Depressed Cubic Formula",
    frontPrompt: "How do you eliminate the quadratic term bx² in a general cubic ax³ + bx² + cx + d = 0 to obtain a depressed cubic?",
    backAnswer: "Substitute x = t - b/(3a). This transforms the cubic equation into the depressed form t³ + pt + q = 0, where p = (3ac - b²)/(3a²) and q = (2b³ - 9abc + 27a²d)/(27a³).",
    mathExpression: "x = t - \\frac{b}{3a} \\implies t^3 + pt + q = 0",
    category: 'Algebra',
    source: 'default',
    keyConcepts: ["Cardano's Method", 'Tschirnhaus Transformation', 'Depressed Cubic'],
    tip: 'Once in depressed form, use t = u + v with 3uv + p = 0.',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
  {
    id: 'card_cramer',
    title: "Cramer's Rule for 3x3 Linear Systems",
    frontPrompt: "What is Cramer's Rule for solving a 3x3 system Ax = b, and when does it apply?",
    backAnswer: "For a linear system with det(A) ≠ 0, the unique solution for variable x_i is given by x_i = det(A_i) / det(A), where A_i is matrix A with its i-th column replaced by column vector b.",
    mathExpression: "x_i = \\frac{\\det(A_i)}{\\det(A)}, \\quad \\det(A) \\neq 0",
    category: 'Linear Algebra',
    source: 'default',
    keyConcepts: ["Cramer's Rule", 'Determinants', 'Matrix Inversion'],
    tip: 'If det(A) = 0, the system is either inconsistent or has infinitely many solutions.',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
  {
    id: 'card_ode_2nd',
    title: 'Second-Order Linear Homogeneous ODE',
    frontPrompt: 'What is the characteristic equation for ay" + by\' + cy = 0 with constant coefficients, and what are the solution forms when roots are complex (α ± iβ)?',
    backAnswer: "The characteristic equation is ar² + br + c = 0. When discriminant b² - 4ac < 0 with roots r = α ± iβ, the general solution is y(x) = e^(αx) [C₁ cos(βx) + C₂ sin(βx)].",
    mathExpression: "y(x) = e^{\\alpha x} \\left( C_1 \\cos(\\beta x) + C_2 \\sin(\\beta x) \\right)",
    category: 'Differential Equations',
    source: 'default',
    keyConcepts: ['Characteristic Equation', 'Complex Conjugate Roots', 'Euler Formula'],
    tip: 'α = -b/(2a) represents damping decay, while β = sqrt(4ac - b²)/(2a) is the angular frequency.',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
  {
    id: 'card_lorentz',
    title: 'Relativistic Momentum & Lorentz Factor',
    frontPrompt: 'State the relativistic momentum equation for a particle with rest mass m₀ traveling at speed v near speed of light c.',
    backAnswer: "p = γ m₀ v, where γ (Lorentz factor) is 1 / sqrt(1 - v²/c²). As v approaches c, γ diverges to infinity, requiring infinite force to accelerate further.",
    mathExpression: "p = \\frac{m_0 v}{\\sqrt{1 - \\frac{v^2}{c^2}}} = \\gamma m_0 v",
    category: 'Physics',
    source: 'default',
    keyConcepts: ['Special Relativity', 'Lorentz Factor', 'Rest Mass'],
    tip: 'When v << c, γ ≈ 1 + 0.5(v/c)², reducing to classical Newtonian momentum p = m₀v.',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
  {
    id: 'card_euler_identity',
    title: "Euler's Formula & Identity",
    frontPrompt: "What is Euler's Formula for any real number θ, and what iconic equation results when θ = π?",
    backAnswer: "Euler's Formula states e^(iθ) = cos(θ) + i sin(θ). Setting θ = π yields e^(iπ) = -1, which rearranges to Euler's Identity: e^(iπ) + 1 = 0, connecting e, i, π, 1, and 0.",
    mathExpression: "e^{i\\pi} + 1 = 0",
    category: 'Complex Analysis',
    source: 'default',
    keyConcepts: ["Euler's Identity", 'Complex Exponentials', 'Trigonometric Representation'],
    tip: 'Derivable from the Taylor series expansions of e^x, cos(x), and sin(x).',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
  {
    id: 'card_integration_parts',
    title: 'Integration by Parts',
    frontPrompt: 'State the Integration by Parts formula and the LIATE rule for choosing u.',
    backAnswer: "∫ u dv = u v - ∫ v du. The LIATE heuristic suggests selecting u in order of priority: Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential.",
    mathExpression: "\\int u \\, dv = u v - \\int v \\, du",
    category: 'Calculus',
    source: 'default',
    keyConcepts: ['Integration by Parts', 'Product Rule', 'LIATE Heuristic'],
    tip: 'Differentiating u simplifies it; integrating dv should be straightforward.',
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    masteryState: 'new',
  },
];

export function getStoredFlashcards(): FlashcardItem[] {
  try {
    const raw = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    let cards: FlashcardItem[] = raw ? JSON.parse(raw) : [];
    if (cards.length === 0) {
      cards = [...DEFAULT_FLASHCARDS];
    }

    // Pull from saved calculations to create cards if not already present
    const calcs = offlineStorage.getCalculations();
    const existingIds = new Set(cards.map((c) => c.id));
    calcs.forEach((c) => {
      const cardId = `calc_card_${c.id}`;
      if (!existingIds.has(cardId)) {
        cards.push({
          id: cardId,
          title: c.title,
          frontPrompt: `Solve & state the derivation steps for: ${c.title} (${c.expression})`,
          backAnswer: `Solved result: ${c.result}.\nKey Method: ${c.steps[0]?.explanation || 'Step-by-step mathematical decomposition'}.\nFinal Step: ${c.steps[c.steps.length - 1]?.mathExpression || ''}`,
          mathExpression: c.expression,
          category: c.category || 'Algebra',
          source: 'history',
          keyConcepts: c.keyConcepts || [c.title],
          tip: c.steps.find((s) => s.tip)?.tip || `Result: ${c.result}`,
          intervalDays: 1,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewDate: new Date().toISOString(),
          masteryState: 'new',
        });
        existingIds.add(cardId);
      }
    });

    // Pull from saved curriculum plan if exists in localStorage
    try {
      const rawPlan = localStorage.getItem('mathformula_active_curriculum_plan');
      if (rawPlan) {
        const plan: CurriculumPlan = JSON.parse(rawPlan);
        (plan.keyUnits || []).forEach((unit, idx) => {
          const unitCardId = `curric_unit_${idx}_${unit.slice(0, 15).replace(/\W/g, '_')}`;
          if (!existingIds.has(unitCardId)) {
            cards.push({
              id: unitCardId,
              title: `${plan.curriculumTitle || 'Syllabus'}: ${unit}`,
              frontPrompt: `Active Recall Drill: What are the foundational formulas and principles of "${unit}" in ${plan.subject}?`,
              backAnswer: `Curriculum Unit: ${unit}\nSubject: ${plan.subject} (${plan.gradeLevel})\nTarget: Score 10/10 by mastering unit core formulas and chapter practice problems.`,
              category: plan.subject || 'Curriculum',
              source: 'curriculum',
              keyConcepts: [unit, plan.subject],
              tip: `Master this unit to reach estimated mastery target: ${plan.masteryScoreEstimate}%`,
              intervalDays: 1,
              easeFactor: 2.5,
              repetitions: 0,
              nextReviewDate: new Date().toISOString(),
              masteryState: 'new',
            });
            existingIds.add(unitCardId);
          }
        });
      }
    } catch {}

    saveStoredFlashcards(cards);
    return cards;
  } catch (err) {
    console.error('Failed to load flashcards:', err);
    return DEFAULT_FLASHCARDS;
  }
}

export function saveStoredFlashcards(cards: FlashcardItem[]) {
  try {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save flashcards:', err);
  }
}

/**
 * SuperMemo SM-2 Spaced Repetition calculation
 */
export function processSrsReview(card: FlashcardItem, rating: SrsRating): FlashcardItem {
  const updated = { ...card };
  const now = new Date();
  updated.lastReviewed = now.toISOString();

  switch (rating) {
    case 'again':
      updated.repetitions = 0;
      updated.intervalDays = 1;
      updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.2);
      updated.masteryState = 'learning';
      break;
    case 'hard':
      updated.repetitions = Math.max(1, updated.repetitions + 1);
      updated.intervalDays = Math.max(1, Math.round(updated.intervalDays * 1.2));
      updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.15);
      updated.masteryState = updated.repetitions >= 3 ? 'review' : 'learning';
      break;
    case 'good':
      updated.repetitions += 1;
      if (updated.repetitions === 1) {
        updated.intervalDays = 2;
      } else if (updated.repetitions === 2) {
        updated.intervalDays = 5;
      } else {
        updated.intervalDays = Math.round(updated.intervalDays * updated.easeFactor);
      }
      updated.masteryState = updated.repetitions >= 4 ? 'mastered' : 'review';
      break;
    case 'easy':
      updated.repetitions += 1;
      if (updated.repetitions === 1) {
        updated.intervalDays = 4;
      } else if (updated.repetitions === 2) {
        updated.intervalDays = 8;
      } else {
        updated.intervalDays = Math.round(updated.intervalDays * updated.easeFactor * 1.3);
      }
      updated.easeFactor = Math.min(3.0, updated.easeFactor + 0.15);
      updated.masteryState = updated.repetitions >= 3 ? 'mastered' : 'review';
      break;
  }

  // Calculate next review date by adding intervalDays
  const nextDate = new Date(now.getTime() + updated.intervalDays * 24 * 60 * 60 * 1000);
  updated.nextReviewDate = nextDate.toISOString();
  return updated;
}

export function updateFlashcardReview(cardId: string, rating: SrsRating): FlashcardItem[] {
  const cards = getStoredFlashcards();
  const index = cards.findIndex((c) => c.id === cardId);
  if (index >= 0) {
    cards[index] = processSrsReview(cards[index], rating);
    saveStoredFlashcards(cards);
  }
  return cards;
}

export function resetFlashcardDeck(): FlashcardItem[] {
  saveStoredFlashcards(DEFAULT_FLASHCARDS);
  return DEFAULT_FLASHCARDS;
}
