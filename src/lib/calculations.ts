interface BusinessData {
  meta: {
    periods: number;
    currency: string;
  };
  assumptions: {
    pricing: {
      avg_unit_price: { value: number };
      discount_pct: { value: number };
    };
    financial: {
      interest_rate: { value: number };
    };
    customers: {
      segments: Array<{
        id: string;
        volume: {
          type: string;
          pattern_type: string;
          series?: Array<{ period: number; value: number }>;
          seasonality_index_12?: number[];
          base_year_total?: { value: number };
          yoy_growth?: { value: number };
        };
      }>;
    };
    unit_economics: {
      cogs_pct: { value: number };
      cac: { value: number };
    };
    opex: Array<{
      name: string;
      value: { value: number };
    }>;
  };
}

export function calculateMonthlyVolumes(data: BusinessData): { [segmentId: string]: number[] } {
  const periods = data.meta.periods;
  const volumes: { [segmentId: string]: number[] } = {};

  data.assumptions.customers.segments.forEach(segment => {
    const monthlyVolumes = new Array(periods).fill(0);
    
    if (segment.volume.type === 'pattern') {
      if (segment.volume.pattern_type === 'seasonal_growth') {
        const seasonality = segment.volume.seasonality_index_12 || new Array(12).fill(1);
        const baseTotal = segment.volume.base_year_total?.value || 0;
        const yoyGrowth = segment.volume.yoy_growth?.value || 0;
        
        // Calculate monthly base from annual total
        const monthlyBase = baseTotal / 12;
        
        for (let month = 0; month < periods; month++) {
          const year = Math.floor(month / 12);
          const monthInYear = month % 12;
          const yearMultiplier = Math.pow(1 + yoyGrowth, year);
          
          monthlyVolumes[month] = monthlyBase * seasonality[monthInYear] * yearMultiplier;
        }
      } else if (segment.volume.pattern_type === 'geom_growth') {
        // Handle geometric growth if needed
        const firstValue = segment.volume.series?.[0]?.value || 0;
        for (let month = 0; month < periods; month++) {
          monthlyVolumes[month] = firstValue * Math.pow(1.05, month); // 5% monthly growth example
        }
      } else if (segment.volume.pattern_type === 'linear_growth') {
        // Handle linear growth if needed
        const firstValue = segment.volume.series?.[0]?.value || 0;
        for (let month = 0; month < periods; month++) {
          monthlyVolumes[month] = firstValue + (month * 100); // +100 per month example
        }
      }
    } else if (segment.volume.type === 'time_series' && segment.volume.series) {
      // Handle explicit time series data
      segment.volume.series.forEach(point => {
        if (point.period <= periods) {
          monthlyVolumes[point.period - 1] = point.value;
        }
      });
    }
    
    volumes[segment.id] = monthlyVolumes;
  });

  return volumes;
}

export function calculateFinancialMetrics(data: BusinessData) {
  const periods = data.meta.periods;
  const volumes = calculateMonthlyVolumes(data);
  
  // Calculate monthly revenue
  const monthlyRevenue = new Array(periods).fill(0);
  const monthlyUnits = new Array(periods).fill(0);
  
  for (let month = 0; month < periods; month++) {
    let totalUnits = 0;
    Object.values(volumes).forEach(segmentVolumes => {
      totalUnits += segmentVolumes[month];
    });
    
    monthlyUnits[month] = totalUnits;
    const effectivePrice = data.assumptions.pricing.avg_unit_price.value * (1 - data.assumptions.pricing.discount_pct.value);
    monthlyRevenue[month] = totalUnits * effectivePrice;
  }
  
  // Calculate monthly costs
  const monthlyCOGS = monthlyRevenue.map(revenue => revenue * data.assumptions.unit_economics.cogs_pct.value);
  
  const monthlyOpex = new Array(periods).fill(0);
  data.assumptions.opex.forEach(opexItem => {
    for (let month = 0; month < periods; month++) {
      monthlyOpex[month] += opexItem.value.value;
    }
  });
  
  // Calculate monthly gross profit and EBITDA
  const monthlyGrossProfit = monthlyRevenue.map((revenue, i) => revenue - monthlyCOGS[i]);
  const monthlyEBITDA = monthlyGrossProfit.map((grossProfit, i) => grossProfit - monthlyOpex[i]);
  
  // Calculate cumulative metrics
  const cumulativeRevenue = monthlyRevenue.reduce((acc, curr, i) => {
    acc[i] = (acc[i - 1] || 0) + curr;
    return acc;
  }, [] as number[]);
  
  const cumulativeEBITDA = monthlyEBITDA.reduce((acc, curr, i) => {
    acc[i] = (acc[i - 1] || 0) + curr;
    return acc;
  }, [] as number[]);
  
  // Calculate NPV
  const discountRate = data.assumptions.financial.interest_rate.value / 12; // Monthly discount rate
  let npv = 0;
  monthlyEBITDA.forEach((ebitda, month) => {
    npv += ebitda / Math.pow(1 + discountRate, month + 1);
  });
  
  // Calculate payback period (months to positive cumulative EBITDA)
  let paybackPeriod = null;
  for (let i = 0; i < cumulativeEBITDA.length; i++) {
    if (cumulativeEBITDA[i] > 0) {
      paybackPeriod = i + 1;
      break;
    }
  }
  
  return {
    monthlyRevenue,
    monthlyUnits,
    monthlyCOGS,
    monthlyOpex,
    monthlyGrossProfit,
    monthlyEBITDA,
    cumulativeRevenue,
    cumulativeEBITDA,
    npv,
    paybackPeriod,
    totalRevenue: cumulativeRevenue[cumulativeRevenue.length - 1] || 0,
    totalEBITDA: cumulativeEBITDA[cumulativeEBITDA.length - 1] || 0,
    averageMonthlyRevenue: monthlyRevenue.reduce((a, b) => a + b, 0) / periods,
    grossMargin: monthlyRevenue.reduce((a, b) => a + b, 0) > 0 ? 
      monthlyGrossProfit.reduce((a, b) => a + b, 0) / monthlyRevenue.reduce((a, b) => a + b, 0) : 0
  };
}

export function calculateSensitivityAnalysis(data: BusinessData, drivers: any[]) {
  const baseMetrics = calculateFinancialMetrics(data);
  const results: any = {};
  
  drivers.forEach(driver => {
    const driverResults: any = {};
    
    driver.range.forEach((value: number, index: number) => {
      const testData = JSON.parse(JSON.stringify(data));
      
      // Update the specific value using the path
      const pathParts = driver.path.split('.');
      let current = testData;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      const metrics = calculateFinancialMetrics(testData);
      driverResults[`scenario_${index}`] = {
        value,
        npv: metrics.npv,
        totalRevenue: metrics.totalRevenue,
        totalEBITDA: metrics.totalEBITDA,
        paybackPeriod: metrics.paybackPeriod
      };
    });
    
    results[driver.key] = driverResults;
  });
  
  return results;
}