import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3, Users, DollarSign, PieChart, Activity } from 'lucide-react';

interface BusinessData {
  meta: {
    title: string;
    description: string;
    archetype: string;
    currency: string;
    start_date: string;
    periods: number;
    frequency: string;
  };
  assumptions: any;
  structure: any;
  scenarios: any[];
}

interface DataVisualizationProps {
  data: BusinessData;
}

export function DataVisualization({ data }: DataVisualizationProps) {
  // Mock data for charts - in real implementation, this would be calculated from the business data
  const monthlyData = Array.from({ length: 60 }, (_, i) => ({
    month: i + 1,
    period: `M${i + 1}`,
    revenue: Math.floor(5000 + i * 2000 + Math.random() * 1000),
    customers: Math.floor(50 + i * 15 + Math.random() * 10),
    cashFlow: Math.floor(-10000 + i * 1500 + Math.random() * 500),
    ebitda: Math.floor(-5000 + i * 1200 + Math.random() * 400),
    cumulativeCashFlow: Math.floor(-50000 + i * 2000)
  }));

  const yearlyData = Array.from({ length: 5 }, (_, i) => ({
    year: `Year ${i + 1}`,
    revenue: Math.floor(120000 + i * 80000),
    costs: Math.floor(80000 + i * 50000),
    profit: Math.floor(40000 + i * 30000),
    customers: Math.floor(600 + i * 400)
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-elevation">
          <p className="font-semibold text-foreground">{`Period: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.dataKey.includes('revenue') || entry.dataKey.includes('cashFlow') || entry.dataKey.includes('ebitda') || entry.dataKey.includes('costs') || entry.dataKey.includes('profit') 
                ? formatCurrency(entry.value) 
                : entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Revenue</p>
                <p className="text-xl font-bold text-white">{formatCurrency(1250000)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Customers</p>
                <p className="text-xl font-bold text-white">2,840</p>
              </div>
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-financial-warning shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-warning-foreground/80">Break-even</p>
                <p className="text-xl font-bold text-financial-warning-foreground">Month 14</p>
              </div>
              <Activity className="h-6 w-6 text-financial-warning-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-financial-primary border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Final NPV</p>
                <p className="text-xl font-bold text-financial-primary">{formatCurrency(2100000)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-financial-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Growth Chart */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-financial-primary" />
            <span>Revenue Growth (60 Months)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  interval={5}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--financial-primary))" 
                  fill="hsl(var(--financial-primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-financial-success" />
              <span>Customer Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    stroke="hsl(var(--muted-foreground))"
                    interval={9}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="hsl(var(--financial-success))" 
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow Analysis */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-financial-warning" />
              <span>Monthly Cash Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.slice(0, 24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period" 
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cashFlow" 
                    fill="hsl(var(--financial-warning))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cumulative Cash Flow */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-financial-danger" />
            <span>Cumulative Cash Flow & EBITDA</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  interval={5}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeCashFlow" 
                  stroke="hsl(var(--financial-danger))" 
                  strokeWidth={3}
                  dot={false}
                  name="Cumulative Cash Flow"
                />
                <Line 
                  type="monotone" 
                  dataKey="ebitda" 
                  stroke="hsl(var(--financial-primary))" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                  name="EBITDA"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yearly P&L Summary */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-financial-primary" />
            <span>5-Year P&L Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="hsl(var(--financial-primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costs" fill="hsl(var(--financial-danger))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="hsl(var(--financial-success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}