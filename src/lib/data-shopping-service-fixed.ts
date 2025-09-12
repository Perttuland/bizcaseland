/**
 * Data Shopping Service Implementation
 * 
 * This service implements the complete data shopping workflow for transferring
 * market analysis insights to business case analysis. It follows the test-driven
 * design patterns established in the comprehensive test suite.
 * 
 * Key Features:
 * - Real-time reactive cart management
 * - Data extraction from live market analysis
 * - Modification tracking with audit trails
 * - Validated transfers with comprehensive error handling
 * - Event-driven architecture for UI reactivity
 */

import { nanoid } from 'nanoid';
import type { MarketData } from '@/lib/market-calculations';
import type {
  IDataShoppingService,
  DataShoppingItem,
  ShoppingCart,
  TransferOperation,
  MarketDataPoint,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TransferSuggestion,
  DataModification
} from '@/lib/data-shopping-types';

export class DataShoppingService implements IDataShoppingService {
  private carts = new Map<string, ShoppingCart>();
  private transferHistory = new Map<string, TransferOperation[]>();
  private cartChangeListeners = new Set<(cart: ShoppingCart) => void>();
  private transferCompleteListeners = new Set<(operation: TransferOperation) => void>();

  // ===== CART MANAGEMENT =====

  async createCart(sourceProject: string): Promise<ShoppingCart> {
    const now = Date.now();
    const cart: ShoppingCart = {
      id: nanoid(),
      items: [],
      metadata: {
        sourceProject,
        createdAt: now,
        lastModified: now
      },
      status: 'active'
    };

    this.carts.set(cart.id, cart);
    this.notifyCartChange(cart);
    
    return cart;
  }

  async getCart(cartId: string): Promise<ShoppingCart | null> {
    return this.carts.get(cartId) || null;
  }

  async addToCart(cartId: string, dataPoint: MarketDataPoint): Promise<DataShoppingItem> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const item: DataShoppingItem = {
      id: nanoid(),
      sourceType: this.determineSourceType(dataPoint.path),
      sourcePath: dataPoint.path,
      originalValue: dataPoint.value,
      modifiedValue: null,
      modifications: [],
      addedAt: Date.now()
    };

    cart.items.push(item);
    cart.metadata.lastModified = Date.now();

    this.carts.set(cartId, cart);
    this.notifyCartChange(cart);

