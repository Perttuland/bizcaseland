import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/calculations';
import { getNestedValue } from '@/lib/utils/nested-operations';

interface Driver {
  key: string;
  path: string;
  rationale: string;
  range: number[];
}

interface SensitivityAnalysisProps {
  drivers: Driver[];
  businessData: any;
  baselineRef: React.MutableRefObject<any>;
  driverValues: {[key: string]: number};
  onDriverChange: (driverKey: string, value: number) => void;
}

export function SensitivityAnalysis({ 
  drivers, 
  businessData, 
  baselineRef,
  driverValues,
  onDriverChange
}: SensitivityAnalysisProps) {
  
  const getDriverCurrentValue = (driver: Driver) => {
    return driverValues[driver.key] !== undefined 
      ? driverValues[driver.key] 
      : getNestedValue(businessData, driver.path);
  };

  if (drivers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <div>
          <CardTitle>Sensitivity Drivers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust key drivers to see real-time impact on your business case. Changes apply immediately.
          </p>
        </div>
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
                      onValueChange={(values) => onDriverChange(driver.key, values[0])}
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
                          onClick={() => onDriverChange(driver.key, value)}
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
  );
}

export default SensitivityAnalysis;