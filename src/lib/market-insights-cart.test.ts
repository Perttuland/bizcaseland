/**
 * Market Insights Cart Service Tests
 * 
 * Comprehensive test suite for the market insights cart functionality,
 * covering cart operations, insight extraction, validation, and transfer operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketInsightsCartService } from './market-insights-cart-service';
import { 
  VolumeProjectionInsight,
  MarketSizingInsight,
  CustomerSegmentInsight,
  CartValidationResult,
  TransferResult,
  DEFAULT_CART_CONFIG
} from './market-insights-cart';
import { MarketData } from './market-calculations';
import { BusinessData } from '@/contexts/BusinessDataContext';

// ===== TEST DATA =====

const mockMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "Test SaaS Platform Analysis",
    description: "Test market analysis for SaaS platform",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: "2024-01-01",
    analyst: "Test Analyst"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 2500000, 
        unit: "EUR", 
        rationale: "European SMB market size" 
      },
      growth_rate: { 
        value: 8, 
        unit: "percentage_per_year", 
        rationale: "Industry growth rate" 
      },
      market_definition: "SMB customer service software",
      data_sources: ["Industry report", "Government data"]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 60, 
        unit: "percentage", 
        rationale: "Addressable portion" 
      },
      geographic_constraints: "EU market",
      regulatory_constraints: "GDPR compliance",
      capability_constraints: "Technical capabilities"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 30, 
        unit: "percentage", 
        rationale: "Realistic obtainable market" 
      },
      resource_constraints: "Financial limitations",
      competitive_barriers: "Established competition",
      time_constraints: "Market timing"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "New market entry" 
      },
      market_entry_date: "2024-01-01",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "Pre-launch" 
      }
    },
    target_position: {
      target_share: { 
        value: 8, 
        unit: "percentage", 
        rationale: "5-year target" 
      },
      target_timeframe: {
        value: 5,
        unit: "years",
        rationale: "5-year strategic plan"
      },
      penetration_strategy: "linear" as const,
      key_milestones: [
        {
          year: 1,
          milestone: "Market entry",
          target_share: 1,
          rationale: "Initial market penetration"
        },
        {
          year: 5,
          milestone: "Target achievement",
          target_share: 8,
          rationale: "5-year target achievement"
        }
      ]
    }
  },
  competitive_landscape: {
    competitors: [
      {
        name: "Competitor A",
        market_share: { 
          value: 25, 
          unit: "percentage", 
          rationale: "Market leader" 
        },
        positioning: "Premium solution",
        strengths: ["Brand recognition", "Feature completeness"],
        weaknesses: ["High price", "Complex setup"],
        threat_level: "high" as const,
        competitive_response: "Price competition"
      }
    ],
    competitive_advantages: [
      {
        advantage: "AI-powered analytics",
        sustainability: "high",
        rationale: "Proprietary technology"
      }
    ]
  },
  customer_analysis: {
    market_segments: [
      {
        id: "smb_tech",
        name: "SMB Tech Companies",
        size_percentage: { 
          value: 40, 
          unit: "percentage", 
          rationale: "Largest segment" 
        },
        growth_rate: { 
          value: 12, 
          unit: "percentage_per_year", 
          rationale: "High growth segment" 
        },
        target_share: { 
          value: 15, 
          unit: "percentage", 
          rationale: "Primary target" 
        },
        customer_profile: "Technology companies with 10-100 employees",
        value_drivers: ["Cost efficiency", "Scalability"],
        entry_strategy: "Direct sales"
      },
      {
        id: "retail_chains",
        name: "Retail Chains",
        size_percentage: { 
          value: 30, 
          unit: "percentage", 
          rationale: "Secondary segment" 
        },
        growth_rate: { 
          value: 6, 
          unit: "percentage_per_year", 
          rationale: "Moderate growth" 
        },
        target_share: { 
          value: 8, 
          unit: "percentage", 
          rationale: "Secondary target" 
        },
        customer_profile: "Multi-location retail businesses",
        value_drivers: ["Customer service", "Integration"],
        entry_strategy: "Partner channel"
      }
    ],
    customer_economics: {
      average_customer_value: {
        annual_value: { 
          value: 2400, 
          unit: "EUR_per_customer_per_year", 
          rationale: "Average subscription value" 
        },
        lifetime_value: { 
          value: 7200, 
          unit: "EUR_per_customer", 
          rationale: "3-year average lifetime" 
        },
        acquisition_cost: { 
          value: 600, 
          unit: "EUR_per_customer", 
          rationale: "Marketing and sales costs" 
        }
      },
      customer_behavior: {
        purchase_frequency: { 
          value: 1, 
          unit: "purchases_per_year", 
          rationale: "Annual subscription model" 
        },
        loyalty_rate: {
          value: 85,
          unit: "percentage",
          rationale: "High customer loyalty in SaaS"
        },
        referral_rate: {
          value: 15,
          unit: "percentage",
          rationale: "Word-of-mouth referrals"
        }
      }
    }
  }
} as MarketData;

const mockBusinessData: BusinessData = {
  meta: {
    title: "Test Business Case",
    description: "Test business case",
    currency: "EUR",
    periods: 60,
    business_model: "recurring" as const
  },
  assumptions: {
    customers: {
      segments: [
        {
          id: "test_segment",
          label: "Test Segment",
          rationale: "Test segment rationale",
          volume: {
            type: "pattern" as const,
            pattern_type: "linear_growth" as const,
            base_year_total: {
              value: 1000,
              unit: "units_per_year",
              rationale: "Base volume"
            }
          }
        }
      ]
    },
    pricing: {
      avg_unit_price: {
        value: 100,
        unit: "EUR",
        rationale: "Average unit price"
      }
    }
  }
} as BusinessData;

// ===== TEST SUITE =====

describe('MarketInsightsCartService', () => {
  let cartService: MarketInsightsCartService;

  beforeEach(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    
    cartService = new MarketInsightsCartService({
      maxCartItems: 10,
      autoValidation: true,
      persistenceEnabled: false // Disable for testing
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cart Management', () => {
    it('should initialize with empty cart', () => {
      const state = cartService.getCartState();
      expect(state.items).toHaveLength(0);
      expect(state.totalItems).toBe(0);
    });

    it('should add insights to cart', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      const volumeInsight = insights.find(i => i.type === 'volume_projection');
      
      expect(volumeInsight).toBeDefined();
      
      if (volumeInsight) {
        const added = await cartService.addInsight(volumeInsight, 'Test notes');
        expect(added).toBe(true);
        
        const state = cartService.getCartState();
        expect(state.totalItems).toBe(1);
        expect(state.items[0].userNotes).toBe('Test notes');
      }
    });

    it('should prevent duplicate insights', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      const volumeInsight = insights.find(i => i.type === 'volume_projection');
      
      if (volumeInsight) {
        const firstAdd = await cartService.addInsight(volumeInsight);
        const secondAdd = await cartService.addInsight(volumeInsight);
        
        expect(firstAdd).toBe(true);
        expect(secondAdd).toBe(false);
        
        const state = cartService.getCartState();
        expect(state.totalItems).toBe(1);
      }
    });

    it('should remove insights from cart', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      const volumeInsight = insights.find(i => i.type === 'volume_projection');
      
      if (volumeInsight) {
        await cartService.addInsight(volumeInsight);
        
        const removed = await cartService.removeInsight(volumeInsight.id);
        expect(removed).toBe(true);
        
        const state = cartService.getCartState();
        expect(state.totalItems).toBe(0);
      }
    });

    it('should clear entire cart', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      // Add multiple insights
      for (const insight of insights.slice(0, 3)) {
        await cartService.addInsight(insight);
      }
      
      await cartService.clearCart();
      
      const state = cartService.getCartState();
      expect(state.totalItems).toBe(0);
      expect(state.items).toHaveLength(0);
    });

    it('should respect cart capacity limits', async () => {
      const limitedCart = new MarketInsightsCartService({
        maxCartItems: 2,
        autoValidation: false
      });
      
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      // Try to add more than limit
      const results = [];
      for (const insight of insights) {
        results.push(await limitedCart.addInsight(insight));
      }
      
      const successCount = results.filter(r => r).length;
      expect(successCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Insight Extraction', () => {
    it('should extract volume projection insight', async () => {
      const volumeInsight = await cartService.extractVolumeProjection(mockMarketData);
      
      expect(volumeInsight).toBeDefined();
      expect(volumeInsight?.type).toBe('volume_projection');
      expect(volumeInsight?.data.projectedVolume).toBeGreaterThan(0);
      expect(volumeInsight?.data.marketValue).toBeGreaterThan(0);
      expect(volumeInsight?.confidence.score).toBeGreaterThan(0);
    });

    it('should extract market sizing insight', async () => {
      const marketSizingInsight = await cartService.extractMarketSizing(mockMarketData);
      
      expect(marketSizingInsight).toBeDefined();
      expect(marketSizingInsight?.type).toBe('market_sizing');
      expect(marketSizingInsight?.data.tam).toBe(2500000);
      expect(marketSizingInsight?.data.sam).toBeGreaterThan(0);
      expect(marketSizingInsight?.data.som).toBeGreaterThan(0);
    });

    it('should extract customer segment insights', async () => {
      const segmentInsights = await cartService.extractCustomerSegments(mockMarketData);
      
      expect(segmentInsights).toHaveLength(2); // smb_tech and retail_chains
      expect(segmentInsights[0].type).toBe('customer_segment');
      expect(segmentInsights[0].data.segmentName).toBe('SMB Tech Companies');
      expect(segmentInsights[1].data.segmentName).toBe('Retail Chains');
    });

    it('should extract all insights from market data', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      expect(insights.length).toBeGreaterThan(0);
      
      const types = insights.map(i => i.type);
      expect(types).toContain('volume_projection');
      expect(types).toContain('market_sizing');
      expect(types).toContain('customer_segment');
    });

    it('should handle invalid market data gracefully', async () => {
      const invalidMarketData = {
        schema_version: "1.0",
        meta: { title: "Invalid" }
      } as MarketData;
      
      const insights = await cartService.extractInsightsFromMarket(invalidMarketData);
      expect(insights).toHaveLength(0);
    });

    it('should respect quality thresholds', async () => {
      const lowQualityMarketData = {
        ...mockMarketData,
        market_sizing: {
          ...mockMarketData.market_sizing,
          total_addressable_market: {
            ...mockMarketData.market_sizing.total_addressable_market,
            base_value: { value: 100, unit: "EUR", rationale: "Too small" } // Below threshold
          }
        }
      };
      
      const volumeInsight = await cartService.extractVolumeProjection(lowQualityMarketData);
      expect(volumeInsight).toBeNull(); // Should be null due to low TAM
    });
  });

  describe('Validation', () => {
    it('should validate cart state', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      // Add some insights
      for (const insight of insights.slice(0, 2)) {
        await cartService.addInsight(insight);
      }
      
      const validation = await cartService.validateCart();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should warn about empty cart', async () => {
      const validation = await cartService.validateCart();
      expect(validation.warnings).toContain('Cart is empty');
    });

    it('should validate individual insights', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      const volumeInsight = insights.find(i => i.type === 'volume_projection');
      
      if (volumeInsight) {
        const isValid = await cartService.validateInsight(volumeInsight);
        expect(isValid).toBe(true);
      }
    });

    it('should reject invalid insights', async () => {
      const invalidInsight = {
        id: '',
        type: 'volume_projection',
        title: '',
        data: { projectedVolume: -1 }
      } as any;
      
      const isValid = await cartService.validateInsight(invalidInsight);
      expect(isValid).toBe(false);
    });
  });

  describe('Transfer Operations', () => {
    it('should create transfer operation', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      await cartService.addInsight(insights[0]);
      
      const state = cartService.getCartState();
      const operation = cartService.createTransferOperation(state.items, {
        targetBusinessCaseId: 'test-case-123',
        transferType: 'selective'
      });
      
      expect(operation.id).toBeDefined();
      expect(operation.targetBusinessCaseId).toBe('test-case-123');
      expect(operation.transferType).toBe('selective');
      expect(operation.items).toHaveLength(1);
    });

    it('should execute transfer operation', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      await cartService.addInsight(insights[0]);
      
      const state = cartService.getCartState();
      const operation = cartService.createTransferOperation(state.items, {
        targetBusinessCaseId: 'test-case-123'
      });
      
      const result = await cartService.executeTransfer(operation, mockBusinessData);
      
      expect(result.success).toBe(true);
      expect(result.itemsTransferred).toBe(1);
      expect(result.itemsFailed).toBe(0);
      expect(result.details).toHaveLength(1);
    });

    it('should handle transfer failures gracefully', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      await cartService.addInsight(insights[0]);
      
      const state = cartService.getCartState();
      const operation = cartService.createTransferOperation(state.items, {
        targetBusinessCaseId: 'invalid-case'
      });
      
      // Mock transfer failure by passing null business data
      const result = await cartService.executeTransfer(operation, null as any);
      
      expect(result.success).toBe(false);
      expect(result.itemsTransferred).toBe(0);
    });
  });

  describe('Recommendations', () => {
    it('should provide transfer recommendations', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      // Add insights to cart
      for (const insight of insights) {
        await cartService.addInsight(insight);
      }
      
      const recommendations = await cartService.getTransferRecommendations(mockBusinessData);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].item).toBeDefined();
      expect(recommendations[0].reason).toBeDefined();
      expect(recommendations[0].priority).toBeDefined();
    });

    it('should prioritize high-value insights', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      for (const insight of insights) {
        await cartService.addInsight(insight);
      }
      
      const recommendations = await cartService.getTransferRecommendations();
      
      // Volume projections should be high priority
      const volumeRec = recommendations.find(r => r.item.insight.type === 'volume_projection');
      expect(volumeRec?.priority).toBe('high');
    });
  });

  describe('Persistence', () => {
    it('should save and load cart state', async () => {
      const persistentCart = new MarketInsightsCartService({
        persistenceEnabled: true
      });
      
      const insights = await persistentCart.extractInsightsFromMarket(mockMarketData);
      await persistentCart.addInsight(insights[0]);
      
      // Save should happen automatically
      await persistentCart.saveCart();
      
      // Create new instance to test loading
      const newCart = new MarketInsightsCartService({
        persistenceEnabled: true
      });
      
      const newState = newCart.getCartState();
      expect(newState.totalItems).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed market data', async () => {
      const malformedData = { invalid: true } as any;
      
      const insights = await cartService.extractInsightsFromMarket(malformedData);
      expect(insights).toHaveLength(0);
    });

    it('should handle concurrent operations', async () => {
      const insights = await cartService.extractInsightsFromMarket(mockMarketData);
      
      // Simulate concurrent adds
      const promises = insights.slice(0, 3).map(insight => 
        cartService.addInsight(insight)
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r).length;
      
      expect(successCount).toBe(3);
      
      const state = cartService.getCartState();
      expect(state.totalItems).toBe(3);
    });

    it('should handle memory constraints gracefully', async () => {
      // Test with very large cart
      const largeCart = new MarketInsightsCartService({
        maxCartItems: 1000
      });
      
      const insights = await largeCart.extractInsightsFromMarket(mockMarketData);
      
      // Should not crash with reasonable number of insights
      expect(insights.length).toBeLessThan(100);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customCart = new MarketInsightsCartService({
        maxCartItems: 5,
        autoValidation: false,
        extractionRules: {
          ...DEFAULT_CART_CONFIG.extractionRules,
          volumeProjection: {
            ...DEFAULT_CART_CONFIG.extractionRules.volumeProjection,
            qualityThresholds: {
              minTamValue: 50000,
              minMarketShare: 1.0,
              minConfidence: 50
            }
          }
        }
      });
      
      const state = customCart.getCartState();
      expect(state.totalItems).toBe(0); // Should start empty
    });

    it('should respect extraction rules', async () => {
      const strictCart = new MarketInsightsCartService({
        extractionRules: {
          ...DEFAULT_CART_CONFIG.extractionRules,
          volumeProjection: {
            ...DEFAULT_CART_CONFIG.extractionRules.volumeProjection,
            qualityThresholds: {
              minTamValue: 10000000, // Very high threshold
              minMarketShare: 50,
              minConfidence: 90
            }
          }
        }
      });
      
      const volumeInsight = await strictCart.extractVolumeProjection(mockMarketData);
      expect(volumeInsight).toBeNull(); // Should fail strict thresholds
    });
  });
});

// ===== INTEGRATION TESTS =====

describe('MarketInsightsCartService Integration', () => {
  let cartService: MarketInsightsCartService;

  beforeEach(() => {
    cartService = new MarketInsightsCartService();
  });

  it('should support full workflow: extract → add → validate → transfer', async () => {
    // 1. Extract insights
    const insights = await cartService.extractInsightsFromMarket(mockMarketData);
    expect(insights.length).toBeGreaterThan(0);

    // 2. Add to cart
    const volumeInsight = insights.find(i => i.type === 'volume_projection');
    if (volumeInsight) {
      const added = await cartService.addInsight(volumeInsight, 'End-to-end test');
      expect(added).toBe(true);
    }

    // 3. Validate cart
    const validation = await cartService.validateCart();
    expect(validation.isValid).toBe(true);

    // 4. Create and execute transfer
    const state = cartService.getCartState();
    const operation = cartService.createTransferOperation(state.items, {
      targetBusinessCaseId: 'integration-test'
    });

    const result = await cartService.executeTransfer(operation, mockBusinessData);
    expect(result.success).toBe(true);
  });

  it('should maintain data integrity across operations', async () => {
    const insights = await cartService.extractInsightsFromMarket(mockMarketData);
    
    // Add multiple insights
    for (const insight of insights) {
      await cartService.addInsight(insight);
    }
    
    const initialState = cartService.getCartState();
    const initialCount = initialState.totalItems;
    
    // Perform various operations
    const recommendations = await cartService.getTransferRecommendations();
    const validation = await cartService.validateCart();
    
    // Verify state consistency
    const finalState = cartService.getCartState();
    expect(finalState.totalItems).toBe(initialCount);
    expect(validation.isValid).toBe(true);
    expect(recommendations.length).toBe(initialCount);
  });
});
