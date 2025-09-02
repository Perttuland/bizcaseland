interface BusinessData {
  schema_version?: string;
  meta: {
    title: string;
    description: string;
    archetype: string;
    currency: string;
    periods: number;
    frequency: string;
  };
  assumptions: {
    pricing: {
      avg_unit_price: { value: number; unit: string; rationale: string };
      discount_pct: { value: number; unit: string; rationale: string };
    };
    financial: {
      interest_rate: { value: number; unit: string; rationale: string };
    };
    customers: {
      segments: Array<{
        id: string;
        label: string;
        kind: string;
        rationale: string;
        volume: {
          type: string;
          pattern_type: string;
          series?: Array<{ period: number; value: number; unit: string; rationale: string }>;
          seasonality_index_12?: number[];
          base_year_total?: { value: number; unit: string; rationale: string };
          yoy_growth?: { value: number; unit: string; rationale: string };
          fallback_formula?: string;
        };
      }>;
    };
    unit_economics: {
      cogs_pct: { value: number; unit: string; rationale: string };
      cac: { value: number; unit: string; rationale: string };
    };
    opex: Array<{
      name: string;
      value: { value: number; unit: string; rationale: string };
    }>;
  };
  drivers: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
}

interface MonthlyData {
  month: number;
  date: string;
  customers: number;
  revenue: number;
  cogs: number;
  opex: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  segmentBreakdown: Record<string, number>;
}

export function calculateSeasonalVolume(
  segment: BusinessData['assumptions']['customers']['segments'][0],
  month: number
): number {
  const { volume } = segment;
  
  if (volume.pattern_type === 'seasonal_growth' && volume.seasonality_index_12 && volume.base_year_total) {
    const yearIndex = Math.floor((month - 1) / 12);
    const monthInYear = ((month - 1) % 12);
    const seasonalityIndex = volume.seasonality_index_12[monthInYear];
    
    // Calculate base monthly volume
    const baseMonthlyVolume = volume.base_year_total.value / 12;
    
    // Apply seasonality
    const seasonalVolume = baseMonthlyVolume * seasonalityIndex;
    
    // Apply YoY growth if specified
    const yoyGrowthRate = volume.yoy_growth?.value || 0;
    const growthMultiplier = Math.pow(1 + yoyGrowthRate, yearIndex);
    
    return seasonalVolume * growthMultiplier;
  }
  
  // Fallback to simple series if available
  if (volume.series && volume.series.length > 0) {
    return volume.series[0].value;
  }
  
  return 0;
}

export function calculateMonthlyProjection(data: BusinessData): MonthlyData[] {
  const periods = data.meta.periods;
  const results: MonthlyData[] = [];
  let cumulativeCashFlow = 0;

  // Get base values
  const avgUnitPrice = data.assumptions.pricing.avg_unit_price.value;
  const discountPct = data.assumptions.pricing.discount_pct.value;
  const cogsPct = data.assumptions.unit_economics.cogs_pct.value;
  const monthlyOpex = data.assumptions.opex.reduce((sum, opex) => sum + opex.value.value, 0);

  for (let month = 1; month <= periods; month++) {
    // Calculate volume for each customer segment
    let totalCustomers = 0;
    const segmentBreakdown: Record<string, number> = {};
    
    data.assumptions.customers.segments.forEach((segment) => {
      const segmentVolume = calculateSeasonalVolume(segment, month);
      segmentBreakdown[segment.id] = segmentVolume;
      totalCustomers += segmentVolume;
    });
    
    const grossRevenue = totalCustomers * avgUnitPrice;
    const revenue = grossRevenue * (1 - discountPct);
    const cogs = revenue * cogsPct;
    const netCashFlow = revenue - cogs - monthlyOpex;
    cumulativeCashFlow += netCashFlow;

    results.push({
      month,
      date: new Date(2026, month - 1).toISOString().slice(0, 7),
      customers: Math.round(totalCustomers),
      revenue: Math.round(revenue),
      cogs: Math.round(cogs),
      opex: Math.round(monthlyOpex),
      netCashFlow: Math.round(netCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      segmentBreakdown
    });
  }

  return results;
}

export function calculateSummaryMetrics(monthlyData: MonthlyData[], data: BusinessData) {
  if (monthlyData.length === 0) return null;

  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalCosts = monthlyData.reduce((sum, month) => sum + month.cogs + month.opex, 0);
  const finalCumulativeCashFlow = monthlyData[monthlyData.length - 1]?.cumulativeCashFlow || 0;
  
  // Calculate NPV
  const discountRate = data.assumptions.financial.interest_rate.value || 0.1;
  const monthlyRate = discountRate / 12;
  const npv = monthlyData.reduce((sum, month) => {
    return sum + month.netCashFlow / Math.pow(1 + monthlyRate, month.month);
  }, 0);

  // Find break-even month
  const breakEvenMonth = monthlyData.findIndex(month => month.cumulativeCashFlow > 0);

  return {
    totalRevenue,
    totalCosts,
    finalCumulativeCashFlow,
    npv,
    breakEvenMonth: breakEvenMonth === -1 ? null : breakEvenMonth + 1
  };
}