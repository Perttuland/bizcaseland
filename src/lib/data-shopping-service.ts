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
  DataModification,
  ModificationAuditTrail,
  RollbackPoint,
  ModificationValidation,
  BusinessRuleValidation,
  DataConsistencyValidation,
  ModificationHistoryValidation,
  CrossValidationResult,
  DataExtractionTarget
} from '@/lib/data-shopping-types';

export class DataShoppingService implements IDataShoppingService {
  private carts = new Map<string, ShoppingCart>();
  private transferHistory = new Map<string, TransferOperation[]>();
  private cartChangeListeners = new Set<(cart: ShoppingCart) => void>();
  private transferCompleteListeners = new Set<(operation: TransferOperation) => void>();
  private auditTrails = new Map<string, Map<string, ModificationAuditTrail>>(); // cartId -> itemId -> audit trail
  private rollbackPoints = new Map<string, Map<string, RollbackPoint[]>>(); // cartId -> itemId -> rollback points

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

  async addToCart(cartId: string, dataPoint: MarketDataPoint): Promise<DataShoppingItem>;
  async addToCart(cartId: string, path: string, displayName: string, sourceData: any, sourceType: string): Promise<DataShoppingItem>;
  async addToCart(cartId: string, pathOrDataPoint: string | MarketDataPoint, displayName?: string, sourceData?: any, sourceType?: string): Promise<DataShoppingItem> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    let item: DataShoppingItem;

    if (typeof pathOrDataPoint === 'string') {
      // Method overload: addToCart(cartId, path, displayName, sourceData, sourceType)
      const path = pathOrDataPoint;
      const value = this.getNestedValue(sourceData, path);
      
      item = {
        id: nanoid(),
        sourceType: this.determineSourceType(path),
        sourcePath: path,
        displayName: displayName!,
        originalValue: value,
        modifiedValue: null,
        modifications: [],
        confidence: 0.85, // Default confidence for manual extraction
        rationale: `Extracted from ${sourceType} data`,
        timestamp: Date.now(),
        addedAt: Date.now()
      };
    } else {
      // Original method: addToCart(cartId, dataPoint)
      const dataPoint = pathOrDataPoint;
      item = {
        id: nanoid(),
        sourceType: this.determineSourceType(dataPoint.path),
        sourcePath: dataPoint.path,
        displayName: dataPoint.metadata.displayName,
        originalValue: dataPoint.value,
        modifiedValue: null,
        modifications: [],
        confidence: dataPoint.metadata.confidence,
        rationale: dataPoint.metadata.description,
        timestamp: Date.now(),
        addedAt: Date.now()
      };
    }

    cart.items.push(item);
    cart.metadata.lastModified = Date.now();

    this.carts.set(cartId, cart);
    this.notifyCartChange(cart);

