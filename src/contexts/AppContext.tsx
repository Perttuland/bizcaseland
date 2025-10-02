import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setNestedValue, getNestedValue } from '@/lib/utils/nested-operations';

// Simplified data structure interfaces
export interface BusinessDataSummary {
  meta?: {
    title?: string;
    description?: string;
  };
  [key: string]: any;
}

export interface MarketDriver {
  key: string;
  label: string;
  path: string;
  range: number[];
  rationale: string;
}

export interface MarketDataSummary {
  meta?: {
    title?: string;
    description?: string;
  };
  drivers?: MarketDriver[];
  [key: string]: any;
}

// App-level state types
export type AnalysisMode = 'landing' | 'business' | 'market';

export interface AppState {
  activeMode: AnalysisMode;
  businessData: BusinessDataSummary | null;
  marketData: MarketDataSummary | null;
  hasBusinessData: boolean;
  hasMarketData: boolean;
}

export interface AppContextType {
  appState: AppState;
  switchToBusinessMode: () => void;
  switchToMarketMode: () => void;
  switchToLanding: () => void;
  updateBusinessData: (data: BusinessDataSummary) => void;
  updateMarketData: (data: MarketDataSummary) => void;
  updateMarketAssumption: (path: string, value: any) => void;
  addMarketDriver: (label: string, path: string, range: number[], rationale: string) => void;
  removeMarketDriver: (path: string) => void;
  updateMarketDriverRange: (path: string, range: number[]) => void;
  clearBusinessData: () => void;
  clearMarketData: () => void;
  clearAllData: () => void;
  exportAllData: () => { business: BusinessDataSummary | null; market: MarketDataSummary | null };
  syncDataFromStorage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage keys for data persistence - matching existing keys
const STORAGE_KEYS = {
  BUSINESS_DATA: 'businessCaseData', // Match existing key from BusinessDataContext
  MARKET_DATA: 'bizcaseland_market_data',
  ACTIVE_MODE: 'bizcaseland_active_mode'
} as const;

// Enhanced storage utilities with error handling
const storage = {
  save: function<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Data saved to ${key}`);
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  },
  
  load: function<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      console.log(`Data loaded from ${key}:`, parsed ? 'Success' : 'Empty');
      return parsed;
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  },
  
  remove: function(key: string): void {
    try {
      localStorage.removeItem(key);
      console.log(`Data removed from ${key}`);
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
    }
  }
};

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [appState, setAppState] = useState<AppState>(() => {
    // Initialize state from localStorage
    const savedBusinessData = storage.load<BusinessDataSummary>(STORAGE_KEYS.BUSINESS_DATA);
    const savedMarketData = storage.load<MarketDataSummary>(STORAGE_KEYS.MARKET_DATA);
    const savedMode = storage.load<AnalysisMode>(STORAGE_KEYS.ACTIVE_MODE) || 'landing';
    
    return {
      activeMode: savedMode,
      businessData: savedBusinessData,
      marketData: savedMarketData,
      hasBusinessData: !!savedBusinessData,
      hasMarketData: !!savedMarketData
    };
  });

  // Sync data from localStorage (called when components mount)
  const syncDataFromStorage = React.useCallback(() => {
    const businessData = storage.load<BusinessDataSummary>(STORAGE_KEYS.BUSINESS_DATA);
    const marketData = storage.load<MarketDataSummary>(STORAGE_KEYS.MARKET_DATA);
    
    setAppState(prev => ({
      ...prev,
      businessData,
      marketData,
      hasBusinessData: !!businessData,
      hasMarketData: !!marketData
    }));
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.BUSINESS_DATA || e.key === STORAGE_KEYS.MARKET_DATA) {
        syncDataFromStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncDataFromStorage]);

  // Navigation functions
  const switchToBusinessMode = () => {
    setAppState(prev => ({ ...prev, activeMode: 'business' }));
    storage.save(STORAGE_KEYS.ACTIVE_MODE, 'business');
    window.location.href = '/business';
  };

  const switchToMarketMode = () => {
    setAppState(prev => ({ ...prev, activeMode: 'market' }));
    storage.save(STORAGE_KEYS.ACTIVE_MODE, 'market');
    window.location.href = '/market';
  };

  const switchToLanding = () => {
    setAppState(prev => ({ ...prev, activeMode: 'landing' }));
    storage.save(STORAGE_KEYS.ACTIVE_MODE, 'landing');
    window.location.href = '/';
  };

  // Data management functions
  const updateBusinessData = (data: BusinessDataSummary) => {
    setAppState(prev => ({
      ...prev,
      businessData: data,
      hasBusinessData: !!data
    }));
    storage.save(STORAGE_KEYS.BUSINESS_DATA, data);
  };

  const updateMarketData = (data: MarketDataSummary) => {
    setAppState(prev => ({
      ...prev,
      marketData: data,
      hasMarketData: !!data
    }));
    storage.save(STORAGE_KEYS.MARKET_DATA, data);
  };

  const updateMarketAssumption = (path: string, value: any) => {
    if (!appState.marketData) {
      console.error('Cannot update market assumption: no market data loaded');
      return;
    }

    try {
      const updatedData = setNestedValue(appState.marketData, path, value);
      updateMarketData(updatedData);
      console.log(`Market assumption updated at path: ${path}`, value);
    } catch (error) {
      console.error('Error updating market assumption:', error);
    }
  };

  const addMarketDriver = (label: string, path: string, range: number[], rationale: string) => {
    if (!appState.marketData) {
      console.error('Cannot add market driver: no market data loaded');
      return;
    }

    const drivers = appState.marketData.drivers || [];
    const key = path.replace(/\./g, '_');
    
    // Check if driver already exists
    if (drivers.some(d => d.path === path)) {
      console.log('Driver already exists for path:', path);
      return;
    }

    const newDriver: MarketDriver = {
      key,
      label,
      path,
      range,
      rationale
    };

    const updatedData = {
      ...appState.marketData,
      drivers: [...drivers, newDriver]
    };

    updateMarketData(updatedData);
    console.log('Market driver added:', newDriver);
  };

  const removeMarketDriver = (path: string) => {
    if (!appState.marketData) {
      console.error('Cannot remove market driver: no market data loaded');
      return;
    }

    const drivers = appState.marketData.drivers || [];
    const updatedDrivers = drivers.filter(d => d.path !== path);

    const updatedData = {
      ...appState.marketData,
      drivers: updatedDrivers
    };

    updateMarketData(updatedData);
    console.log('Market driver removed:', path);
  };

  const updateMarketDriverRange = (path: string, range: number[]) => {
    if (!appState.marketData) {
      console.error('Cannot update market driver range: no market data loaded');
      return;
    }

    const drivers = appState.marketData.drivers || [];
    const updatedDrivers = drivers.map(d => 
      d.path === path ? { ...d, range } : d
    );

    const updatedData = {
      ...appState.marketData,
      drivers: updatedDrivers
    };

    updateMarketData(updatedData);
    console.log('Market driver range updated:', path, range);
  };

  const clearBusinessData = () => {
    setAppState(prev => ({
      ...prev,
      businessData: null,
      hasBusinessData: false
    }));
    storage.remove(STORAGE_KEYS.BUSINESS_DATA);
  };

  const clearMarketData = () => {
    setAppState(prev => ({
      ...prev,
      marketData: null,
      hasMarketData: false
    }));
    storage.remove(STORAGE_KEYS.MARKET_DATA);
  };

  const clearAllData = () => {
    setAppState(prev => ({
      ...prev,
      activeMode: 'landing',
      businessData: null,
      marketData: null,
      hasBusinessData: false,
      hasMarketData: false
    }));
    storage.remove(STORAGE_KEYS.BUSINESS_DATA);
    storage.remove(STORAGE_KEYS.MARKET_DATA);
    storage.remove(STORAGE_KEYS.ACTIVE_MODE);
  };

  const exportAllData = () => ({
    business: appState.businessData,
    market: appState.marketData
  });

  const value: AppContextType = {
    appState,
    switchToBusinessMode,
    switchToMarketMode,
    switchToLanding,
    updateBusinessData,
    updateMarketData,
    updateMarketAssumption,
    addMarketDriver,
    removeMarketDriver,
    updateMarketDriverRange,
    clearBusinessData,
    clearMarketData,
    clearAllData,
    exportAllData,
    syncDataFromStorage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Hook to check data status across both analysis types
export function useDataStatus() {
  const { appState, syncDataFromStorage } = useApp();
  
  // Sync data when hook is used
  React.useEffect(() => {
    syncDataFromStorage();
  }, [syncDataFromStorage]);

  return {
    hasBusinessData: appState.hasBusinessData,
    hasMarketData: appState.hasMarketData,
    businessData: appState.businessData,
    marketData: appState.marketData
  };
}
