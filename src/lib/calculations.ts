interface CustomerSegment {
  id: string;
  label: string;
  kind: string;
  rationale: string;
  volume: {
    type: 'pattern' | 'time_series';
    pattern_type?: 'geom_growth' | 'seasonal_growth' | 'linear_growth';
    series?: Array<{ period: number; value: number; unit: string; rationale: string }>;
    base_year_total?: { value: number; unit: string; rationale: string };
    yoy_growth?: { value: number; unit: string; rationale: string };
    seasonality_index_12?: number[];
    monthly_growth?: { value: number; unit: string; rationale: string };
    monthly_flat_increase?: { value: number; unit: string; rationale: string };
    start?: { value: number; unit: string; rationale: string };
    fallback_formula?: string;
  };
}

interface BusinessData {
  schema_version?: string;
  instructions?: any;
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
      segments: CustomerSegment[];
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
  drivers?: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  npv: number;
  irr: number;
  paybackPeriod: number;
  roa: number;
  breakEvenMonth: number;
  monthlyRevenues: number[];
  monthlyCosts: number[];
  monthlyCashFlows: number[];
  cumulativeCashFlows: number[];
}

function expandSegmentVolume(segment: CustomerSegment, periods: number): number[] {
  const volume = segment.volume;
  const result: number[] = new Array(periods).fill(0);

  if (volume.type === 'time_series' && volume.series) {
    // Use provided time series data
    volume.series.forEach(entry => {
      if (entry.period <= periods) {
        result[entry.period - 1] = entry.value;
      }
    });
    return result;
  }

  if (volume.type === 'pattern') {
    switch (volume.pattern_type) {
      case 'geom_growth':
        const startValue = volume.start?.value || 0;
        const growthRate = volume.monthly_growth?.value || 0;
        for (let i = 0; i < periods; i++) {
          result[i] = startValue * Math.pow(1 + growthRate, i);
        }
        break;

      case 'linear_growth':
        const linearStart = volume.start?.value || 0;
        const monthlyIncrease = volume.monthly_flat_increase?.value || 0;
        for (let i = 0; i < periods; i++) {
          result[i] = linearStart + (monthlyIncrease * i);
        }
        break;

      case 'seasonal_growth':
        if (volume.base_year_total && volume.seasonality_index_12) {
          const baseYearTotal = volume.base_year_total.value;
          const yoyGrowth = volume.yoy_growth?.value || 0;
          const seasonality = volume.seasonality_index_12;
          
          const monthlyBase = baseYearTotal / 12;
          
          for (let i = 0; i < periods; i++) {
            const year = Math.floor(i / 12);
            const monthInYear = i % 12;
            const yearMultiplier = Math.pow(1 + yoyGrowth, year);
            const seasonalMultiplier = seasonality[monthInYear] || 1;
            
            result[i] = monthlyBase * yearMultiplier * seasonalMultiplier;
          }
        }
        break;
    }
  }

  return result;
}

export function calculateFinancialMetrics(data: BusinessData): FinancialMetrics {
  const periods = data.meta.periods;
  const discountRate = data.assumptions.financial.interest_rate.value;
  const avgUnitPrice = data.assumptions.pricing.avg_unit_price.value;
  const discountPct = data.assumptions.pricing.discount_pct.value;
  const cogsPct = data.assumptions.unit_economics.cogs_pct.value;
  
  // Calculate monthly volumes for all segments
  const segmentVolumes = data.assumptions.customers.segments.map(segment => 
    expandSegmentVolume(segment, periods)
  );
  
  // Calculate total monthly volumes
  const totalMonthlyVolumes = new Array(periods).fill(0);
  for (let i = 0; i < periods; i++) {
    totalMonthlyVolumes[i] = segmentVolumes.reduce((sum, segmentVolume) => 
      sum + segmentVolume[i], 0
    );
  }
  
  // Calculate revenues
  const effectivePrice = avgUnitPrice * (1 - discountPct);
  const monthlyRevenues = totalMonthlyVolumes.map(volume => volume * effectivePrice);
  
  // Calculate monthly OpEx
  const monthlyOpex = data.assumptions.opex.reduce((sum, opexItem) => 
    sum + opexItem.value.value, 0
  );
  
  // Calculate costs (COGS + OpEx)
  const monthlyCosts = monthlyRevenues.map(revenue => 
    (revenue * cogsPct) + monthlyOpex
  );
  
  // Calculate cash flows
  const monthlyCashFlows = monthlyRevenues.map((revenue, i) => 
    revenue - monthlyCosts[i]
  );
  
  // Calculate cumulative cash flows
  const cumulativeCashFlows = monthlyCashFlows.reduce((acc, cashFlow, i) => {
    acc.push((acc[i - 1] || 0) + cashFlow);
    return acc;
  }, [] as number[]);
  
  // Calculate metrics
  const totalRevenue = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
  const totalCosts = monthlyCosts.reduce((sum, cost) => sum + cost, 0);
  const netProfit = totalRevenue - totalCosts;
  
  // Calculate NPV
  let npv = 0;
  for (let i = 0; i < periods; i++) {
    npv += monthlyCashFlows[i] / Math.pow(1 + discountRate / 12, i);
  }
  
  // Find break-even month
  let breakEvenMonth = periods;
  for (let i = 0; i < cumulativeCashFlows.length; i++) {
    if (cumulativeCashFlows[i] > 0) {
      breakEvenMonth = i + 1;
      break;
    }
  }
  
  // Calculate IRR (simplified estimation)
  const irr = calculateIRR(monthlyCashFlows) || 0;
  
  // Calculate payback period (months to recover initial investment)
  const paybackPeriod = breakEvenMonth;
  
  // Calculate ROA (simplified)
  const initialInvestment = Math.abs(Math.min(...cumulativeCashFlows, 0));
  const roa = initialInvestment > 0 ? netProfit / initialInvestment : 0;
  
  return {
    totalRevenue,
    totalCosts,
    netProfit,
    npv,
    irr,
    paybackPeriod,
    roa,
    breakEvenMonth,
    monthlyRevenues,
    monthlyCosts,
    monthlyCashFlows,
    cumulativeCashFlows
  };
}

function calculateIRR(cashFlows: number[]): number | null {
  // Simplified IRR calculation using Newton-Raphson method
  let rate = 0.1; // Initial guess
  const tolerance = 0.0001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let npvDerivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += cashFlows[j] / factor;
      npvDerivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate;
    }
    
    if (npvDerivative === 0) {
      break;
    }
    
    rate = rate - npv / npvDerivative;
    
    if (rate < -0.99) rate = -0.99; // Prevent negative rates
    if (rate > 10) rate = 10; // Cap very high rates
  }
  
  return null; // IRR not found
}

export function calculateSensitivityAnalysis(
  data: BusinessData, 
  driverKey: string, 
  values: number[]
): Array<{ value: number; metrics: FinancialMetrics }> {
  const driver = data.drivers?.find(d => d.key === driverKey);
  if (!driver) return [];
  
  return values.map(value => {
    // Create a copy of the data with the new value
    const modifiedData = JSON.parse(JSON.stringify(data));
    
    // Navigate to the path and update the value
    const pathParts = driver.path.split('.');
    let current = modifiedData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    
    return {
      value,
      metrics: calculateFinancialMetrics(modifiedData)
    };
  });
}