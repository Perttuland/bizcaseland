/**
 * Data persistence utilities to prevent data loss on refresh
 * Provides secure localStorage management with error handling
 */

import { BusinessData } from '@/contexts/BusinessDataContext';
import { safeJSONParse, safeJSONStringify, validateBusinessData } from './utils/json-validation';

// Storage keys
const STORAGE_KEYS = {
  BUSINESS_DATA: 'bizcaseland_business_data',
  USER_PREFERENCES: 'bizcaseland_preferences',
  SESSION_DATA: 'bizcaseland_session'
} as const;

// Storage limits (in bytes)
const STORAGE_LIMITS = {
  BUSINESS_DATA: 5 * 1024 * 1024, // 5MB
  USER_PREFERENCES: 100 * 1024,   // 100KB
  SESSION_DATA: 500 * 1024        // 500KB
} as const;

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultCurrency?: string;
  autoSave?: boolean;
  notifications?: boolean;
}

export interface SessionData {
  lastActiveTab?: string;
  hasSeenWelcome?: boolean;
  recentFiles?: string[];
}

/**
 * Safe localStorage wrapper with error handling
 */
class SafeStorage {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private checkStorageQuota(key: string, data: string): boolean {
    const limit = STORAGE_LIMITS[key as keyof typeof STORAGE_LIMITS];
    if (!limit) return true;
    
    const size = new Blob([data]).size;
    if (size > limit) {
      console.warn(`Data too large for ${key}: ${size} bytes (limit: ${limit} bytes)`);
      return false;
    }
    return true;
  }

  get<T>(key: string, fallback: T): T {
    if (!this.isAvailable()) {
      console.warn('localStorage not available, using fallback');
      return fallback;
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;

      const parseResult = safeJSONParse<T>(item);
      if (!parseResult.success) {
        console.warn(`Failed to parse stored data for ${key}:`, parseResult.error);
        return fallback;
      }

      return parseResult.data ?? fallback;
    } catch (error) {
      console.warn(`Error reading from localStorage for ${key}:`, error);
      return fallback;
    }
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage not available, cannot save data');
      return false;
    }

    try {
      const stringifyResult = safeJSONStringify(value);
      if (!stringifyResult.success) {
        console.warn(`Failed to stringify data for ${key}:`, stringifyResult.error);
        return false;
      }

      if (!this.checkStorageQuota(key, stringifyResult.data!)) {
        return false;
      }

      localStorage.setItem(key, stringifyResult.data!);
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for ${key}:`, error);
      return false;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for ${key}:`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Only clear our app's keys, not all localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }

  getUsageInfo(): { used: number; available: number; percentage: number } | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Estimate localStorage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += (key.length + (value?.length || 0)) * 2; // UTF-16 encoding
        }
      }

      // Most browsers have ~5-10MB localStorage limit
      const estimated_limit = 10 * 1024 * 1024; // 10MB
      const percentage = (used / estimated_limit) * 100;

      return {
        used,
        available: estimated_limit - used,
        percentage: Math.min(percentage, 100)
      };
    } catch {
      return null;
    }
  }
}

const storage = new SafeStorage();

/**
 * Business data persistence
 */
export const businessDataPersistence = {
  save: (data: BusinessData | null): boolean => {
    if (!data) {
      return storage.remove(STORAGE_KEYS.BUSINESS_DATA);
    }

    // Validate data before saving
    const validation = validateBusinessData(data);
    if (!validation.success) {
      console.warn('Cannot save invalid business data:', validation.error);
      return false;
    }

    return storage.set(STORAGE_KEYS.BUSINESS_DATA, data);
  },

  load: (): BusinessData | null => {
    const data = storage.get<BusinessData | null>(STORAGE_KEYS.BUSINESS_DATA, null);
    
    if (!data) {
      return null;
    }

    // Validate loaded data
    const validation = validateBusinessData(data);
    if (!validation.success) {
      console.warn('Loaded business data is invalid:', validation.error);
      return null;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Business data has warnings:', validation.warnings);
    }

    return validation.data!;
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.BUSINESS_DATA);
  }
};

/**
 * User preferences persistence
 */
export const userPreferences = {
  save: (preferences: UserPreferences): boolean => {
    return storage.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  load: (): UserPreferences => {
    return storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, {
      theme: 'system',
      defaultCurrency: 'EUR',
      autoSave: true,
      notifications: true
    });
  },

  update: (updates: Partial<UserPreferences>): boolean => {
    const current = userPreferences.load();
    const updated = { ...current, ...updates };
    return userPreferences.save(updated);
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.USER_PREFERENCES);
  }
};

/**
 * Session data persistence
 */
export const sessionData = {
  save: (data: SessionData): boolean => {
    return storage.set(STORAGE_KEYS.SESSION_DATA, data);
  },

  load: (): SessionData => {
    return storage.get<SessionData>(STORAGE_KEYS.SESSION_DATA, {
      lastActiveTab: 'input',
      hasSeenWelcome: false,
      recentFiles: []
    });
  },

  update: (updates: Partial<SessionData>): boolean => {
    const current = sessionData.load();
    const updated = { ...current, ...updates };
    return sessionData.save(updated);
  },

  clear: (): boolean => {
    return storage.remove(STORAGE_KEYS.SESSION_DATA);
  }
};

/**
 * Auto-save functionality
 */
export class AutoSave {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly delay: number;
  private isEnabled: boolean;

  constructor(delay: number = 2000) {
    this.delay = delay;
    this.isEnabled = userPreferences.load().autoSave ?? true;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  schedule(data: BusinessData | null) {
    if (!this.isEnabled) return;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const success = businessDataPersistence.save(data);
      if (success) {
        console.log('Data auto-saved successfully');
      } else {
        console.warn('Auto-save failed');
      }
      this.timeoutId = null;
    }, this.delay);
  }

  saveNow(data: BusinessData | null): boolean {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    return businessDataPersistence.save(data);
  }

  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Storage utility functions
 */
export const storageUtils = {
  getStorageInfo: () => storage.getUsageInfo(),
  
  clearAllData: (): boolean => {
    return storage.clear();
  },

  exportData: () => {
    const businessData = businessDataPersistence.load();
    const preferences = userPreferences.load();
    const session = sessionData.load();

    return {
      businessData,
      preferences,
      session,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  },

  importData: (importedData: any): boolean => {
    try {
      if (importedData.businessData) {
        businessDataPersistence.save(importedData.businessData);
      }
      if (importedData.preferences) {
        userPreferences.save(importedData.preferences);
      }
      if (importedData.session) {
        sessionData.save(importedData.session);
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
};

// Initialize auto-save instance
export const autoSave = new AutoSave();
