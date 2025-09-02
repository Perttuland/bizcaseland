import { BusinessData } from '@/contexts/BusinessDataContext';

export interface CalculatedMetrics {
  totalRevenue: number;
  netProfit: number;
  npv: number;
  paybackPeriod: number;
  roi: number;
  breakEvenMonth: number;
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: number;
  date: Date;
  salesVolume: number;
  newCustomers: number;
  existingCustomers: number;
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
  const interestRate = businessData.assumptions?.financial?.interest_rate?.value || 0;
  const npv = calculateNPV(monthlyData, interestRate);
  
  // Calculate break-even
  const breakEvenMonth = calculateBreakEven(monthlyData);
  
  // Calculate other metrics
  const netProfit = monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0);
  const paybackPeriod = breakEvenMonth || 0;
  
  // Calculate ROI: (Net Profit / Total Investment) * 100
  const totalInvestment = monthlyData.reduce((sum, month) => sum + month.capex, 0) + 
                         (businessData.assumptions?.financial?.initial_investment?.value || 0);
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) : 0;

  return {
    totalRevenue,
    netProfit,
    npv,
    paybackPeriod,
    roi,
    breakEvenMonth: breakEvenMonth || 0,
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
    let totalSalesVolume = calculateTotalVolumeForMonth(businessData, i);
    
    // Determine business model and calculate new vs existing customers
    const businessModel = businessData?.meta?.business_model;
    const churnRate = businessData?.assumptions?.customers?.churn_pct?.value || 0;
    
    let newCustomers = 0;
    let existingCustomers = 0;
    
    if (businessModel === 'recurring') {
      // For recurring models, differentiate between new and existing customers
      if (i === 0) {
        // First month: all customers are new
        newCustomers = totalSalesVolume;
        existingCustomers = 0;
      } else {
        // Calculate existing customers from previous month (minus churn)
        const previousMonth = months[i - 1];
        existingCustomers = Math.round((previousMonth.newCustomers + previousMonth.existingCustomers) * (1 - churnRate));
        
        // New customers is the difference to reach total volume
        newCustomers = Math.max(0, totalSalesVolume - existingCustomers);
      }
    } else {
      // For transactional/unit sales models, all volume represents new transactions each month
      // We don't track customers separately - each unit sale is independent
      newCustomers = totalSalesVolume; // This represents units sold, not customers
      existingCustomers = 0;
    }
    
    const unitPrice = businessData?.assumptions?.pricing?.avg_unit_price?.value || 0;
    
    const salesVolume = Math.round(totalSalesVolume);
    const revenue = Math.round(salesVolume * unitPrice);
    
    const cogs = -Math.round(revenue * (businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0));
    const grossProfit = revenue + cogs;
    
    const salesMarketing = -Math.round((businessData?.assumptions?.opex?.[0]?.value?.value || 0));
    const cac = businessData?.assumptions?.unit_economics?.cac?.value || 0;
    
    // For recurring models: CAC only applies to new customers
    // For unit sales models: CAC applies to all units (since each sale is independent)
    const totalCAC = businessModel === 'recurring'
      ? -Math.round(newCustomers * cac)
      : -Math.round(totalSalesVolume * cac);
    
    const rd = -Math.round((businessData?.assumptions?.opex?.[1]?.value?.value || 0));
    const ga = -Math.round((businessData?.assumptions?.opex?.[2]?.value?.value || 0));
    const totalOpex = salesMarketing + totalCAC + rd + ga;
    
    const ebitda = grossProfit + totalOpex;
    const capex = -calculateCapexForMonth(businessData, i);
    const netCashFlow = ebitda + capex;
    
    months.push({
      month: i + 1,
      date: currentDate,
      salesVolume,
      newCustomers: Math.round(newCustomers),
      existingCustomers: Math.round(existingCustomers),
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
    const volume = calculateSegmentVolumeForMonth(segment, monthIndex, businessData);
    totalVolume += volume;
  }

  return totalVolume;
}

/**
 * Calculate volume for a specific segment and month
 */
export function calculateSegmentVolumeForMonth(segment: any, monthIndex: number, businessData?: BusinessData): number {
  const volume = segment?.volume;
  if (!volume) return 0;

  if (volume.type === "pattern") {
    if (volume.pattern_type === "seasonal_growth") {
      return calculateSeasonalGrowthVolume(volume, monthIndex, businessData);
    } else if (volume.pattern_type === "geom_growth") {
      return calculateGeomGrowthVolume(volume, monthIndex, businessData);
    } else if (volume.pattern_type === "linear_growth") {
      return calculateLinearGrowthVolume(volume, monthIndex, businessData);
    }
  } else if (volume.type === "time_series") {
    return calculateTimeSeriesVolume(volume, monthIndex);
  }

  // Fallback to series data if available
  const firstSeriesValue = volume?.series?.[0]?.value || 0;
  return firstSeriesValue;
}

/**
 * Calculate volume using seasonal growth pattern
 */
export function calculateSeasonalGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first, then fallback to growth_settings
  let baseYearTotal = volume.base_year_total?.value;
  let seasonalityIndices = volume.seasonality_index_12;
  let yoyGrowth = volume.yoy_growth?.value;
  
  // If not found in volume, try growth_settings
  if (baseYearTotal === undefined && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    baseYearTotal = businessData.assumptions.growth_settings.seasonal_growth.base_year_total?.value;
  }
  if (!seasonalityIndices && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    seasonalityIndices = businessData.assumptions.growth_settings.seasonal_growth.seasonality_index_12?.value;
  }
  if (yoyGrowth === undefined && businessData?.assumptions?.growth_settings?.seasonal_growth) {
    yoyGrowth = businessData.assumptions.growth_settings.seasonal_growth.yoy_growth?.value;
  }
  
  // Apply defaults
  baseYearTotal = baseYearTotal || 0;
  seasonalityIndices = seasonalityIndices || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  yoyGrowth = yoyGrowth || 0;

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
export function calculateGeomGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first, then fallback to growth_settings
  let startValue = volume?.series?.[0]?.value;
  let monthlyGrowthRate = volume.monthly_growth_rate?.value;
  
  // If not found in volume, try growth_settings
  if (startValue === undefined && businessData?.assumptions?.growth_settings?.geom_growth) {
    startValue = businessData.assumptions.growth_settings.geom_growth.start?.value;
  }
  if (monthlyGrowthRate === undefined && businessData?.assumptions?.growth_settings?.geom_growth) {
    monthlyGrowthRate = businessData.assumptions.growth_settings.geom_growth.monthly_growth?.value;
  }
  
  // Apply defaults
  startValue = startValue || 0;
  monthlyGrowthRate = monthlyGrowthRate || 0;
  
  return startValue * Math.pow(1 + monthlyGrowthRate, monthIndex);
}

