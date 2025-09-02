import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit3, Save, X, DollarSign, TrendingUp, Users, Settings, Download, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { CustomerSegments } from './CustomerSegments';

interface DatapointsViewerProps {
  data: BusinessData;
  onDataUpdate?: (updatedData: BusinessData) => void;
}

interface EditableItem {
  value: any;
  unit: string;
  rationale: string;
  range?: number[];
  path?: string;
}

export function DatapointsViewer({ data, onDataUpdate }: DatapointsViewerProps) {
  const { updateData, updateDriver, updateAssumption, exportData } = useBusinessData();
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, EditableItem>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pricing: true,
    customers: true,
    economics: true,
    opex: true,
    structure: false,
    drivers: false,
  });
  const { toast } = useToast();

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (itemId: string, currentValue: EditableItem) => {
    setEditingItems(prev => ({ ...prev, [itemId]: true }));
    setTempValues(prev => ({ ...prev, [itemId]: { ...currentValue } }));
  };

  const cancelEditing = (itemId: string) => {
    setEditingItems(prev => ({ ...prev, [itemId]: false }));
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[itemId];
      return newValues;
    });
  };

  const saveEdit = (itemId: string) => {
    const tempValue = tempValues[itemId];
    const updatedData = { ...data };
    
    if (tempValue && itemId.startsWith('drivers_driver_')) {
      const driverIndex = parseInt(itemId.split('_')[2]) - 1;
      updateDriver(driverIndex, {
        key: tempValue.value,
        path: tempValue.path,
        range: tempValue.range || data.drivers?.[driverIndex]?.range,
        rationale: tempValue.rationale
      });
    } else if (itemId.startsWith('segment_')) {
      // Handle segment updates
      const segmentIndex = parseInt(itemId.split('_')[1]);
      if (updatedData.assumptions?.customers?.segments?.[segmentIndex] && tempValue) {
        updatedData.assumptions.customers.segments[segmentIndex] = {
          ...updatedData.assumptions.customers.segments[segmentIndex],
          ...tempValue
        };
      }
    } else if (itemId.startsWith('volume_')) {
      // Handle volume series updates
      const [, segmentIndex, periodIndex] = itemId.split('_').map(Number);
      if (updatedData.assumptions?.customers?.segments?.[segmentIndex]?.volume?.series?.[periodIndex] && tempValue) {
        updatedData.assumptions.customers.segments[segmentIndex].volume.series[periodIndex] = {
          ...updatedData.assumptions.customers.segments[segmentIndex].volume.series[periodIndex],
          ...tempValue
        };
      }
    } else if (itemId.startsWith('driver_')) {
      // Handle sensitivity driver updates
      const driverIndex = parseInt(itemId.split('_')[1]) - 1;
      if (updatedData.drivers?.[driverIndex] && tempValue) {
        updatedData.drivers[driverIndex] = {
          ...updatedData.drivers[driverIndex],
          key: tempValue.value,
          path: tempValue.path,
          range: tempValue.range,
          rationale: tempValue.rationale
        };
        // Also update the corresponding assumption if path exists
        if (tempValue.path && tempValue.range) {
          const currentValue = tempValue.range[2]; // Use middle value as current
          updateAssumption(tempValue.path, currentValue);
        }
      }
    } else if (tempValue) {
      // Handle other assumption updates
      const [section, itemKey] = itemId.split('_', 2);
      
      if (section === 'pricing' && updatedData.assumptions?.pricing?.[itemKey]) {
        updatedData.assumptions.pricing[itemKey] = tempValue;
      } else if (section === 'financial' && updatedData.assumptions?.financial?.[itemKey]) {
        updatedData.assumptions.financial[itemKey] = tempValue;
      } else if (section === 'economics' && updatedData.assumptions?.unit_economics?.[itemKey]) {
        updatedData.assumptions.unit_economics[itemKey] = tempValue;
      } else if (section === 'opex' && updatedData.assumptions?.opex) {
        const opexIndex = parseInt(itemKey.replace('opex_', ''));
        if (updatedData.assumptions.opex[opexIndex]) {
          updatedData.assumptions.opex[opexIndex].value = tempValue;
        }
      }
    }
    
    if (onDataUpdate) {
      onDataUpdate(updatedData);
    }
    updateData(updatedData);
    
    setEditingItems(prev => ({ ...prev, [itemId]: false }));
    toast({
      title: "Datapoint Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatValue = (value: any, unit: string, itemKey?: string) => {
    if (typeof value === 'number') {
      // Special formatting for avg unit price and customer acquisition cost - one decimal place
      if (itemKey === 'avg_unit_price' || itemKey === 'cac') {
        if (unit.includes('EUR') || unit.includes('USD')) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.meta.currency || 'EUR',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }).format(value);
        }
        return value.toFixed(1);
      }
      
      if (unit.includes('EUR') || unit.includes('USD')) {
        return formatCurrency(value);
      }
      if (unit === 'ratio' || unit.includes('pct')) {
        return `${(value * 100).toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const renderCompactDatapoint = (
    itemId: string,
    label: string,
    item: any,
    icon: React.ComponentType<any>
  ) => {
    const Icon = icon;
    
    // Extract the itemKey from itemId (e.g., "pricing_avg_unit_price" -> "avg_unit_price")
    const itemKey = itemId.split('_').slice(1).join('_');

    return (
      <TooltipProvider key={itemId}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Card className="bg-muted/30 border-l-4 border-l-financial-primary hover:bg-muted/50 transition-colors cursor-pointer h-32">
              <CardContent className="p-3 h-full flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-4 w-4 text-financial-primary flex-shrink-0" />
                  <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-2">{label}</h4>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-xl font-bold text-financial-success mb-1 truncate">
                    {formatValue(item.value, item.unit, itemKey)}
                  </div>
                  <Badge variant="outline" className="text-xs self-start">{item.unit}</Badge>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-1">
              <p className="font-medium text-xs">{label}</p>
              <p className="text-xs text-muted-foreground">{item.rationale}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const sections = [
    {
      key: 'pricing',
      title: 'Pricing Strategy',
      icon: DollarSign,
      items: data.assumptions.pricing ? Object.entries(data.assumptions.pricing) : []
    },
    {
      key: 'financial',
      title: 'Financial Assumptions',
      icon: TrendingUp,
      items: data.assumptions.financial ? Object.entries(data.assumptions.financial) : []
    },
    {
      key: 'economics',
      title: 'Unit Economics',
      icon: TrendingUp,
      items: data.assumptions.unit_economics ? Object.entries(data.assumptions.unit_economics) : []
    },
    {
      key: 'opex',
      title: 'Operating Expenses',
      icon: Settings,
      items: data.assumptions.opex ? data.assumptions.opex.map((item: any, index: number) => [
        `opex_${index}`,
        { ...item.value, name: item.name }
      ]) : []
    }
  ];

  const getStructureDatapoints = () => {
    const structureItems: any[] = [];
    
    if (data.structure?.revenue_streams) {
      data.structure.revenue_streams.forEach((stream: any, index: number) => {
        structureItems.push([
          `revenue_${index}`,
          {
            value: stream.name,
            unit: 'formula',
            rationale: stream.rationale,
            formula: stream.formula
          }
        ]);
      });
    }
    
    if (data.structure?.cost_items) {
      data.structure.cost_items.forEach((cost: any, index: number) => {
        structureItems.push([
          `cost_${index}`,
          {
            value: cost.name,
            unit: 'formula',
            rationale: cost.rationale,
            formula: cost.formula
          }
        ]);
      });
    }
    
    return structureItems;
  };

  const getDriverDatapoints = () => {
    if (!data.drivers) return [];
    
    return data.drivers.map((driver: any, index: number) => [
      `driver_${index + 1}`,
      {
        value: driver.key,
        unit: 'sensitivity',
        rationale: driver.rationale,
        path: driver.path,
        range: driver.range,
        driverNumber: index + 1
      }
    ]);
  };

  const allSections = [
    ...sections,
    {
      key: 'structure',
      title: 'Revenue & Cost Structure',
      icon: TrendingUp,
      items: getStructureDatapoints()
    },
    {
      key: 'drivers',
      title: 'Sensitivity Drivers',
      icon: Settings,
      items: getDriverDatapoints()
    }
  ];

  // Collect all regular datapoints from all sections
  const allDatapoints: any[] = [];
  
  // Add all section items
  sections.forEach(({ key, icon, items }) => {
    items.forEach(([itemKey, itemValue]: [string, any]) => {
      const itemId = `${key}_${itemKey}`;
      
      // Expand common financial acronyms and terms
      const expandedLabel = (itemValue.name || itemKey)
        .replace(/\br&d\b/gi, 'Research & Development')
        .replace(/\bg&a\b/gi, 'General & Administrative')
        .replace(/\bs&m\b/gi, 'Sales & Marketing')
        .replace(/\bhr\b/gi, 'Human Resources')
        .replace(/\bit\b/gi, 'Information Technology')
        .replace(/\bsaas\b/gi, 'Software as a Service')
        .replace(/\bb2b\b/gi, 'Business to Business')
        .replace(/\bb2c\b/gi, 'Business to Consumer')
        .replace(/\bkpi\b/gi, 'Key Performance Indicator')
        .replace(/\bp&l\b/gi, 'Profit & Loss')
        .replace(/\broe\b/gi, 'Return on Equity')
        .replace(/\broa\b/gi, 'Return on Assets')
        .replace(/\bnpv\b/gi, 'Net Present Value')
        .replace(/\birr\b/gi, 'Internal Rate of Return')
        .replace(/\bwacc\b/gi, 'Weighted Average Cost of Capital')
        .replace(/\bfcf\b/gi, 'Free Cash Flow')
        .replace(/\bocf\b/gi, 'Operating Cash Flow')
        .replace(/\bppe\b/gi, 'Property, Plant & Equipment')
        .replace(/\bwc\b/gi, 'Working Capital')
        .replace(/\bar\b/gi, 'Accounts Receivable')
        .replace(/\bap\b/gi, 'Accounts Payable')
        .replace(/\binventory\b/gi, 'Stock Inventory')
        .replace(/cac/gi, 'Customer Acquisition Cost')
        .replace(/ltv/gi, 'Customer Lifetime Value')
        .replace(/arpu/gi, 'Average Revenue Per User')
        .replace(/mrr/gi, 'Monthly Recurring Revenue')
        .replace(/arr/gi, 'Annual Recurring Revenue')
        .replace(/cogs/gi, 'Cost of Goods Sold')
        .replace(/opex/gi, 'Operating Expenses')
        .replace(/capex/gi, 'Capital Expenditures')
        .replace(/ebitda/gi, 'EBITDA')
        .replace(/ebit/gi, 'Earnings Before Interest & Taxes')
        .replace(/roi/gi, 'Return on Investment')
        .replace(/roas/gi, 'Return on Ad Spend')
        .replace(/ctr/gi, 'Click Through Rate')
        .replace(/cpm/gi, 'Cost Per Thousand Impressions')
        .replace(/cpc/gi, 'Cost Per Click')
        .replace(/cpa/gi, 'Cost Per Acquisition')
        .replace(/rpu/gi, 'Revenue Per User')
        .replace(/gmv/gi, 'Gross Merchandise Value')
        .replace(/aov/gi, 'Average Order Value')
        .replace(/churn/gi, 'Customer Churn Rate')
        .replace(/conversion/gi, 'Conversion Rate')
        .replace(/gross_margin/gi, 'Gross Profit Margin')
        .replace(/net_margin/gi, 'Net Profit Margin')
        .replace(/burn_rate/gi, 'Monthly Cash Burn Rate')
        .replace(/runway/gi, 'Cash Runway (Months Until Funds Depleted)')
        .replace(/market_share/gi, 'Market Share Percentage')
        .replace(/tam/gi, 'Total Addressable Market')
        .replace(/sam/gi, 'Serviceable Addressable Market')
        .replace(/som/gi, 'Serviceable Obtainable Market')
        .replace(/dau/gi, 'Daily Active Users')
        .replace(/mau/gi, 'Monthly Active Users')
        .replace(/wau/gi, 'Weekly Active Users')
        .replace(/retention/gi, 'Customer Retention Rate')
        .replace(/nps/gi, 'Net Promoter Score')
        .replace(/csat/gi, 'Customer Satisfaction Score')
        .replace(/fte/gi, 'Full-Time Equivalent Employees')
        .replace(/headcount/gi, 'Total Number of Employees')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const label = expandedLabel;
      
      // Skip formulas and sensitivity drivers - they'll be handled separately
      if (!itemValue.formula && itemValue.unit !== 'sensitivity') {
        allDatapoints.push({
          itemId,
          label,
          itemValue,
          icon
        });
      }
    });
  });
  
  // Add structure datapoints (formulas)
  const structureDatapoints = getStructureDatapoints();
  const driverDatapoints = getDriverDatapoints();

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Datapoints and Assumptions</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View all business assumptions and rationales used in the analysis. Hover over datapoints to see detailed rationale.
          </p>
        </CardHeader>
      </Card>

      {/* All Regular Datapoints in Grid */}
      {allDatapoints.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Business Assumptions</span>
              <Badge variant="secondary">{allDatapoints.length} datapoints</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allDatapoints.map(({ itemId, label, itemValue, icon }) => 
                renderCompactDatapoint(itemId, label, itemValue, icon)
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue & Cost Structure */}
      {structureDatapoints.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenue & Cost Structure</span>
              <Badge variant="secondary">{structureDatapoints.length} formulas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {structureDatapoints.map(([itemKey, itemValue]: [string, any]) => {
              const itemId = `structure_${itemKey}`;
              const label = itemValue.value;
              
              return (
                <TooltipProvider key={itemId}>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Card className="bg-muted/30 border-l-4 border-l-financial-secondary hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <TrendingUp className="h-5 w-5 text-financial-secondary mt-1" />
                            <div className="flex-1 space-y-2">
                              <h4 className="font-semibold text-lg">{label}</h4>
                              <Badge variant="outline">{itemValue.unit}</Badge>
                              <div className="p-2 bg-card rounded font-mono text-sm">
                                {itemValue.formula}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p className="text-sm">{itemValue.rationale}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Sensitivity Drivers */}
      {driverDatapoints.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Sensitivity Drivers</span>
              <Badge variant="secondary">{driverDatapoints.length} drivers</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {driverDatapoints.map(([itemKey, itemValue]: [string, any]) => {
              const itemId = `drivers_${itemKey}`;
              const rangeLabels = ['Low', 'Mid-Low', 'Mid', 'Mid-High', 'High'];
              
              return (
              <TooltipProvider key={itemId}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                      <Card className="bg-muted/30 border-l-4 border-l-financial-warning hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Settings className="h-5 w-5 text-financial-warning mt-1" />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">Driver {itemValue.driverNumber}: {itemValue.value}</h4>
                                <Badge variant="outline">Sensitivity Analysis</Badge>
                              </div>
                              
                              <div className="p-3 bg-financial-warning/10 rounded-lg border border-financial-warning/20">
                                <h5 className="font-medium mb-2 text-sm text-muted-foreground">Sensitivity Range:</h5>
                                <div className="grid grid-cols-5 gap-2">
                                  {itemValue.range.map((value: number, index: number) => (
                                    <div key={index} className="text-center p-2 bg-card rounded border">
                                      <div className="text-xs font-medium text-muted-foreground mb-1">
                                        {rangeLabels[index] || `Level ${index + 1}`}
                                      </div>
                                      <div className="text-sm font-semibold text-financial-warning">
                                        {typeof value === 'number' ? value.toLocaleString() : value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="p-2 bg-card rounded font-mono text-sm">
                                <span className="text-muted-foreground">Path:</span> {itemValue.path}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-md">
                      <p className="text-sm">{itemValue.rationale}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Customer Segments - Use dedicated component */}
      <CustomerSegments data={data} />

      {/* Export JSON Button */}
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="p-4">
          <Button 
            onClick={() => {
              const dataStr = exportData();
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'business-data.json';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast({
                title: "Data Exported",
                description: "JSON file has been downloaded successfully.",
              });
            }}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
