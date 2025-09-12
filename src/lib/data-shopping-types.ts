/**
 * Data Shopping Service Types and Interfaces
 * 
 * This file defines the complete type system for the data shopping mode feature
 * that allows users to gather market data and transfer it to business case analysis.
 */

// Data extraction target for market data shopping
export interface DataExtractionTarget {
  path: string;
  displayName: string;
  confidence: number;
  sourceType?: string;
  description?: string;
}

export interface DataShoppingItem {
  id: string;
  sourceType: 'market_sizing' | 'customer_segment' | 'pricing_data' | 'growth_projection';
  sourcePath: string; // JSONPath to original data
  displayName: string;
  originalValue: any;
  modifiedValue?: any;
  modifications: DataModification[];
  confidence: number;
  rationale: string;
  timestamp: number;
  addedAt: number;
}

export interface DataModification {
  id: string;
  field: string;
  originalValue: any;
  newValue: any;
  reason: string;
  timestamp: number;
  userId?: string;
  confidence: number;
  validationPassed: boolean;
  rollbackAvailable: boolean;
}

export interface ShoppingCart {
  id: string;
  items: DataShoppingItem[];
  metadata: {
    sourceProject: string;
    targetProject?: string;
    createdAt: number;
    lastModified: number;
  };
  status: 'active' | 'reviewing' | 'transferred' | 'abandoned';
}

export interface TransferOperation {
  id: string;
  cartId: string;
  sourceData: DataShoppingItem[];
  targetMapping: Record<string, string>; // shopping item id -> business case field path
  transferredAt: number;
  status: 'pending' | 'success' | 'failed' | 'partial';
  errors?: TransferError[];
}

export interface TransferError {
  itemId: string;
  field: string;
  errorType: 'type_mismatch' | 'validation_failed' | 'mapping_missing';
  message: string;
}

export interface MarketDataPoint {
  id: string;
  path: string;
  type: string;
  value: any;
  metadata: {
    displayName: string;
    description: string;
    unit?: string;
    confidence: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: TransferSuggestion[];
}

export interface ValidationError {
  itemId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  itemId: string;
  field: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TransferSuggestion {
  itemId: string;
  suggestedMapping: string;
  reason: string;
  confidence: number;
}

export interface ModificationAuditTrail {
  itemId: string;
  modifications: DataModification[];
  currentState: any;
  originalState: any;
  totalModifications: number;
  lastModified: number;
  rollbackPoints: RollbackPoint[];
}

export interface RollbackPoint {
  id: string;
  timestamp: number;
  state: any;
  reason: string;
  automatic: boolean;
}

export interface ModificationValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  confidence: number;
  businessRuleViolations: string[];
  dataTypeIssues: string[];
}

export interface BusinessRuleValidation {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

export interface DataConsistencyValidation {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ModificationHistoryValidation {
  isValid: boolean;
  concerns: string[];
  confidence: number;
}

export interface CrossValidationResult {
  isValid: boolean;
  warnings: string[];
  relationships: string[];
}

/**
 * Core Data Shopping Service Interface
 * 
 * This service handles the complete workflow for market data shopping:
 * 1. Cart management (create, add, modify, remove)
 * 2. Data selection and search
 * 3. Transfer operations with validation
 * 4. Event handling for real-time updates
 */
export interface IDataShoppingService {
  // Cart Management
  createCart(sourceProject: string): Promise<ShoppingCart>;
  getCart(cartId: string): Promise<ShoppingCart | null>;
  addToCart(cartId: string, dataPoint: MarketDataPoint): Promise<DataShoppingItem>;
  addToCart(cartId: string, path: string, displayName: string, sourceData: any, sourceType: string): Promise<DataShoppingItem>;
  removeFromCart(cartId: string, itemId: string): Promise<void>;
  modifyItem(cartId: string, itemId: string, modifications: Partial<any>): Promise<DataShoppingItem>;
  
  // Data Selection
  getAvailableDataPoints(marketData: import('@/lib/market-calculations').MarketData): Promise<MarketDataPoint[]>;
  searchDataPoints(marketData: import('@/lib/market-calculations').MarketData, query: string): Promise<MarketDataPoint[]>;
  filterDataPointsByCategory(marketData: import('@/lib/market-calculations').MarketData, category: string): Promise<MarketDataPoint[]>;
  getDataPointsByConfidence(marketData: import('@/lib/market-calculations').MarketData, minConfidence?: number): Promise<MarketDataPoint[]>;
  extractMarketData(sourceData: any, targets: DataExtractionTarget[], cartId: string): Promise<DataShoppingItem[]>;
  
  // Transfer Operations
  validateTransfer(cart: ShoppingCart, targetProject: string): Promise<ValidationResult>;
  executeTransfer(cart: ShoppingCart, targetProject: string): Promise<TransferOperation>;
  getTransferHistory(projectId: string): Promise<TransferOperation[]>;
  
  // Modification & Audit Trail
  getModificationHistory(cartId: string, itemId: string): Promise<ModificationAuditTrail>;
  validateModification(cartId: string, itemId: string, modifications: Partial<any>): Promise<ModificationValidation>;
  rollbackToPoint(cartId: string, itemId: string, rollbackPointId: string): Promise<DataShoppingItem>;
  createRollbackPoint(cartId: string, itemId: string, reason: string): Promise<RollbackPoint>;
  getAvailableRollbackPoints(cartId: string, itemId: string): Promise<RollbackPoint[]>;
  
  // Event Handling
  onCartChange(callback: (cart: ShoppingCart) => void): () => void;
  onTransferComplete(callback: (operation: TransferOperation) => void): () => void;
}
