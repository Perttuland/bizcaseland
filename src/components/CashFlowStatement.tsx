import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { useToast } from '@/hooks/use-toast';
import { calculateBusinessMetrics, formatCurrency } from '@/lib/calculations';

export function CashFlowStatement() {
  const { data: businessData, updateAssumption } = useBusinessData();
  const { toast } = useToast();
  const [hoveredCell, setHoveredCell] = useState<{row: string, month: number} | null>(null);
  const [sensitivityValues, setSensitivityValues] = useState<{[key: string]: string}>({});
  
  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view cash flow analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Use centralized calculation engine
  const calculatedMetrics = calculateBusinessMetrics(businessData);
  const monthlyData = calculatedMetrics.monthlyData;
  const currency = businessData.meta?.currency || 'EUR';
  
  // Handle sensitivity analysis
  const handleSensitivityChange = (driverKey: string, value: string) => {
    const driver = businessData?.drivers?.find(d => d.key === driverKey);
    if (driver && driver.path) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updateAssumption(driver.path, numValue);
        
        // Show toast notification
        toast({
          title: "Sensitivity Analysis Updated",
          description: `${driver.key} updated to ${value}`,
        });
      }
    }
  };

  const formatDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit' 
    });
  };

  const getValueColor = (value: number) => {
    if (value > 0) return 'text-financial-success';
    if (value < 0) return 'text-financial-danger';
    return 'text-muted-foreground';
  };

  // Determine if we're using a recurring revenue model
  const isRecurringModel = businessData?.meta?.business_model === 'recurring' || 
                          businessData?.meta?.business_model === 'subscription';

  const rows = [
    { label: 'Revenue', key: 'revenue', isTotal: true, category: 'revenue' },
    { label: '  Sales Volume', key: 'salesVolume', isSubItem: true, category: 'volume', unit: 'units' },
    ...(isRecurringModel ? [
      { label: '  New Customers', key: 'newCustomers', isSubItem: true, category: 'volume', unit: 'units' },
      { label: '  Existing Customers', key: 'existingCustomers', isSubItem: true, category: 'volume', unit: 'units' }
    ] : []),
    { label: '  Unit Price', key: 'unitPrice', isSubItem: true, category: 'price', unit: 'decimal' },
    { label: 'Cost of Goods Sold', key: 'cogs', category: 'costs' },
    { label: 'Gross Profit', key: 'grossProfit', isSubtotal: true, category: 'profit' },
    { label: '', key: 'spacer1', category: 'spacer' },
    { label: 'Sales & Marketing', key: 'salesMarketing', category: 'opex' },
    { 
      label: isRecurringModel ? 'CAC (New Customers Only)' : 'CAC', 
      key: 'totalCAC', 
      isSubItem: true, 
      category: 'costs' 
    },
    { label: 'Research & Development', key: 'rd', category: 'opex' },
    { label: 'General & Administrative', key: 'ga', category: 'opex' },
    { label: 'Total Operating Expenses', key: 'totalOpex', isSubtotal: true, category: 'opex' },
    { label: '', key: 'spacer2', category: 'spacer' },
    { label: 'EBITDA', key: 'ebitda', isTotal: true, category: 'profit' },
    { label: 'CAPEX', key: 'capex', category: 'capex' },
    { label: '', key: 'spacer3', category: 'spacer' },
    { label: 'Net Cash Flow', key: 'netCashFlow', isTotal: true, category: 'cash' },
  ];

  const getAssumptions = (rowKey: string, month: number) => {
    if (!businessData.assumptions) return null;
    
    const currentMonth = monthlyData[month - 1];
    
    const assumptions = {
      revenue: {
        formula: `Sales Volume × Unit Price`,
        components: `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatCurrency(currentMonth?.unitPrice || 0)}`,
        rationale: businessData.assumptions.pricing?.avg_unit_price?.rationale
      },
      salesVolume: {
        formula: `Base Volume × Growth Factor`,
        baseValue: businessData?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.value,
        growthRate: `${(month * 2)}% cumulative growth`,
        rationale: businessData?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.rationale
      },
      unitPrice: {
        formula: `Average Unit Price`,
        value: businessData?.assumptions?.pricing?.avg_unit_price?.value,
        rationale: businessData?.assumptions?.pricing?.avg_unit_price?.rationale
      },
      cogs: {
        formula: `Revenue × COGS Rate`,
        rate: businessData?.assumptions?.unit_economics?.cogs_pct?.value ? `${(businessData.assumptions.unit_economics.cogs_pct.value * 100)}%` : undefined,
        rationale: businessData.assumptions.unit_economics?.cogs_pct?.rationale
      },
      salesMarketing: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[0]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[0]?.value?.rationale
      },
      rd: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[1]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[1]?.value?.rationale
      },
      ga: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[2]?.value?.value,
        rationale: businessData?.assumptions?.opex?.[2]?.value?.rationale
      },
      cac: {
        formula: `Customer Acquisition Cost per Unit`,
        value: businessData?.assumptions?.unit_economics?.cac?.value,
        rationale: businessData?.assumptions?.unit_economics?.cac?.rationale
      },
      totalCAC: {
        formula: isRecurringModel ? `New Customers × CAC` : `Sales Volume × CAC`,
        components: isRecurringModel 
          ? `${currentMonth?.newCustomers?.toLocaleString()} new customers × ${formatDecimal(currentMonth?.cac || 0)}`
          : `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatDecimal(currentMonth?.cac || 0)}`,
        rationale: `CAC Value: ${formatDecimal(businessData?.assumptions?.unit_economics?.cac?.value || 0)} per ${isRecurringModel ? 'customer' : 'unit'}. ${isRecurringModel 
          ? 'Applied only to new customer acquisitions in recurring models.' 
          : 'Applied to all unit sales in transactional models.'} ${businessData?.assumptions?.unit_economics?.cac?.rationale || ''}`
      },
      ebitda: {
        formula: `Gross Profit + Total Operating Expenses`,
        rationale: businessData?.meta?.description
      },
      capex: {
        formula: `Initial Investment + Periodic Investments`,
        rationale: businessData?.assumptions?.capex?.[0]?.name
      },
      netCashFlow: {
        formula: `EBITDA + CAPEX`,
        rationale: businessData?.meta?.description
      }
    };
    
    return assumptions[rowKey as keyof typeof assumptions];
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{businessData.meta?.title || 'Profit & Loss Statement'}</span>
          </CardTitle>
          {businessData.meta?.description && (
            <p className="text-sm text-muted-foreground">
              {businessData.meta.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Monthly cash flow projection with full P&L structure
          </p>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <div className="min-w-max" style={{ width: `${200 + (monthlyData.length * 100)}px` }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-gradient-card z-10 px-4 py-3 text-left font-semibold min-w-[200px]">
                      Line Item
                    </th>
                     {monthlyData.map((month) => (
                       <th key={month.month} className="px-3 py-3 text-center font-medium min-w-[100px] border-l border-border">
                         <span className="text-sm font-medium">{month.month}</span>
                       </th>
                     ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    if (row.category === 'spacer') {
                      return (
                        <tr key={index}>
                          <td colSpan={25} className="h-4"></td>
                        </tr>
                      );
                    }

                     const rowClasses = [
                       'border-b border-border/50',
                       row.isTotal && 'bg-muted/30 font-semibold',
                       row.isSubtotal && 'bg-muted/20 font-medium',
                       row.isSubItem && 'bg-muted/10 text-sm',
                     ].filter(Boolean).join(' ');

                    return (
                      <tr key={index} className={rowClasses}>
                        <td className="sticky left-0 bg-gradient-card z-10 px-4 py-2 font-medium border-r border-border">
                          <div className="flex items-center space-x-2">
                            <span>{row.label}</span>
                            {row.category === 'revenue' && <TrendingUp className="h-3 w-3 text-financial-success" />}
                            {row.category === 'costs' && <TrendingDown className="h-3 w-3 text-financial-danger" />}
                            {row.category === 'profit' && <DollarSign className="h-3 w-3 text-financial-primary" />}
                          </div>
                        </td>
                        {monthlyData.map((month) => {
                          const value = month[row.key as keyof typeof month] as number;
                          const assumptions = getAssumptions(row.key, month.month);
                          
                          return (
                            <td 
                              key={month.month} 
                              className="px-3 py-2 text-center border-l border-border relative cursor-pointer hover:bg-muted/30 transition-colors"
                              onMouseEnter={() => setHoveredCell({row: row.key, month: month.month})}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                             {typeof value === 'number' ? (
                                 <span className={`font-mono text-sm ${getValueColor(value)}`}>
                                   {row.unit === 'units' ? value.toLocaleString() : 
                                    row.unit === 'decimal' ? formatDecimal(value) : 
                                    formatCurrency(value)}
                                 </span>
                               ) : (
                                 <span className="text-muted-foreground">-</span>
                               )}
                              
                               {/* Tooltip */}
                               {hoveredCell?.row === row.key && hoveredCell?.month === month.month && assumptions && (
                                 <div className="absolute z-[100] bg-card border border-border rounded-lg p-3 shadow-elevation min-w-[250px] top-full left-1/2 transform -translate-x-1/2 mt-1">
                                   <div className="text-sm space-y-2">
                                     <div className="font-semibold text-foreground">{row.label} - Month {month.month}</div>
                                     {assumptions.formula && (
                                       <div>
                                         <span className="text-muted-foreground">Formula:</span>
                                         <div className="font-mono text-xs bg-muted/50 p-1 rounded">{assumptions.formula}</div>
                                       </div>
                                     )}
                                      {'rate' in assumptions && assumptions.rate && (
                                        <div>
                                          <span className="text-muted-foreground">Rate:</span> {String(assumptions.rate)}
                                        </div>
                                      )}
                                      {'rationale' in assumptions && assumptions.rationale && (
                                        <div>
                                          <span className="text-muted-foreground">Rationale:</span>
                                          <div className="text-xs">{String(assumptions.rationale)}</div>
                                        </div>
                                      )}
                                   </div>
                                 </div>
                               )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Revenue</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenue, 0), currency)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Net Present Value</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(calculatedMetrics.npv, currency)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-financial-warning border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                <p className="text-xl font-bold text-financial-warning">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.netCashFlow, 0))}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-financial-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-card ${calculatedMetrics.breakEvenMonth ? 'bg-gradient-success' : 'bg-gradient-danger'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Break-even Point</p>
                <p className="text-xl font-bold text-white">
                  {calculatedMetrics.breakEvenMonth ? `Month ${calculatedMetrics.breakEvenMonth}` : '-'}
                </p>
              </div>
              {calculatedMetrics.breakEvenMonth ? (
                <Target className="h-6 w-6 text-white" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-white" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Three Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Revenue & Operating Expense */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-financial-primary" />
              <span>Revenue & Operating Expense</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={Math.floor(monthlyData.length / 10)}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{`Month ${label}`}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {`${entry.name}: ${formatCurrency(entry.value as number)}`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--financial-primary))" 
                    strokeWidth={3}
                    dot={false}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalOpex" 
                    stroke="hsl(var(--financial-danger))" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                    name="Operating Expense"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Sales Volume */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-financial-success" />
              <span>Sales Volume</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    interval={Math.floor(monthlyData.length / 10)}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-md">
                            <p className="font-semibold">{`Month ${label}`}</p>
                            <p style={{ color: payload[0].color }}>
                              {`Sales Volume: ${(payload[0].value as number).toLocaleString()} units`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="salesVolume" 
                    stroke="hsl(var(--financial-success))" 
                    strokeWidth={3}
                    dot={false}
                    name="Sales Volume"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Cost Structure Pie Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-financial-warning" />
              <span>Total Cost Structure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Sales & Marketing', 
                        value: Math.abs(monthlyData.reduce((sum, m) => sum + (m.salesMarketing || 0), 0)),
                        color: 'hsl(var(--financial-primary))'
                      },
                      { 
                        name: 'R&D', 
                        value: Math.abs(monthlyData.reduce((sum, m) => sum + (m.rd || 0), 0)),
                        color: 'hsl(var(--financial-success))'
                      },
                      { 
                        name: 'G&A', 
                        value: Math.abs(monthlyData.reduce((sum, m) => sum + (m.ga || 0), 0)),
                        color: 'hsl(var(--financial-warning))'
                      },
                      { 
                        name: 'CAPEX', 
                        value: Math.abs(monthlyData.reduce((sum, m) => sum + (m.capex || 0), 0)),
                        color: 'hsl(var(--financial-danger))'
                      }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { color: 'hsl(var(--financial-primary))' },
                      { color: 'hsl(var(--financial-success))' },
                      { color: 'hsl(var(--financial-warning))' },
                      { color: 'hsl(var(--financial-danger))' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensitivity Analysis */}
      {businessData?.drivers && businessData.drivers.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Sensitivity Analysis</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on driver values to test different scenarios
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {businessData.drivers.map((driver) => (
                <div key={driver.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium capitalize">{driver.key}</h4>
                    <Badge variant="outline" className="text-xs">
                      {driver.path.split('.').pop()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {driver.range.map((value, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSensitivityChange(driver.key, value.toString())}
                      >
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{driver.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}