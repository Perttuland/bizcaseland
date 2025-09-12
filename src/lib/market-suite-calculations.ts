/**
 * Market Analysis Suite Calculations
 * Advanced market research and strategic analysis calculations
 */

import { MarketData } from './market-calculations';

// Extended interfaces for comprehensive market analysis
export interface MarketSuiteMetrics {
  // Core market sizing
  tam: number;
  sam: number;
  som: number;
  
  // Advanced metrics
  opportunityScore: number;
  competitivePosition: string;
  customerSegments: number;
  marketGrowthRate: number;
  
  // Competitive analysis
  marketConcentration: number;
  competitorCount: number;
  averageCompetitorStrength: number;
  
  // Customer insights
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  marketPenetrationRate: number;
  
  // Strategic insights
  entryBarrierScore: number;
  strategicFitScore: number;
  riskScore: number;
  
  // Summary insights
  summary: {
    marketOpportunity: string;
    recommendations: string[];
    keyRisks: string[];
    nextSteps: string[];
  };
}

export interface CompetitivePositioning {
  quadrant: 'leader' | 'challenger' | 'visionary' | 'niche';
  strength: number; // 0-100
  marketPosition: number; // 0-100
  differentiationFactors: string[];
}

export interface CustomerSegmentAnalysis {
  id: string;
  name: string;
  attractiveness: number; // 0-100
  accessibility: number; // 0-100
  defensibility: number; // 0-100;
  size: number;
  growthRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  recommendedStrategy: string;
}

export interface StrategicOption {
  id: string;
  name: string;
  description: string;
  investmentRequired: number;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeToMarket: number; // months
  probability: number; // 0-100
  strategicFit: number; // 0-100
}

export interface MarketOpportunityMatrix {
  opportunities: Array<{
    segment: string;
    marketSize: number;
    growthRate: number;
    competitiveIntensity: number;
    accessibility: number;
    overallScore: number;
    position: { x: number; y: number };
  }>;
}

/**
 * Calculate comprehensive market suite metrics
 */
