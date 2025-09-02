import React, { createContext, useContext, useState, useCallback } from 'react';

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
  drivers?: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
}

interface BusinessDataContextType {
  data: BusinessData | null;
  updateData: (newData: BusinessData) => void;
  updateAssumption: (path: string, value: any) => void;
  updateDriver: (driverIndex: number, updates: any) => void;
  exportData: () => string;
}

const BusinessDataContext = createContext<BusinessDataContextType | undefined>(undefined);

export function BusinessDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BusinessData | null>(null);

  const updateData = useCallback((newData: BusinessData) => {
    // Fill in missing fields with defaults
    const normalizedData = {
      ...newData,
      assumptions: {
        pricing: newData.assumptions?.pricing || {
          avg_unit_price: { value: 0, unit: "EUR_per_unit", rationale: "Default value" },
          discount_pct: { value: 0, unit: "ratio", rationale: "Default value" }
        },
        financial: newData.assumptions?.financial || {
          interest_rate: { value: 0.1, unit: "ratio", rationale: "Default 10% discount rate" }
        },
        customers: newData.assumptions?.customers || {
          segments: []
        },
        unit_economics: newData.assumptions?.unit_economics || {
          cogs_pct: { value: 0, unit: "ratio", rationale: "Default value" },
          cac: { value: 0, unit: "EUR", rationale: "Default value" }
        },
        opex: newData.assumptions?.opex || []
      },
      drivers: newData.drivers || []
    };
    
    setData(normalizedData);
  }, []);

  const updateAssumption = useCallback((path: string, value: any) => {
    if (!data) return;
    
    const pathParts = path.split('.');
    const newData = JSON.parse(JSON.stringify(data));
    
    let current = newData;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    
    setData(newData);
  }, [data]);

  const updateDriver = useCallback((driverIndex: number, updates: any) => {
    if (!data || !data.drivers) return;
    
    const newData = { ...data };
    newData.drivers = [...data.drivers];
    newData.drivers[driverIndex] = { ...newData.drivers[driverIndex], ...updates };
    
    setData(newData);
  }, [data]);

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2);
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