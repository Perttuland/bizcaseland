import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BusinessData } from './BusinessDataContext';
import { MarketData } from '@/lib/market-calculations';
import { SafeStorage } from '@/lib/persistence';
import { 
  syncMarketToBusinessVolume, 
  validateBusinessAgainstMarket,
  MarketBusinessInsights as SyncMarketBusinessInsights,
  exportUnifiedInsights
} from '@/lib/utils/data-sync';

// NEW: Market Insights Cart Integration
import { MarketInsightsCartService } from '@/lib/market-insights-cart-service';
import { 
  CartState, 
  TransferOperation, 
  AnyMarketInsight,
  CartItem 
} from '@/lib/market-insights-cart';

// Unified data interfaces
export interface UnifiedProjectData {
  projectId: string;
  projectName: string;
  lastModified: string;
  businessData?: BusinessData;
  marketData?: MarketData;
  metadata: {
    version: string;
    createdBy: string;
    tags: string[];
    description?: string;
  };
}

export interface DataSyncMap {
  // Mapping functions for cross-tool data synchronization
  marketToBusinessVolume?: (marketData: MarketData) => Partial<BusinessData>;
  businessToMarketValidation?: (businessData: BusinessData) => Partial<MarketData>;
}

interface DataManagerContextType {
  // Project management
  currentProject: UnifiedProjectData | null;
  projects: UnifiedProjectData[];
  
  // Core operations
  createProject: (name: string, type: 'business' | 'market' | 'unified') => Promise<string>;
  loadProject: (projectId: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // Data management
  updateBusinessData: (data: Partial<BusinessData>) => void;
  updateMarketData: (data: Partial<MarketData>) => void;
  syncDataBetweenTools: (syncMap: DataSyncMap) => void;
  
  // Import/Export
  exportProject: (format: 'json' | 'csv') => Promise<string>;
  importProject: (data: string, format: 'json') => Promise<boolean>;
  
  // Cross-tool insights
  getMarketInsights: () => MarketBusinessInsights | null;
  validateDataConsistency: () => ValidationResult[];
  
  // NEW: Market Insights Cart Integration
  marketInsightsCart: {
    cartState: CartState | null;
    cartService: MarketInsightsCartService;
    extractInsightsFromCurrentMarketData: () => Promise<readonly AnyMarketInsight[]>;
    addInsightToCart: (insight: AnyMarketInsight, userNotes?: string) => Promise<boolean>;
    removeInsightFromCart: (insightId: string) => Promise<boolean>;
    clearCart: () => Promise<void>;
    transferInsightsToBusinessCase: (transferType?: 'bulk' | 'selective') => Promise<TransferOperation | null>;
    onCartChange: (callback: (state: CartState) => void) => () => void;
  };
}

export interface MarketBusinessInsights {
  volumeAlignment: {
    marketProjectedVolume: number;
    businessAssumedVolume: number;
    alignmentScore: number; // 0-1 scale
    recommendations: string[];
  };
  revenueConsistency: {
    marketSize: number;
    businessProjectedRevenue: number;
    marketShareImplied: number;
    feasibilityScore: number;
  };
}

export interface ValidationResult {
  type: 'warning' | 'error' | 'info';
  category: 'market' | 'business' | 'crossTool';
  message: string;
  path?: string;
  suggestedAction?: string;
}

const DataManagerContext = createContext<DataManagerContextType | undefined>(undefined);

// Storage keys for unified system
const STORAGE_KEYS = {
  PROJECTS: 'bizcaseland_projects',
  CURRENT_PROJECT: 'bizcaseland_current_project',
  USER_SETTINGS: 'bizcaseland_settings'
} as const;

export function DataManagerProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<UnifiedProjectData | null>(null);
  const [projects, setProjects] = useState<UnifiedProjectData[]>([]);
  const storage = new SafeStorage();

  // NEW: Market Insights Cart State
  const [cartService] = useState(() => new MarketInsightsCartService({
    maxCartItems: 20,
    autoValidation: true,
    persistenceEnabled: true
  }));
  const [cartState, setCartState] = useState<CartState | null>(null);
  const [cartChangeCallbacks, setCartChangeCallbacks] = useState<((state: CartState) => void)[]>([]);

  // Load projects on mount
  useEffect(() => {
    const savedProjects = storage.get<UnifiedProjectData[]>(STORAGE_KEYS.PROJECTS, []);
    setProjects(savedProjects);
    
    const currentProjectId = storage.get<string>(STORAGE_KEYS.CURRENT_PROJECT, '');
    if (currentProjectId) {
      const project = savedProjects.find(p => p.projectId === currentProjectId);
      if (project) {
        setCurrentProject(project);
      }
    }

    // Initialize cart state
    setCartState(cartService.getCartState());
  }, [cartService]);

