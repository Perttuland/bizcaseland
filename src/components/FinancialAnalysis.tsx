import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target, AlertCircle, BarChart3 } from 'lucide-react';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { calculateBusinessMetrics, formatCurrency, formatPercent, calculateBreakEven } from '@/lib/calculations';

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
  // baselineRef holds the original JSON data so we can compare current values
  // against the original baseline even after the global data is updated.
  const baselineRef = useRef(businessData);

  // Update baseline when a fresh businessData is loaded and there are no active modifications.
  useEffect(() => {
    if (Object.keys(driverValues).length === 0) {
      baselineRef.current = businessData;
    }
  }, [businessData, driverValues]);

  // Listen for global data refresh events (dispatched from BusinessCaseAnalyzer)
  useEffect(() => {
    const handleDataRefreshed = () => {
      // Clear any local driver overrides so UI reflects the fresh JSON
      setDriverValues({});
      // Update baseline to the latest businessData
      baselineRef.current = businessData;
    };

    window.addEventListener('datarefreshed', handleDataRefreshed);
    return () => window.removeEventListener('datarefreshed', handleDataRefreshed);
  }, [businessData]);
  
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
    const metrics = calculateBusinessMetrics(modifiedBusinessData);

    // Ensure break-even month is recalculated correctly
    metrics.breakEvenMonth = calculateBreakEven(metrics.monthlyData);

    return metrics;
  }, [modifiedBusinessData]);

  // Update the global data when driver values change
  React.useEffect(() => {
    updateData(modifiedBusinessData);
  }, [modifiedBusinessData, updateData]);

  const handleDriverChange = (driverKey: string, value: number) => {
    setDriverValues(prev => ({
      ...prev,
      [driverKey]: value
    }));
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
          {/* Removed Time Horizon, Frequency, and Currency UI elements */}
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

        <Card className={calculatedMetrics.netProfit >= 0 ? "bg-gradient-success shadow-card" : "bg-gradient-danger shadow-card"}>
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

        <Card className={calculatedMetrics.npv >= 0 ? "bg-gradient-success shadow-card" : "bg-gradient-danger shadow-card"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Present Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(calculatedMetrics.npv, businessData.meta.currency)}</p>
              </div>
              <Target className="h-8 w-8 text-white" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-primary mb-2">{calculatedMetrics.paybackPeriod > 0 ? calculatedMetrics.paybackPeriod : "N/A"}</div>
              <div className="text-sm text-muted-foreground">Payback Period (months)</div>
            </div>
            <div className={`text-center p-4 bg-muted/50 rounded-lg ${calculatedMetrics.irr >= 0 && calculatedMetrics.irr <= 1 && calculatedMetrics.irr !== -999 ? 'text-financial-success' : 'text-financial-danger'}`}>
              <div className="text-3xl font-bold mb-2">
                {calculatedMetrics.irr === -999 || calculatedMetrics.irr < -1 || calculatedMetrics.irr > 1 ? (
                  <span className="text-financial-danger">-</span>
                ) : (
                  formatPercent(calculatedMetrics.irr)
                )}
              </div>
              <div className="text-sm text-muted-foreground">Internal Rate of Return</div>
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
            <CardTitle>Sensitivity Drivers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adjust key drivers to see real-time impact on your business case.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {drivers.map((driver, index) => {
                const currentValue = getDriverCurrentValue(driver);
                const minValue = Math.min(...driver.range);
                const maxValue = Math.max(...driver.range);
                const baseValue = getNestedValue(baselineRef.current || businessData, driver.path);
                const isModified = Math.abs(currentValue - baseValue) > 0.001;
                
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
                        {driver.range.map((value, i) => {
                          const isSelected = Math.abs(currentValue - value) < 0.001; // Handle floating point precision
                          return (
                            <Button
                              key={i}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleDriverChange(driver.key, value)}
                              className="text-xs h-8"
                            >
                              {businessData.meta.currency && driver.path.includes('price') 
                                ? formatCurrency(value, businessData.meta.currency).replace(/[€$£]/g, '').trim()
                                : value.toLocaleString()}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Volume & Customer Metrics */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Volume & Customer Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Customer acquisition and volume projections over the analysis period
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-financial-primary mr-2" />
              </div>
              <div className="text-3xl font-bold text-financial-primary mb-2">
                {calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Units Sold</div>
              <div className="text-xs text-muted-foreground mt-1">
                Over {calculatedMetrics.monthlyData.length} months
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-financial-success mr-2" />
              </div>
              <div className="text-3xl font-bold text-financial-success mb-2">
                {businessData.meta.business_model === 'recurring' ? 
                  calculatedMetrics.monthlyData.reduce((sum, month) => sum + (month.newCustomers || 0), 0).toLocaleString() :
                  calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0).toLocaleString()
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {businessData.meta.business_model === 'recurring' ? 'New Customers Acquired' : 'Total Customer Interactions'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {businessData.meta.business_model === 'recurring' ? 'Net new acquisitions' : 'All sales transactions'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-financial-warning mr-2" />
              </div>
              <div className="text-3xl font-bold text-financial-warning mb-2">
                {formatCurrency(
                  calculatedMetrics.monthlyData.length > 0 && calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) > 0 ? 
                    calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.revenue, 0) / calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) :
                    0,
                  businessData.meta.currency
                )}
              </div>
              <div className="text-sm text-muted-foreground">Average Revenue per Unit</div>
              <div className="text-xs text-muted-foreground mt-1">
                Blended rate across all periods
              </div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-financial-info mr-2" />
              </div>
              <div className="text-3xl font-bold text-financial-info mb-2">
                {calculatedMetrics.monthlyData.length > 0 ? 
                  Math.round(calculatedMetrics.monthlyData.reduce((sum, month) => sum + month.salesVolume, 0) / calculatedMetrics.monthlyData.length).toLocaleString() :
                  0
                }
              </div>
              <div className="text-sm text-muted-foreground">Average Monthly Volume</div>
              <div className="text-xs text-muted-foreground mt-1">
                Units per month
              </div>
            </div>
          </div>

          {/* Customer Segments Information */}
          {businessData.assumptions?.customers?.segments && businessData.assumptions.customers.segments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold mb-3 text-sm">Customer Segments</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessData.assumptions.customers.segments.map((segment, index) => (
                  <div key={index} className="p-4 bg-accent/20 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">{segment.label || `Segment ${index + 1}`}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {segment.volume?.type || 'Standard'}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      {segment.volume?.series?.[0]?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Volume:</span>
                          <span className="font-medium">{segment.volume.series[0].value.toLocaleString()}</span>
                        </div>
                      )}
                      {segment.volume?.yoy_growth?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">YoY Growth:</span>
                          <span className="font-medium">{(segment.volume.yoy_growth.value * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {segment.volume?.monthly_growth_rate?.value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Growth:</span>
                          <span className="font-medium">{(segment.volume.monthly_growth_rate.value * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {segment.volume?.pattern_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pattern:</span>
                          <span className="font-medium capitalize">{segment.volume.pattern_type.replace('_', ' ')}</span>
                        </div>
                      )}
                      {segment.rationale && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-muted-foreground">{segment.rationale}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Insights */}
          {calculatedMetrics.monthlyData.length > 1 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold mb-3 text-sm">Growth Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-lg font-bold text-financial-primary">
                    {calculatedMetrics.monthlyData.length > 0 && calculatedMetrics.monthlyData[0].salesVolume > 0 ? 
                      Math.round(((calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1].salesVolume - calculatedMetrics.monthlyData[0].salesVolume) / calculatedMetrics.monthlyData[0].salesVolume) * 100) :
                      0
                    }%
                  </div>
                  <div className="text-xs text-muted-foreground">Volume Growth</div>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-lg font-bold text-financial-success">
                    {calculatedMetrics.monthlyData[0]?.salesVolume?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Starting Volume</div>
                </div>
                <div className="text-center p-3 bg-accent/30 rounded-lg">
                  <div className="text-lg font-bold text-financial-warning">
                    {calculatedMetrics.monthlyData[calculatedMetrics.monthlyData.length - 1]?.salesVolume?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Final Volume</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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