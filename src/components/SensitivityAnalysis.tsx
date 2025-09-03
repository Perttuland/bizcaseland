import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Play, AlertCircle } from 'lucide-react';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { calculateBusinessMetrics, formatCurrency, formatPercent } from '@/lib/calculations';

interface SensitivityResult {
  driver: string;
  driverLabel: string;
  baseValue: number;
  scenarios: {
    value: number;
    totalRevenue: number;
    netProfit: number;
    npv: number;
    paybackPeriod: number;
    impact: number;
  }[];
}

// Helper function to set nested value in object
function setNestedValue(obj: any, path: string, value: number): any {
  const newObj = JSON.parse(JSON.stringify(obj));
  const pathParts = path.split('.');
  let current = newObj;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    // Handle array indices like "opex[2]"
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      current = current[arrayName][index];
    } else {
      current = current[part];
    }
  }
  
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart.includes('[') && lastPart.includes(']')) {
    const arrayName = lastPart.split('[')[0];
    const index = parseInt(lastPart.split('[')[1].split(']')[0]);
    current[arrayName][index] = value;
  } else {
    current[lastPart] = value;
  }
  
  return newObj;
}

// Helper function to get nested value from object
function getNestedValue(obj: any, path: string): number {
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (part.includes('[') && part.includes(']')) {
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].split(']')[0]);
      current = current[arrayName][index];
    } else {
      current = current[part];
    }
  }
  
  return current;
}

export function SensitivityAnalysis() {
  const { data: businessData } = useBusinessData();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SensitivityResult[]>([]);

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to run sensitivity analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const drivers = businessData.drivers || [];

  if (drivers.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Drivers Configured</h3>
            <p className="text-muted-foreground">Add drivers to your business data to enable sensitivity analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const runSensitivityAnalysis = async () => {
    setIsRunning(true);
    const analysisResults: SensitivityResult[] = [];
    
    try {
      // Get baseline metrics
      const baselineMetrics = calculateBusinessMetrics(businessData);
      
      for (const driver of drivers) {
        const baseValue = getNestedValue(businessData, driver.path);
        const scenarios = [];
        
        for (const testValue of driver.range) {
          // Create modified business data with the test value
          const modifiedData = setNestedValue(businessData, driver.path, testValue);
          
          // Calculate metrics with modified data
          const metrics = calculateBusinessMetrics(modifiedData);
          
          // Calculate impact percentage compared to baseline
          const revenueImpact = ((metrics.totalRevenue - baselineMetrics.totalRevenue) / baselineMetrics.totalRevenue) * 100;
          
          scenarios.push({
            value: testValue,
            totalRevenue: metrics.totalRevenue,
            netProfit: metrics.netProfit,
            npv: metrics.npv,
            paybackPeriod: metrics.paybackPeriod,
            impact: revenueImpact
          });
        }
        
        analysisResults.push({
          driver: driver.key,
          driverLabel: driver.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          baseValue,
          scenarios
        });
      }
      
      setResults(analysisResults);
    } catch (error) {
      console.error('Error running sensitivity analysis:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact > 10) return 'text-financial-success';
    if (impact > 0) return 'text-financial-success/70';
    if (impact > -10) return 'text-financial-danger/70';
    return 'text-financial-danger';
  };

  const getImpactIcon = (impact: number) => {
    return impact >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sensitivity Analysis
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Test how changes to key drivers impact your business metrics
              </p>
            </div>
            <Button 
              onClick={runSensitivityAnalysis} 
              disabled={isRunning}
              className="bg-financial-primary hover:bg-financial-primary/90"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {/* Drivers Overview */}
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-semibold">Configured Drivers ({drivers.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drivers.map((driver, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {driver.key.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{driver.rationale}</p>
                  <div className="text-xs text-muted-foreground">
                    Range: {driver.range.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {results.map((result, index) => (
            <Card key={index} className="bg-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">{result.driverLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.scenarios}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="value" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number, name: string) => {
                            if (name === 'totalRevenue') return [formatCurrency(value, businessData.meta.currency), 'Total Revenue'];
                            if (name === 'npv') return [formatCurrency(value, businessData.meta.currency), 'NPV'];
                            return [value, name];
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalRevenue" 
                          stroke="hsl(var(--financial-primary))" 
                          strokeWidth={2}
                          name="totalRevenue"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="npv" 
                          stroke="hsl(var(--financial-warning))" 
                          strokeWidth={2}
                          name="npv"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Value</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">NPV</th>
                          <th className="text-right p-2">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.scenarios.map((scenario, scenarioIndex) => (
                          <tr key={scenarioIndex} className="border-b">
                            <td className="p-2 font-mono">{scenario.value}</td>
                            <td className="text-right p-2">{formatCurrency(scenario.totalRevenue, businessData.meta.currency)}</td>
                            <td className="text-right p-2">{formatCurrency(scenario.npv, businessData.meta.currency)}</td>
                            <td className={`text-right p-2 flex items-center justify-end gap-1 ${getImpactColor(scenario.impact)}`}>
                              {getImpactIcon(scenario.impact)}
                              <span>{formatPercent(scenario.impact / 100)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}