  const createProject = useCallback(async (name: string, type: 'business' | 'market' | 'unified'): Promise<string> => {
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newProject: UnifiedProjectData = {
      projectId,
      projectName: name,
      lastModified: new Date().toISOString(),
      metadata: {
        version: '1.0',
        createdBy: 'User', // Could be enhanced with user management
        tags: [type],
        description: `${type} analysis project`
      }
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setCurrentProject(newProject);
    
    // Persist to storage
    storage.set(STORAGE_KEYS.PROJECTS, updatedProjects);
    storage.set(STORAGE_KEYS.CURRENT_PROJECT, projectId);
    
    return projectId;
  }, [projects, storage]);

  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!currentProject) return false;

    try {
      const updatedProject = {
        ...currentProject,
        lastModified: new Date().toISOString()
      };

      const updatedProjects = projects.map(p => 
        p.projectId === currentProject.projectId ? updatedProject : p
      );

      setProjects(updatedProjects);
      setCurrentProject(updatedProject);
      
      storage.set(STORAGE_KEYS.PROJECTS, updatedProjects);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }, [currentProject, projects, storage]);

  const updateBusinessData = useCallback((data: Partial<BusinessData>) => {
    if (!currentProject) return;

    setCurrentProject(prev => ({
      ...prev!,
      businessData: { ...prev!.businessData, ...data } as BusinessData,
      lastModified: new Date().toISOString()
    }));
  }, [currentProject]);

  const updateMarketData = useCallback((data: Partial<MarketData>) => {
    if (!currentProject) return;

    setCurrentProject(prev => ({
      ...prev!,
      marketData: { ...prev!.marketData, ...data } as MarketData,
      lastModified: new Date().toISOString()
    }));
  }, [currentProject]);

  const syncDataBetweenTools = useCallback((syncMap: DataSyncMap) => {
    if (!currentProject) return;

    // Market → Business sync
    if (currentProject.marketData && syncMap.marketToBusinessVolume) {
      const { businessData } = syncMarketToBusinessVolume(
        currentProject.marketData,
        currentProject.businessData
      );
      updateBusinessData(businessData);
    }

    // Additional sync operations can be added here
  }, [currentProject, updateBusinessData]);

  const getMarketInsights = useCallback((): MarketBusinessInsights | null => {
    if (!currentProject?.marketData || !currentProject?.businessData) return null;

    const { insights } = validateBusinessAgainstMarket(
      currentProject.businessData, 
      currentProject.marketData
    );
    
    return insights;
  }, [currentProject]);

  const validateDataConsistency = useCallback((): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    if (!currentProject) return results;

    // Cross-tool validation logic
    if (currentProject.businessData && currentProject.marketData) {
      const { validation } = validateBusinessAgainstMarket(
        currentProject.businessData,
        currentProject.marketData
      );
      
      // Convert sync result warnings to validation results
      validation.warnings.forEach(warning => {
        results.push({
          type: 'warning',
          category: 'crossTool',
          message: warning,
          suggestedAction: 'Review alignment between market analysis and business case'
        });
      });
      
      validation.errors.forEach(error => {
        results.push({
          type: 'error',
          category: 'crossTool',
          message: error,
          suggestedAction: 'Fix data inconsistencies'
        });
      });
    }

    return results;
  }, [currentProject]);

  // Placeholder implementations for remaining methods
  const loadProject = useCallback(async (projectId: string): Promise<boolean> => {
    const project = projects.find(p => p.projectId === projectId);
    if (project) {
      setCurrentProject(project);
      storage.set(STORAGE_KEYS.CURRENT_PROJECT, projectId);
      return true;
    }
    return false;
  }, [projects, storage]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    const updatedProjects = projects.filter(p => p.projectId !== projectId);
    setProjects(updatedProjects);
    storage.set(STORAGE_KEYS.PROJECTS, updatedProjects);
    
    if (currentProject?.projectId === projectId) {
      setCurrentProject(null);
      storage.remove(STORAGE_KEYS.CURRENT_PROJECT);
    }
    
    return true;
  }, [projects, currentProject, storage]);

  // ===== MARKET INSIGHTS CART IMPLEMENTATION =====
  
  // Helper function to update cart state and notify callbacks
  const updateCartState = useCallback(() => {
    const newState = cartService.getCartState();
    setCartState(newState);
    cartChangeCallbacks.forEach(callback => callback(newState));
  }, [cartService, cartChangeCallbacks]);

  // Extract insights from current market data
  const extractInsightsFromCurrentMarketData = useCallback(async (): Promise<readonly AnyMarketInsight[]> => {
    if (!currentProject?.marketData) {
      return [];
    }
    
    try {
      return await cartService.extractInsightsFromMarket(currentProject.marketData);
    } catch (error) {
      console.error('Failed to extract insights from market data:', error);
      return [];
    }
  }, [currentProject?.marketData, cartService]);

  // Add insight to cart
  const addInsightToCart = useCallback(async (insight: AnyMarketInsight, userNotes?: string): Promise<boolean> => {
    try {
      const success = await cartService.addInsight(insight, userNotes);
      if (success) {
        updateCartState();
      }
      return success;
    } catch (error) {
      console.error('Failed to add insight to cart:', error);
      return false;
    }
  }, [cartService, updateCartState]);

  // Remove insight from cart
  const removeInsightFromCart = useCallback(async (insightId: string): Promise<boolean> => {
    try {
      const success = await cartService.removeInsight(insightId);
      if (success) {
        updateCartState();
      }
      return success;
    } catch (error) {
      console.error('Failed to remove insight from cart:', error);
      return false;
    }
  }, [cartService, updateCartState]);

  // Clear cart
  const clearCart = useCallback(async (): Promise<void> => {
    try {
      await cartService.clearCart();
      updateCartState();
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }, [cartService, updateCartState]);

  // Transfer insights to business case
  const transferInsightsToBusinessCase = useCallback(async (transferType: 'bulk' | 'selective' = 'bulk'): Promise<TransferOperation | null> => {
    if (!currentProject?.businessData) {
      console.error('No business data available for transfer');
      return null;
    }

    try {
      const cartState = cartService.getCartState();
      if (cartState.totalItems === 0) {
        console.warn('No items in cart to transfer');
        return null;
      }

      // Create transfer operation
      const operation = cartService.createTransferOperation(cartState.items, {
        id: `transfer_${Date.now()}`,
        targetBusinessCaseId: currentProject.projectId,
        transferType,
        options: {
          preserveExistingData: true,
          mergeStrategy: 'smart_merge',
          validateBeforeTransfer: true
        },
        metadata: {
          title: `Market Insights Transfer - ${currentProject.projectName}`,
          description: `Transfer of ${cartState.totalItems} market insights to business case`,
          analyst: 'User'
        }
      });

      // Execute transfer (this would integrate with business data in real implementation)
      const result = await cartService.executeTransfer(operation, currentProject.businessData);
      
      if (result.success) {
        // Clear cart after successful transfer
        await cartService.clearCart();
        updateCartState();
        
        // Save project with updated data
        await saveProject();
      }

      return operation;
    } catch (error) {
      console.error('Failed to transfer insights to business case:', error);
      return null;
    }
  }, [currentProject, cartService, updateCartState, saveProject]);

  // Register cart change callback
  const onCartChange = useCallback((callback: (state: CartState) => void): (() => void) => {
    setCartChangeCallbacks(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setCartChangeCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // ===== END CART IMPLEMENTATION =====

  const exportProject = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
    if (!currentProject) return '';
    
    if (format === 'json') {
      return JSON.stringify(currentProject, null, 2);
    }
    
    // CSV export would be more complex, implementing basic version
    return `Project: ${currentProject.projectName}\nLast Modified: ${currentProject.lastModified}`;
  }, [currentProject]);

  const importProject = useCallback(async (data: string, format: 'json'): Promise<boolean> => {
    try {
      if (format === 'json') {
        const projectData = JSON.parse(data) as UnifiedProjectData;
        const updatedProjects = [...projects, projectData];
        setProjects(updatedProjects);
        storage.set(STORAGE_KEYS.PROJECTS, updatedProjects);
        return true;
      }
    } catch (error) {
      console.error('Failed to import project:', error);
    }
    return false;
  }, [projects, storage]);

  const value = {
    currentProject,
    projects,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    updateBusinessData,
    updateMarketData,
    syncDataBetweenTools,
    exportProject,
    importProject,
    getMarketInsights,
    validateDataConsistency,
    marketInsightsCart: {
      cartState,
      cartService,
      extractInsightsFromCurrentMarketData,
      addInsightToCart,
      removeInsightFromCart,
      clearCart,
      transferInsightsToBusinessCase,
      onCartChange
    }
  };

  return (
    <DataManagerContext.Provider value={value}>
      {children}
    </DataManagerContext.Provider>
  );
}

export function useDataManager() {
  const context = useContext(DataManagerContext);
  if (context === undefined) {
    throw new Error('useDataManager must be used within a DataManagerProvider');
  }
  return context;
}