    return item;
  }

  async extractMarketData(sourceData: any, targets: DataExtractionTarget[], cartId: string): Promise<DataShoppingItem[]> {
    const extractedItems: DataShoppingItem[] = [];
    
    for (const target of targets) {
      try {
        const value = this.getNestedValue(sourceData, target.path);
        if (value !== undefined) {
          const item = await this.addToCart(cartId, target.path, target.displayName, sourceData, 'market-analysis');
          extractedItems.push(item);
        }
      } catch (error) {
        console.warn(`Failed to extract data for ${target.path}:`, error);
      }
    }
    
    return extractedItems;
  }

  // Helper method to get nested values from objects
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
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

    // Validate modification first
    const validation = await this.validateModification(cartId, itemId, modifications);
    if (!validation.isValid) {
      throw new Error(`Modification validation failed: ${validation.errors.join(', ')}`);
    }

    // Create comprehensive modification record
    const modification: DataModification = {
      id: nanoid(),
      field: this.detectModifiedField(item.originalValue, modifications),
      originalValue: item.modifiedValue || item.originalValue,
      newValue: modifications.value || modifications,
      reason: modifications.reason || 'User modification',
      timestamp: Date.now(),
      userId: 'current-user', // In real implementation, get from auth context
      confidence: validation.confidence,
      validationPassed: validation.isValid,
      rollbackAvailable: true
    };

    // Create rollback point before modification
    await this.createRollbackPoint(cartId, itemId, `Auto-rollback before ${modification.field} change`);

    // Apply modification
    item.modifiedValue = this.applyModification(item.originalValue, modifications);
    item.modifications.push(modification);
    
    // Update audit trail
    await this.updateAuditTrail(cartId, itemId, modification, item);
    
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

    // Extract market share target data points (using actual market_share structure)
    if (marketData.market_share?.target_position) {
      if (marketData.market_share.target_position.target_share) {
        dataPoints.push({
          id: 'target-market-share',
          path: 'market_share.target_position.target_share',
          type: 'percentage',
          value: marketData.market_share.target_position.target_share,
          metadata: {
            displayName: 'Target Market Share',
            description: 'Projected market share target',
            unit: marketData.market_share.target_position.target_share.unit,
            confidence: this.calculateConfidence(marketData.market_share.target_position.target_share)
          }
        });
      }

      if (marketData.market_share.target_position.target_timeframe) {
        dataPoints.push({
          id: 'target-timeframe',
          path: 'market_share.target_position.target_timeframe',
          type: 'duration',
          value: marketData.market_share.target_position.target_timeframe,
          metadata: {
            displayName: 'Target Timeframe',
            description: 'Timeline to achieve market share target',
            unit: marketData.market_share.target_position.target_timeframe.unit,
            confidence: this.calculateConfidence(marketData.market_share.target_position.target_timeframe)
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

    // Extract customer analysis data points
    if (marketData.customer_analysis) {
      // Market segments
      if (marketData.customer_analysis.market_segments && Array.isArray(marketData.customer_analysis.market_segments)) {
        marketData.customer_analysis.market_segments.forEach((segment, index) => {
          dataPoints.push({
            id: `customer-segment-${index}-size`,
            path: `customer_analysis.market_segments[${index}].size_percentage`,
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
              id: `customer-segment-${index}-growth`,
              path: `customer_analysis.market_segments[${index}].growth_rate`,
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

          if (segment.target_share) {
            dataPoints.push({
              id: `customer-segment-${index}-target`,
              path: `customer_analysis.market_segments[${index}].target_share`,
              type: 'percentage',
              value: segment.target_share,
              metadata: {
                displayName: `${segment.name} Target Share`,
                description: `Target market share for ${segment.name} segment`,
                unit: segment.target_share.unit,
                confidence: this.calculateConfidence(segment.target_share)
              }
            });
          }
        });
      }

      // Customer economics
      if (marketData.customer_analysis.customer_economics) {
        const economics = marketData.customer_analysis.customer_economics;
        
        if (economics.average_customer_value?.annual_value) {
          dataPoints.push({
            id: 'customer-annual-value',
            path: 'customer_analysis.customer_economics.average_customer_value.annual_value',
            type: 'currency_value',
            value: economics.average_customer_value.annual_value,
            metadata: {
              displayName: 'Average Annual Customer Value',
              description: 'Average revenue per customer per year',
              unit: economics.average_customer_value.annual_value.unit,
              confidence: this.calculateConfidence(economics.average_customer_value.annual_value)
            }
          });
        }

        if (economics.average_customer_value?.lifetime_value) {
          dataPoints.push({
            id: 'customer-lifetime-value',
            path: 'customer_analysis.customer_economics.average_customer_value.lifetime_value',
            type: 'currency_value',
            value: economics.average_customer_value.lifetime_value,
            metadata: {
              displayName: 'Customer Lifetime Value',
              description: 'Total expected revenue from a customer over their lifetime',
              unit: economics.average_customer_value.lifetime_value.unit,
              confidence: this.calculateConfidence(economics.average_customer_value.lifetime_value)
            }
          });
        }

        if (economics.average_customer_value?.acquisition_cost) {
          dataPoints.push({
            id: 'customer-acquisition-cost',
            path: 'customer_analysis.customer_economics.average_customer_value.acquisition_cost',
            type: 'currency_value',
            value: economics.average_customer_value.acquisition_cost,
            metadata: {
              displayName: 'Customer Acquisition Cost',
              description: 'Average cost to acquire a new customer',
              unit: economics.average_customer_value.acquisition_cost.unit,
              confidence: this.calculateConfidence(economics.average_customer_value.acquisition_cost)
            }
          });
        }

        if (economics.customer_behavior?.loyalty_rate) {
          dataPoints.push({
            id: 'customer-loyalty-rate',
            path: 'customer_analysis.customer_economics.customer_behavior.loyalty_rate',
            type: 'percentage',
            value: economics.customer_behavior.loyalty_rate,
            metadata: {
              displayName: 'Customer Loyalty Rate',
              description: 'Percentage of customers who return for repeat purchases',
              unit: economics.customer_behavior.loyalty_rate.unit,
              confidence: this.calculateConfidence(economics.customer_behavior.loyalty_rate)
            }
          });
        }
      }
    }

    // Extract market dynamics data points (using actual structure)
    if (marketData.market_dynamics) {
      if (marketData.market_dynamics.growth_drivers && Array.isArray(marketData.market_dynamics.growth_drivers)) {
        marketData.market_dynamics.growth_drivers.forEach((driver, index) => {
          // Convert impact level to numeric score for shopping
          const impactScore = driver.impact === 'high' ? 3 : driver.impact === 'medium' ? 2 : 1;
          
          dataPoints.push({
            id: `growth-driver-${index}-impact`,
            path: `market_dynamics.growth_drivers[${index}].impact`,
            type: 'numeric',
            value: { value: impactScore, unit: 'score' },
            metadata: {
              displayName: `${driver.driver} Impact`,
              description: `Impact level for growth driver: ${driver.driver}`,
              unit: 'score',
              confidence: this.calculateConfidence({ value: impactScore })
            }
          });
        });
      }

      if (marketData.market_dynamics.market_risks && Array.isArray(marketData.market_dynamics.market_risks)) {
        marketData.market_dynamics.market_risks.forEach((risk, index) => {
          // Convert risk probability and impact to numeric scores
          const probabilityScore = risk.probability === 'high' ? 3 : risk.probability === 'medium' ? 2 : 1;
          const impactScore = risk.impact === 'high' ? 3 : risk.impact === 'medium' ? 2 : 1;
          
          dataPoints.push({
            id: `market-risk-${index}-probability`,
            path: `market_dynamics.market_risks[${index}].probability`,
            type: 'numeric',
            value: { value: probabilityScore, unit: 'score' },
            metadata: {
              displayName: `${risk.risk} Risk Probability`,
              description: `Probability score for market risk: ${risk.risk}`,
              unit: 'score',
              confidence: this.calculateConfidence({ value: probabilityScore })
            }
          });
        });
      }
    }

    // Extract volume projections and sensitivity analysis
    if (marketData.volume_projections) {
      if (marketData.volume_projections.sensitivity_factors && Array.isArray(marketData.volume_projections.sensitivity_factors)) {
        marketData.volume_projections.sensitivity_factors.forEach((factor, index) => {
          // Extract base case scenario data
          if (factor.base_case !== undefined) {
            dataPoints.push({
              id: `sensitivity-${index}-base`,
              path: `volume_projections.sensitivity_factors[${index}].base_case`,
              type: 'scenario_value',
              value: { value: factor.base_case, unit: 'base_case', rationale: factor.rationale },
              metadata: {
                displayName: `${factor.factor} Base Case`,
                description: `Base case scenario for sensitivity factor: ${factor.factor}`,
                unit: 'base_case',
                confidence: this.calculateConfidence({ value: factor.base_case })
              }
            });
          }

          // Extract optimistic scenario data
          if (factor.optimistic !== undefined) {
            dataPoints.push({
              id: `sensitivity-${index}-optimistic`,
              path: `volume_projections.sensitivity_factors[${index}].optimistic`,
              type: 'scenario_value',
              value: { value: factor.optimistic, unit: 'optimistic', rationale: factor.rationale },
              metadata: {
                displayName: `${factor.factor} Optimistic`,
                description: `Optimistic scenario for sensitivity factor: ${factor.factor}`,
                unit: 'optimistic',
                confidence: this.calculateConfidence({ value: factor.optimistic })
              }
            });
          }

          // Extract pessimistic scenario data
          if (factor.pessimistic !== undefined) {
            dataPoints.push({
              id: `sensitivity-${index}-pessimistic`,
              path: `volume_projections.sensitivity_factors[${index}].pessimistic`,
              type: 'scenario_value',
              value: { value: factor.pessimistic, unit: 'pessimistic', rationale: factor.rationale },
              metadata: {
                displayName: `${factor.factor} Pessimistic`,
                description: `Pessimistic scenario for sensitivity factor: ${factor.factor}`,
                unit: 'pessimistic',
                confidence: this.calculateConfidence({ value: factor.pessimistic })
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

    // Enhanced search with multiple criteria
    return allDataPoints.filter(point => {
      // Basic text matching
      const textMatch = 
        point.metadata.displayName.toLowerCase().includes(lowercaseQuery) ||
        point.metadata.description.toLowerCase().includes(lowercaseQuery) ||
        point.path.toLowerCase().includes(lowercaseQuery);

      // Category-based matching
      const categoryMatch = this.matchesCategory(point, lowercaseQuery);

      // Value type matching
      const typeMatch = point.type.toLowerCase().includes(lowercaseQuery);

      return textMatch || categoryMatch || typeMatch;
    });
  }

  async filterDataPointsByCategory(marketData: MarketData, category: string): Promise<MarketDataPoint[]> {
    const allDataPoints = await this.getAvailableDataPoints(marketData);
    
    return allDataPoints.filter(point => {
      const pathSegments = point.path.split('.');
      return pathSegments[0] === category || this.determineSourceType(point.path) === category;
    });
  }

  async getDataPointsByConfidence(marketData: MarketData, minConfidence: number = 0.7): Promise<MarketDataPoint[]> {
    const allDataPoints = await this.getAvailableDataPoints(marketData);
    
    return allDataPoints.filter(point => point.metadata.confidence >= minConfidence);
  }

  // ===== VALIDATION & TRANSFER =====

  async validateTransfer(cart: ShoppingCart, targetProject: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: TransferSuggestion[] = [];

    // Comprehensive cart validation
    if (cart.items.length === 0) {
      errors.push({
        itemId: 'cart',
        field: 'items',
        message: 'Cannot transfer empty cart',
        severity: 'error'
      });
    }

    // Check for invalid or abandoned status
    if (cart.status === 'abandoned') {
      errors.push({
        itemId: 'cart',
        field: 'status',
        message: 'Cannot transfer abandoned cart',
        severity: 'error'
      });
    }

    // Validate target project
    if (!targetProject || targetProject.trim().length === 0) {
      errors.push({
        itemId: 'transfer',
        field: 'targetProject',
        message: 'Target project is required',
        severity: 'error'
      });
    }

    // Validate each cart item with enhanced business rules
    for (const item of cart.items) {
      // Type validation with detailed error reporting
      if (!this.isValidDataType(item)) {
        errors.push({
          itemId: item.id,
          field: 'type',
          message: `Data type validation failed for ${item.sourcePath}: ${this.getTypeValidationDetails(item)}`,
          severity: 'error'
        });
      }

      // Enhanced business rules validation
      const businessRuleValidation = this.validateBusinessRules(item);
      if (!businessRuleValidation.isValid) {
        errors.push({
          itemId: item.id,
          field: 'value',
          message: `Business rule violations: ${businessRuleValidation.violations.join(', ')}`,
          severity: 'error'
        });
      }

      if (businessRuleValidation.warnings.length > 0) {
        warnings.push({
          itemId: item.id,
          field: 'value',
          message: `Business rule warnings: ${businessRuleValidation.warnings.join(', ')}`,
          impact: 'medium'
        });
      }

      // Data consistency validation
      const consistencyValidation = this.validateDataConsistency(item, cart.items);
      if (!consistencyValidation.isValid) {
        warnings.push({
          itemId: item.id,
          field: 'consistency',
          message: `Data consistency issues: ${consistencyValidation.issues.join(', ')}`,
          impact: 'high'
        });
      }

      // Modification history validation
      if (item.modifications.length > 0) {
        const modificationValidation = this.validateModificationHistory(item);
        if (!modificationValidation.isValid) {
          warnings.push({
            itemId: item.id,
            field: 'modifications',
            message: `Modification concerns: ${modificationValidation.concerns.join(', ')}`,
            impact: 'low'
          });
        }
      }

      // Enhanced mapping suggestions with confidence scoring
      const suggestion = this.generateEnhancedMappingSuggestion(item, targetProject);
      if (suggestion) {
        suggestions.push(suggestion);
      } else {
        warnings.push({
          itemId: item.id,
          field: 'mapping',
          message: `No automatic mapping available for ${item.sourcePath}. Manual mapping required.`,
          impact: 'medium'
        });
      }

      // Check for conflicting data points
      const conflicts = this.detectDataConflicts(item, cart.items);
      if (conflicts.length > 0) {
        warnings.push({
          itemId: item.id,
          field: 'conflicts',
          message: `Potential conflicts with: ${conflicts.join(', ')}`,
          impact: 'high'
        });
      }
    }

    // Cross-validation between items
    const crossValidation = this.performCrossValidation(cart.items);
    if (!crossValidation.isValid) {
      warnings.push({
        itemId: 'cross-validation',
        field: 'relationships',
        message: `Cross-validation warnings: ${crossValidation.warnings.join(', ')}`,
        impact: 'medium'
      });
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

  // ===== MODIFICATION & AUDIT TRAIL =====

  async getModificationHistory(cartId: string, itemId: string): Promise<ModificationAuditTrail> {
    const cartAuditTrails = this.auditTrails.get(cartId) || new Map();
    const auditTrail = cartAuditTrails.get(itemId);
    
    if (!auditTrail) {
      // Create initial audit trail if none exists
      const cart = this.carts.get(cartId);
      const item = cart?.items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error(`Item ${itemId} not found in cart ${cartId}`);
      }

      const newAuditTrail: ModificationAuditTrail = {
        itemId,
        modifications: item.modifications,
        currentState: item.modifiedValue || item.originalValue,
        originalState: item.originalValue,
        totalModifications: item.modifications.length,
        lastModified: item.modifications.length > 0 ? 
          Math.max(...item.modifications.map(m => m.timestamp)) : item.timestamp,
        rollbackPoints: this.rollbackPoints.get(cartId)?.get(itemId) || []
      };

      cartAuditTrails.set(itemId, newAuditTrail);
      this.auditTrails.set(cartId, cartAuditTrails);
      return newAuditTrail;
    }

    return auditTrail;
  }

  async validateModification(cartId: string, itemId: string, modifications: Partial<any>): Promise<ModificationValidation> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in cart`);
    }

    const warnings: string[] = [];
    const errors: string[] = [];
    const businessRuleViolations: string[] = [];
    const dataTypeIssues: string[] = [];

    // Type validation
    const originalType = typeof (item.modifiedValue || item.originalValue)?.value;
    const newType = typeof modifications.value;
    
    if (originalType !== newType && modifications.value !== undefined) {
      dataTypeIssues.push(`Type mismatch: original is ${originalType}, new value is ${newType}`);
      errors.push(`Cannot change data type from ${originalType} to ${newType}`);
    }

    // Business rules validation
    if (modifications.value !== undefined) {
      const currentValue = item.modifiedValue || item.originalValue;
      
      // Percentage validation
      if (item.sourcePath.includes('percentage') && typeof modifications.value === 'number') {
        if (modifications.value < 0 || modifications.value > 100) {
          businessRuleViolations.push('Percentage values must be between 0 and 100');
          errors.push('Invalid percentage value');
        }
      }

      // Currency validation
      if (currentValue?.unit?.includes('USD') || currentValue?.unit?.includes('EUR')) {
        if (typeof modifications.value !== 'number' || modifications.value < 0) {
          businessRuleViolations.push('Currency values must be positive numbers');
          errors.push('Invalid currency value');
        }
      }

      // Market share validation
      if (item.sourcePath.includes('market_share') && typeof modifications.value === 'number') {
        if (modifications.value > 100) {
          businessRuleViolations.push('Market share cannot exceed 100%');
          warnings.push('Market share above 100% is unrealistic');
        }
      }

      // Confidence scoring based on deviation from original
      const originalVal = typeof currentValue?.value === 'number' ? currentValue.value : 0;
      const newVal = typeof modifications.value === 'number' ? modifications.value : 0;
      const deviation = Math.abs((newVal - originalVal) / originalVal) * 100;
      
      if (deviation > 50) {
        warnings.push(`Large deviation from original value (${deviation.toFixed(1)}%)`);
      }
    }

    // Rationale validation
    if (!modifications.reason || modifications.reason.trim().length < 10) {
      warnings.push('Consider providing a more detailed rationale for this modification');
    }

    // Calculate confidence score
    let confidence = 0.8; // Base confidence
    if (errors.length > 0) confidence = 0.2;
    else if (businessRuleViolations.length > 0) confidence = 0.4;
    else if (warnings.length > 2) confidence = 0.6;
    else if (warnings.length > 0) confidence = 0.7;

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      confidence,
      businessRuleViolations,
      dataTypeIssues
    };
  }

  async createRollbackPoint(cartId: string, itemId: string, reason: string): Promise<RollbackPoint> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in cart`);
    }

    const rollbackPoint: RollbackPoint = {
      id: nanoid(),
      timestamp: Date.now(),
      state: JSON.parse(JSON.stringify(item.modifiedValue || item.originalValue)),
      reason,
      automatic: reason.includes('Auto-rollback')
    };

    // Ensure rollback points map exists
    if (!this.rollbackPoints.has(cartId)) {
      this.rollbackPoints.set(cartId, new Map());
    }
    
    const cartRollbacks = this.rollbackPoints.get(cartId)!;
    if (!cartRollbacks.has(itemId)) {
      cartRollbacks.set(itemId, []);
    }

    const itemRollbacks = cartRollbacks.get(itemId)!;
    itemRollbacks.push(rollbackPoint);

    // Keep only last 10 rollback points to avoid memory bloat
    if (itemRollbacks.length > 10) {
      itemRollbacks.shift();
    }

    cartRollbacks.set(itemId, itemRollbacks);
    this.rollbackPoints.set(cartId, cartRollbacks);

    return rollbackPoint;
  }

  async rollbackToPoint(cartId: string, itemId: string, rollbackPointId: string): Promise<DataShoppingItem> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in cart`);
    }

    const rollbackPoints = this.rollbackPoints.get(cartId)?.get(itemId) || [];
    const rollbackPoint = rollbackPoints.find(rp => rp.id === rollbackPointId);
    
    if (!rollbackPoint) {
      throw new Error(`Rollback point ${rollbackPointId} not found`);
    }

    // Create modification record for rollback
    const rollbackModification: DataModification = {
      id: nanoid(),
      field: 'rollback',
      originalValue: item.modifiedValue || item.originalValue,
      newValue: rollbackPoint.state,
      reason: `Rollback to: ${rollbackPoint.reason}`,
      timestamp: Date.now(),
      userId: 'current-user',
      confidence: 0.9, // High confidence for rollbacks
      validationPassed: true,
      rollbackAvailable: true
    };

    // Apply rollback
    item.modifiedValue = rollbackPoint.state;
    item.modifications.push(rollbackModification);

    // Update audit trail
    await this.updateAuditTrail(cartId, itemId, rollbackModification, item);

    cart.metadata.lastModified = Date.now();
    this.carts.set(cartId, cart);
    this.notifyCartChange(cart);

    return item;
  }

  async getAvailableRollbackPoints(cartId: string, itemId: string): Promise<RollbackPoint[]> {
    const rollbackPoints = this.rollbackPoints.get(cartId)?.get(itemId) || [];
    return [...rollbackPoints].reverse(); // Return newest first
  }

  // ===== PRIVATE HELPER METHODS =====

  private determineSourceType(path: string): DataShoppingItem['sourceType'] {
    if (path.includes('market_sizing')) return 'market_sizing';
    if (path.includes('customer_analysis')) return 'customer_segment';
    if (path.includes('pricing')) return 'pricing_data';
    if (path.includes('growth')) return 'growth_projection';
    return 'market_sizing'; // default
  }

  private matchesCategory(point: MarketDataPoint, query: string): boolean {
    const pathCategories = {
      'market': ['market_sizing', 'market_share', 'market_dynamics'],
      'customer': ['customer_analysis', 'customer_segment'],
      'competitive': ['competitive_landscape'],
      'pricing': ['pricing_strategy', 'pricing_data'],
      'growth': ['growth_drivers', 'growth_rate'],
      'risk': ['market_risks', 'barriers'],
      'volume': ['volume_projections', 'sensitivity_factors'],
      'revenue': ['annual_value', 'lifetime_value'],
      'cost': ['acquisition_cost'],
      'behavior': ['customer_behavior', 'loyalty_rate', 'referral_rate']
    };

    for (const [category, keywords] of Object.entries(pathCategories)) {
      if (query.includes(category)) {
        return keywords.some(keyword => point.path.includes(keyword));
      }
    }

    return false;
  }

  private async updateAuditTrail(cartId: string, itemId: string, modification: DataModification, item: DataShoppingItem): Promise<void> {
    // Ensure audit trail maps exist
    if (!this.auditTrails.has(cartId)) {
      this.auditTrails.set(cartId, new Map());
    }
    
    const cartAuditTrails = this.auditTrails.get(cartId)!;
    
    // Get or create audit trail for this item
    let auditTrail = cartAuditTrails.get(itemId);
    if (!auditTrail) {
      auditTrail = {
        itemId,
        modifications: [],
        currentState: item.originalValue,
        originalState: item.originalValue,
        totalModifications: 0,
        lastModified: item.timestamp,
        rollbackPoints: []
      };
    }

    // Update audit trail
    auditTrail.modifications.push(modification);
    auditTrail.currentState = item.modifiedValue || item.originalValue;
    auditTrail.totalModifications = auditTrail.modifications.length;
    auditTrail.lastModified = modification.timestamp;
    auditTrail.rollbackPoints = this.rollbackPoints.get(cartId)?.get(itemId) || [];

    cartAuditTrails.set(itemId, auditTrail);
    this.auditTrails.set(cartId, cartAuditTrails);
  }

  private detectModifiedField(originalValue: any, modifications: Partial<any>): string {
    if (modifications.value !== undefined) return 'value';
    if (modifications.unit !== undefined) return 'unit';
    if (modifications.rationale !== undefined) return 'rationale';
    if (modifications.confidence !== undefined) return 'confidence';
    
    // Try to detect based on object structure
    if (typeof originalValue === 'object' && originalValue !== null) {
      const keys = Object.keys(modifications);
      if (keys.length > 0) {
        return keys[0]; // Return first modified key
      }
    }
    
    return 'value'; // default
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

  private getTypeValidationDetails(item: DataShoppingItem): string {
    const original = item.originalValue;
    const modified = item.modifiedValue;
    
    if (!original) return 'Original value is missing';
    if (!modified) return 'No type issues';
    
    const originalType = typeof original?.value;
    const modifiedType = typeof modified?.value;
    
    if (originalType !== modifiedType) {
      return `Type changed from ${originalType} to ${modifiedType}`;
    }
    
    return 'Type validation passed';
  }

  private validateBusinessRules(item: DataShoppingItem): BusinessRuleValidation {
    const violations: string[] = [];
    const warnings: string[] = [];
    const value = item.modifiedValue || item.originalValue;

    // Market sizing validations
    if (item.sourceType === 'market_sizing' && typeof value?.value === 'number') {
      if (value.value <= 0) {
        violations.push('Market size must be positive');
      }
      if (value.value > 1e12) {
        violations.push('Market size exceeds reasonable bounds (1 trillion)');
      }
      if (value.value > 1e10) {
        warnings.push('Very large market size - please verify');
      }
    }

    // Percentage validations
    if (item.sourcePath.includes('percentage') && typeof value?.value === 'number') {
      if (value.value < 0) {
        violations.push('Percentages cannot be negative');
      }
      if (value.value > 100) {
        violations.push('Percentages cannot exceed 100%');
      }
      if (value.value > 50 && item.sourcePath.includes('market_share')) {
        warnings.push('Market share above 50% may be unrealistic');
      }
    }

    // Currency validations
    if (value?.unit && (value.unit.includes('USD') || value.unit.includes('EUR'))) {
      if (typeof value.value !== 'number' || value.value < 0) {
        violations.push('Currency values must be positive numbers');
      }
    }

    // Growth rate validations
    if (item.sourcePath.includes('growth_rate') && typeof value?.value === 'number') {
      if (value.value < -100) {
        violations.push('Growth rate cannot be less than -100%');
      }
      if (value.value > 1000) {
        warnings.push('Growth rate above 1000% seems unrealistic');
      }
    }

    // Customer metrics validations
    if (item.sourcePath.includes('customer') && typeof value?.value === 'number') {
      if (value.value < 0) {
        violations.push('Customer metrics cannot be negative');
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  private validateDataConsistency(item: DataShoppingItem, allItems: DataShoppingItem[]): DataConsistencyValidation {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const value = item.modifiedValue || item.originalValue;

    // Check for TAM > SAM > SOM consistency
    if (item.sourcePath.includes('total_addressable_market')) {
      const samItem = allItems.find(i => i.sourcePath.includes('serviceable_addressable_market'));
      const somItem = allItems.find(i => i.sourcePath.includes('serviceable_obtainable_market'));
      
      if (samItem && somItem) {
        const tamValue = value?.value || 0;
        const samValue = (samItem.modifiedValue || samItem.originalValue)?.value || 0;
        const somValue = (somItem.modifiedValue || somItem.originalValue)?.value || 0;
        
        if (samValue > tamValue) {
          issues.push('SAM cannot be larger than TAM');
        }
        if (somValue > samValue) {
          issues.push('SOM cannot be larger than SAM');
        }
      }
    }

    // Check percentage consistency
    if (item.sourcePath.includes('percentage')) {
      const relatedItems = allItems.filter(i => 
        i.sourcePath.includes('percentage') && 
        i.sourcePath !== item.sourcePath &&
        i.sourcePath.includes(item.sourcePath.split('.')[0])
      );
      
      if (relatedItems.length > 0) {
        const totalPercentage = relatedItems.reduce((sum, i) => {
          const val = (i.modifiedValue || i.originalValue)?.value || 0;
          return sum + val;
        }, value?.value || 0);
        
        if (totalPercentage > 100) {
          issues.push('Related percentages sum to more than 100%');
          suggestions.push('Consider adjusting related percentage values');
        }
      }
    }

    // Check customer economics consistency
    if (item.sourcePath.includes('customer_economics')) {
      const ltv = allItems.find(i => i.sourcePath.includes('lifetime_value'));
      const cac = allItems.find(i => i.sourcePath.includes('acquisition_cost'));
      
      if (ltv && cac) {
        const ltvValue = (ltv.modifiedValue || ltv.originalValue)?.value || 0;
        const cacValue = (cac.modifiedValue || cac.originalValue)?.value || 0;
        
        if (cacValue > ltvValue) {
          issues.push('Customer acquisition cost exceeds lifetime value');
          suggestions.push('Review customer economics model');
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  private validateModificationHistory(item: DataShoppingItem): ModificationHistoryValidation {
    const concerns: string[] = [];
    let confidence = 0.9;

    if (item.modifications.length > 5) {
      concerns.push('Item has been modified many times');
      confidence -= 0.2;
    }

    // Check for recent modifications
    const recentMods = item.modifications.filter(m => 
      Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );
    
    if (recentMods.length > 3) {
      concerns.push('Multiple recent modifications detected');
      confidence -= 0.1;
    }

    // Check for low-confidence modifications
    const lowConfidenceMods = item.modifications.filter(m => m.confidence < 0.5);
    if (lowConfidenceMods.length > 0) {
      concerns.push('Contains low-confidence modifications');
      confidence -= 0.3;
    }

    // Check for validation failures
    const failedValidations = item.modifications.filter(m => !m.validationPassed);
    if (failedValidations.length > 0) {
      concerns.push('Contains modifications that failed validation');
      confidence -= 0.4;
    }

    return {
      isValid: concerns.length === 0,
      concerns,
      confidence: Math.max(0.1, confidence)
    };
  }

  private generateEnhancedMappingSuggestion(item: DataShoppingItem, targetProject: string): TransferSuggestion | null {
    // Enhanced mapping with project-specific logic
    let suggestedMapping = '';
    let confidence = 0.8;
    let reason = '';

    // Market sizing mappings
    if (item.sourcePath.includes('total_addressable_market.base_value')) {
      suggestedMapping = 'volume.market_size_assumptions.total_addressable_market';
      confidence = 0.95;
      reason = 'Direct TAM mapping for volume calculations';
    } else if (item.sourcePath.includes('serviceable_addressable_market')) {
      suggestedMapping = 'volume.market_size_assumptions.serviceable_addressable_market';
      confidence = 0.9;
      reason = 'SAM mapping for realistic volume estimation';
    } else if (item.sourcePath.includes('serviceable_obtainable_market')) {
      suggestedMapping = 'volume.target_market_share.achievable_market';
      confidence = 0.85;
      reason = 'SOM mapping to achievable market calculations';
    }

    // Customer economics mappings
    else if (item.sourcePath.includes('lifetime_value')) {
      suggestedMapping = 'revenue.customer_value.lifetime_value';
      confidence = 0.9;
      reason = 'Customer LTV for revenue projections';
    } else if (item.sourcePath.includes('acquisition_cost')) {
      suggestedMapping = 'costs.customer_acquisition.average_cost';
      confidence = 0.85;
      reason = 'CAC for customer acquisition cost modeling';
    } else if (item.sourcePath.includes('annual_value')) {
      suggestedMapping = 'revenue.customer_value.annual_revenue_per_customer';
      confidence = 0.88;
      reason = 'Annual customer value for revenue calculations';
    }

    // Market share and growth mappings
    else if (item.sourcePath.includes('market_share.target_position.target_share')) {
      suggestedMapping = 'volume.target_market_share.percentage';
      confidence = 0.92;
      reason = 'Target market share for volume projections';
    } else if (item.sourcePath.includes('growth_rate')) {
      suggestedMapping = 'assumptions.market_growth_rate';
      confidence = 0.8;
      reason = 'Market growth rate for trend analysis';
    }

    // Competitive and pricing mappings
    else if (item.sourcePath.includes('competitive_landscape') && item.sourcePath.includes('pricing')) {
      suggestedMapping = 'pricing.competitive_benchmarks.average_price';
      confidence = 0.75;
      reason = 'Competitive pricing for pricing strategy';
    }

    // Customer segment mappings
    else if (item.sourcePath.includes('customer_analysis.market_segments')) {
      if (item.sourcePath.includes('size_percentage')) {
        suggestedMapping = 'volume.customer_segments.segment_size';
        confidence = 0.8;
        reason = 'Customer segment size for volume allocation';
      } else if (item.sourcePath.includes('target_share')) {
        suggestedMapping = 'volume.customer_segments.target_penetration';
        confidence = 0.75;
        reason = 'Target penetration per customer segment';
      }
    }

    // Scenario analysis mappings
    else if (item.sourcePath.includes('sensitivity_factors')) {
      if (item.sourcePath.includes('optimistic')) {
        suggestedMapping = 'scenarios.optimistic_case.market_assumptions';
        confidence = 0.7;
        reason = 'Optimistic scenario market assumptions';
      } else if (item.sourcePath.includes('pessimistic')) {
        suggestedMapping = 'scenarios.pessimistic_case.market_assumptions';
        confidence = 0.7;
        reason = 'Pessimistic scenario market assumptions';
      } else if (item.sourcePath.includes('base_case')) {
        suggestedMapping = 'scenarios.base_case.market_assumptions';
        confidence = 0.8;
        reason = 'Base case scenario market assumptions';
      }
    }

    if (!suggestedMapping) {
      return null;
    }

    return {
      itemId: item.id,
      suggestedMapping,
      reason,
      confidence
    };
  }

  private detectDataConflicts(item: DataShoppingItem, allItems: DataShoppingItem[]): string[] {
    const conflicts: string[] = [];
    const value = item.modifiedValue || item.originalValue;

    // Check for conflicting market size values
    if (item.sourcePath.includes('market_sizing')) {
      const conflictingItems = allItems.filter(other => 
        other.id !== item.id &&
        other.sourcePath.includes('market_sizing') &&
        this.valuesConflict(value, other.modifiedValue || other.originalValue)
      );
      
      conflicts.push(...conflictingItems.map(conflictItem => conflictItem.sourcePath));
    }

    // Check for conflicting percentage allocations
    if (item.sourcePath.includes('percentage')) {
      const sameCategory = allItems.filter(other =>
        other.id !== item.id &&
        other.sourcePath.includes('percentage') &&
        this.getCategoryFromPath(other.sourcePath) === this.getCategoryFromPath(item.sourcePath)
      );
      
      const totalPercentage = sameCategory.reduce((sum, other) => {
        const otherValue = (other.modifiedValue || other.originalValue)?.value || 0;
        return sum + otherValue;
      }, value?.value || 0);
      
      if (totalPercentage > 100) {
        conflicts.push(...sameCategory.map(other => other.sourcePath));
      }
    }

    return conflicts;
  }

  private performCrossValidation(items: DataShoppingItem[]): CrossValidationResult {
    const warnings: string[] = [];
    const relationships: string[] = [];

    // Validate TAM/SAM/SOM hierarchy
    const tamItem = items.find(i => i.sourcePath.includes('total_addressable_market'));
    const samItem = items.find(i => i.sourcePath.includes('serviceable_addressable_market'));
    const somItem = items.find(i => i.sourcePath.includes('serviceable_obtainable_market'));

    if (tamItem && samItem && somItem) {
      relationships.push('TAM-SAM-SOM hierarchy validation');
      
      const tamValue = (tamItem.modifiedValue || tamItem.originalValue)?.value || 0;
      const samPercentage = (samItem.modifiedValue || samItem.originalValue)?.value || 0;
      const somPercentage = (somItem.modifiedValue || somItem.originalValue)?.value || 0;
      
      if (samPercentage > 100 || somPercentage > 100) {
        warnings.push('Market sizing percentages exceed 100%');
      }
      
      const impliedSam = tamValue * (samPercentage / 100);
      const impliedSom = impliedSam * (somPercentage / 100);
      
      if (impliedSom < 1000 && tamValue > 1000000) {
        warnings.push('Very small SOM relative to TAM - review market sizing');
      }
    }

    // Validate customer economics
    const ltvItems = items.filter(i => i.sourcePath.includes('lifetime_value'));
    const cacItems = items.filter(i => i.sourcePath.includes('acquisition_cost'));
    
    if (ltvItems.length > 0 && cacItems.length > 0) {
      relationships.push('Customer economics validation');
      
      ltvItems.forEach(ltv => {
        cacItems.forEach(cac => {
          const ltvValue = (ltv.modifiedValue || ltv.originalValue)?.value || 0;
          const cacValue = (cac.modifiedValue || cac.originalValue)?.value || 0;
          
          if (cacValue > ltvValue) {
            warnings.push('Customer acquisition cost exceeds lifetime value');
          }
          
          const ratio = ltvValue / cacValue;
          if (ratio < 3) {
            warnings.push('LTV:CAC ratio below recommended 3:1 threshold');
          }
        });
      });
    }

    // Validate growth consistency
    const growthItems = items.filter(i => i.sourcePath.includes('growth_rate'));
    if (growthItems.length > 1) {
      relationships.push('Growth rate consistency check');
      
      const growthRates = growthItems.map(item => 
        (item.modifiedValue || item.originalValue)?.value || 0
      );
      
      const maxGrowth = Math.max(...growthRates);
      const minGrowth = Math.min(...growthRates);
      
      if (maxGrowth - minGrowth > 50) {
        warnings.push('Large variance in growth rates across different metrics');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      relationships
    };
  }

  private valuesConflict(value1: any, value2: any): boolean {
    if (!value1 || !value2) return false;
    
    const val1 = value1.value || value1;
    const val2 = value2.value || value2;
    
    if (typeof val1 !== 'number' || typeof val2 !== 'number') return false;
    
    const difference = Math.abs(val1 - val2) / Math.max(val1, val2);
    return difference > 0.5; // Consider values conflicting if they differ by more than 50%
  }

  private getCategoryFromPath(path: string): string {
    const segments = path.split('.');
    return segments[0] || 'unknown';
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