/**
 * Calculate volume using linear growth pattern
 */
export function calculateLinearGrowthVolume(volume: any, monthIndex: number, businessData?: BusinessData): number {
  // Try to get values from volume object first, then fallback to growth_settings
  let startValue = volume?.series?.[0]?.value;
  let monthlyIncrease = volume.monthly_flat_increase?.value;
  
  // If not found in volume, try growth_settings
  if (startValue === undefined && businessData?.assumptions?.growth_settings?.linear_growth) {
    startValue = businessData.assumptions.growth_settings.linear_growth.start?.value;
  }
  if (monthlyIncrease === undefined && businessData?.assumptions?.growth_settings?.linear_growth) {
    monthlyIncrease = businessData.assumptions.growth_settings.linear_growth.monthly_flat_increase?.value;
  }
  
  // Apply defaults
  startValue = startValue || 0;
  monthlyIncrease = monthlyIncrease || 0;
  
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
 * Calculate capex for a specific month based on period-specific investments
 */
export function calculateCapexForMonth(businessData: BusinessData, monthIndex: number): number {
  const capexItems = businessData?.assumptions?.capex || [];
  let totalCapex = 0;

  for (const item of capexItems) {
    const timeline = item?.timeline;
    if (!timeline) continue;

    if (timeline.type === "time_series") {
      // For time series, check if this specific month has a capex investment
      const series = timeline.series || [];
      const monthData = series.find((s: any) => s.period === monthIndex + 1);
      if (monthData) {
        totalCapex += monthData.value || 0;
      }
    } else if (timeline.type === "pattern") {
      // For patterns, apply the same logic as volume calculations
      if (timeline.pattern_type === "seasonal_growth") {
        totalCapex += calculateSeasonalGrowthVolume(timeline, monthIndex);
      } else if (timeline.pattern_type === "geom_growth") {
        totalCapex += calculateGeomGrowthVolume(timeline, monthIndex);
      } else if (timeline.pattern_type === "linear_growth") {
        totalCapex += calculateLinearGrowthVolume(timeline, monthIndex);
      }
    }
  }

  return totalCapex;
}

/**
 * Calculate break-even point (first month with positive cumulative cash flow)
 */
export function calculateBreakEven(monthlyData: MonthlyData[]): number | null {
  let cumulativeCashFlow = 0;
  for (let i = 0; i < monthlyData.length; i++) {
    cumulativeCashFlow += monthlyData[i].netCashFlow;
    if (cumulativeCashFlow >= 0) {
      return i + 1; // Return month number (1-indexed)
    }
  }
  return null; // Never breaks even
}

/**
 * Default metrics for when no data is available
 */
function getDefaultMetrics(): CalculatedMetrics {
  return {
    totalRevenue: 0,
    netProfit: 0,
    npv: 0,
    paybackPeriod: 0,
    roi: 0,
    breakEvenMonth: 0,
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