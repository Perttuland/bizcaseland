/**
 * Unified Data Context
 * Single source of truth for all application data
 * Replaces AppContext, BusinessDataContext, and DataManagerContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { BusinessData } from '@/core/types/business';
import type { MarketData } from '@/core/types/market';
import { storageService, STORAGE_KEYS } from '@/core/services/storage.service';
import { validationService } from '@/core/services/validation.service';
import { syncService } from '@/core/services/sync.service';
import { setNestedValue } from '@/core/engine';

// ============================================================================
// Types
// ============================================================================

export type AnalysisMode = 'landing' | 'business' | 'market';

export interface DataState {
  business: {
    data: BusinessData | null;
    hasData: boolean;
    lastModified: string | null;
  };
  market: {
    data: MarketData | null;
    hasData: boolean;
    lastModified: string | null;
  };
  ui: {
    activeMode: AnalysisMode;
  };
}

export interface DataContextValue {
  // State
  state: DataState;
  
  // Navigation
  switchMode: (mode: AnalysisMode) => void;
  
  // Business Data Operations
  updateBusinessData: (data: BusinessData | null) => void;
  updateBusinessAssumption: (path: string, value: any) => void;
  clearBusinessData: () => void;
  
  // Market Data Operations
  updateMarketData: (data: MarketData | null) => void;
  updateMarketAssumption: (path: string, value: any) => void;
  clearMarketData: () => void;
  
  // Driver Management
  addBusinessDriver: (path: string, key: string, range: number[], rationale: string, unit?: string) => void;
  removeBusinessDriver: (path: string) => void;
  updateBusinessDriverRange: (path: string, range: number[]) => void;
  
  addMarketDriver: (label: string, path: string, range: number[], rationale: string) => void;
  removeMarketDriver: (path: string) => void;
  updateMarketDriverRange: (path: string, range: number[]) => void;
  
  // Cross-tool operations
  syncDataFromStorage: () => void;
  validateData: () => void;
  clearAllData: () => void;
  exportAllData: () => { business: BusinessData | null; market: MarketData | null };
}

// ============================================================================
// Context
// ============================================================================

const DataContext = createContext<DataContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, setState] = useState<DataState>(() => {
    // Initialize from localStorage
    const businessData = storageService.load<BusinessData>(STORAGE_KEYS.BUSINESS_DATA);
    const marketData = storageService.load<MarketData>(STORAGE_KEYS.MARKET_DATA);
    const activeMode = storageService.loadWithDefault<AnalysisMode>(STORAGE_KEYS.ACTIVE_MODE, 'landing');

    return {
      business: {
        data: businessData,
        hasData: !!businessData,
        lastModified: businessData ? new Date().toISOString() : null,
      },
      market: {
        data: marketData,
        hasData: !!marketData,
        lastModified: marketData ? new Date().toISOString() : null,
      },
      ui: {
        activeMode,
      },
    };
  });

  // ============================================================================
  // Navigation
  // ============================================================================

  const switchMode = useCallback((mode: AnalysisMode) => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, activeMode: mode },
    }));
    storageService.save(STORAGE_KEYS.ACTIVE_MODE, mode);
    
    // Navigate
    const routes: Record<AnalysisMode, string> = {
      landing: '/',
      business: '/business',
      market: '/market',
    };
    window.location.href = routes[mode];
  }, []);

  // ============================================================================
  // Business Data Operations
  // ============================================================================

  const updateBusinessData = useCallback((data: BusinessData | null) => {
    setState(prev => ({
      ...prev,
      business: {
        data,
        hasData: !!data,
        lastModified: data ? new Date().toISOString() : null,
      },
    }));
    
    if (data) {
      storageService.save(STORAGE_KEYS.BUSINESS_DATA, data);
    } else {
      storageService.remove(STORAGE_KEYS.BUSINESS_DATA);
    }
  }, []);

  const updateBusinessAssumption = useCallback((path: string, value: any) => {
    setState(prev => {
      if (!prev.business.data) {
        console.warn('Cannot update business assumption: no data loaded');
        return prev;
      }

      try {
        const newData = setNestedValue(prev.business.data, path, value);
        storageService.save(STORAGE_KEYS.BUSINESS_DATA, newData);
        
        return {
          ...prev,
          business: {
            ...prev.business,
            data: newData,
            lastModified: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('Error updating business assumption:', error);
        return prev;
      }
    });
  }, []);

  const clearBusinessData = useCallback(() => {
    setState(prev => ({
      ...prev,
      business: {
        data: null,
        hasData: false,
        lastModified: null,
      },
    }));
    storageService.remove(STORAGE_KEYS.BUSINESS_DATA);
  }, []);

  // ============================================================================
  // Market Data Operations
  // ============================================================================

  const updateMarketData = useCallback((data: MarketData | null) => {
    setState(prev => ({
      ...prev,
      market: {
        data,
        hasData: !!data,
        lastModified: data ? new Date().toISOString() : null,
      },
    }));
    
    if (data) {
      storageService.save(STORAGE_KEYS.MARKET_DATA, data);
    } else {
      storageService.remove(STORAGE_KEYS.MARKET_DATA);
    }
  }, []);

  const updateMarketAssumption = useCallback((path: string, value: any) => {
    setState(prev => {
      if (!prev.market.data) {
        console.warn('Cannot update market assumption: no data loaded');
        return prev;
      }

      try {
        const newData = setNestedValue(prev.market.data, path, value);
        storageService.save(STORAGE_KEYS.MARKET_DATA, newData);
        
        return {
          ...prev,
          market: {
            ...prev.market,
            data: newData,
            lastModified: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error('Error updating market assumption:', error);
        return prev;
      }
    });
  }, []);

  const clearMarketData = useCallback(() => {
    setState(prev => ({
      ...prev,
      market: {
        data: null,
        hasData: false,
        lastModified: null,
      },
    }));
    storageService.remove(STORAGE_KEYS.MARKET_DATA);
  }, []);

  // ============================================================================
  // Driver Management - Business
  // ============================================================================

  const addBusinessDriver = useCallback((path: string, key: string, range: number[], rationale: string, unit?: string) => {
    setState(prev => {
      if (!prev.business.data) return prev;

      const drivers = prev.business.data.drivers || [];
      if (drivers.some(d => d.path === path)) {
        console.warn('Driver already exists for path:', path);
        return prev;
      }

      const newData = {
        ...prev.business.data,
        drivers: [...drivers, { key, path, range, rationale, unit }],
      };

      storageService.save(STORAGE_KEYS.BUSINESS_DATA, newData);

      return {
        ...prev,
        business: {
          ...prev.business,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  const removeBusinessDriver = useCallback((path: string) => {
    setState(prev => {
      if (!prev.business.data || !prev.business.data.drivers) return prev;

      const newData = {
        ...prev.business.data,
        drivers: prev.business.data.drivers.filter(d => d.path !== path),
      };

      storageService.save(STORAGE_KEYS.BUSINESS_DATA, newData);

      return {
        ...prev,
        business: {
          ...prev.business,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  const updateBusinessDriverRange = useCallback((path: string, range: number[]) => {
    setState(prev => {
      if (!prev.business.data || !prev.business.data.drivers) return prev;

      const newData = {
        ...prev.business.data,
        drivers: prev.business.data.drivers.map(d =>
          d.path === path ? { ...d, range } : d
        ),
      };

      storageService.save(STORAGE_KEYS.BUSINESS_DATA, newData);

      return {
        ...prev,
        business: {
          ...prev.business,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  // ============================================================================
  // Driver Management - Market
  // ============================================================================

  const addMarketDriver = useCallback((label: string, path: string, range: number[], rationale: string) => {
    setState(prev => {
      if (!prev.market.data) return prev;

      const drivers = prev.market.data.drivers || [];
      const key = path.replace(/\./g, '_');
      
      if (drivers.some(d => d.path === path)) {
        console.warn('Driver already exists for path:', path);
        return prev;
      }

      const newData = {
        ...prev.market.data,
        drivers: [...drivers, { key, label, path, range, rationale }],
      };

      storageService.save(STORAGE_KEYS.MARKET_DATA, newData);

      return {
        ...prev,
        market: {
          ...prev.market,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  const removeMarketDriver = useCallback((path: string) => {
    setState(prev => {
      if (!prev.market.data || !prev.market.data.drivers) return prev;

      const newData = {
        ...prev.market.data,
        drivers: prev.market.data.drivers.filter(d => d.path !== path),
      };

      storageService.save(STORAGE_KEYS.MARKET_DATA, newData);

      return {
        ...prev,
        market: {
          ...prev.market,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  const updateMarketDriverRange = useCallback((path: string, range: number[]) => {
    setState(prev => {
      if (!prev.market.data || !prev.market.data.drivers) return prev;

      const newData = {
        ...prev.market.data,
        drivers: prev.market.data.drivers.map(d =>
          d.path === path ? { ...d, range } : d
        ),
      };

      storageService.save(STORAGE_KEYS.MARKET_DATA, newData);

      return {
        ...prev,
        market: {
          ...prev.market,
          data: newData,
          lastModified: new Date().toISOString(),
        },
      };
    });
  }, []);

  // ============================================================================
  // Cross-tool Operations
  // ============================================================================

  const syncDataFromStorage = useCallback(() => {
    const businessData = storageService.load<BusinessData>(STORAGE_KEYS.BUSINESS_DATA);
    const marketData = storageService.load<MarketData>(STORAGE_KEYS.MARKET_DATA);

    setState(prev => ({
      ...prev,
      business: {
        data: businessData,
        hasData: !!businessData,
        lastModified: businessData ? new Date().toISOString() : null,
      },
      market: {
        data: marketData,
        hasData: !!marketData,
        lastModified: marketData ? new Date().toISOString() : null,
      },
    }));
  }, []);

  const validateData = useCallback(() => {
    const businessValidation = state.business.data
      ? validationService.validateBusinessData(state.business.data)
      : null;

    const marketValidation = state.market.data
      ? validationService.validateMarketData(state.market.data)
      : null;

    const crossValidation = validationService.validateCrossToolConsistency(
      state.business.data,
      state.market.data
    );

    console.log('Validation Results:', {
      business: businessValidation,
      market: marketValidation,
      crossTool: crossValidation,
    });
  }, [state.business.data, state.market.data]);

  const clearAllData = useCallback(() => {
    setState({
      business: { data: null, hasData: false, lastModified: null },
      market: { data: null, hasData: false, lastModified: null },
      ui: { activeMode: 'landing' },
    });
    
    storageService.remove(STORAGE_KEYS.BUSINESS_DATA);
    storageService.remove(STORAGE_KEYS.MARKET_DATA);
    storageService.remove(STORAGE_KEYS.ACTIVE_MODE);
  }, []);

  const exportAllData = useCallback(() => ({
    business: state.business.data,
    market: state.market.data,
  }), [state.business.data, state.market.data]);

  // ============================================================================
  // Storage Event Listener
  // ============================================================================

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.BUSINESS_DATA || e.key === STORAGE_KEYS.MARKET_DATA) {
        syncDataFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncDataFromStorage]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: DataContextValue = {
    state,
    switchMode,
    updateBusinessData,
    updateBusinessAssumption,
    clearBusinessData,
    updateMarketData,
    updateMarketAssumption,
    clearMarketData,
    addBusinessDriver,
    removeBusinessDriver,
    updateBusinessDriverRange,
    addMarketDriver,
    removeMarketDriver,
    updateMarketDriverRange,
    syncDataFromStorage,
    validateData,
    clearAllData,
    exportAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
