import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Users, Settings, Info, Calculator, Target, Clock, Zap, BarChart3 } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';

export function AssumptionsTab() {
  const { data } = useBusinessData();
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  if (!data) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view assumptions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (value: any, unit: string) => {
    if (typeof value === 'number') {
      if (unit.includes('EUR') || unit.includes('USD')) {
        return formatCurrency(value);
      }
      if (unit === 'ratio' || unit.includes('pct')) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (unit.includes('hours')) {
        return `${value.toFixed(1)} hours`;
      }
      if (unit.includes('month')) {
        return `Month ${value}`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  // Determine business model type
  const isCostSavingsModel = data.meta?.business_model === 'cost_savings';
  const isRecurringModel = data.meta?.business_model === 'recurring';

  // Build assumption rows based on business model and available data
  const getAssumptionRows = () => {
    const rows: any[] = [];

    // Revenue/Net Benefit Section
    rows.push({ 
      label: isCostSavingsModel ? 'Net Benefits' : 'Revenue', 
      category: 'header',
      icon: TrendingUp,
      color: 'text-financial-success'
    });

    if (isCostSavingsModel) {
      // Cost Savings Model
      if (data.assumptions?.cost_savings?.baseline_costs) {
        data.assumptions.cost_savings.baseline_costs.forEach((cost, index) => {
          rows.push({
            label: `  ${cost.label} - Baseline Cost`,
            value: cost.current_monthly_cost?.value,
            unit: cost.current_monthly_cost?.unit,
            rationale: cost.current_monthly_cost?.rationale,
            category: 'cost_savings',
            isSubItem: true
          });
          rows.push({
            label: `  ${cost.label} - Savings Rate`,
            value: cost.savings_potential_pct?.value,
            unit: cost.savings_potential_pct?.unit,
            rationale: cost.savings_potential_pct?.rationale,
            category: 'cost_savings',
            isSubItem: true
          });
        });
      }

      if (data.assumptions?.cost_savings?.efficiency_gains) {
        data.assumptions.cost_savings.efficiency_gains.forEach((gain, index) => {
          rows.push({
            label: `  ${gain.label} - Baseline`,
            value: gain.baseline_value?.value,
            unit: gain.baseline_value?.unit,
            rationale: gain.baseline_value?.rationale,
            category: 'efficiency',
            isSubItem: true
          });
          rows.push({
            label: `  ${gain.label} - Improved`,
            value: gain.improved_value?.value,
            unit: gain.improved_value?.unit,
            rationale: gain.improved_value?.rationale,
            category: 'efficiency',
            isSubItem: true
          });
          rows.push({
            label: `  ${gain.label} - Value per Unit`,
            value: gain.value_per_unit?.value,
            unit: gain.value_per_unit?.unit,
            rationale: gain.value_per_unit?.rationale,
            category: 'efficiency',
            isSubItem: true
          });
        });
      }
    } else {
      // Regular Business Model
      if (data.assumptions?.pricing?.avg_unit_price) {
        rows.push({
          label: '  Average Unit Price',
          value: data.assumptions.pricing.avg_unit_price.value,
          unit: data.assumptions.pricing.avg_unit_price.unit,
          rationale: data.assumptions.pricing.avg_unit_price.rationale,
          category: 'pricing',
          isSubItem: true
        });
      }

      if (data.assumptions?.customers?.segments) {
        data.assumptions.customers.segments.forEach((segment, index) => {
          if (segment.volume?.base_year_total) {
            rows.push({
              label: `  ${segment.label} - Base Volume`,
              value: segment.volume.base_year_total.value,
              unit: segment.volume.base_year_total.unit,
              rationale: segment.volume.base_year_total.rationale,
              category: 'volume',
              isSubItem: true
            });
          }
          if (segment.volume?.yoy_growth) {
            rows.push({
              label: `  ${segment.label} - Growth Rate`,
              value: segment.volume.yoy_growth.value,
              unit: segment.volume.yoy_growth.unit,
              rationale: segment.volume.yoy_growth.rationale,
              category: 'volume',
              isSubItem: true
            });
          }
        });
      }
    }

    // Gross Margin Section (only for non-cost savings models)
    if (!isCostSavingsModel) {
      rows.push({ label: '', category: 'spacer' });
      rows.push({ 
        label: 'Gross Margin', 
        category: 'header',
        icon: DollarSign,
        color: 'text-financial-primary'
      });

      if (data.assumptions?.unit_economics?.cogs_pct) {
        rows.push({
          label: '  Cost of Goods Sold %',
          value: data.assumptions.unit_economics.cogs_pct.value,
          unit: data.assumptions.unit_economics.cogs_pct.unit,
          rationale: data.assumptions.unit_economics.cogs_pct.rationale,
          category: 'cogs',
          isSubItem: true
        });
      }

      if (data.assumptions?.unit_economics?.cac) {
        rows.push({
          label: '  Customer Acquisition Cost',
          value: data.assumptions.unit_economics.cac.value,
          unit: data.assumptions.unit_economics.cac.unit,
          rationale: data.assumptions.unit_economics.cac.rationale,
          category: 'cogs',
          isSubItem: true
        });
      }
    }

    // Operating Expenses Section
    rows.push({ label: '', category: 'spacer' });
    rows.push({ 
      label: 'Operating Expenses', 
      category: 'header',
      icon: Settings,
      color: 'text-financial-danger'
    });

    if (data.assumptions?.opex) {
      data.assumptions.opex.forEach((opex, index) => {
        rows.push({
          label: `  ${opex.name}`,
          value: opex.value?.value,
          unit: opex.value?.unit,
          rationale: opex.value?.rationale,
          category: 'opex',
          isSubItem: true
        });
      });
    }

    // Capital Expenditures Section
    if (data.assumptions?.capex && data.assumptions.capex.length > 0) {
      rows.push({ label: '', category: 'spacer' });
      rows.push({ 
        label: 'Capital Expenditures', 
        category: 'header',
        icon: Calculator,
        color: 'text-purple-600'
      });

      data.assumptions.capex.forEach((capex, index) => {
        if (capex.timeline?.series?.[0]) {
          rows.push({
            label: `  ${capex.name}`,
            value: capex.timeline.series[0].value,
            unit: capex.timeline.series[0].unit,
            rationale: capex.timeline.series[0].rationale,
            category: 'capex',
            isSubItem: true
          });
        }
      });
    }

    // Financial Parameters Section
    rows.push({ label: '', category: 'spacer' });
    rows.push({ 
      label: 'Financial Parameters', 
      category: 'header',
      icon: TrendingUp,
      color: 'text-blue-600'
    });

    if (data.assumptions?.financial?.interest_rate) {
      rows.push({
        label: '  Discount Rate',
        value: data.assumptions.financial.interest_rate.value,
        unit: data.assumptions.financial.interest_rate.unit,
        rationale: data.assumptions.financial.interest_rate.rationale,
        category: 'financial',
        isSubItem: true
      });
    }

    if (data.meta?.periods) {
      rows.push({
        label: '  Analysis Period',
        value: data.meta.periods,
        unit: 'months',
        rationale: `Business case analysis covers ${data.meta.periods} months`,
        category: 'financial',
        isSubItem: true
      });
    }

    if (data.meta?.frequency) {
      rows.push({
        label: '  Reporting Frequency',
        value: data.meta.frequency,
        unit: 'frequency',
        rationale: `Financial projections calculated on a ${data.meta.frequency} basis`,
        category: 'financial',
        isSubItem: true
      });
    }

    return rows;
  };

  const assumptionRows = getAssumptionRows();

  const getRowClasses = (row: any) => {
    if (row.category === 'spacer') return 'h-2';
    if (row.category === 'header') return 'bg-muted/20 border-t-2 border-border font-semibold';
    if (row.isSubItem) return 'hover:bg-muted/30 transition-colors';
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Business Case Assumptions</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Key assumptions and datapoints organized by cash flow statement categories. 
            Each assumption includes its value, unit, and underlying rationale. 
            Hover over any row to see detailed explanations.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              {assumptionRows.filter(r => r.value !== undefined).length} assumptions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.meta?.business_model?.replace('_', ' ')} model
            </Badge>
            <Badge variant="outline" className="text-xs">
              {data.meta?.currency} currency
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Assumptions Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Assumption Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="text-left px-4 py-3 font-medium text-sm">Assumption</th>
                  <th className="text-center px-4 py-3 font-medium text-sm">Value</th>
                  <th className="text-center px-4 py-3 font-medium text-sm">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-sm">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {assumptionRows.map((row, index) => {
                  const rowClasses = getRowClasses(row);
                  
                  if (row.category === 'spacer') {
                    return <tr key={index} className={rowClasses}><td colSpan={4}></td></tr>;
                  }

                  if (row.category === 'header') {
                    const Icon = row.icon;
                    return (
                      <tr key={index} className={rowClasses}>
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Icon className={`h-4 w-4 ${row.color}`} />
                            <span className="font-semibold text-base">{row.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <tr 
                            className={rowClasses}
                            onMouseEnter={() => setHoveredCell(`row-${index}`)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <td className="px-4 py-3 font-medium text-sm">
                              <span className="text-sm">{row.label}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.value !== undefined ? (
                                <span className="font-mono text-sm font-medium">
                                  {formatValue(row.value, row.unit)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.unit && (
                                <Badge variant="outline" className="text-xs">
                                  {row.unit.replace('_', ' ')}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-md">
                              <div className="truncate">
                                {row.rationale || 'No rationale provided'}
                              </div>
                            </td>
                          </tr>
                        </TooltipTrigger>
                        {row.rationale && (
                          <TooltipContent side="top" className="max-w-sm">
                            <div className="space-y-1">
                              <p className="font-medium text-xs">{row.label.trim()}</p>
                              <p className="text-xs text-muted-foreground">{row.rationale}</p>
                              {row.value !== undefined && (
                                <p className="text-xs">
                                  <span className="font-medium">Value:</span> {formatValue(row.value, row.unit)}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Total Assumptions</p>
              <p className="text-2xl font-bold text-white">
                {assumptionRows.filter(r => r.value !== undefined).length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Business Model</p>
              <p className="text-lg font-bold text-white">
                {data.meta?.business_model?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-secondary shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Analysis Period</p>
              <p className="text-2xl font-bold text-white">
                {data.meta?.periods} months
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent shadow-card">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Currency</p>
              <p className="text-2xl font-bold text-white">
                {data.meta?.currency}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
