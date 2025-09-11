/**
 * Improved TypeScript types for better type safety
 * Replaces loose typing throughout the application
 */

// Utility types for better type safety
export type NonEmptyString = string & { readonly __brand: unique symbol };
export type PositiveNumber = number & { readonly __brand: unique symbol };
export type Percentage = number & { readonly __brand: unique symbol }; // 0-100
export type DecimalPercentage = number & { readonly __brand: unique symbol }; // 0-1

// Currency codes (ISO 4217)
export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SEK' | 'NOK' | 'DKK';

// Business model types
export type BusinessModelType = 'recurring' | 'unit_sales' | 'cost_savings';

// Frequency types
export type FrequencyType = 'monthly' | 'quarterly' | 'annually';

// Growth pattern types
export type GrowthPatternType = 'geom_growth' | 'seasonal_growth' | 'linear_growth';

// Time series type
export type TimeSeriesType = 'pattern' | 'time_series';

// Penetration strategy types
export type PenetrationStrategy = 'linear' | 'exponential' | 's_curve';

// Base value interface with proper typing
export interface ValueWithRationale<T = number> {
  readonly value: T;
  readonly unit: NonEmptyString;
  readonly rationale: NonEmptyString;
}

// Properly typed meta information
export interface BusinessMeta {
  readonly title: NonEmptyString;
  readonly description: string;
  readonly business_model: BusinessModelType;
  readonly archetype?: string;
  readonly currency: CurrencyCode;
  readonly periods: PositiveNumber;
  readonly frequency: FrequencyType;
}

// Pricing assumptions with better typing
export interface PricingAssumptions {
  readonly avg_unit_price?: ValueWithRationale<PositiveNumber>;
  readonly yearly_adjustments?: {
    readonly pricing_factors?: ReadonlyArray<{
      readonly year: PositiveNumber;
      readonly factor: PositiveNumber;
      readonly rationale: NonEmptyString;
    }>;
    readonly price_overrides?: ReadonlyArray<{
      readonly period: PositiveNumber;
      readonly price: PositiveNumber;
      readonly rationale: NonEmptyString;
    }>;
  };
}

// Financial assumptions
export interface FinancialAssumptions {
  readonly interest_rate?: ValueWithRationale<DecimalPercentage>;
}

// Time series data point
export interface TimeSeriesDataPoint {
  readonly period: PositiveNumber;
  readonly value: number;
  readonly unit: NonEmptyString;
  readonly rationale: NonEmptyString;
}

// Implementation timeline
export interface ImplementationTimeline {
  readonly start_month: PositiveNumber;
  readonly ramp_up_months: PositiveNumber;
  readonly full_implementation_month: PositiveNumber;
}

// Volume configuration
export interface VolumeConfiguration {
  readonly type: TimeSeriesType;
  readonly pattern_type?: GrowthPatternType;
  readonly series?: ReadonlyArray<TimeSeriesDataPoint>;
  readonly base_year_total?: ValueWithRationale<PositiveNumber>;
  readonly seasonality_index_12?: ReadonlyArray<PositiveNumber>;
  readonly yoy_growth?: ValueWithRationale<DecimalPercentage>;
  readonly monthly_growth_rate?: ValueWithRationale<DecimalPercentage>;
  readonly monthly_flat_increase?: ValueWithRationale<number>;
  readonly yearly_adjustments?: {
    readonly volume_factors?: ReadonlyArray<{
      readonly year: PositiveNumber;
      readonly factor: PositiveNumber;
      readonly rationale: NonEmptyString;
    }>;
    readonly volume_overrides?: ReadonlyArray<{
      readonly period: PositiveNumber;
      readonly volume: number;
      readonly rationale: NonEmptyString;
    }>;
  };
}

// Customer segment
export interface CustomerSegment {
  readonly id: NonEmptyString;
  readonly label: NonEmptyString;
  readonly rationale: NonEmptyString;
  readonly volume?: VolumeConfiguration;
}

// Customer assumptions
export interface CustomerAssumptions {
  readonly churn_pct?: ValueWithRationale<Percentage>;
  readonly segments?: ReadonlyArray<CustomerSegment>;
}

