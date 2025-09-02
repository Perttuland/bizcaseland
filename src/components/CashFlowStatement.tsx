import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';

interface BusinessData {
  meta: {
    title: string;
    currency: string;
    start_date: string;
    periods: number;
  };
  assumptions: any;
}

interface CashFlowStatementProps {
  data: BusinessData;
}

export function CashFlowStatement({ data }: CashFlowStatementProps) {
  const { data: contextData } = useBusinessData();
  const [hoveredCell, setHoveredCell] = useState<{row: string, month: number} | null>(null);
  
  // Use context data if available, otherwise use prop data
  const businessData = contextData || data;
  
  // Generate monthly data based on business assumptions
  const generateMonthlyData = () => {
    const months = [];
    const startDate = new Date(data.meta.start_date);
    
    for (let i = 0; i < Math.min(data.meta.periods, 60); i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + i);
      
      // Mock financial data with some growth pattern
      const baseRevenue = 50000 + (i * 2000);
      const growthFactor = 1 + (i * 0.02);
      const seasonality = 1 + Math.sin((i / 12) * 2 * Math.PI) * 0.1;
      
      const revenue = Math.round(baseRevenue * growthFactor * seasonality);
      const cogs = -Math.round(revenue * 0.3); // Negative cost
      const grossProfit = revenue + cogs; // Adding because cogs is negative
      
      const salesMarketing = -Math.round(15000 + (i * 300)); // Negative cost
      const rd = -Math.round(8000 + (i * 200)); // Negative cost
      const ga = -Math.round(5000 + (i * 100)); // Negative cost
      const totalOpex = salesMarketing + rd + ga;
      
      const ebitda = grossProfit - totalOpex;
      const depreciation = -2000; // Negative cost
      const ebit = ebitda + depreciation; // Adding because depreciation is negative
      const interest = -500; // Negative cost
      const taxes = -Math.max(0, (ebit + interest) * 0.25); // Negative cost
      const netIncome = ebit + interest + taxes; // Adding because they're negative
      
      const capex = -(i === 0 ? 50000 : (i % 12 === 0 ? 10000 : 0)); // Negative cost
      const workingCapitalChange = -Math.round(revenue * 0.02); // Negative cost
      const netCashFlow = netIncome - depreciation + capex + workingCapitalChange; // Adjusted for net cash flow
      
      months.push({
        month: i + 1,
        date: currentDate,
        revenue,
        cogs,
        grossProfit,
        salesMarketing,
        rd,
        ga,
        totalOpex,
        ebitda,
        depreciation,
        ebit,
        interest,
        taxes,
        netIncome,
        capex,
        workingCapitalChange,
        netCashFlow,
      });
    }
    
    return months;
  };

  const monthlyData = generateMonthlyData();
  const currency = data.meta.currency || 'EUR';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    { label: 'Cost of Goods Sold', key: 'cogs', category: 'costs' },
    { label: 'Gross Profit', key: 'grossProfit', isSubtotal: true, category: 'profit' },
    { label: '', key: 'spacer1', category: 'spacer' },
    { label: 'Sales & Marketing', key: 'salesMarketing', category: 'opex' },
    { label: 'Research & Development', key: 'rd', category: 'opex' },
    { label: 'General & Administrative', key: 'ga', category: 'opex' },
    { label: 'Total Operating Expenses', key: 'totalOpex', isSubtotal: true, category: 'opex' },
    { label: '', key: 'spacer2', category: 'spacer' },
    { label: 'EBITDA', key: 'ebitda', isTotal: true, category: 'profit' },
    { label: '', key: 'spacer3', category: 'spacer' },
    { label: 'Net Cash Flow', key: 'netCashFlow', isTotal: true, category: 'cash' },
  ];

  const getAssumptions = (rowKey: string, month: number) => {
    if (!businessData.assumptions) return null;
    
    // Mock assumptions based on row key and business data
    const assumptions = {
      revenue: {
        formula: `Base Revenue × Growth Factor × Seasonality`,
        baseValue: 50000,
        growthRate: `${(month * 2)}% monthly growth`,
        seasonality: `${(Math.sin((month / 12) * 2 * Math.PI) * 10).toFixed(1)}% seasonal adjustment`
      },
      cogs: {
        formula: `Revenue × COGS Rate`,
        rate: '30%',
        rationale: businessData.assumptions.unit_economics?.cogs?.rationale || 'Standard industry COGS percentage'
      },
      salesMarketing: {
        formula: `Base Cost + Monthly Increment`,
        baseCost: 15000,
        increment: 300,
        rationale: businessData.assumptions.opex?.[0]?.rationale || 'Marketing spend scaling with growth'
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
            <span>Profit & Loss Statement</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monthly cash flow projection with full P&L structure
          </p>
        </CardHeader>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-gradient-card z-10 px-4 py-3 text-left font-semibold min-w-[200px]">
                      Line Item
                    </th>
                    {monthlyData.map((month) => (
                      <th key={month.month} className="px-3 py-3 text-center font-medium min-w-[100px] border-l border-border">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-xs text-muted-foreground">{month.month}</span>
                        </div>
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
                                  {formatCurrency(value)}
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
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm text-white/80">Total EBITDA</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(monthlyData.reduce((sum, m) => sum + m.ebitda, 0))}
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
      </div>
    </div>
  );
}