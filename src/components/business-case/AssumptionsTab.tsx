import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, DollarSign, Users, Settings, Info, Calculator, Target, Clock, Zap, BarChart3 } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';

interface SensitivityDriver {
  key: string;
  path: string;
  range: {
    min: number;
    max: number;
  };
  rationale?: string;
}

interface AssumptionRow {
  label: string;
  value?: any;
  unit?: string;
  rationale?: string;
  category: string;
  isSubItem?: boolean;
  icon?: any;
  color?: string;
  sensitivityDriver?: SensitivityDriver;
  dataPath?: string;
}

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
      if (unit === 'month' || unit.includes('month') && !unit.includes('per_month')) {
        return `Month ${value}`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  // Determine business model type
  const isCostSavingsModel = data.meta?.business_model === 'cost_savings';
  const isRecurringModel = data.meta?.business_model === 'recurring';

  // Helper function to find sensitivity driver for a given path
  const findSensitivityDriver = (dataPath: string): SensitivityDriver | undefined => {
    if (!data.drivers) return undefined;
    
    const driver = data.drivers.find((d: any) => d.path === dataPath);
    if (!driver) return undefined;
    // Handle both array format (e.g. [30,40,50,60,70]) and object format { min, max }
    let range: { min: number; max: number } | undefined;
    if (Array.isArray(driver.range)) {
      const nums = driver.range.filter((v: any) => typeof v === 'number');
      if (nums.length > 0) {
        range = { min: Math.min(...nums), max: Math.max(...nums) };
      }
    } else {
      // defensive: treat driver.range as any and accept {min,max} shape
      const drRange: any = driver.range;
      if (drRange && typeof drRange.min === 'number' && typeof drRange.max === 'number') {
        range = { min: drRange.min, max: drRange.max };
      }
    }

    return {
      key: driver.key,
      path: driver.path,
      // cast to any to be tolerant of undefined ranges in data
      range: range as any,
      rationale: driver.rationale
    };
  };

  // Helper function to generate the data path for an assumption
  const generateDataPath = (category: string, index?: number, field?: string) => {
    switch (category) {
      case 'pricing':
        if (field === 'avg_unit_price') return 'assumptions.pricing.avg_unit_price.value';
        break;
      case 'cost_savings':
        if (field === 'baseline_cost') return `assumptions.cost_savings.baseline_costs[${index}].current_monthly_cost.value`;
        if (field === 'savings_rate') return `assumptions.cost_savings.baseline_costs[${index}].savings_potential_pct.value`;
        break;
      case 'efficiency':
        if (field === 'baseline') return `assumptions.cost_savings.efficiency_gains[${index}].baseline_value.value`;
        if (field === 'improved') return `assumptions.cost_savings.efficiency_gains[${index}].improved_value.value`;
        if (field === 'value_per_unit') return `assumptions.cost_savings.efficiency_gains[${index}].value_per_unit.value`;
        break;
      case 'cogs':
        if (field === 'cogs_pct') return 'assumptions.unit_economics.cogs_pct.value';
        if (field === 'cac') return 'assumptions.unit_economics.cac.value';
        break;
      case 'opex':
        return `assumptions.opex[${index}].value.value`;
      case 'capex':
        return `assumptions.capex[${index}].timeline.series[0].value`;
      case 'financial':
        if (field === 'interest_rate') return 'assumptions.financial.interest_rate.value';
        break;
      default:
        return null;
    }
    return null;
  };

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
          const baselinePath = generateDataPath('cost_savings', index, 'baseline_cost');
          const savingsPath = generateDataPath('cost_savings', index, 'savings_rate');
          const baselineDriver = findSensitivityDriver(baselinePath);
          const savingsDriver = findSensitivityDriver(savingsPath);
          
          rows.push({
            label: `  ${cost.label} - Baseline Cost`,
            value: cost.current_monthly_cost?.value,
            unit: cost.current_monthly_cost?.unit,
            rationale: cost.current_monthly_cost?.rationale,
            category: 'cost_savings',
            isSubItem: true,
            sensitivityDriver: baselineDriver,
            dataPath: baselinePath
          });
          rows.push({
            label: `  ${cost.label} - Savings Rate`,
            value: cost.savings_potential_pct?.value,
            unit: cost.savings_potential_pct?.unit,
            rationale: cost.savings_potential_pct?.rationale,
            category: 'cost_savings',
            isSubItem: true,
            sensitivityDriver: savingsDriver,
            dataPath: savingsPath
          });
        });
      }

      if (data.assumptions?.cost_savings?.efficiency_gains) {
        data.assumptions.cost_savings.efficiency_gains.forEach((gain, index) => {
          const baselinePath = generateDataPath('efficiency', index, 'baseline');
          const improvedPath = generateDataPath('efficiency', index, 'improved');
          const valuePath = generateDataPath('efficiency', index, 'value_per_unit');
          const baselineDriver = findSensitivityDriver(baselinePath);
          const improvedDriver = findSensitivityDriver(improvedPath);
          const valueDriver = findSensitivityDriver(valuePath);
          
          rows.push({
            label: `  ${gain.label} - Baseline`,
            value: gain.baseline_value?.value,
            unit: gain.baseline_value?.unit,
            rationale: gain.baseline_value?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: baselineDriver,
            dataPath: baselinePath
          });
          rows.push({
            label: `  ${gain.label} - Improved`,
            value: gain.improved_value?.value,
            unit: gain.improved_value?.unit,
            rationale: gain.improved_value?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: improvedDriver,
            dataPath: improvedPath
          });
          rows.push({
            label: `  ${gain.label} - Value per Unit`,
            value: gain.value_per_unit?.value,
            unit: gain.value_per_unit?.unit,
            rationale: gain.value_per_unit?.rationale,
            category: 'efficiency',
            isSubItem: true,
            sensitivityDriver: valueDriver,
            dataPath: valuePath
          });
        });
      }
    } else {
      // Regular Business Model
      if (data.assumptions?.pricing?.avg_unit_price) {
        const pricingPath = generateDataPath('pricing', undefined, 'avg_unit_price');
        const pricingDriver = findSensitivityDriver(pricingPath);
        
        rows.push({
          label: '  Average Unit Price',
          value: data.assumptions.pricing.avg_unit_price.value,
          unit: data.assumptions.pricing.avg_unit_price.unit,
          rationale: data.assumptions.pricing.avg_unit_price.rationale,
          category: 'pricing',
          isSubItem: true,
          sensitivityDriver: pricingDriver,
          dataPath: pricingPath
        });
      }

      if (data.assumptions?.customers?.segments) {
        data.assumptions.customers.segments.forEach((segment, index) => {
          // Cast segment to any to handle the actual data structure vs typed interface mismatch
          const segmentAny = segment as any;
          
          // Handle pattern-based volume data (new format)
          if (segmentAny.volume?.type === 'pattern') {
            const patternType = segmentAny.volume.pattern_type;
            
            // Extract base value from series, growth_settings, or direct base_value
            let baseValue, baseUnit, baseRationale;
            if (segmentAny.volume.series && segmentAny.volume.series[0]) {
              baseValue = segmentAny.volume.series[0].value;
              baseUnit = segmentAny.volume.series[0].unit;
              baseRationale = segmentAny.volume.series[0].rationale;
            } else if (data.assumptions?.growth_settings?.[patternType]?.start) {
              baseValue = data.assumptions.growth_settings[patternType].start.value;
              baseUnit = data.assumptions.growth_settings[patternType].start.unit;
              baseRationale = data.assumptions.growth_settings[patternType].start.rationale;
            } else if (segmentAny.volume.base_value !== undefined) {
              // Handle direct base_value in volume object
              baseValue = segmentAny.volume.base_value;
              baseUnit = segmentAny.volume.unit;
              baseRationale = segmentAny.volume.rationale;
            }
            
            if (baseValue !== undefined) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Base Volume`,
                value: baseValue,
                unit: baseUnit || 'units_per_month',
                rationale: baseRationale || `Base volume for ${segmentAny.name || segment.label}`,
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Extract growth rate from growth_settings or direct growth_rate
            let growthValue, growthUnit, growthRationale;
            if (data.assumptions?.growth_settings?.[patternType]) {
              const growthSettings = data.assumptions.growth_settings[patternType];
              
              if (patternType === 'geom_growth' && growthSettings.monthly_growth) {
                growthValue = growthSettings.monthly_growth.value;
                growthUnit = 'ratio'; // Convert to percentage display
                growthRationale = growthSettings.monthly_growth.rationale;
              } else if (patternType === 'linear_growth' && growthSettings.monthly_flat_increase) {
                growthValue = growthSettings.monthly_flat_increase.value;
                growthUnit = growthSettings.monthly_flat_increase.unit;
                growthRationale = growthSettings.monthly_flat_increase.rationale;
              } else if (patternType === 'seasonal_growth' && growthSettings.yoy_growth) {
                growthValue = growthSettings.yoy_growth.value;
                growthUnit = growthSettings.yoy_growth.unit;
                growthRationale = growthSettings.yoy_growth.rationale;
              }
            } else if (segmentAny.volume.growth_rate !== undefined) {
              // Handle direct growth_rate in volume object
              growthValue = segmentAny.volume.growth_rate;
              // For linear growth, the growth_rate is in units_per_month; for others it's a ratio
              growthUnit = (segmentAny.volume.pattern_type === 'linear_growth') ? 'units_per_month' : 'ratio';
              growthRationale = segmentAny.volume.growth_rationale || 'Growth rate assumption';
            }
            
            if (growthValue !== undefined) {
              const growthLabel = patternType === 'linear_growth' 
                ? 'Linear Growth' 
                : 'Growth Rate';
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - ${growthLabel}`,
                value: growthValue,
                unit: growthUnit,
                rationale: growthRationale || 'Growth rate assumption',
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Show growth pattern type (only if patternType is defined)
            if (patternType) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Pattern`,
                value: patternType.replace('_', ' '),
                unit: 'pattern',
                rationale: `Growth methodology: ${patternType}`,
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Handle yearly adjustments if present
            if (segmentAny.volume.yearly_adjustments?.volume_factors) {
              segmentAny.volume.yearly_adjustments.volume_factors.forEach((factor: any, factorIndex: number) => {
                rows.push({
                  label: `  ${segmentAny.name || segment.label} - Year ${factor.year} Factor`,
                  value: factor.factor,
                  unit: 'multiplier',
                  rationale: factor.rationale,
                  category: 'volume',
                  isSubItem: true
                });
              });
            }
          }
          // Handle modern data structure with base_value and growth_rate (direct in volume object)
          else if (segmentAny.volume?.base_value !== undefined) {
            rows.push({
              label: `  ${segmentAny.name || segment.label} - Base Volume`,
              value: segmentAny.volume.base_value,
              unit: segmentAny.volume.unit || 'units_per_month',
              rationale: segmentAny.volume.rationale || `Base volume for ${segmentAny.name || segment.label}`,
              category: 'volume',
              isSubItem: true
            });
          
            // Show growth rate based on pattern type
            if (segmentAny.volume?.growth_rate !== undefined) {
              const growthLabel = segmentAny.volume.pattern_type === 'linear_growth' 
                ? 'Linear Growth' 
                : 'Growth Rate';
              const growthUnit = segmentAny.volume.pattern_type === 'linear_growth'
                ? 'units_per_month'
                : 'ratio';
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - ${growthLabel}`,
                value: segmentAny.volume.growth_rate,
                unit: growthUnit,
                rationale: segmentAny.volume.growth_rationale || 'Growth rate assumption',
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Show growth pattern type
            if (segmentAny.volume?.pattern_type) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Pattern`,
                value: segmentAny.volume.pattern_type.replace('_', ' '),
                unit: 'pattern',
                rationale: segmentAny.volume.growth_rationale || 'Growth pattern methodology',
                category: 'volume',
                isSubItem: true
              });
            }
            
            // Handle seasonal patterns
            if (segmentAny.volume?.pattern_type === 'seasonal_growth' && segmentAny.volume?.seasonal_pattern) {
              const peakMonth = segmentAny.volume.seasonal_pattern.indexOf(Math.max(...segmentAny.volume.seasonal_pattern)) + 1;
              const lowMonth = segmentAny.volume.seasonal_pattern.indexOf(Math.min(...segmentAny.volume.seasonal_pattern)) + 1;
              
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Seasonal Variation`,
                value: `Peak: Month ${peakMonth}, Low: Month ${lowMonth}`,
                unit: 'seasonal',
                rationale: 'Seasonal demand pattern throughout the year',
                category: 'volume',
                isSubItem: true
              });
            }
          }
          
          // Handle legacy data structure for backward compatibility
          else if (segment.volume?.base_year_total) {
            rows.push({
              label: `  ${segmentAny.name || segment.label} - Base Volume`,
              value: segment.volume.base_year_total.value,
              unit: segment.volume.base_year_total.unit,
              rationale: segment.volume.base_year_total.rationale,
              category: 'volume',
              isSubItem: true
            });
          
            if (segment.volume?.yoy_growth) {
              rows.push({
                label: `  ${segmentAny.name || segment.label} - Growth Rate`,
                value: segment.volume.yoy_growth.value,
                unit: segment.volume.yoy_growth.unit,
                rationale: segment.volume.yoy_growth.rationale,
                category: 'volume',
                isSubItem: true
              });
            }
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
        const cogsPath = generateDataPath('cogs', undefined, 'cogs_pct');
        const cogsDriver = findSensitivityDriver(cogsPath);
        
        rows.push({
          label: '  Cost of Goods Sold %',
          value: data.assumptions.unit_economics.cogs_pct.value,
          unit: data.assumptions.unit_economics.cogs_pct.unit,
          rationale: data.assumptions.unit_economics.cogs_pct.rationale,
          category: 'cogs',
          isSubItem: true,
          sensitivityDriver: cogsDriver,
          dataPath: cogsPath
        });
      }

      if (data.assumptions?.unit_economics?.cac) {
        const cacPath = generateDataPath('cogs', undefined, 'cac');
        const cacDriver = findSensitivityDriver(cacPath);
        
        rows.push({
          label: '  Customer Acquisition Cost',
          value: data.assumptions.unit_economics.cac.value,
          unit: data.assumptions.unit_economics.cac.unit,
          rationale: data.assumptions.unit_economics.cac.rationale,
          category: 'cogs',
          isSubItem: true,
          sensitivityDriver: cacDriver,
          dataPath: cacPath
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
        const opexPath = generateDataPath('opex', index);
        const opexDriver = findSensitivityDriver(opexPath);
        
        rows.push({
          label: `  ${opex.name}`,
          value: opex.value?.value,
          unit: opex.value?.unit,
          rationale: opex.value?.rationale,
          category: 'opex',
          isSubItem: true,
          sensitivityDriver: opexDriver,
          dataPath: opexPath
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
          const capexPath = generateDataPath('capex', index);
          const capexDriver = findSensitivityDriver(capexPath);
          
          rows.push({
            label: `  ${capex.name}`,
            value: capex.timeline.series[0].value,
            unit: capex.timeline.series[0].unit,
            rationale: capex.timeline.series[0].rationale,
            category: 'capex',
            isSubItem: true,
            sensitivityDriver: capexDriver,
            dataPath: capexPath
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
      const interestPath = generateDataPath('financial', undefined, 'interest_rate');
      const interestDriver = findSensitivityDriver(interestPath);
      
      rows.push({
        label: '  Discount Rate',
        value: data.assumptions.financial.interest_rate.value,
        unit: data.assumptions.financial.interest_rate.unit,
        rationale: data.assumptions.financial.interest_rate.rationale,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: interestDriver,
        dataPath: interestPath
      });
    }

    if (data.meta?.periods) {
      const periodsPath = generateDataPath('meta', undefined, 'periods');
      const periodsDriver = findSensitivityDriver(periodsPath);
      
      rows.push({
        label: '  Analysis Period',
        value: data.meta.periods,
        unit: 'months',
        rationale: `Business case analysis covers ${data.meta.periods} months`,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: periodsDriver,
        dataPath: periodsPath
      });
    }

    if (data.meta?.frequency) {
      const frequencyPath = generateDataPath('meta', undefined, 'frequency');
      const frequencyDriver = findSensitivityDriver(frequencyPath);
      
      rows.push({
        label: '  Reporting Frequency',
        value: data.meta.frequency,
        unit: 'frequency',
        rationale: `Financial projections calculated on a ${data.meta.frequency} basis`,
        category: 'financial',
        isSubItem: true,
        sensitivityDriver: frequencyDriver,
        dataPath: frequencyPath
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
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">{row.label}</span>
                                {row.sensitivityDriver && (
                                  <div className="flex items-center space-x-1">
                                    <TrendingUp className="h-3 w-3 text-orange-500" />
                                    <span className="text-xs text-orange-500">S</span>
                                  </div>
                                )}
                              </div>
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
                              {row.sensitivityDriver && (
                                <div className="border-t pt-1 mt-1">
                                  <p className="text-xs font-medium text-orange-500 flex items-center space-x-1">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Sensitivity Driver</span>
                                  </p>
                                  {row.sensitivityDriver.range && (
                                    <p className="text-xs text-muted-foreground">
                                      Range: {row.sensitivityDriver.range.min} to {row.sensitivityDriver.range.max}
                                    </p>
                                  )}
                                  {row.sensitivityDriver.rationale && (
                                    <p className="text-xs text-muted-foreground">
                                      {row.sensitivityDriver.rationale}
                                    </p>
                                  )}
                                </div>
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
