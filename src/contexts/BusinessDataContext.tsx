import React, { createContext, useContext, useState, useCallback } from 'react';
import { setNestedValue } from '@/lib/utils/nested-operations';
import { safeJSONStringify } from '@/lib/utils/json-validation';

export interface BusinessData {
  schema_version?: string;
  meta: {
    title: string;
    description: string;
    business_model?: 'recurring' | 'unit_sales' | 'cost_savings';
    archetype?: string;
    currency: string;
    periods: number;
    frequency: string;
  };
  assumptions: {
    pricing?: {
      avg_unit_price?: { value: number; unit: string; rationale: string };
      yearly_adjustments?: {
        pricing_factors?: Array<{ year: number; factor: number; rationale: string }>;
        price_overrides?: Array<{ period: number; price: number; rationale: string }>;
      };
    };
    financial?: {
      interest_rate?: { value: number; unit: string; rationale: string };
    };
    customers?: {
      churn_pct?: { value: number; unit: string; rationale: string };
      segments?: Array<{
        id: string;
        label: string;
        rationale: string;
        volume?: {
          type: 'pattern' | 'time_series';
          pattern_type?: 'geom_growth' | 'seasonal_growth' | 'linear_growth';
          series?: Array<{ period: number; value: number; unit: string; rationale: string }>;
          base_year_total?: { value: number; unit: string; rationale: string };
          seasonality_index_12?: number[];
          yoy_growth?: { value: number; unit: string; rationale: string };
          monthly_growth_rate?: { value: number; unit: string; rationale: string };
          monthly_flat_increase?: { value: number; unit: string; rationale: string };
          yearly_adjustments?: {
            volume_factors?: Array<{ year: number; factor: number; rationale: string }>;
            volume_overrides?: Array<{ period: number; volume: number; rationale: string }>;
          };
        };
      }>;
    };
    unit_economics?: {
      cogs_pct?: { value: number; unit: string; rationale: string };
      cac?: { value: number; unit: string; rationale: string };
    };
    opex?: Array<{
      name: string;
      value: { value: number; unit: string; rationale: string };
    }>;
    capex?: Array<{
      name: string;
      timeline?: {
        type: 'pattern' | 'time_series';
        pattern_type?: 'geom_growth' | 'seasonal_growth' | 'linear_growth';
        series?: Array<{ period: number; value: number; unit: string; rationale: string }>;
      };
    }>;
    growth_settings?: {
      geom_growth?: {
        start?: { value: number; unit: string; rationale: string };
        monthly_growth?: { value: number; unit: string; rationale: string };
      };
      seasonal_growth?: {
        base_year_total?: { value: number; unit: string; rationale: string };
        seasonality_index_12?: { value: number[]; unit: string; rationale: string };
        yoy_growth?: { value: number; unit: string; rationale: string };
      };
      linear_growth?: {
        start?: { value: number; unit: string; rationale: string };
        monthly_flat_increase?: { value: number; unit: string; rationale: string };
      };
    };
    cost_savings?: {
      baseline_costs?: Array<{
        id: string;
        label: string;
        category: 'operational' | 'administrative' | 'technology' | 'other';
        current_monthly_cost: { value: number; unit: string; rationale: string };
        savings_potential_pct: { value: number; unit: string; rationale: string };
        implementation_timeline?: {
          start_month: number;
          ramp_up_months: number;
          full_implementation_month: number;
        };
      }>;
      efficiency_gains?: Array<{
        id: string;
        label: string;
        metric: string; // e.g., "hours saved", "transactions processed", "error reduction"
        baseline_value: { value: number; unit: string; rationale: string };
        improved_value: { value: number; unit: string; rationale: string };
        value_per_unit: { value: number; unit: string; rationale: string }; // monetary value per unit of improvement
        implementation_timeline?: {
          start_month: number;
          ramp_up_months: number;
          full_implementation_month: number;
        };
      }>;
    };
    market_analysis?: {
      total_addressable_market?: {
        base_value: { value: number; unit: string; rationale: string };
        growth_rate: { value: number; unit: string; rationale: string };
        currency: string;
        year: number; // Base year for TAM calculation
      };
      serviceable_addressable_market?: {
        percentage_of_tam: { value: number; unit: string; rationale: string };
      };
      serviceable_obtainable_market?: {
        percentage_of_sam: { value: number; unit: string; rationale: string };
      };
      market_share?: {
        current_share: { value: number; unit: string; rationale: string };
        target_share: { value: number; unit: string; rationale: string };
        target_timeframe: { value: number; unit: string; rationale: string }; // years to reach target
        penetration_strategy: 'linear' | 'exponential' | 's_curve';
      };
      competitive_landscape?: Array<{
        competitor_name: string;
        market_share: { value: number; unit: string; rationale: string };
        positioning: string;
      }>;
      market_segments?: Array<{
        id: string;
        name: string;
        size_percentage: { value: number; unit: string; rationale: string };
        growth_rate: { value: number; unit: string; rationale: string };
        target_share: { value: number; unit: string; rationale: string };
      }>;
      avg_customer_value?: {
        annual_value: { value: number; unit: string; rationale: string };
        lifetime_value: { value: number; unit: string; rationale: string };
      };
    };
  };
  drivers?: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
  scenarios?: any[];
  structure?: any;
}

interface BusinessDataContextType {
  data: BusinessData | null;
  updateData: (newData: BusinessData | null) => void;
  updateAssumption: (path: string, value: any) => void;
  updateDriver: (driverIndex: number, updates: any) => void;
  exportData: () => string;
}

const BusinessDataContext = createContext<BusinessDataContextType | undefined>(undefined);

export function BusinessDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BusinessData | null>(null);

  const updateData = useCallback((newData: BusinessData | null) => {
    setData(newData);
  }, []);

  const updateAssumption = useCallback((path: string, value: any) => {
    if (!data) {
      console.warn('updateAssumption called with no data');
      return;
    }
    
    try {
      const newData = setNestedValue(data, path, value);
      setData(newData);
    } catch (error) {
      console.error('Failed to update assumption:', error);
      // Don't update state if there's an error
    }
  }, [data]);

  const updateDriver = useCallback((driverIndex: number, updates: any) => {
    if (!data || !data.drivers) {
      console.warn('updateDriver called with no data or drivers');
      return;
    }
    
    if (driverIndex < 0 || driverIndex >= data.drivers.length) {
      console.error(`Invalid driver index: ${driverIndex}. Valid range: 0-${data.drivers.length - 1}`);
      return;
    }
    
    try {
      const newData = { ...data };
      newData.drivers = [...data.drivers];
      newData.drivers[driverIndex] = { ...newData.drivers[driverIndex], ...updates };
      
      setData(newData);
    } catch (error) {
      console.error('Failed to update driver:', error);
    }
  }, [data]);

  const exportData = useCallback(() => {
    const result = safeJSONStringify(data);
    if (!result.success) {
      console.error('Failed to export data:', result.error);
      return '{}';
    }
    return result.data || '{}';
  }, [data]);

  const value = {
    data,
    updateData,
    updateAssumption,
    updateDriver,
    exportData
  };

  return (
    <BusinessDataContext.Provider value={value}>
      {children}
    </BusinessDataContext.Provider>
  );
}

export function useBusinessData() {
  const context = useContext(BusinessDataContext);
  if (context === undefined) {
    throw new Error('useBusinessData must be used within a BusinessDataProvider');
  }
  return context;
}