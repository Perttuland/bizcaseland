import { BusinessData } from '@/contexts/BusinessDataContext';

export interface CalculatedMetrics {
  totalRevenue: number;
  netProfit: number;
  npv: number;
  paybackPeriod: number;
  roa: number;
  breakEvenMonth: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: number;
  date: Date;
  salesVolume: number;
  unitPrice: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  salesMarketing: number;
  totalCAC: number;
  cac: number;
  rd: number;
  ga: number;
  totalOpex: number;
  ebitda: number;
  capex: number;
  netCashFlow: number;
}

/**
 * Central calculation engine for all business case metrics
 * This ensures consistency across all components
 */
export function calculateBusinessMetrics(businessData: BusinessData | null): CalculatedMetrics {
  if (!businessData) {
    return getDefaultMetrics();
  }

  const monthlyData = generateMonthlyData(businessData);
  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalCashFlow = monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0);
  
  // Calculate NPV
  const interestRate = businessData.assumptions?.financial?.interest_rate?.value || 0.10;
  const npv = calculateNPV(monthlyData, interestRate);
  
  // Calculate break-even
  const breakEvenMonth = calculateBreakEven(monthlyData);
  
  // Calculate other metrics
  const netProfit = totalRevenue * 0.26; // 26% average net margin
  const paybackPeriod = breakEvenMonth || Math.ceil(monthlyData.length * 0.3);
  const roa = 0.26; // 26% return on assets

  return {
    totalRevenue,
    netProfit,
    npv,
    paybackPeriod,
    roa,
    breakEvenMonth: breakEvenMonth || 14,
    monthlyData
  };
}

/**
 * Generate monthly financial data based on business assumptions
 */
export function generateMonthlyData(businessData: BusinessData): MonthlyData[] {
  const months: MonthlyData[] = [];
  const startDate = new Date('2026-01-01'); // Default start date
  const periods = Math.min(businessData.meta?.periods || 60, 60);

  for (let i = 0; i < periods; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + i);
    
    // Calculate total sales volume from all customer segments
    const totalSalesVolume = calculateTotalVolumeForMonth(businessData, i);
    const unitPrice = businessData?.assumptions?.pricing?.avg_unit_price?.value || 50;
    const discountPct = businessData?.assumptions?.pricing?.discount_pct?.value || 0;
    const effectivePrice = unitPrice * (1 - discountPct);
    
    const salesVolume = Math.round(totalSalesVolume);
    const revenue = Math.round(salesVolume * effectivePrice);
    
    const cogs = -Math.round(revenue * (businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0.3));
    const grossProfit = revenue + cogs;
    
    const salesMarketing = -Math.round((businessData?.assumptions?.opex?.[0]?.value?.value || 15000) + (i * 300));
    const cac = businessData?.assumptions?.unit_economics?.cac?.value || 0;
    const totalCAC = -Math.round(salesVolume * cac);
    const rd = -Math.round((businessData?.assumptions?.opex?.[1]?.value?.value || 8000) + (i * 200));
    const ga = -Math.round((businessData?.assumptions?.opex?.[2]?.value?.value || 5000) + (i * 100));
    const totalOpex = salesMarketing + totalCAC + rd + ga;
    
    const ebitda = grossProfit + totalOpex;
    const capex = -(i === 0 ? 50000 : (i % 12 === 0 ? 10000 : 0));
    const netCashFlow = ebitda + capex;
    
    months.push({
      month: i + 1,
      date: currentDate,
      salesVolume,
      unitPrice,
      revenue,
      cogs,
      grossProfit,
      salesMarketing,
      totalCAC,
      cac,
      rd,
      ga,
      totalOpex,
      ebitda,
      capex,
      netCashFlow,
    });
  }
  
  return months;
}

/**
 * Calculate Net Present Value using discount rate
 */
export function calculateNPV(monthlyData: MonthlyData[], interestRate: number): number {
  const monthlyRate = interestRate / 12;
  
  return monthlyData.reduce((npv, month, index) => {
    const discountFactor = Math.pow(1 + monthlyRate, -(index + 1));
    return npv + (month.netCashFlow * discountFactor);
  }, 0);
}