export function calculateSuiteMetrics(marketData: MarketData): MarketSuiteMetrics {
  // Basic market sizing
  const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
  const samPercentage = (marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100;
  const somPercentage = (marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100;
  
  const sam = tam * samPercentage;
  const som = sam * somPercentage;
  
  // Growth metrics
  const marketGrowthRate = marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0;
  
  // Competitive metrics
  const competitors = marketData?.competitive_landscape?.competitors || [];
  const competitorCount = competitors.length;
  const competitorShares = competitors.map(c => (c.market_share?.value || 0) / 100);
  const marketConcentration = competitorShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  const averageCompetitorStrength = competitors.reduce((sum, comp) => {
    const threatLevel = comp.threat_level === 'high' ? 3 : comp.threat_level === 'medium' ? 2 : 1;
    return sum + threatLevel;
  }, 0) / Math.max(competitorCount, 1);
  
  // Customer metrics
  const customerEcon = marketData?.customer_analysis?.customer_economics;
  const customerAcquisitionCost = customerEcon?.average_customer_value?.acquisition_cost?.value || 0;
  const customerLifetimeValue = customerEcon?.average_customer_value?.lifetime_value?.value || 0;
  
  // Current and target market share
  const currentShare = (marketData?.market_share?.current_position?.current_share?.value || 0) / 100;
  const targetShare = (marketData?.market_share?.target_position?.target_share?.value || 0) / 100;
  const marketPenetrationRate = targetShare;
  
  // Strategic metrics
  const entryBarriers = marketData?.competitive_landscape?.market_structure?.barriers_to_entry || 'medium';
  const entryBarrierScore = entryBarriers === 'low' ? 25 : entryBarriers === 'medium' ? 50 : 75;
  
  const competitiveAdvantages = marketData?.competitive_landscape?.competitive_advantages || [];
  const strategicFitScore = Math.min(100, competitiveAdvantages.length * 20);
  
  // Risk assessment
  const marketRisks = marketData?.market_dynamics?.market_risks || [];
  const highRisks = marketRisks.filter(r => r.probability === 'high' && r.impact === 'high').length;
  const riskScore = Math.min(100, highRisks * 25);
  
  // Opportunity scoring
  const opportunityScore = calculateOpportunityScore({
    marketSize: tam,
    growthRate: marketGrowthRate,
    competitionLevel: marketConcentration,
    entryBarriers: entryBarrierScore,
    strategicFit: strategicFitScore,
    targetShare: targetShare * 100
  });
  
  // Competitive positioning
  const competitivePosition = determineCompetitivePosition(
    targetShare * 100,
    strategicFitScore,
    averageCompetitorStrength
  );
  
  // Customer segments
  const customerSegments = marketData?.customer_analysis?.market_segments?.length || 0;
  
  // Generate summary insights
  const summary = generateSummaryInsights({
    tam,
    sam,
    som,
    opportunityScore,
    competitivePosition,
    marketGrowthRate,
    riskScore,
    competitorCount,
    customerSegments
  });
  
  return {
    tam,
    sam,
    som,
    opportunityScore,
    competitivePosition,
    customerSegments,
    marketGrowthRate,
    marketConcentration,
    competitorCount,
    averageCompetitorStrength,
    customerAcquisitionCost,
    customerLifetimeValue,
    marketPenetrationRate,
    entryBarrierScore,
    strategicFitScore,
    riskScore,
    summary
  };
}

/**
 * Calculate multi-factor opportunity score
 */
function calculateOpportunityScore(factors: {
  marketSize: number;
  growthRate: number;
  competitionLevel: number;
  entryBarriers: number;
  strategicFit: number;
  targetShare: number;
}): number {
  // Weighted scoring
  const sizeScore = Math.min(25, Math.log10(factors.marketSize / 1000000) * 5);
  const growthScore = Math.min(25, factors.growthRate * 2.5);
  const competitionScore = Math.max(0, 25 - (factors.competitionLevel * 25));
  const barrierScore = Math.max(0, 25 - (factors.entryBarriers / 4));
  const fitScore = (factors.strategicFit / 100) * 15;
  const shareScore = Math.min(10, factors.targetShare / 5);
  
  return Math.round(sizeScore + growthScore + competitionScore + barrierScore + fitScore + shareScore);
}

/**
 * Determine competitive position quadrant
 */
function determineCompetitivePosition(
  marketShare: number,
  strategicStrength: number,
  competitorStrength: number
): string {
  const relativeStrength = strategicStrength - (competitorStrength * 20);
  
  if (marketShare >= 10) {
    return relativeStrength > 50 ? 'Market Leader' : 'Strong Challenger';
  } else if (marketShare >= 5) {
    return relativeStrength > 50 ? 'Strategic Challenger' : 'Market Follower';
  } else {
    return relativeStrength > 50 ? 'Niche Specialist' : 'Emerging Player';
  }
}

/**
 * Generate AI-powered summary insights
 */
function generateSummaryInsights(metrics: {
  tam: number;
  sam: number;
  som: number;
  opportunityScore: number;
  competitivePosition: string;
  marketGrowthRate: number;
  riskScore: number;
  competitorCount: number;
  customerSegments: number;
}): MarketSuiteMetrics['summary'] {
  const { tam, opportunityScore, marketGrowthRate, competitivePosition, riskScore, competitorCount } = metrics;
  
  // Market opportunity assessment
  let marketOpportunity = '';
  if (opportunityScore >= 75) {
    marketOpportunity = `Excellent market opportunity with ${(tam / 1e9).toFixed(1)}B TAM and ${marketGrowthRate.toFixed(1)}% growth rate. Strong potential for market entry and expansion.`;
  } else if (opportunityScore >= 60) {
    marketOpportunity = `Good market opportunity with moderate potential. Market size of ${(tam / 1e9).toFixed(1)}B offers solid foundation for growth.`;
  } else if (opportunityScore >= 40) {
    marketOpportunity = `Fair market opportunity with some challenges. Consider focused approach on specific segments.`;
  } else {
    marketOpportunity = `Challenging market conditions. Careful strategy and strong differentiation required for success.`;
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (opportunityScore >= 70) {
    recommendations.push('Accelerate market entry with significant investment');
    recommendations.push('Focus on capturing market share in high-growth segments');
  } else if (opportunityScore >= 50) {
    recommendations.push('Pursue selective market entry with phased approach');
    recommendations.push('Develop strong competitive differentiation');
  } else {
    recommendations.push('Consider alternative markets or modified value proposition');
    recommendations.push('Focus on niche segments with lower competition');
  }
  
  if (marketGrowthRate > 10) {
    recommendations.push('Leverage high market growth to gain early market position');
  }
  
  if (competitorCount > 5) {
    recommendations.push('Develop clear differentiation strategy in crowded market');
  }
  
  // Identify key risks
  const keyRisks: string[] = [];
  
  if (riskScore > 60) {
    keyRisks.push('High market risk profile requires careful risk management');
  }
  
  if (competitorCount > 10) {
    keyRisks.push('Highly fragmented market with intense competition');
  }
  
  if (marketGrowthRate < 3) {
    keyRisks.push('Slow market growth may limit expansion opportunities');
  }
  
  // Next steps
  const nextSteps = [
    'Validate market assumptions with primary research',
    'Develop detailed go-to-market strategy',
    'Create competitive differentiation plan',
    'Build financial model with market projections'
  ];
  
  return {
    marketOpportunity,
    recommendations,
    keyRisks,
    nextSteps
  };
}

/**
 * Analyze customer segments for attractiveness
 */
export function analyzeCustomerSegments(marketData: MarketData): CustomerSegmentAnalysis[] {
  const segments = marketData?.customer_analysis?.market_segments || [];
  
  return segments.map(segment => {
    const size = segment.size_percentage?.value || 0;
    const growth = segment.growth_rate?.value || 0;
    const targetShare = segment.target_share?.value || 0;
    
    // Calculate attractiveness factors
    const attractiveness = Math.min(100, (size + growth * 2 + targetShare) / 3);
    const accessibility = targetShare > 0 ? Math.min(100, 60 + targetShare) : 30;
    const defensibility = growth > 5 ? 70 : 50; // Simplified calculation
    
    const competitionLevel: 'low' | 'medium' | 'high' = 
      attractiveness > 70 ? 'high' : attractiveness > 40 ? 'medium' : 'low';
    
    let recommendedStrategy = '';
    if (attractiveness > 70 && accessibility > 60) {
      recommendedStrategy = 'Invest heavily - primary target segment';
    } else if (attractiveness > 50) {
      recommendedStrategy = 'Selective investment - secondary target';
    } else {
      recommendedStrategy = 'Monitor - potential future opportunity';
    }
    
    return {
      id: segment.id,
      name: segment.name,
      attractiveness,
      accessibility,
      defensibility,
      size: size,
      growthRate: growth,
      competitionLevel,
      recommendedStrategy
    };
  });
}

/**
 * Generate strategic options matrix
 */
export function generateStrategicOptions(marketData: MarketData): StrategicOption[] {
  const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
  const marketGrowthRate = marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0;
  const entryBarriers = marketData?.competitive_landscape?.market_structure?.barriers_to_entry || 'medium';
  
  const options: StrategicOption[] = [];
  
  // Direct market entry
  options.push({
    id: 'direct_entry',
    name: 'Direct Market Entry',
    description: 'Enter market with full product offering and direct sales',
    investmentRequired: tam * 0.001, // 0.1% of TAM as investment
    expectedReturn: tam * 0.01, // 1% of TAM as potential return
    riskLevel: entryBarriers === 'high' ? 'high' : 'medium',
    timeToMarket: entryBarriers === 'high' ? 18 : 12,
    probability: entryBarriers === 'low' ? 80 : entryBarriers === 'medium' ? 60 : 40,
    strategicFit: 85
  });
  
  // Partnership strategy
  options.push({
    id: 'partnership',
    name: 'Strategic Partnership',
    description: 'Enter through partnerships with established market players',
    investmentRequired: tam * 0.0005,
    expectedReturn: tam * 0.005,
    riskLevel: 'low',
    timeToMarket: 6,
    probability: 75,
    strategicFit: 70
  });
  
  // Niche entry
  options.push({
    id: 'niche_entry',
    name: 'Niche Market Entry',
    description: 'Focus on specific high-value customer segments',
    investmentRequired: tam * 0.0002,
    expectedReturn: tam * 0.003,
    riskLevel: 'low',
    timeToMarket: 9,
    probability: 85,
    strategicFit: 80
  });
  
  // Acquisition
  if (entryBarriers === 'high') {
    options.push({
      id: 'acquisition',
      name: 'Market Acquisition',
      description: 'Acquire existing market player for immediate presence',
      investmentRequired: tam * 0.01,
      expectedReturn: tam * 0.02,
      riskLevel: 'medium',
      timeToMarket: 3,
      probability: 60,
      strategicFit: 90
    });
  }
  
  return options;
}

/**
 * Create market opportunity matrix
 */
export function createOpportunityMatrix(marketData: MarketData): MarketOpportunityMatrix {
  const segments = marketData?.customer_analysis?.market_segments || [];
  const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
  
  const opportunities = segments.map(segment => {
    const size = (segment.size_percentage?.value || 0) / 100 * tam;
    const growthRate = segment.growth_rate?.value || 0;
    const targetShare = segment.target_share?.value || 0;
    
    // Estimate competitive intensity (simplified)
    const competitiveIntensity = targetShare > 10 ? 0.8 : targetShare > 5 ? 0.6 : 0.4;
    const accessibility = targetShare > 0 ? 0.8 : 0.3;
    
    // Calculate overall score
    const sizeScore = Math.min(1, size / (tam * 0.1)); // Normalize to 10% of TAM
    const growthScore = Math.min(1, growthRate / 20); // Normalize to 20% growth
    const competitionScore = 1 - competitiveIntensity;
    const accessScore = accessibility;
    
    const overallScore = (sizeScore * 0.3 + growthScore * 0.3 + competitionScore * 0.2 + accessScore * 0.2) * 100;
    
    return {
      segment: segment.name,
      marketSize: size,
      growthRate,
      competitiveIntensity,
      accessibility,
      overallScore,
      position: {
        x: accessibility * 100, // X-axis: Market accessibility
        y: overallScore // Y-axis: Overall attractiveness
      }
    };
  });
  
  return { opportunities };
}

/**
 * Validate comprehensive market suite data
 */
export function validateMarketSuiteData(marketData: MarketData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Core market sizing validation
  if (!marketData?.market_sizing?.total_addressable_market?.base_value?.value) {
    errors.push("Total Addressable Market base value is required");
  }
  
  // Competitive landscape validation
  const competitors = marketData?.competitive_landscape?.competitors || [];
  if (competitors.length === 0) {
    warnings.push("No competitors defined - consider adding competitive analysis");
  }
  
  // Customer segment validation
  const segments = marketData?.customer_analysis?.market_segments || [];
  if (segments.length === 0) {
    warnings.push("No customer segments defined - segment analysis recommended");
  }
  
  // Strategic validation
  const advantages = marketData?.competitive_landscape?.competitive_advantages || [];
  if (advantages.length === 0) {
    warnings.push("No competitive advantages defined - strategic differentiation needed");
  }
  
  // Data consistency checks
  const totalSegmentPercentage = segments.reduce((sum, seg) => sum + (seg.size_percentage?.value || 0), 0);
  if (totalSegmentPercentage > 100) {
    errors.push("Total customer segment percentages exceed 100%");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export comprehensive market insights
 */
export function exportMarketInsights(marketData: MarketData, metrics: MarketSuiteMetrics): any {
  return {
    meta: {
      exportDate: new Date().toISOString(),
      analysisTitle: marketData?.meta?.title || 'Market Analysis',
      version: '1.0'
    },
    executiveSummary: metrics.summary,
    marketSizing: {
      tam: metrics.tam,
      sam: metrics.sam,
      som: metrics.som,
      growthRate: metrics.marketGrowthRate
    },
    competitiveAnalysis: {
      position: metrics.competitivePosition,
      competitorCount: metrics.competitorCount,
      marketConcentration: metrics.marketConcentration
    },
    opportunityAssessment: {
      score: metrics.opportunityScore,
      riskLevel: metrics.riskScore,
      recommendation: metrics.summary.marketOpportunity
    },
    volumeProjections: {
      // This would typically include monthly/quarterly projections
      // Integration point for business case analysis
      marketBasedVolume: metrics.som * metrics.marketPenetrationRate,
      timeframe: '60 months'
    },
    strategicRecommendations: metrics.summary.recommendations,
    keyRisks: metrics.summary.keyRisks,
    nextSteps: metrics.summary.nextSteps
  };
}
