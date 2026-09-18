import { DigitalBadge, GamificationProfile } from '../types';

export type { DigitalBadge, GamificationProfile };

const STORAGE_KEY = 'mathformula_gamification_profile_v1';

export const INITIAL_BADGES: DigitalBadge[] = [
  {
    id: 'formula_master',
    title: 'Formula Master',
    description: 'Solve 5 complex mathematical formulas with step-by-step proofs.',
    iconName: 'Calculator',
    category: 'solver',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    unit: 'formulas',
    xpReward: 250,
  },
  {
    id: 'exam_ace',
    title: 'Exam Ace',
    description: 'Achieve a score of 90% or higher (or 10/10) on any mini-exam or diagnostic test.',
    iconName: 'Award',
    category: 'exam',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    unit: 'top score',
    xpReward: 300,
  },
  {
    id: 'consistency_streak',
    title: 'Consistency Streak',
    description: 'Study and solve equations for 3 consecutive days.',
    iconName: 'Flame',
    category: 'streak',
    tier: 'platinum',
    unlocked: false,
    progress: 1,
    maxProgress: 3,
    unit: 'days',
    xpReward: 350,
  },
  {
    id: 'active_recall_champion',
    title: 'Active Recall Champion',
    description: 'Review 10 flashcards using spaced repetition confidence grading.',
    iconName: 'Brain',
    category: 'recall',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    unit: 'cards reviewed',
    xpReward: 200,
  },
  {
    id: 'curriculum_conqueror',
    title: 'Curriculum Conqueror',
    description: 'Scan an OCR syllabus and generate an adaptive 4-week course roadmap.',
    iconName: 'FileCheck',
    category: 'feature',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    unit: 'scans',
    xpReward: 150,
  },
  {
    id: 'voice_navigator',
    title: 'Voice Navigator',
    description: 'Speak a formula or ask the AI Math Tutor a question using hands-free speech recognition.',
    iconName: 'Mic',
    category: 'feature',
    tier: 'bronze',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    unit: 'voice query',
    xpReward: 100,
  },
  {
    id: 'proof_scholar',
    title: 'Proof Scholar',
    description: 'Inspect and calculate advanced Cardano cubic or Cramer 3x3 equations.',
    iconName: 'BookOpen',
    category: 'solver',
    tier: 'silver',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    unit: 'derivations',
    xpReward: 180,
  },
  {
    id: 'flashcard_grandmaster',
    title: 'Memory Grandmaster',
    description: 'Reach Mastered state on 3 or more spaced repetition flashcards.',
    iconName: 'Sparkles',
    category: 'recall',
    tier: 'gold',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    unit: 'mastered cards',
    xpReward: 280,
  },
];

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, maxXp: 200, title: 'Math Novice' },
  { level: 2, minXp: 200, maxXp: 500, title: 'Formula Apprentice' },
  { level: 3, minXp: 500, maxXp: 1000, title: 'Algebra Specialist' },
  { level: 4, minXp: 1000, maxXp: 1800, title: 'Calculus Practitioner' },
  { level: 5, minXp: 1800, maxXp: 3000, title: 'Master Mathematician' },
];

export function calculateLevel(totalXp: number) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = LEVEL_THRESHOLDS[i];
    if (totalXp >= t.minXp) {
      return {
        level: t.level,
        levelTitle: t.title,
        currentLevelXp: totalXp - t.minXp,
        nextLevelXp: t.maxXp - t.minXp,
      };
    }
  }
  return {
    level: 1,
    levelTitle: 'Math Novice',
    currentLevelXp: totalXp,
    nextLevelXp: 200,
  };
}

export const badgeUnlockListeners: ((badge: DigitalBadge) => void)[] = [];

export function onBadgeUnlocked(callback: (badge: DigitalBadge) => void) {
  badgeUnlockListeners.push(callback);
  return () => {
    const idx = badgeUnlockListeners.indexOf(callback);
    if (idx >= 0) badgeUnlockListeners.splice(idx, 1);
  };
}

