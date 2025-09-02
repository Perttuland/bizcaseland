import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertCircle } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { calculateFinancialMetrics, calculateSensitivityAnalysis } from '@/lib/calculations';

interface BusinessData {
  meta: any;
  assumptions: any;
  drivers?: any[];
}

interface BusinessCaseAnalysisProps {
  data: BusinessData;
}

export function BusinessCaseAnalysis({ data }: BusinessCaseAnalysisProps) {
  const { data: contextData } = useBusinessData();
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  
  // Always use context data if available for real-time updates
  const businessData = contextData || data;
  
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(businessData);
  }, [businessData]);

  const sensitivityAnalysis = useMemo(() => {
    if (!businessData.drivers?.length) return {};
    return calculateSensitivityAnalysis(businessData, businessData.drivers);
  }, [businessData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return metrics.monthlyRevenue.map((revenue, index) => ({
      month: `M${index + 1}`,
      revenue: Math.round(revenue),
      ebitda: Math.round(metrics.monthlyEBITDA[index]),
      grossProfit: Math.round(metrics.monthlyGrossProfit[index]),
      cumulativeRevenue: Math.round(metrics.cumulativeRevenue[index]),
      cumulativeEBITDA: Math.round(metrics.cumulativeEBITDA[index])
    }));
  }, [metrics]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: businessData.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  const getSensitivityChartData = (driverKey: string) => {
    if (!sensitivityAnalysis[driverKey]) return [];
    
    return Object.entries(sensitivityAnalysis[driverKey]).map(([scenario, data]: [string, any]) => ({
      scenario: `${data.value}`,
      npv: Math.round(data.npv),
      revenue: Math.round(data.totalRevenue),
      ebitda: Math.round(data.totalEBITDA)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total EBITDA</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalEBITDA)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">NPV</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.npv)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Payback Period</p>
                <p className="text-2xl font-bold">
                  {metrics.paybackPeriod ? `${metrics.paybackPeriod}M` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Average Monthly Revenue</p>
              <p className="text-xl font-semibold">{formatCurrency(metrics.averageMonthlyRevenue)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Gross Margin</p>
              <p className="text-xl font-semibold">{formatPercentage(metrics.grossMargin)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Units Sold</p>
              <p className="text-xl font-semibold">
                {metrics.monthlyUnits.reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financials" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financials">Financial Projections</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Performance</TabsTrigger>
          <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Financial Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="grossProfit" stroke="#10b981" strokeWidth={2} name="Gross Profit" />
                    <Line type="monotone" dataKey="ebitda" stroke="#f59e0b" strokeWidth={2} name="EBITDA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cumulative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Line type="monotone" dataKey="cumulativeRevenue" stroke="#3b82f6" strokeWidth={2} name="Cumulative Revenue" />
                    <Line type="monotone" dataKey="cumulativeEBITDA" stroke="#f59e0b" strokeWidth={2} name="Cumulative EBITDA" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          {businessData.drivers && businessData.drivers.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity Analysis</CardTitle>
                  <div className="flex space-x-2">
                    {businessData.drivers.map((driver: any) => (
                      <Badge
                        key={driver.key}
                        variant={selectedDriver === driver.key ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedDriver(driver.key)}
                      >
                        {driver.key}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDriver && sensitivityAnalysis[selectedDriver] && (
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getSensitivityChartData(selectedDriver)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="scenario" />
                          <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Bar dataKey="npv" fill="#3b82f6" name="NPV" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {!selectedDriver && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a driver above to view sensitivity analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sensitivity Drivers</h3>
                  <p className="text-muted-foreground">Add drivers to your JSON to enable sensitivity analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}