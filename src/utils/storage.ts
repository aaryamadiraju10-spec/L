import { CalculationRecord } from '../types';

const STORAGE_KEYS = {
  CALCULATIONS: 'mathformula_offline_calculations',
  USER: 'mathformula_user_account',
  DARK_MODE: 'mathformula_theme_dark',
  OFFLINE_QUEUE: 'mathformula_offline_queue',
};

export const offlineStorage = {
  getCalculations(): CalculationRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CALCULATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveCalculations(list: CalculationRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CALCULATIONS, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to save calculations to localStorage:', err);
    }
  },

  addCalculation(item: CalculationRecord) {
    const list = this.getCalculations();
    const updated = [item, ...list.filter((x) => x.id !== item.id)];
    this.saveCalculations(updated);
  },

  removeCalculation(id: string) {
    const list = this.getCalculations().filter((x) => x.id !== id);
    this.saveCalculations(list);
  },

  clearAllCalculations() {
    localStorage.removeItem(STORAGE_KEYS.CALCULATIONS);
  },

  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveUser(user: any) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  isDarkMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  },

  setDarkMode(isDark: boolean) {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDark ? 'true' : 'false');
  },
};

export async function syncWithCloudDatabase(userId?: string): Promise<{ success: boolean; count: number }> {
  try {
    const local = offlineStorage.getCalculations();
    const response = await fetch('/api/calculations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId || 'guest',
        records: local,
      }),
    });
    if (!response.ok) throw new Error('Cloud sync request failed');
    const data = await response.json();
    if (data.records) {
      offlineStorage.saveCalculations(data.records);
    }
    return { success: true, count: data.records?.length || 0 };
  } catch (err) {
    console.warn('Sync failed (working offline):', err);
    return { success: false, count: 0 };
  }
}

export function getLocalCalculations(): CalculationRecord[] {
  return offlineStorage.getCalculations();
}

export function saveCalculationLocally(item: CalculationRecord) {
  offlineStorage.addCalculation(item);
}

export function deleteLocalCalculation(id: string) {
  offlineStorage.removeCalculation(id);
}

export function clearLocalCalculations() {
  offlineStorage.clearAllCalculations();
}

export async function syncOfflineCalculations(userId?: string): Promise<CalculationRecord[]> {
  await syncWithCloudDatabase(userId);
  return offlineStorage.getCalculations();
}

export const getStoredCalculations = getLocalCalculations;
export const saveCalculation = (item: CalculationRecord): CalculationRecord[] => {
  saveCalculationLocally(item);
  return getLocalCalculations();
};
export const syncCalculationsWithServer = syncOfflineCalculations;
