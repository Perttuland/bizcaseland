import React, { createContext, useContext, useState, useCallback } from 'react';

export interface BusinessData {
  meta: {
    title: string;
    description: string;
    archetype: string;
    currency: string;
    periods: number;
    frequency: string;
  };
  assumptions: any;
  drivers?: any[];
  scenarios?: any[];
  structure?: any;
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
    setData(newData);
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