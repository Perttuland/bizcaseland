/**
 * Cross-Tool Data Integration Architecture
 * 
 * This system establishes the foundational pattern for data flow between analysis tools.
 * Key principles:
 * 1. Data Provenance: Always know where data came from
 * 2. User Control: Users can choose and switch between data sources
 * 3. Reversibility: No data loss - all sources preserved
 * 4. Clear UX: Visual indicators show data source and sync status
 */

import { BusinessData } from '@/contexts/BusinessDataContext';
import { MarketData } from '@/lib/market-calculations';

// Core data source tracking
export interface DataSource {
  readonly type: 'user_input' | 'market_analysis' | 'external_api' | 'imported';
  readonly timestamp: string;
  readonly source_id?: string; // For tracking specific market analysis projects
  readonly confidence_score?: number; // 0-1 for AI/calculated sources
  user_notes?: string; // User can add context - mutable
}

// Enhanced business assumption with source tracking
export interface SourcedBusinessAssumption {
  // Current active value (what's used in calculations)
  value: number;
  unit: string;
  rationale: string;
  
  // Source management
  active_source: DataSource['type'];
  sources: Partial<Record<DataSource['type'], {
    data: { value: number; unit: string; rationale: string };
    source_metadata: DataSource;
    user_accepted: boolean;
    user_modified: boolean; // Track if user changed synced data
  }>>;
  
  // Sync status
  sync_status: 'current' | 'stale' | 'conflict' | 'never_synced';
  last_sync_timestamp?: string;
}

// Market analysis volume data structure for transfer
export interface MarketVolumeTransfer {
  volume_projection: {
    base_year_total: number;
    unit: string;
    growth_pattern: 'linear' | 'exponential' | 'seasonal';
    yoy_growth_rate?: number;
    monthly_pattern?: number[]; // For seasonal
  };
  source_analysis: {
    tam_value: number;
    sam_percentage: number;
    som_percentage: number;
    target_market_share: number;
    confidence_level: 'high' | 'medium' | 'low';
  };
  metadata: {
    analysis_title: string;
    analyst: string;
    analysis_date: string;
    methodology: string;
  };
}

// Cross-tool integration service
export class CrossToolDataService {
  
  /**
   * Transfer volume data from market analysis to business case
   */
  static transferMarketVolume(
    marketData: MarketData,
    targetSegmentId: string,
    options: {
      preserveUserData: boolean;
      confidence_threshold: number;
    } = { preserveUserData: true, confidence_threshold: 0.7 }
  ): SourcedBusinessAssumption {
    
    // Extract volume projection from market analysis
    const volumeData = this.extractVolumeFromMarket(marketData);
    
    // Create sourced assumption
    const sourcedAssumption: SourcedBusinessAssumption = {
      // Active data (what gets used)
      value: volumeData.volume_projection.base_year_total,
      unit: volumeData.volume_projection.unit,
      rationale: `Market-based projection: ${volumeData.metadata.methodology}`,
      
      // Source tracking
      active_source: 'market_analysis',
      sources: {
        market_analysis: {
          data: {
            value: volumeData.volume_projection.base_year_total,
            unit: volumeData.volume_projection.unit,
            rationale: `Derived from market analysis "${volumeData.metadata.analysis_title}". ` +
                      `TAM: ${volumeData.source_analysis.tam_value}, ` +
                      `Target share: ${volumeData.source_analysis.target_market_share}%`
          },
          source_metadata: {
            type: 'market_analysis',
            timestamp: new Date().toISOString(),
            source_id: marketData.meta?.title || 'market_analysis',
            confidence_score: this.calculateConfidenceScore(volumeData),
            user_notes: ''
          },
          user_accepted: false, // User must explicitly accept
          user_modified: false
        },
        user_input: {
          data: { value: 0, unit: 'units_per_year', rationale: 'User input placeholder' },
          source_metadata: {
            type: 'user_input',
            timestamp: new Date().toISOString()
          },
          user_accepted: true,
          user_modified: false
        }
      },
      
      sync_status: 'current',
      last_sync_timestamp: new Date().toISOString()
    };
    
    return sourcedAssumption;
  }
  
  /**
   * Switch between data sources for a business assumption
   */
  static switchDataSource(
    assumption: SourcedBusinessAssumption,
    targetSource: DataSource['type']
  ): SourcedBusinessAssumption {
    
    if (!assumption.sources[targetSource]) {
      throw new Error(`Data source ${targetSource} not available`);
    }
    
    const sourceData = assumption.sources[targetSource];
    
    return {
      ...assumption,
      value: sourceData.data.value,
      unit: sourceData.data.unit,
      rationale: sourceData.data.rationale,
      active_source: targetSource,
      sync_status: targetSource === 'market_analysis' ? 'current' : 'never_synced'
    };
  }
  