// Unit economics
export interface UnitEconomicsAssumptions {
  readonly cogs_pct?: ValueWithRationale<DecimalPercentage>;
  readonly cac?: ValueWithRationale<PositiveNumber>;
}

// OpEx item
export interface OpexItem {
  readonly name: NonEmptyString;
  readonly value: ValueWithRationale<number>;
}

// CapEx timeline
export interface CapexTimeline {
  readonly type: TimeSeriesType;
  readonly pattern_type?: GrowthPatternType;
  readonly series?: ReadonlyArray<TimeSeriesDataPoint>;
}

// CapEx item
export interface CapexItem {
  readonly name: NonEmptyString;
  readonly timeline?: CapexTimeline;
}

// Cost savings baseline cost
export interface BaselineCost {
  readonly id: NonEmptyString;
  readonly label: NonEmptyString;
  readonly category: 'operational' | 'administrative' | 'technology' | 'other';
  readonly current_monthly_cost: ValueWithRationale<PositiveNumber>;
  readonly savings_potential_pct: ValueWithRationale<Percentage>;
  readonly implementation_timeline?: ImplementationTimeline;
}

// Efficiency gain
export interface EfficiencyGain {
  readonly id: NonEmptyString;
  readonly label: NonEmptyString;
  readonly metric: NonEmptyString;
  readonly baseline_value: ValueWithRationale<number>;
  readonly improved_value: ValueWithRationale<number>;
  readonly value_per_unit: ValueWithRationale<PositiveNumber>;
  readonly implementation_timeline?: ImplementationTimeline;
}

// Cost savings assumptions
export interface CostSavingsAssumptions {
  readonly baseline_costs?: ReadonlyArray<BaselineCost>;
  readonly efficiency_gains?: ReadonlyArray<EfficiencyGain>;
}

// Market analysis types
export interface TotalAddressableMarket {
  readonly base_value: ValueWithRationale<PositiveNumber>;
  readonly growth_rate: ValueWithRationale<DecimalPercentage>;
  readonly currency: CurrencyCode;
  readonly year: PositiveNumber;
}

export interface ServiceableAddressableMarket {
  readonly percentage_of_tam: ValueWithRationale<Percentage>;
}

export interface ServiceableObtainableMarket {
  readonly percentage_of_sam: ValueWithRationale<Percentage>;
}

export interface MarketShareStrategy {
  readonly current_share: ValueWithRationale<Percentage>;
  readonly target_share: ValueWithRationale<Percentage>;
  readonly target_timeframe: ValueWithRationale<PositiveNumber>;
  readonly penetration_strategy: PenetrationStrategy;
}

export interface CompetitorInfo {
  readonly competitor_name: NonEmptyString;
  readonly market_share: ValueWithRationale<Percentage>;
  readonly positioning: NonEmptyString;
}

export interface MarketSegmentInfo {
  readonly id: NonEmptyString;
  readonly name: NonEmptyString;
  readonly size_percentage: ValueWithRationale<Percentage>;
  readonly growth_rate: ValueWithRationale<DecimalPercentage>;
  readonly target_share: ValueWithRationale<Percentage>;
}

export interface CustomerValue {
  readonly annual_value: ValueWithRationale<PositiveNumber>;
  readonly lifetime_value: ValueWithRationale<PositiveNumber>;
}

export interface MarketAnalysisAssumptions {
  readonly total_addressable_market?: TotalAddressableMarket;
  readonly serviceable_addressable_market?: ServiceableAddressableMarket;
  readonly serviceable_obtainable_market?: ServiceableObtainableMarket;
  readonly market_share?: MarketShareStrategy;
  readonly competitive_landscape?: ReadonlyArray<CompetitorInfo>;
  readonly market_segments?: ReadonlyArray<MarketSegmentInfo>;
  readonly avg_customer_value?: CustomerValue;
}

