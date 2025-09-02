import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, AlertTriangle } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { useToast } from '@/hooks/use-toast';

interface BusinessData {
  meta: {
    title: string;
    description?: string;
    currency: string;
    start_date: string;
    periods: number;
  };
  assumptions: any;
  drivers?: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
}

interface CashFlowStatementProps {
  data: BusinessData;
}

export function CashFlowStatement({ data }: CashFlowStatementProps) {
  const { data: contextData, updateAssumption } = useBusinessData();
  const { toast } = useToast();
  const [hoveredCell, setHoveredCell] = useState<{row: string, month: number} | null>(null);
  const [sensitivityValues, setSensitivityValues] = useState<{[key: string]: string}>({});
  
  // Always use context data if available for real-time updates
  const businessData = contextData || data;
  
  // Generate monthly data based on business assumptions
  const generateMonthlyData = () => {
    const months = [];
    const startDate = new Date(businessData.meta.start_date);
    
    for (let i = 0; i < Math.min(businessData.meta.periods, 60); i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + i);
      
      // Calculate sales volume and unit price from business data
      const baseVolume = businessData?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.value || 1000;
      const unitPrice = businessData?.assumptions?.pricing?.avg_unit_price?.value || 50;
      const growthFactor = 1 + (i * 0.02);
      
      const salesVolume = Math.round(baseVolume * growthFactor);
      const revenue = Math.round(salesVolume * unitPrice);
      
      const cogs = -Math.round(revenue * (businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0.3));
      const grossProfit = revenue + cogs;
      
      const salesMarketing = -Math.round((businessData?.assumptions?.opex?.[0]?.value?.value || 15000) + (i * 300));
      const cac = businessData?.assumptions?.unit_economics?.cac?.value || 0;
      const totalCAC = -Math.round(salesVolume * cac);
      const rd = -Math.round((businessData?.assumptions?.opex?.[1]?.value?.value || 8000) + (i * 200));
      const ga = -Math.round((businessData?.assumptions?.opex?.[2]?.value?.value || 5000) + (i * 100));
      const totalOpex = salesMarketing + totalCAC + rd + ga;
      
      const ebitda = grossProfit + totalOpex;
      const capex = -(i === 0 ? 50000 : (i % 12 === 0 ? 10000 : 0));
      const netCashFlow = ebitda + capex;
      
      months.push({
        month: i + 1,
        date: currentDate,
        salesVolume,
        unitPrice,
        revenue,
        cogs,
        grossProfit,
        salesMarketing,
        totalCAC,
        cac,
        rd,
        ga,
        totalOpex,
        ebitda,
        capex,
        netCashFlow,
      });
    }
    
    return months;
  };

  const monthlyData = generateMonthlyData();
  const currency = businessData.meta.currency || 'EUR';
  
  // Calculate NPV using interest rate from business data
  const calculateNPV = () => {
    const interestRate = businessData?.assumptions?.financial?.interest_rate?.value || 0.10;
    const monthlyRate = interestRate / 12;
    
    return monthlyData.reduce((npv, month, index) => {
      const discountFactor = Math.pow(1 + monthlyRate, -(index + 1));
      return npv + (month.netCashFlow * discountFactor);
    }, 0);
  };

  // Calculate break-even point
  const calculateBreakEven = () => {
    let cumulativeCashFlow = 0;
    for (let i = 0; i < monthlyData.length; i++) {
      cumulativeCashFlow += monthlyData[i].netCashFlow;
      if (cumulativeCashFlow > 0) {
        return i + 1; // Return month number
      }
    }
    return null; // Never breaks even
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  const rows = [
    { label: 'Revenue', key: 'revenue', isTotal: true, category: 'revenue' },
    { label: '  Sales Volume', key: 'salesVolume', isSubItem: true, category: 'volume', unit: 'units' },
    { label: '  Unit Price', key: 'unitPrice', isSubItem: true, category: 'price', unit: 'decimal' },
    { label: 'Cost of Goods Sold', key: 'cogs', category: 'costs' },
    { label: 'Gross Profit', key: 'grossProfit', isSubtotal: true, category: 'profit' },
    { label: '', key: 'spacer1', category: 'spacer' },
    { label: 'Sales & Marketing', key: 'salesMarketing', category: 'opex' },
    { label: '  Customer Acquisition Cost', key: 'cac', isSubItem: true, category: 'cac', unit: 'decimal' },
    { label: '  Total CAC', key: 'totalCAC', isSubItem: true, category: 'costs' },
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
    
    const monthlyData = generateMonthlyData();
    const currentMonth = monthlyData[month - 1];
    
    const assumptions = {
      revenue: {
        formula: `Sales Volume × Unit Price`,
        components: `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatCurrency(currentMonth?.unitPrice || 0)}`,
        rationale: businessData.assumptions.pricing?.avg_unit_price?.rationale || 'Revenue calculation from volume and pricing'
      },
      salesVolume: {
        formula: `Base Volume × Growth Factor`,
        baseValue: businessData?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.value || 1000,
        growthRate: `${(month * 2)}% cumulative growth`,
        rationale: businessData?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.rationale || 'Customer volume projection'
      },
      unitPrice: {
        formula: `Average Unit Price`,
        value: businessData?.assumptions?.pricing?.avg_unit_price?.value || 50,
        rationale: businessData?.assumptions?.pricing?.avg_unit_price?.rationale || 'Average price per unit'
      },
      cogs: {
        formula: `Revenue × COGS Rate`,
        rate: `${((businessData?.assumptions?.unit_economics?.cogs_pct?.value || 0.3) * 100)}%`,
        rationale: businessData.assumptions.unit_economics?.cogs_pct?.rationale || 'Cost of goods sold percentage'
      },
      salesMarketing: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[0]?.value?.value || 15000,
        rationale: businessData?.assumptions?.opex?.[0]?.value?.rationale || 'Sales and marketing expenses'
      },
      rd: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[1]?.value?.value || 8000,
        rationale: businessData?.assumptions?.opex?.[1]?.value?.rationale || 'Research and development costs'
      },
      ga: {
        formula: `Base Cost + Monthly Growth`,
        baseCost: businessData?.assumptions?.opex?.[2]?.value?.value || 5000,
        rationale: businessData?.assumptions?.opex?.[2]?.value?.rationale || 'General and administrative costs'
      },
      cac: {
        formula: `Customer Acquisition Cost per Unit`,
        value: businessData?.assumptions?.unit_economics?.cac?.value || 0,
        rationale: businessData?.assumptions?.unit_economics?.cac?.rationale || 'Cost to acquire each customer'
      },
      totalCAC: {
        formula: `Sales Volume × CAC`,
        components: `${currentMonth?.salesVolume?.toLocaleString()} units × ${formatDecimal(currentMonth?.cac || 0)}`,
        rationale: 'Total customer acquisition costs for the period'
      },
      ebitda: {
        formula: `Gross Profit + Total Operating Expenses`,
        rationale: 'Earnings before interest, taxes, depreciation, and amortization'
      },
      capex: {
        formula: `Initial Investment + Periodic Investments`,
        rationale: 'Capital expenditures for equipment and infrastructure'
      },
      netCashFlow: {
        formula: `EBITDA + CAPEX`,
        rationale: 'Net cash flow after operating profit and capital investments'
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
                                <div className="absolute z-50 bg-card border border-border rounded-lg p-3 shadow-elevation min-w-[250px] top-full left-1/2 transform -translate-x-1/2 mt-1">
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
                                         <span className="text-muted-foreground">Rate:</span> {assumptions.rate}
                                       </div>
                                     )}
                                     {'rationale' in assumptions && assumptions.rationale && (
                                       <div>
                                         <span className="text-muted-foreground">Rationale:</span>
                                         <div className="text-xs">{assumptions.rationale}</div>
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
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.revenue, 0))}
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
                  {formatCurrency(calculateNPV())}
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

        <Card className={`shadow-card ${calculateBreakEven() ? 'bg-gradient-success' : 'bg-gradient-danger'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Break-even Point</p>
                <p className="text-xl font-bold text-white">
                  {calculateBreakEven() ? `Month ${calculateBreakEven()}` : '-'}
                </p>
              </div>
              {calculateBreakEven() ? (
                <Target className="h-6 w-6 text-white" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-white" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue and Net Cash Flow Line Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-financial-primary" />
              <span>Revenue & Net Cash Flow</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Monthly trends comparison
            </p>
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
                    stroke="hsl(var(--financial-success))" 
                    strokeWidth={3}
                    dot={false}
                    name="Revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netCashFlow" 
                    stroke="hsl(var(--financial-primary))" 
                    strokeWidth={3}
                    dot={false}
                    name="Net Cash Flow"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Structure Bar Chart */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-financial-warning" />
              <span>Cost Structure (Month 12)</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Breakdown of major cost components
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Sales & Marketing',
                    value: Math.abs(monthlyData[11]?.salesMarketing || 0),
                    color: 'hsl(var(--financial-danger))'
                  },
                  {
                    name: 'R&D',
                    value: Math.abs(monthlyData[11]?.rd || 0),
                    color: 'hsl(var(--financial-warning))'
                  },
                  {
                    name: 'G&A',
                    value: Math.abs(monthlyData[11]?.ga || 0),
                    color: 'hsl(var(--financial-secondary))'
                  },
                  {
                    name: 'COGS',
                    value: Math.abs(monthlyData[11]?.cogs || 0),
                    color: 'hsl(var(--financial-primary))'
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                            <p className="font-semibold">{label}</p>
                            <p style={{ color: payload[0].color }}>
                              {`Cost: ${formatCurrency(payload[0].value as number)}`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--financial-danger))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
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