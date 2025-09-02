import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useBusinessData } from "@/contexts/BusinessDataContext";
import { calculateMonthlyProjection, calculateSummaryMetrics } from "@/lib/calculations";

export function BusinessCaseAnalysis() {
  const { data, updateValue } = useBusinessData();

  const monthlyData = useMemo(() => {
    if (!data) return [];
    return calculateMonthlyProjection(data);
  }, [data]);

  const summary = useMemo(() => {
    if (!data || monthlyData.length === 0) return null;
    return calculateSummaryMetrics(monthlyData, data);
  }, [monthlyData, data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: data?.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSensitivityChange = (driverKey: string, multiplier: number) => {
    if (!data) return;
    
    const driver = data.drivers.find(d => d.key === driverKey);
    if (!driver) return;

    const currentValue = driver.range[2]; // Middle value as base
    const newValue = currentValue * multiplier;
    
    updateValue(driver.path, newValue);
  };

  if (!data || monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>No analysis data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Present Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(summary?.npv || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Final Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.finalCumulativeCashFlow || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(summary?.finalCumulativeCashFlow || 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Break-even</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {summary?.breakEvenMonth ? `Month ${summary.breakEvenMonth}` : 'No break-even'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData.slice(0, 24)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" />
                <Line type="monotone" dataKey="cumulativeCashFlow" stroke="hsl(var(--accent))" name="Cumulative Cash Flow" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
                <Bar dataKey="cogs" fill="hsl(var(--destructive))" name="COGS" />
                <Bar dataKey="opex" fill="hsl(var(--muted))" name="OpEx" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sensitivity Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.drivers.map((driver) => (
            <div key={driver.key} className="space-y-2">
              <label className="text-sm font-medium capitalize">{driver.key}</label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleSensitivityChange(driver.key, 0.5)}>
                  -50%
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSensitivityChange(driver.key, 0.8)}>
                  -20%
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSensitivityChange(driver.key, 1.0)}>
                  Base
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSensitivityChange(driver.key, 1.2)}>
                  +20%
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleSensitivityChange(driver.key, 1.5)}>
                  +50%
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{driver.rationale}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Detailed Monthly Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Projection (First 24 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>COGS</TableHead>
                  <TableHead>OpEx</TableHead>
                  <TableHead>Net Cash Flow</TableHead>
                  <TableHead>Cumulative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.slice(0, 24).map((month) => (
                  <TableRow key={month.month}>
                    <TableCell>{month.month}</TableCell>
                    <TableCell>{month.date}</TableCell>
                    <TableCell>{month.customers.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(month.revenue)}</TableCell>
                    <TableCell>{formatCurrency(month.cogs)}</TableCell>
                    <TableCell>{formatCurrency(month.opex)}</TableCell>
                    <TableCell className={month.netCashFlow >= 0 ? 'text-primary' : 'text-destructive'}>
                      {formatCurrency(month.netCashFlow)}
                    </TableCell>
                    <TableCell className={month.cumulativeCashFlow >= 0 ? 'text-primary' : 'text-destructive'}>
                      {formatCurrency(month.cumulativeCashFlow)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}