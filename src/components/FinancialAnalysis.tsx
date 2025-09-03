import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target, AlertCircle, RotateCcw } from 'lucide-react';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { calculateBusinessMetrics, formatCurrency, formatPercent } from '@/lib/calculations';
import { CustomerSegments } from './CustomerSegments';

// Helper functions for driver manipulation
function setNestedValue(obj: any, path: string, value: number): any {
  const newObj = JSON.parse(JSON.stringify(obj));
  const pathParts = path.split('.');
  let current = newObj;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      while (current[arrayName].length <= index) {
        current[arrayName].push({});
      }
      current = current[arrayName][index];
    } else {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }
  
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart.includes('[') && lastPart.includes(']')) {
    const arrayName = lastPart.split('[')[0];
    const index = parseInt(lastPart.split('[')[1].split(']')[0]);
    if (!current[arrayName]) {
      current[arrayName] = [];
    }
    while (current[arrayName].length <= index) {
      current[arrayName].push({});
    }
    current[arrayName][index] = value;
  } else {
    current[lastPart] = value;
  }
  
  return newObj;
}

function getNestedValue(obj: any, path: string): number {
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      if (!current[arrayName] || !current[arrayName][index]) {
        return 0;
      }
      current = current[arrayName][index];
    } else {
      if (!current || current[part] === undefined) {
        return 0;
      }
      current = current[part];
    }
  }
  
  return typeof current === 'number' ? current : (current?.value || 0);
}

export function FinancialAnalysis() {
  const { data: businessData, updateData } = useBusinessData();
  
  const [driverValues, setDriverValues] = useState<{[key: string]: number}>({});
  
  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get drivers and initialize values if needed
  const drivers = businessData.drivers || [];
  
  // Create modified business data with current driver values
  const modifiedBusinessData = useMemo(() => {
    let modified = businessData;
    
    for (const driver of drivers) {
      const currentValue = driverValues[driver.key];
      if (currentValue !== undefined) {
        modified = setNestedValue(modified, driver.path, currentValue);
      }
    }
    
    return modified;
  }, [businessData, driverValues]);
  
  // Calculate metrics from modified business data using centralized calculations
  const calculatedMetrics = useMemo(() => {
    return calculateBusinessMetrics(modifiedBusinessData);
  }, [modifiedBusinessData]);

  // Update the global data when driver values change
  React.useEffect(() => {
    if (Object.keys(driverValues).length > 0) {
      updateData(modifiedBusinessData);
    }
  }, [modifiedBusinessData, updateData]);

  const handleDriverChange = (driverKey: string, value: number) => {
    setDriverValues(prev => ({
      ...prev,
      [driverKey]: value
    }));
  };

  const resetDrivers = () => {
    setDriverValues({});
    updateData(businessData);
  };

  const getDriverCurrentValue = (driver: any) => {
    return driverValues[driver.key] !== undefined 
      ? driverValues[driver.key] 
      : getNestedValue(businessData, driver.path);
  };

  const getArchetypeColor = (archetype: string) => {
    const colors = {
      subscription: 'bg-gradient-primary text-white',
      transactional: 'bg-gradient-success text-white',
      licensing: 'bg-financial-warning text-financial-warning-foreground',
      profit_share: 'bg-financial-danger text-financial-danger-foreground',
      hybrid: 'bg-gradient-card text-foreground'
    };
    return colors[archetype as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Business Case Overview */}
      <Card className="bg-gradient-card shadow-elevation relative">
        {/* Business Model Badge in top-right corner */}
        <Badge variant="outline" className="absolute top-4 right-4 bg-financial-primary text-financial-primary-foreground">
          {businessData.meta.business_model === 'recurring' ? 'Recurring Revenue' : 'Unit Sales'}
        </Badge>
        
        <CardHeader>
          <div className="flex items-center justify-between pr-32">
            <CardTitle className="text-xl">{businessData.meta.title}</CardTitle>
            <Badge className={getArchetypeColor(businessData.meta.archetype)}>
              {businessData.meta.archetype}
            </Badge>
          </div>
          <p className="text-muted-foreground">{businessData.meta.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time Horizon</p>
                <p className="font-semibold">{businessData.meta.periods} months</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Target className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-semibold">{businessData.meta.frequency}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-semibold">{businessData.meta.currency}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-success-foreground/80">Total Revenue (5Y)</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.totalRevenue, businessData.meta.currency)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-primary-foreground/80">Net Profit (5Y)</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.netProfit, businessData.meta.currency)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-financial-warning border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Present Value</p>
                <p className="text-2xl font-bold text-financial-warning">{formatCurrency(calculatedMetrics.npv, businessData.meta.currency)}</p>
              </div>
              <Target className="h-8 w-8 text-financial-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-primary mb-2">{calculatedMetrics.paybackPeriod}</div>
              <div className="text-sm text-muted-foreground">Payback Period (months)</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-warning mb-2">{formatCurrency(calculatedMetrics.totalInvestmentRequired, businessData.meta.currency)}</div>
              <div className="text-sm text-muted-foreground">Total Investment Required</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-warning mb-2">{calculatedMetrics.breakEvenMonth}</div>
              <div className="text-sm text-muted-foreground">Break-even (months)</div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Interactive Sensitivity Drivers */}
      {drivers.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sensitivity Drivers</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetDrivers}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Adjust key drivers to see real-time impact on your business case
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {drivers.map((driver, index) => {
                const currentValue = getDriverCurrentValue(driver);
                const minValue = Math.min(...driver.range);
                const maxValue = Math.max(...driver.range);
                const baseValue = getNestedValue(businessData, driver.path);
                const isModified = driverValues[driver.key] !== undefined;
                
                return (
                  <div key={index} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {driver.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <p className="text-xs text-muted-foreground">{driver.rationale}</p>
                      </div>
                      {isModified && (
                        <Badge variant="outline" className="text-xs bg-financial-primary text-financial-primary-foreground">
                          Modified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Value:</span>
                        <span className="font-mono font-semibold">
                          {businessData.meta.currency && driver.path.includes('price') 
                            ? formatCurrency(currentValue, businessData.meta.currency)
                            : currentValue.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Slider
                          value={[currentValue]}
                          onValueChange={(values) => handleDriverChange(driver.key, values[0])}
                          min={minValue}
                          max={maxValue}
                          step={(maxValue - minValue) / 100}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{minValue.toLocaleString()}</span>
                          <span className="text-center">
                            Base: {businessData.meta.currency && driver.path.includes('price') 
                              ? formatCurrency(baseValue, businessData.meta.currency)
                              : baseValue.toLocaleString()}
                          </span>
                          <span>{maxValue.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {driver.range.map((value, i) => (
                          <Button
                            key={i}
                            variant={currentValue === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleDriverChange(driver.key, value)}
                            className="text-xs h-8"
                          >
                            {businessData.meta.currency && driver.path.includes('price') 
                              ? formatCurrency(value, businessData.meta.currency).replace(/[€$£]/g, '').trim()
                              : value.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Segments & Volume Projections */}
      <CustomerSegments data={modifiedBusinessData} />

      {/* Scenarios */}
      {businessData.scenarios && businessData.scenarios.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Scenarios Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {businessData.scenarios.map((scenario, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">{scenario.name}</h4>
                  <div className="text-2xl font-bold text-financial-primary mb-1">
                    {formatCurrency(calculatedMetrics.totalRevenue * (1 + index * 0.1 - 0.1), modifiedBusinessData.meta.currency)}
                  </div>
                  <p className="text-xs text-muted-foreground">Projected Revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}