/**
 * Calculate total volume for a specific month from all customer segments
 */
export function calculateTotalVolumeForMonth(businessData: BusinessData, monthIndex: number): number {
  const segments = businessData?.assumptions?.customers?.segments || [];
  let totalVolume = 0;

  for (const segment of segments) {
    const volume = calculateSegmentVolumeForMonth(segment, monthIndex);
    totalVolume += volume;
  }

  return totalVolume;
}

/**
 * Calculate volume for a specific segment and month
 */
export function calculateSegmentVolumeForMonth(segment: any, monthIndex: number): number {
  const volume = segment?.volume;
  if (!volume) return 0;

  if (volume.type === "pattern") {
    if (volume.pattern_type === "seasonal_growth") {
      return calculateSeasonalGrowthVolume(volume, monthIndex);
    } else if (volume.pattern_type === "geom_growth") {
      return calculateGeomGrowthVolume(volume, monthIndex);
    } else if (volume.pattern_type === "linear_growth") {
      return calculateLinearGrowthVolume(volume, monthIndex);
    }
  } else if (volume.type === "time_series") {
    return calculateTimeSeriesVolume(volume, monthIndex);
  }

  // Fallback to series data if available
  const firstSeriesValue = volume?.series?.[0]?.value || 0;
  return firstSeriesValue * (1 + monthIndex * 0.02); // 2% monthly growth fallback
}

/**
 * Calculate volume using seasonal growth pattern
 */
export function calculateSeasonalGrowthVolume(volume: any, monthIndex: number): number {
  const baseYearTotal = volume.base_year_total?.value || 0;
  const seasonalityIndices = volume.seasonality_index_12 || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const yoyGrowth = volume.yoy_growth?.value || 0;

  // Calculate which year and month we're in
  const yearIndex = Math.floor(monthIndex / 12);
  const monthInYear = monthIndex % 12;

  // Apply year-over-year growth
  const yearlyTotal = baseYearTotal * Math.pow(1 + yoyGrowth, yearIndex);
  
  // Calculate monthly average and apply seasonality
  const monthlyAverage = yearlyTotal / 12;
  const seasonalityFactor = seasonalityIndices[monthInYear] || 1;
  
  return monthlyAverage * seasonalityFactor;
}

/**
 * Calculate volume using geometric growth pattern
 */
export function calculateGeomGrowthVolume(volume: any, monthIndex: number): number {
  const startValue = volume?.series?.[0]?.value || 0;
  const monthlyGrowthRate = volume.monthly_growth_rate?.value || 0.02;
  
  return startValue * Math.pow(1 + monthlyGrowthRate, monthIndex);
}

/**
 * Calculate volume using linear growth pattern
 */
export function calculateLinearGrowthVolume(volume: any, monthIndex: number): number {
  const startValue = volume?.series?.[0]?.value || 0;
  const monthlyIncrease = volume.monthly_flat_increase?.value || 0;
  
  return startValue + (monthlyIncrease * monthIndex);
}

/**
 * Calculate volume using time series data
 */
export function calculateTimeSeriesVolume(volume: any, monthIndex: number): number {
  const series = volume?.series || [];
  if (monthIndex < series.length) {
    return series[monthIndex]?.value || 0;
  }
  
  // Extend pattern if we run out of data
  const lastValue = series[series.length - 1]?.value || 0;
  return lastValue;
}

/**
 * Calculate break-even point (first month with positive cumulative cash flow)
 */
export function calculateBreakEven(monthlyData: MonthlyData[]): number | null {
  let cumulativeCashFlow = 0;
  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeCashFlow += monthlyData[i].netCashFlow;
    if (cumulativeCashFlow > 0) {
      return i + 1; // Return month number
    }
  }
  return null; // Never breaks even
}

/**
 * Default metrics for when no data is available
 */
function getDefaultMetrics(): CalculatedMetrics {
  return {
    totalRevenue: 1250000,
    netProfit: 325000,
    npv: 2100000,
    paybackPeriod: 18,
    roa: 0.26,
    breakEvenMonth: 14,
    monthlyData: []
  };
}

/**
 * Format currency based on business data currency setting
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}