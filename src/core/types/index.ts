/**
 * Central type system export
 * Single source of truth for all type definitions
 */

// Export all common types
export * from './common';

// Export all business types
export * from './business';

// Export all market types
export * from './market';

// Re-export commonly used types for convenience
export type {
  // Common
  ValueWithRationale,
  Driver,
  VolumeConfiguration,
  
  // Business
  BusinessData,
  BusinessAssumptions,
  CustomerSegment,
  MonthlyData,
  CalculatedMetrics,
  
  // Market
  MarketData,
  MarketSizing,
  CompetitiveLandscape,
  CustomerAnalysis,
} from './business';
