import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, BarChart3 } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { calculateFinancialMetrics, calculateSensitivityAnalysis } from '@/lib/calculations';

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
        volume: any;
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

interface BusinessCaseAnalysisProps {
  data: BusinessData;
}

export function BusinessCaseAnalysis({ data: propData }: BusinessCaseAnalysisProps) {
  const { data: contextData } = useBusinessData();
  const data = contextData || propData;

  const metrics = useMemo(() => {
    if (!data) return null;
    return calculateFinancialMetrics(data);
  }, [data]);

  const sensitivityData = useMemo(() => {
    if (!data || !data.drivers || !metrics) return [];
    
    return data.drivers.map(driver => {
      const analysis = calculateSensitivityAnalysis(data, driver.key, driver.range);
      return {
        driver: driver.key,
        title: driver.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        data: analysis.map((item, index) => ({
          scenario: `Scenario ${index + 1}`,
          value: item.value,
          revenue: item.metrics.totalRevenue,
          profit: item.metrics.netProfit,
          npv: item.metrics.npv
        }))
      };
    });
  }, [data, metrics]);

  const monthlyData = useMemo(() => {
    if (!metrics) return [];
    
    return metrics.monthlyRevenues.map((revenue, index) => ({
      month: index + 1,
      revenue: revenue,
      costs: metrics.monthlyCosts[index],
      cashFlow: metrics.monthlyCashFlows[index],
      cumulativeCashFlow: metrics.cumulativeCashFlows[index]
    }));
  }, [metrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data?.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!data || !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{data.meta.title}</CardTitle>
              <p className="text-muted-foreground">{data.meta.description}</p>
            </div>
            <Badge className="bg-gradient-primary text-white">
              {data.meta.archetype}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time Horizon</p>
                <p className="font-semibold">{data.meta.periods} months</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-semibold">{data.meta.currency}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Target className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Break-even</p>
                <p className="font-semibold">Month {metrics.breakEvenMonth}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Net Profit</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.netProfit)}</p>
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
                <p className="text-2xl font-bold text-financial-warning">{formatCurrency(metrics.npv)}</p>
              </div>
              <Target className="h-8 w-8 text-financial-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-financial-info border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IRR</p>
                <p className="text-2xl font-bold text-financial-info">{formatPercent(metrics.irr || 0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-financial-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Revenue vs Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1" 
                    stroke="hsl(var(--financial-success))" 
                    fill="hsl(var(--financial-success))" 
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="costs" 
                    stackId="2" 
                    stroke="hsl(var(--financial-danger))" 
                    fill="hsl(var(--financial-danger))" 
                    name="Costs"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-financial-primary">{metrics.paybackPeriod}</div>
                  <div className="text-sm text-muted-foreground">Payback Period (months)</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-financial-success">{formatPercent(metrics.roa)}</div>
                  <div className="text-sm text-muted-foreground">Return on Assets</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Unit Economics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Avg Unit Price</div>
                  <div className="text-lg font-bold">{formatCurrency(data.assumptions.pricing.avg_unit_price.value)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">COGS %</div>
                  <div className="text-lg font-bold">{formatPercent(data.assumptions.unit_economics.cogs_pct.value)}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Operating Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.assumptions.opex.map((opex, index) => (
                  <div key={index} className="flex justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">{opex.name}</span>
                    <span className="font-medium">{formatCurrency(opex.value.value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Monthly Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cashFlow" 
                    stroke="hsl(var(--financial-primary))" 
                    strokeWidth={2}
                    name="Monthly Cash Flow"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeCashFlow" 
                    stroke="hsl(var(--financial-success))" 
                    strokeWidth={2}
                    name="Cumulative Cash Flow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          {sensitivityData.map((sensitivity, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>{sensitivity.title} Sensitivity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sensitivity.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar 
                      dataKey="revenue" 
                      fill="hsl(var(--financial-success))" 
                      name="Revenue"
                    />
                    <Bar 
                      dataKey="profit" 
                      fill="hsl(var(--financial-primary))" 
                      name="Profit"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}