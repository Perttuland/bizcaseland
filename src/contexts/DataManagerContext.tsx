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
import { CrossToolDataService, SourcedBusinessAssumption } from '@/lib/utils/cross-tool-integration';

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
  
  // NEW: Market to Business transfer functionality
  transferMarketVolumeToBusinessCase: (
    targetSegmentId: string,
    options?: { preserveUserData?: boolean; userNotes?: string }
  ) => Promise<{ success: boolean; message: string }>;
  
  // Enhanced business data management with sourced assumptions
  updateBusinessDataWithSource: (path: string, sourcedAssumption: SourcedBusinessAssumption) => void;
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
  }, []);

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

  // NEW: Core transfer functionality from market to business case
  const transferMarketVolumeToBusinessCase = useCallback(async (
    targetSegmentId: string,
    options: { preserveUserData?: boolean; userNotes?: string } = {}
  ): Promise<{ success: boolean; message: string }> => {
    
    if (!currentProject?.marketData) {
      return { success: false, message: 'No market data available for transfer' };
    }

    if (!currentProject?.businessData) {
      return { success: false, message: 'No business case data to update' };
    }

    try {
      // Use the CrossToolDataService to create sourced assumption
      const sourcedAssumption = CrossToolDataService.transferMarketVolume(
        currentProject.marketData,
        targetSegmentId,
        { 
          preserveUserData: options.preserveUserData ?? true, 
          confidence_threshold: 0.7 
        }
      );

      // Add user notes if provided
      if (options.userNotes) {
        sourcedAssumption.sources.market_analysis!.source_metadata.user_notes = options.userNotes;
      }

      // Find and update the target segment
      const updatedBusinessData = { ...currentProject.businessData };
      if (!updatedBusinessData.assumptions) updatedBusinessData.assumptions = {};
      if (!updatedBusinessData.assumptions.customers) updatedBusinessData.assumptions.customers = {};
      if (!updatedBusinessData.assumptions.customers.segments) updatedBusinessData.assumptions.customers.segments = [];

      const segmentIndex = updatedBusinessData.assumptions.customers.segments.findIndex(
        segment => segment.id === targetSegmentId
      );

      if (segmentIndex === -1) {
        return { success: false, message: `Customer segment ${targetSegmentId} not found` };
      }

      // Update the segment with sourced assumption (for now, we'll integrate with existing structure)
      const segment = updatedBusinessData.assumptions.customers.segments[segmentIndex];
      if (!segment.volume) {
        segment.volume = {
          type: 'pattern',
          pattern_type: 'linear_growth'
        };
      }
      
      // For backwards compatibility, update the existing structure but add source metadata
      segment.volume.base_year_total = {
        value: sourcedAssumption.value,
        unit: sourcedAssumption.unit,
        rationale: `${sourcedAssumption.rationale} [Source: Market Analysis, Confidence: ${(sourcedAssumption.sources.market_analysis!.source_metadata.confidence_score! * 100).toFixed(0)}%]`
      };

      // Store the full sourced assumption in a comment field for future use
      // Note: This is a temporary approach until we fully migrate to SourcedBusinessAssumption structure
      segment.rationale = `${segment.rationale || ''} [Market Transfer: ${new Date().toISOString()}]`;

      updateBusinessData(updatedBusinessData);

      return { 
        success: true, 
        message: `Successfully transferred volume projection (${sourcedAssumption.value.toLocaleString()} ${sourcedAssumption.unit}) to ${targetSegmentId}` 
      };

    } catch (error) {
      console.error('Transfer failed:', error);
      return { 
        success: false, 
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }, [currentProject, updateBusinessData]);

  // Enhanced business data update with source tracking
  const updateBusinessDataWithSource = useCallback((path: string, sourcedAssumption: SourcedBusinessAssumption) => {
    if (!currentProject) return;

    // This would implement path-based updates with source tracking
    // For now, we'll use the existing updateBusinessData method
    console.log('Updating business data with source at path:', path, sourcedAssumption);
    
    // TODO: Implement full path-based sourced assumption updates
    // This requires enhancing the BusinessData interface to support SourcedBusinessAssumption
    
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
    transferMarketVolumeToBusinessCase,
    updateBusinessDataWithSource
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