// Growth settings
export interface GrowthSettings {
  readonly geom_growth?: {
    readonly start?: ValueWithRationale<PositiveNumber>;
    readonly monthly_growth?: ValueWithRationale<DecimalPercentage>;
  };
  readonly seasonal_growth?: {
    readonly base_year_total?: ValueWithRationale<PositiveNumber>;
    readonly seasonality_index_12?: ValueWithRationale<ReadonlyArray<PositiveNumber>>;
    readonly yoy_growth?: ValueWithRationale<DecimalPercentage>;
  };
  readonly linear_growth?: {
    readonly start?: ValueWithRationale<PositiveNumber>;
    readonly monthly_flat_increase?: ValueWithRationale<number>;
  };
}

// Complete assumptions interface
export interface BusinessAssumptions {
  readonly pricing?: PricingAssumptions;
  readonly financial?: FinancialAssumptions;
  readonly customers?: CustomerAssumptions;
  readonly unit_economics?: UnitEconomicsAssumptions;
  readonly opex?: ReadonlyArray<OpexItem>;
  readonly capex?: ReadonlyArray<CapexItem>;
  readonly cost_savings?: CostSavingsAssumptions;
  readonly market_analysis?: MarketAnalysisAssumptions;
  readonly growth_settings?: GrowthSettings;
}

// Driver for sensitivity analysis
export interface Driver {
  readonly key: NonEmptyString;
  readonly path: NonEmptyString;
  readonly range: readonly [number, number];
  readonly rationale: NonEmptyString;
}

// Complete business data interface
export interface StrictBusinessData {
  readonly schema_version?: string;
  readonly meta: BusinessMeta;
  readonly assumptions: BusinessAssumptions;
  readonly drivers?: ReadonlyArray<Driver>;
  readonly scenarios?: ReadonlyArray<unknown>;
  readonly structure?: unknown;
}

// Monthly calculation result with proper typing
export interface StrictMonthlyData {
  readonly month: PositiveNumber;
  readonly date: Date;
  readonly salesVolume: number;
  readonly newCustomers: number;
  readonly existingCustomers: number;
  readonly unitPrice: number;
  readonly revenue: number;
  readonly cogs: number;
  readonly grossProfit: number;
  readonly salesMarketing: number;
  readonly totalCAC: number;
  readonly cac: number;
  readonly rd: number;
  readonly ga: number;
  readonly totalOpex: number;
  readonly ebitda: number;
  readonly capex: number;
  readonly netCashFlow: number;
  // Cost savings specific fields
  readonly baselineCosts?: number;
  readonly costSavings?: number;
  readonly efficiencyGains?: number;
  readonly totalBenefits?: number;
}

// Calculated metrics with proper typing
export interface StrictCalculatedMetrics {
  readonly totalRevenue: number;
  readonly netProfit: number;
  readonly npv: number;
  readonly irr: number;
  readonly paybackPeriod: number;
  readonly totalInvestmentRequired: number; // Total amount needed to fund the business until break-even
  readonly breakEvenMonth: number;
  readonly monthlyData: ReadonlyArray<StrictMonthlyData>;
}

// Helper functions for type guards and validation
export function isValidCurrency(currency: string): currency is CurrencyCode {
  return ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK'].includes(currency);
}

export function isValidBusinessModel(model: string): model is BusinessModelType {
  return ['recurring', 'unit_sales', 'cost_savings'].includes(model);
}

export function isPositiveNumber(value: number): value is PositiveNumber {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
}

export function isValidPercentage(value: number): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value) && isFinite(value);
}

export function isValidDecimalPercentage(value: number): value is DecimalPercentage {
  return typeof value === 'number' && value >= 0 && value <= 1 && !isNaN(value) && isFinite(value);
}

export function isNonEmptyString(value: string): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0;
}

// Type assertion helpers
export function assertPositiveNumber(value: number, fieldName: string): PositiveNumber {
  if (!isPositiveNumber(value)) {
    throw new Error(`${fieldName} must be a positive number, got: ${value}`);
  }
  return value;
}

export function assertValidPercentage(value: number, fieldName: string): Percentage {
  if (!isValidPercentage(value)) {
    throw new Error(`${fieldName} must be a percentage between 0 and 100, got: ${value}`);
  }
  return value;
}

export function assertNonEmptyString(value: string, fieldName: string): NonEmptyString {
  if (!isNonEmptyString(value)) {
    throw new Error(`${fieldName} must be a non-empty string, got: "${value}"`);
  }
  return value;
}
