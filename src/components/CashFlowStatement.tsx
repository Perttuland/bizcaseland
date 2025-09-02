import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

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
  // Generate mock monthly data for demonstration
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
      const cogs = Math.round(revenue * 0.3);
      const grossProfit = revenue - cogs;
      
      const salesMarketing = Math.round(15000 + (i * 300));
      const rd = Math.round(8000 + (i * 200));
      const ga = Math.round(5000 + (i * 100));
      const totalOpex = salesMarketing + rd + ga;
      
      const ebitda = grossProfit - totalOpex;
      const depreciation = 2000;
      const ebit = ebitda - depreciation;
      const interest = 500;
      const taxes = Math.max(0, (ebit - interest) * 0.25);
      const netIncome = ebit - interest - taxes;
      
      const capex = i === 0 ? 50000 : (i % 12 === 0 ? 10000 : 0);
      const workingCapitalChange = Math.round(revenue * 0.02);
      const freeCashFlow = netIncome + depreciation - capex - workingCapitalChange;
      
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
        freeCashFlow,
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
    { label: 'Earnings Before Interest, Taxes, Depreciation & Amortization', key: 'ebitda', isTotal: true, category: 'profit' },
    { label: 'Depreciation', key: 'depreciation', category: 'costs' },
    { label: 'Earnings Before Interest & Taxes', key: 'ebit', isSubtotal: true, category: 'profit' },
    { label: 'Interest', key: 'interest', category: 'costs' },
    { label: 'Taxes', key: 'taxes', category: 'costs' },
    { label: 'Net Income', key: 'netIncome', isTotal: true, category: 'profit' },
    { label: '', key: 'spacer3', category: 'spacer' },
    { label: 'Capital Expenditures', key: 'capex', category: 'cash' },
    { label: 'Working Capital Change', key: 'workingCapitalChange', category: 'cash' },
    { label: 'Free Cash Flow', key: 'freeCashFlow', isTotal: true, category: 'cash' },
  ];

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
                    {monthlyData.slice(0, 24).map((month) => (
                      <th key={month.month} className="px-3 py-3 text-center font-medium min-w-[100px] border-l border-border">
                        <div className="flex flex-col items-center space-y-1">
                          <span className="text-xs text-muted-foreground">M{month.month}</span>
                          <span className="text-xs font-normal">{formatMonth(month.date)}</span>
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
                        {monthlyData.slice(0, 24).map((month) => {
                          const value = month[row.key as keyof typeof month] as number;
                          return (
                            <td key={month.month} className="px-3 py-2 text-center border-l border-border">
                              {typeof value === 'number' ? (
                                <span className={`font-mono text-sm ${getValueColor(value)}`}>
                                  {formatCurrency(value)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
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
                <p className="text-sm text-white/80">Total Revenue (24M)</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(monthlyData.slice(0, 24).reduce((sum, m) => sum + m.revenue, 0))}
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
                <p className="text-sm text-white/80">Total Earnings Before Interest, Taxes, Depreciation & Amortization (24M)</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(monthlyData.slice(0, 24).reduce((sum, m) => sum + m.ebitda, 0))}
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
                <p className="text-sm text-muted-foreground">Free Cash Flow (24M)</p>
                <p className="text-xl font-bold text-financial-warning">
                  {formatCurrency(monthlyData.slice(0, 24).reduce((sum, m) => sum + m.freeCashFlow, 0))}
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