    return item;
  }

  async removeFromCart(cartId: string, itemId: string): Promise<void> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new Error(`Item ${itemId} not found in cart`);
    }

    cart.items.splice(itemIndex, 1);
    cart.metadata.lastModified = Date.now();

    this.carts.set(cartId, cart);
    this.notifyCartChange(cart);
  }

  async modifyItem(cartId: string, itemId: string, modifications: Partial<any>): Promise<DataShoppingItem> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const item = cart.items.find(item => item.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in cart`);
    }

    // Create modification record
    const modification: DataModification = {
      field: 'value', // Simplified - in real implementation, detect which field changed
      originalValue: item.originalValue,
      newValue: modifications.value || modifications,
      reason: modifications.reason || 'User modification',
      timestamp: Date.now()
    };

    // Apply modification
    item.modifiedValue = this.applyModification(item.originalValue, modifications);
    item.modifications.push(modification);
    
    cart.metadata.lastModified = Date.now();

    this.carts.set(cartId, cart);
    this.notifyCartChange(cart);

    return item;
  }

  // ===== DATA SELECTION =====

  async getAvailableDataPoints(marketData: MarketData): Promise<MarketDataPoint[]> {
    const dataPoints: MarketDataPoint[] = [];

    // Extract market sizing data points
    if (marketData.market_sizing) {
      if (marketData.market_sizing.total_addressable_market) {
        dataPoints.push({
          id: 'tam-base-value',
          path: 'market_sizing.total_addressable_market.base_value',
          type: 'currency_value',
          value: marketData.market_sizing.total_addressable_market.base_value,
          metadata: {
            displayName: 'Total Addressable Market',
            description: 'Base market size value for business case volume estimation',
            unit: marketData.market_sizing.total_addressable_market.base_value.unit,
            confidence: this.calculateConfidence(marketData.market_sizing.total_addressable_market.base_value)
          }
        });

        if (marketData.market_sizing.total_addressable_market.growth_rate) {
          dataPoints.push({
            id: 'tam-growth-rate',
            path: 'market_sizing.total_addressable_market.growth_rate',
            type: 'percentage',
            value: marketData.market_sizing.total_addressable_market.growth_rate,
            metadata: {
              displayName: 'Market Growth Rate',
              description: 'Annual market growth projection',
              unit: marketData.market_sizing.total_addressable_market.growth_rate.unit,
              confidence: this.calculateConfidence(marketData.market_sizing.total_addressable_market.growth_rate)
            }
          });
        }
      }

      if (marketData.market_sizing.serviceable_addressable_market) {
        dataPoints.push({
          id: 'sam-percentage',
          path: 'market_sizing.serviceable_addressable_market.percentage_of_tam',
          type: 'percentage',
          value: marketData.market_sizing.serviceable_addressable_market.percentage_of_tam,
          metadata: {
            displayName: 'SAM Percentage of TAM',
            description: 'Serviceable addressable market as percentage of total addressable market',
            unit: marketData.market_sizing.serviceable_addressable_market.percentage_of_tam.unit,
            confidence: this.calculateConfidence(marketData.market_sizing.serviceable_addressable_market.percentage_of_tam)
          }
        });
      }

      if (marketData.market_sizing.serviceable_obtainable_market) {
        dataPoints.push({
          id: 'som-percentage',
          path: 'market_sizing.serviceable_obtainable_market.percentage_of_sam',
          type: 'percentage',
          value: marketData.market_sizing.serviceable_obtainable_market.percentage_of_sam,
          metadata: {
            displayName: 'SOM Percentage of SAM',
            description: 'Serviceable obtainable market as percentage of serviceable addressable market',
            unit: marketData.market_sizing.serviceable_obtainable_market.percentage_of_sam.unit,
            confidence: this.calculateConfidence(marketData.market_sizing.serviceable_obtainable_market.percentage_of_sam)
          }
        });
      }
    }

    // Extract customer segments data points
    if (marketData.customer_segments && Array.isArray(marketData.customer_segments)) {
      marketData.customer_segments.forEach((segment, index) => {
        dataPoints.push({
          id: `segment-${index}-size`,
          path: `customer_segments[${index}].size_percentage`,
          type: 'percentage',
          value: segment.size_percentage,
          metadata: {
            displayName: `${segment.name} Segment Size`,
            description: `Market size percentage for ${segment.name} customer segment`,
            unit: segment.size_percentage.unit,
            confidence: this.calculateConfidence(segment.size_percentage)
          }
        });

        if (segment.growth_rate) {
          dataPoints.push({
            id: `segment-${index}-growth`,
            path: `customer_segments[${index}].growth_rate`,
            type: 'percentage',
            value: segment.growth_rate,
            metadata: {
              displayName: `${segment.name} Growth Rate`,
              description: `Growth rate projection for ${segment.name} segment`,
              unit: segment.growth_rate.unit,
              confidence: this.calculateConfidence(segment.growth_rate)
            }
          });
        }
      });
    }

    // Extract market share targets
    if (marketData.market_share_target) {
      if (marketData.market_share_target.target_share) {
        dataPoints.push({
          id: 'target-market-share',
          path: 'market_share_target.target_share',
          type: 'percentage',
          value: marketData.market_share_target.target_share,
          metadata: {
            displayName: 'Target Market Share',
            description: 'Projected market share target',
            unit: marketData.market_share_target.target_share.unit,
            confidence: this.calculateConfidence(marketData.market_share_target.target_share)
          }
        });
      }

      if (marketData.market_share_target.target_timeframe) {
        dataPoints.push({
          id: 'target-timeframe',
          path: 'market_share_target.target_timeframe',
          type: 'duration',
          value: marketData.market_share_target.target_timeframe,
          metadata: {
            displayName: 'Target Timeframe',
            description: 'Timeline to achieve market share target',
            unit: marketData.market_share_target.target_timeframe.unit,
            confidence: this.calculateConfidence(marketData.market_share_target.target_timeframe)
          }
        });
      }
    }

    // Extract competitive landscape data points
    if (marketData.competitive_landscape && Array.isArray(marketData.competitive_landscape)) {
      marketData.competitive_landscape.forEach((competitor, index) => {
        if (competitor.market_share) {
          dataPoints.push({
            id: `competitor-${index}-share`,
            path: `competitive_landscape[${index}].market_share`,
            type: 'percentage',
            value: competitor.market_share,
            metadata: {
              displayName: `${competitor.name} Market Share`,
              description: `Current market share of ${competitor.name}`,
              unit: competitor.market_share.unit,
              confidence: this.calculateConfidence(competitor.market_share)
            }
          });
        }

        if (competitor.pricing_strategy && competitor.pricing_strategy.average_price) {
          dataPoints.push({
            id: `competitor-${index}-pricing`,
            path: `competitive_landscape[${index}].pricing_strategy.average_price`,
            type: 'currency_value',
            value: competitor.pricing_strategy.average_price,
            metadata: {
              displayName: `${competitor.name} Average Price`,
              description: `Average pricing for ${competitor.name}`,
              unit: competitor.pricing_strategy.average_price.unit,
              confidence: this.calculateConfidence(competitor.pricing_strategy.average_price)
            }
          });
        }
      });
    }

    // Extract market dynamics data points
    if (marketData.market_dynamics) {
      if (marketData.market_dynamics.growth_drivers && Array.isArray(marketData.market_dynamics.growth_drivers)) {
        marketData.market_dynamics.growth_drivers.forEach((driver, index) => {
          if (driver.impact_score) {
            dataPoints.push({
              id: `growth-driver-${index}-impact`,
              path: `market_dynamics.growth_drivers[${index}].impact_score`,
              type: 'numeric',
              value: driver.impact_score,
              metadata: {
                displayName: `${driver.factor} Impact Score`,
                description: `Impact score for growth driver: ${driver.factor}`,
                unit: driver.impact_score.unit,
                confidence: this.calculateConfidence(driver.impact_score)
              }
            });
          }
        });
      }

      if (marketData.market_dynamics.barriers && Array.isArray(marketData.market_dynamics.barriers)) {
        marketData.market_dynamics.barriers.forEach((barrier, index) => {
          if (barrier.severity_score) {
            dataPoints.push({
              id: `barrier-${index}-severity`,
              path: `market_dynamics.barriers[${index}].severity_score`,
              type: 'numeric',
              value: barrier.severity_score,
              metadata: {
                displayName: `${barrier.type} Barrier Severity`,
                description: `Severity score for barrier: ${barrier.type}`,
                unit: barrier.severity_score.unit,
                confidence: this.calculateConfidence(barrier.severity_score)
              }
            });
          }
        });
      }
    }

    return dataPoints;
  }

  async searchDataPoints(marketData: MarketData, query: string): Promise<MarketDataPoint[]> {
    const allDataPoints = await this.getAvailableDataPoints(marketData);
    const lowercaseQuery = query.toLowerCase();

    return allDataPoints.filter(point =>
      point.metadata.displayName.toLowerCase().includes(lowercaseQuery) ||
      point.metadata.description.toLowerCase().includes(lowercaseQuery) ||
      point.path.toLowerCase().includes(lowercaseQuery)
    );
  }

  // ===== VALIDATION & TRANSFER =====

  async validateTransfer(cart: ShoppingCart, targetProject: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: TransferSuggestion[] = [];

    // Validate each cart item
    for (const item of cart.items) {
      // Type validation
      if (!this.isValidDataType(item)) {
        errors.push({
          itemId: item.id,
          field: 'type',
          errorType: 'type_mismatch',
          message: `Invalid data type for ${item.sourcePath}`
        });
      }

      // Business rules validation
      if (!this.isWithinBusinessRules(item)) {
        errors.push({
          itemId: item.id,
          field: 'value',
          errorType: 'business_rule_violation',
          message: `Value violates business rules for ${item.sourceType}`
        });
      }

      // Generate transfer suggestions
      const suggestion = this.generateMappingSuggestion(item);
      if (suggestion) {
        suggestions.push(suggestion);
      } else {
        warnings.push({
          itemId: item.id,
          field: 'mapping',
          warningType: 'manual_mapping_required',
          message: `Manual mapping required for ${item.sourcePath}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  async executeTransfer(cart: ShoppingCart, targetProject: string): Promise<TransferOperation> {
    // Validate before transfer
    const validation = await this.validateTransfer(cart, targetProject);
    if (!validation.isValid) {
      throw new Error(`Transfer validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create transfer operation
    const transfer: TransferOperation = {
      id: nanoid(),
      cartId: cart.id,
      sourceData: [...cart.items],
      targetMapping: this.generateTargetMapping(cart.items),
      transferredAt: Date.now(),
      status: 'pending'
    };

    try {
      // Execute the actual transfer (this would integrate with business case system)
      await this.performTransfer(transfer, targetProject);
      
      transfer.status = 'success';
      cart.status = 'transferred';
      
      // Update cart
      this.carts.set(cart.id, cart);
      
      // Store in history
      const projectHistory = this.transferHistory.get(cart.metadata.sourceProject) || [];
      projectHistory.push(transfer);
      this.transferHistory.set(cart.metadata.sourceProject, projectHistory);

      this.notifyCartChange(cart);
      this.notifyTransferComplete(transfer);

      return transfer;
    } catch (error) {
      transfer.status = 'failed';
      transfer.errors = [{
        itemId: 'general',
        field: 'transfer',
        errorType: 'validation_failed',
        message: error instanceof Error ? error.message : 'Unknown transfer error'
      }];

      this.transferHistory.set(cart.metadata.sourceProject, 
        [...(this.transferHistory.get(cart.metadata.sourceProject) || []), transfer]);

      this.notifyTransferComplete(transfer);
      throw error;
    }
  }

  async getTransferHistory(projectId: string): Promise<TransferOperation[]> {
    return this.transferHistory.get(projectId) || [];
  }

  // ===== EVENT HANDLING =====

  onCartChange(callback: (cart: ShoppingCart) => void): () => void {
    this.cartChangeListeners.add(callback);
    return () => this.cartChangeListeners.delete(callback);
  }

  onTransferComplete(callback: (operation: TransferOperation) => void): () => void {
    this.transferCompleteListeners.add(callback);
    return () => this.transferCompleteListeners.delete(callback);
  }

  // ===== PRIVATE HELPER METHODS =====

  private determineSourceType(path: string): DataShoppingItem['sourceType'] {
    if (path.includes('market_sizing')) return 'market_sizing';
    if (path.includes('customer_analysis')) return 'customer_segment';
    if (path.includes('pricing')) return 'pricing_data';
    if (path.includes('growth')) return 'growth_projection';
    return 'market_sizing'; // default
  }

  private calculateConfidence(value: any): number {
    // Simplified confidence calculation
    // In real implementation, this would consider data source quality,
    // completeness, and validation status
    if (!value || value.value === undefined || value.value === null) return 0.1;
    if (typeof value.value === 'number' && value.value > 0) return 0.85;
    return 0.7;
  }

  private applyModification(originalValue: any, modifications: Partial<any>): any {
    if (typeof originalValue === 'object' && originalValue !== null) {
      return {
        ...originalValue,
        ...modifications
      };
    }
    return modifications.value !== undefined ? modifications.value : modifications;
  }

  private isValidDataType(item: DataShoppingItem): boolean {
    // Basic type validation
    if (!item.originalValue) return false;
    if (item.modifiedValue && typeof item.modifiedValue !== typeof item.originalValue) {
      return false;
    }
    return true;
  }

  private isWithinBusinessRules(item: DataShoppingItem): boolean {
    const value = item.modifiedValue || item.originalValue;
    
    // Business rule validation based on data type
    if (item.sourceType === 'market_sizing' && typeof value?.value === 'number') {
      // Market size should be positive and reasonable
      return value.value > 0 && value.value < 1e12; // Less than 1 trillion
    }
    
    if (item.sourcePath.includes('percentage') && typeof value?.value === 'number') {
      // Percentages should be 0-100
      return value.value >= 0 && value.value <= 100;
    }

    return true;
  }

  private generateMappingSuggestion(item: DataShoppingItem): TransferSuggestion | null {
    // Generate intelligent mapping suggestions based on data type and path
    let suggestedMapping = '';
    let confidence = 0.8;

    if (item.sourcePath.includes('total_addressable_market')) {
      suggestedMapping = 'volume.market_size_assumption';
      confidence = 0.9;
    } else if (item.sourcePath.includes('customer_count')) {
      suggestedMapping = 'volume.target_customer_count';
      confidence = 0.85;
    } else if (item.sourcePath.includes('growth_rate')) {
      suggestedMapping = 'assumptions.market_growth_rate';
      confidence = 0.8;
    } else {
      return null; // No good suggestion
    }

    return {
      itemId: item.id,
      suggestedMapping,
      reason: `Semantic match for ${item.sourceType} data`,
      confidence
    };
  }

  private generateTargetMapping(items: DataShoppingItem[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    
    items.forEach(item => {
      const suggestion = this.generateMappingSuggestion(item);
      if (suggestion) {
        mapping[item.id] = suggestion.suggestedMapping;
      }
    });

    return mapping;
  }

  private async performTransfer(transfer: TransferOperation, targetProject: string): Promise<void> {
    // This is where the actual integration with business case system would happen
    // For now, we'll simulate the transfer
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In real implementation:
    // 1. Load target business case project
    // 2. Map source data to target fields using targetMapping
    // 3. Validate target data structure
    // 4. Update business case with new data
    // 5. Save changes with audit trail
    
    console.log(`Transfer executed: ${transfer.sourceData.length} items to project ${targetProject}`);
  }

  private notifyCartChange(cart: ShoppingCart): void {
    this.cartChangeListeners.forEach(listener => {
      try {
        listener(cart);
      } catch (error) {
        console.error('Error in cart change listener:', error);
      }
    });
  }

  private notifyTransferComplete(operation: TransferOperation): void {
    this.transferCompleteListeners.forEach(listener => {
      try {
        listener(operation);
      } catch (error) {
        console.error('Error in transfer complete listener:', error);
      }
    });
  }
}

// Export singleton instance
export const dataShoppingService = new DataShoppingService();
