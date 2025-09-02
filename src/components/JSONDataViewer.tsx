import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Edit3, Save, X, DollarSign, TrendingUp, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessData {
  meta: any;
  assumptions: any;
  structure: any;
  scenarios: any[];
  drivers?: any[];
}

interface DatapointsViewerProps {
  data: BusinessData;
  onDataUpdate?: (updatedData: BusinessData) => void;
}

interface EditableItem {
  value: any;
  unit: string;
  rationale: string;
}

export function DatapointsViewer({ data, onDataUpdate }: DatapointsViewerProps) {
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

  const formatValue = (value: any, unit: string) => {
    if (typeof value === 'number') {
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

  const renderEditableDatapoint = (
    itemId: string,
    label: string,
    item: any,
    icon: React.ComponentType<any>
  ) => {
    const isEditing = editingItems[itemId];
    const currentValue = tempValues[itemId] || item;
    const Icon = icon;

    return (
      <Card key={itemId} className="bg-muted/30 border-l-4 border-l-financial-primary">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Icon className="h-5 w-5 text-financial-primary mt-1" />
              <div className="flex-1 space-y-3">
                <h4 className="font-semibold text-lg">{label}</h4>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Value</label>
                        <Input
                          type="number"
                          value={currentValue.value}
                          onChange={(e) => setTempValues(prev => ({
                            ...prev,
                            [itemId]: { ...prev[itemId], value: parseFloat(e.target.value) || 0 }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unit</label>
                        <Input
                          value={currentValue.unit}
                          onChange={(e) => setTempValues(prev => ({
                            ...prev,
                            [itemId]: { ...prev[itemId], unit: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rationale</label>
                      <Textarea
                        value={currentValue.rationale}
                        onChange={(e) => setTempValues(prev => ({
                          ...prev,
                          [itemId]: { ...prev[itemId], rationale: e.target.value }
                        }))}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl font-bold text-financial-success">
                        {formatValue(item.value, item.unit)}
                      </span>
                      <Badge variant="outline">{item.unit}</Badge>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <strong>Rationale:</strong> {item.rationale}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={() => saveEdit(itemId)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelEditing(itemId)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEditing(itemId, item)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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

  // Get all financial assumptions from the structure section
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

  // Get driver data points
  const getDriverDatapoints = () => {
    if (!data.drivers) return [];
    
    return data.drivers.map((driver: any, index: number) => [
      `driver_${index + 1}`, // Start numbering from 1
      {
        value: driver.key,
        unit: 'sensitivity',
        rationale: driver.rationale,
        path: driver.path,
        range: driver.range,
        driverNumber: index + 1 // Add driver number for display
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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Datapoints and Assumptions</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View and edit all business assumptions, formulas, and rationales used in the analysis
          </p>
        </CardHeader>
      </Card>

      {allSections.map(({ key, title, icon, items }) => {
        if (!items || items.length === 0) return null;

        return (
          <Card key={key} className="bg-gradient-card shadow-card">
            <Collapsible
              open={openSections[key]}
              onOpenChange={() => toggleSection(key)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {React.createElement(icon, { className: "h-5 w-5" })}
                      <span>{title}</span>
                      <Badge variant="secondary">{items.length} items</Badge>
                    </div>
                    {openSections[key] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {items.map(([itemKey, itemValue]: [string, any]) => {
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
                      .replace(/ebitda/gi, 'Earnings Before Interest, Taxes, Depreciation & Amortization')
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
                    
                     if (itemValue.formula) {
                       // Special rendering for formula-based items
                       return (
                         <Card key={itemId} className="bg-muted/30 border-l-4 border-l-financial-secondary">
                           <CardContent className="p-4">
                             <div className="flex items-start space-x-3">
                               {React.createElement(icon, { className: "h-5 w-5 text-financial-secondary mt-1" })}
                               <div className="flex-1 space-y-2">
                                 <h4 className="font-semibold text-lg">{label}</h4>
                                 <Badge variant="outline">{itemValue.unit}</Badge>
                                 <div className="p-2 bg-card rounded font-mono text-sm">
                                   {itemValue.formula}
                                 </div>
                                 <div className="p-3 bg-muted/50 rounded-lg">
                                   <p className="text-base text-muted-foreground leading-relaxed">
                                     <strong>Rationale:</strong> {itemValue.rationale}
                                   </p>
                                 </div>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       );
                     }
                     
                     if (itemValue.unit === 'sensitivity' && itemValue.range) {
                       // Special rendering for sensitivity drivers
                       const rangeLabels = ['Low', 'Mid-Low', 'Mid', 'Mid-High', 'High'];
                       return (
                         <Card key={itemId} className="bg-muted/30 border-l-4 border-l-financial-warning">
                           <CardContent className="p-4">
                             <div className="flex items-start space-x-3">
                               {React.createElement(icon, { className: "h-5 w-5 text-financial-warning mt-1" })}
                               <div className="flex-1 space-y-3">
                                 <div className="flex items-center gap-2">
                                   <h4 className="font-semibold text-lg">
                                     Driver {itemValue.driverNumber}: {label}
                                   </h4>
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
                                 
                                 <div className="p-3 bg-muted/50 rounded-lg">
                                   <p className="text-base text-muted-foreground leading-relaxed">
                                     <strong>Rationale:</strong> {itemValue.rationale}
                                   </p>
                                 </div>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       );
                     }
                    
                    return renderEditableDatapoint(
                      itemId,
                      label,
                      itemValue,
                      icon
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Customer Segments */}
      {data.assumptions.customers?.segments && (
        <Card className="bg-gradient-card shadow-card">
          <Collapsible
            open={openSections.customers}
            onOpenChange={() => toggleSection('customers')}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Customer Segments</span>
                    <Badge variant="secondary">{data.assumptions.customers.segments.length} segments</Badge>
                  </div>
                  {openSections.customers ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {data.assumptions.customers.segments.map((segment: any, index: number) => (
                  <Card key={index} className="bg-muted/30 border-l-4 border-l-financial-warning">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Users className="h-5 w-5 text-financial-warning mt-1" />
                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold text-lg">{segment.label}</h4>
                            <Badge variant="outline">{segment.kind}</Badge>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <p className="text-base text-muted-foreground leading-relaxed">
                                <strong>Rationale:</strong> {segment.rationale}
                              </p>
                            </div>
                            
                            {/* Show volume data if available */}
                            {segment.volume && (
                              <div className="mt-3 p-3 bg-financial-success/10 rounded-lg border border-financial-success/20">
                                <h5 className="font-medium mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-financial-success" />
                                  Customer Volume Information
                                </h5>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <span className="text-sm font-medium text-muted-foreground">Volume Type</span>
                                    <p className="text-sm font-semibold">{segment.volume.type}</p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-muted-foreground">Growth Pattern</span>
                                    <p className="text-sm font-semibold">{segment.volume.pattern_type}</p>
                                  </div>
                                </div>
                                {segment.volume.series && segment.volume.series.length > 0 && (
                                  <div className="space-y-2">
                                    <span className="text-sm font-medium text-muted-foreground">Volume Series Data:</span>
                                    <div className="space-y-2">
                                      {segment.volume.series.slice(0, 3).map((period: any, idx: number) => (
                                        <div key={idx} className="p-2 bg-card rounded border">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <span className="font-medium text-financial-success">
                                                Period {period.period}: {period.value?.toLocaleString() || period.value} {period.unit}
                                              </span>
                                            </div>
                                          </div>
                                          {period.rationale && (
                                            <p className="text-xs text-muted-foreground mt-1">{period.rationale}</p>
                                          )}
                                        </div>
                                      ))}
                                      {segment.volume.series.length > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                          ... and {segment.volume.series.length - 3} more periods
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {segment.volume.growth_rate && (
                                  <div className="mt-3 p-2 bg-muted/50 rounded">
                                    <span className="text-sm font-medium">Growth Rate: </span>
                                    <span className="text-sm font-semibold text-financial-success">
                                      {(segment.volume.growth_rate * 100).toFixed(1)}% per period
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}