function notifyBadgeUnlocked(badge: DigitalBadge) {
  badgeUnlockListeners.forEach((fn) => {
    try {
      fn(badge);
    } catch (e) {
      console.error('Badge notification error:', e);
    }
  });
}

export function getGamificationProfile(): GamificationProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (raw) {
      const parsed: GamificationProfile = JSON.parse(raw);
      // Ensure all badges exist (in case new ones were added)
      const existingBadgeIds = new Set(parsed.badges.map((b) => b.id));
      INITIAL_BADGES.forEach((initB) => {
        if (!existingBadgeIds.has(initB.id)) {
          parsed.badges.push({ ...initB });
        }
      });

      // Update daily streak
      const lastDate = parsed.lastActiveDate ? parsed.lastActiveDate.slice(0, 10) : '';
      if (lastDate && lastDate !== today) {
        const lastTime = new Date(lastDate).getTime();
        const curTime = new Date(today).getTime();
        const diffDays = Math.round((curTime - lastTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          parsed.streakDays = (parsed.streakDays || 1) + 1;
          parsed.lastActiveDate = today;
          // Check streak badge
          const streakBadge = parsed.badges.find((b) => b.id === 'consistency_streak');
          if (streakBadge) {
            streakBadge.progress = Math.min(streakBadge.maxProgress, parsed.streakDays);
            if (!streakBadge.unlocked && streakBadge.progress >= streakBadge.maxProgress) {
              streakBadge.unlocked = true;
              streakBadge.unlockedAt = new Date().toISOString();
              parsed.totalXp += streakBadge.xpReward;
              notifyBadgeUnlocked(streakBadge);
            }
          }
        } else if (diffDays > 1) {
          parsed.streakDays = 1;
          parsed.lastActiveDate = today;
        }
      } else if (!lastDate) {
        parsed.lastActiveDate = today;
        parsed.streakDays = 1;
      }
      saveGamificationProfile(parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load gamification profile:', err);
  }

  // Default initial profile
  const initial: GamificationProfile = {
    totalXp: 50,
    level: 1,
    currentLevelXp: 50,
    nextLevelXp: 200,
    levelTitle: 'Math Novice',
    streakDays: 1,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    badges: INITIAL_BADGES.map((b) => ({ ...b })),
    calculationsCount: 0,
    examsCompletedCount: 0,
    perfectScoresCount: 0,
    flashcardsReviewedCount: 0,
    voiceQueriesCount: 0,
    curriculumScansCount: 0,
  };
  saveGamificationProfile(initial);
  return initial;
}

export function saveGamificationProfile(profile: GamificationProfile) {
  try {
    const lvlInfo = calculateLevel(profile.totalXp);
    profile.level = lvlInfo.level;
    profile.levelTitle = lvlInfo.levelTitle;
    profile.currentLevelXp = lvlInfo.currentLevelXp;
    profile.nextLevelXp = lvlInfo.nextLevelXp;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save gamification profile:', err);
  }
}

// ----------------------------------------------------
// ACTIVITY TRIGGERS
// ----------------------------------------------------
export function recordCalculationSolved(isComplex = true) {
  const profile = getGamificationProfile();
  profile.calculationsCount = (profile.calculationsCount || 0) + 1;
  profile.totalXp += 20;

  // Check Formula Master badge (5 complex formulas)
  const masterBadge = profile.badges.find((b) => b.id === 'formula_master');
  if (masterBadge) {
    masterBadge.progress = Math.min(masterBadge.maxProgress, profile.calculationsCount);
    if (!masterBadge.unlocked && masterBadge.progress >= masterBadge.maxProgress) {
      masterBadge.unlocked = true;
      masterBadge.unlockedAt = new Date().toISOString();
      profile.totalXp += masterBadge.xpReward;
      notifyBadgeUnlocked(masterBadge);
    }
  }

  // Check Proof Scholar badge
  if (isComplex) {
    const proofBadge = profile.badges.find((b) => b.id === 'proof_scholar');
    if (proofBadge) {
      proofBadge.progress = Math.min(proofBadge.maxProgress, proofBadge.progress + 1);
      if (!proofBadge.unlocked && proofBadge.progress >= proofBadge.maxProgress) {
        proofBadge.unlocked = true;
        proofBadge.unlockedAt = new Date().toISOString();
        profile.totalXp += proofBadge.xpReward;
        notifyBadgeUnlocked(proofBadge);
      }
    }
  }

  saveGamificationProfile(profile);
  return profile;
}

export function recordExamCompleted(scoreOrPercent: number, totalQuestions?: number) {
  const profile = getGamificationProfile();
  const scorePercent =
    totalQuestions !== undefined && totalQuestions > 0
      ? Math.round((scoreOrPercent / totalQuestions) * 100)
      : Math.round(scoreOrPercent);

  profile.examsCompletedCount = (profile.examsCompletedCount || 0) + 1;
  profile.totalXp += Math.round(scorePercent * 0.5);

  if (scorePercent >= 90) {
    profile.perfectScoresCount = (profile.perfectScoresCount || 0) + 1;
    const aceBadge = profile.badges.find((b) => b.id === 'exam_ace');
    if (aceBadge && !aceBadge.unlocked) {
      aceBadge.progress = 1;
      aceBadge.unlocked = true;
      aceBadge.unlockedAt = new Date().toISOString();
      profile.totalXp += aceBadge.xpReward;
      notifyBadgeUnlocked(aceBadge);
    }
  }

  saveGamificationProfile(profile);
  return profile;
}

export function recordFlashcardReviewed(isMasteredNow = false) {
  const profile = getGamificationProfile();
  profile.flashcardsReviewedCount = (profile.flashcardsReviewedCount || 0) + 1;
  profile.totalXp += 15;

  const recallBadge = profile.badges.find((b) => b.id === 'active_recall_champion');
  if (recallBadge) {
    recallBadge.progress = Math.min(recallBadge.maxProgress, profile.flashcardsReviewedCount);
    if (!recallBadge.unlocked && recallBadge.progress >= recallBadge.maxProgress) {
      recallBadge.unlocked = true;
      recallBadge.unlockedAt = new Date().toISOString();
      profile.totalXp += recallBadge.xpReward;
      notifyBadgeUnlocked(recallBadge);
    }
  }

  if (isMasteredNow) {
    const masterCardBadge = profile.badges.find((b) => b.id === 'flashcard_grandmaster');
    if (masterCardBadge) {
      masterCardBadge.progress = Math.min(masterCardBadge.maxProgress, masterCardBadge.progress + 1);
      if (!masterCardBadge.unlocked && masterCardBadge.progress >= masterCardBadge.maxProgress) {
        masterCardBadge.unlocked = true;
        masterCardBadge.unlockedAt = new Date().toISOString();
        profile.totalXp += masterCardBadge.xpReward;
        notifyBadgeUnlocked(masterCardBadge);
      }
    }
  }

  saveGamificationProfile(profile);
  return profile;
}

export function recordCurriculumScanned() {
  const profile = getGamificationProfile();
  profile.curriculumScansCount = (profile.curriculumScansCount || 0) + 1;
  profile.totalXp += 50;

  const scanBadge = profile.badges.find((b) => b.id === 'curriculum_conqueror');
  if (scanBadge && !scanBadge.unlocked) {
    scanBadge.progress = 1;
    scanBadge.unlocked = true;
    scanBadge.unlockedAt = new Date().toISOString();
    profile.totalXp += scanBadge.xpReward;
    notifyBadgeUnlocked(scanBadge);
  }

  saveGamificationProfile(profile);
  return profile;
}

export function recordVoiceQueryUsed() {
  const profile = getGamificationProfile();
  profile.voiceQueriesCount = (profile.voiceQueriesCount || 0) + 1;
  profile.totalXp += 25;

  const voiceBadge = profile.badges.find((b) => b.id === 'voice_navigator');
  if (voiceBadge && !voiceBadge.unlocked) {
    voiceBadge.progress = 1;
    voiceBadge.unlocked = true;
    voiceBadge.unlockedAt = new Date().toISOString();
    profile.totalXp += voiceBadge.xpReward;
    notifyBadgeUnlocked(voiceBadge);
  }

  saveGamificationProfile(profile);
  return profile;
}