  /**
   * Update sync status when market data changes
   */
  static markAsStale(assumptions: SourcedBusinessAssumption[]): SourcedBusinessAssumption[] {
    return assumptions.map(assumption => ({
      ...assumption,
      sync_status: assumption.active_source === 'market_analysis' ? 'stale' : assumption.sync_status
    }));
  }
  
  /**
   * Check if business case assumptions are aligned with market data
   */
  static validateAlignment(
    businessAssumption: SourcedBusinessAssumption,
    currentMarketData: MarketData
  ): {
    is_aligned: boolean;
    variance_percentage: number;
    recommendation: string;
  } {
    
    if (businessAssumption.active_source !== 'market_analysis') {
      return {
        is_aligned: true, // User data is always "aligned" by definition
        variance_percentage: 0,
        recommendation: 'Using user input - consider validating against market analysis'
      };
    }
    
    const currentMarketVolume = this.extractVolumeFromMarket(currentMarketData);
    const businessVolume = businessAssumption.value;
    const marketVolume = currentMarketVolume.volume_projection.base_year_total;
    
    const variance = Math.abs(businessVolume - marketVolume) / marketVolume;
    
    return {
      is_aligned: variance < 0.15, // Within 15% is considered aligned
      variance_percentage: variance * 100,
      recommendation: variance > 0.15 
        ? `Business volume differs by ${(variance * 100).toFixed(1)}% from market analysis. Consider re-syncing.`
        : 'Volume assumptions are well-aligned with market analysis.'
    };
  }
  
  /**
   * Extract volume projection data from market analysis (public method)
   */
  static extractVolumeFromMarket(marketData: MarketData): MarketVolumeTransfer {
    // This would contain the actual extraction logic
    // For now, a simplified version:
    
    const tam = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const samPct = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
    const somPct = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
    const targetShare = marketData.market_share?.target_position?.target_share?.value || 0;
    
    const projectedVolume = tam * (samPct / 100) * (somPct / 100) * (targetShare / 100);
    
    return {
      volume_projection: {
        base_year_total: projectedVolume,
        unit: 'units_per_year',
        growth_pattern: 'linear',
        yoy_growth_rate: marketData.market_sizing?.total_addressable_market?.growth_rate?.value || 5
      },
      source_analysis: {
        tam_value: tam,
        sam_percentage: samPct,
        som_percentage: somPct,
        target_market_share: targetShare,
        confidence_level: this.assessConfidenceLevel(marketData)
      },
      metadata: {
        analysis_title: marketData.meta?.title || 'Market Analysis',
        analyst: marketData.meta?.analyst || 'Unknown',
        analysis_date: marketData.meta?.created_date || new Date().toISOString().split('T')[0],
        methodology: 'TAM-SAM-SOM analysis with market share projections'
      }
    };
  }
  
  private static calculateConfidenceScore(volumeData: MarketVolumeTransfer): number {
    // Simple confidence scoring based on data completeness
    let score = 0.5; // Base score
    
    if (volumeData.source_analysis.tam_value > 0) score += 0.15;
    if (volumeData.source_analysis.sam_percentage > 0) score += 0.15;
    if (volumeData.source_analysis.som_percentage > 0) score += 0.1;
    if (volumeData.source_analysis.target_market_share > 0) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  private static assessConfidenceLevel(marketData: MarketData): 'high' | 'medium' | 'low' {
    const completeness = [
      marketData.market_sizing?.total_addressable_market?.base_value?.value,
      marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value,
      marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value,
      marketData.market_share?.target_position?.target_share?.value
    ].filter(Boolean).length;
    
    if (completeness >= 4) return 'high';
    if (completeness >= 2) return 'medium';
    return 'low';
  }
}

// Integration with existing DataManagerContext
export interface CrossToolSyncOptions {
  auto_accept_high_confidence: boolean; // Auto-accept syncs with >90% confidence
  notify_on_stale_data: boolean;        // Show warnings when market data is newer
  preserve_user_modifications: boolean; // Don't overwrite user-modified data
}

// Enhanced business data structure that supports sourced assumptions
export interface EnhancedBusinessData extends Omit<BusinessData, 'assumptions'> {
  assumptions: {
    pricing?: {
      avg_unit_price?: SourcedBusinessAssumption;
    };
    customers?: {
      segments?: Array<{
        id: string;
        label: string;
        rationale: string;
        volume?: {
          base_year_total?: SourcedBusinessAssumption;
          yoy_growth?: SourcedBusinessAssumption;
        };
      }>;
    };
    // ... other assumptions follow same pattern
  };
  
  // Cross-tool metadata
  cross_tool_sync: {
    last_market_sync?: string;
    sync_settings: CrossToolSyncOptions;
    pending_syncs: Array<{
      source_tool: string;
      data_type: string;
      timestamp: string;
      user_action_required: boolean;
    }>;
  };
}
