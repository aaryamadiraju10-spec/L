import { AppSettings } from '../types';

const SETTINGS_KEY = 'mfs_user_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  mathDisplayMode: 'block',
  decimalPrecision: 4,
  angleUnit: 'rad',
  notationStyle: 'standard',
  stepVerbosity: 'detailed',
  katexFontSize: 'base',
  copyFormat: 'latex',
  theme: 'light',
  soundEnabled: true,
  speechLanguage: 'en-US',
  autoSolveOnVoice: true,
  solverMode: 'hybrid',
  autoSyncCloud: true,
};

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveStoredSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getStoredSettings();
  const updated = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
  return updated;
}

export function resetStoredSettings(): AppSettings {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch (e) {
    console.error('Failed to reset settings', e);
  }
  return { ...DEFAULT_SETTINGS };
}

// Web Audio API feedback for micro-interactions
export function playAudioFeedback(type: 'click' | 'success' | 'toggle' | 'delete' = 'click') {
  try {
    const settings = getStoredSettings();
    if (!settings.soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'toggle') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'delete') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // Audio contexts might be blocked before first user gesture
  }
}

/**
 * Creates an all-in-one JSON bundle of user calculations, gamification, and settings
 */
export function exportAllUserDataJson(): string {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings: getStoredSettings(),
    calculations: localStorage.getItem('mfs_offline_calculations_v1')
      ? JSON.parse(localStorage.getItem('mfs_offline_calculations_v1') || '[]')
      : [],
    gamification: localStorage.getItem('mfs_gamification_v1')
      ? JSON.parse(localStorage.getItem('mfs_gamification_v1') || '{}')
      : {},
    flashcards: localStorage.getItem('mfs_flashcards_v1')
      ? JSON.parse(localStorage.getItem('mfs_flashcards_v1') || '[]')
      : [],
    userProfile: localStorage.getItem('mfs_current_user')
      ? JSON.parse(localStorage.getItem('mfs_current_user') || '{}')
      : null,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Imports and restores all user data from JSON
 */
export function importUserDataJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    if (Array.isArray(data.calculations)) {
      localStorage.setItem('mfs_offline_calculations_v1', JSON.stringify(data.calculations));
    }
    if (data.gamification && typeof data.gamification === 'object') {
      localStorage.setItem('mfs_gamification_v1', JSON.stringify(data.gamification));
    }
    if (Array.isArray(data.flashcards)) {
      localStorage.setItem('mfs_flashcards_v1', JSON.stringify(data.flashcards));
    }
    if (data.userProfile && typeof data.userProfile === 'object') {
      localStorage.setItem('mfs_current_user', JSON.stringify(data.userProfile));
    }
    return true;
  } catch (err) {
    console.error('Failed to import user data JSON', err);
    return false;
  }
}
