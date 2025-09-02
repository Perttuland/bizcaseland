import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { useBusinessData } from '@/contexts/BusinessDataContext';

interface BusinessData {
  schema_version?: string;
  instructions?: any;
  meta: {
    title: string;
    description: string;
    archetype: string;
    currency: string;
    periods: number;
    frequency: string;
  };
  assumptions: {
    pricing: {
      avg_unit_price: { value: number; unit: string; rationale: string };
      discount_pct: { value: number; unit: string; rationale: string };
    };
    financial: {
      interest_rate: { value: number; unit: string; rationale: string };
    };
    customers: {
      segments: Array<{
        id: string;
        label: string;
        kind: string;
        rationale: string;
        volume: any;
      }>;
    };
    unit_economics: {
      cogs_pct: { value: number; unit: string; rationale: string };
      cac: { value: number; unit: string; rationale: string };
    };
    opex: Array<{
      name: string;
      value: { value: number; unit: string; rationale: string };
    }>;
  };
  drivers?: Array<{
    key: string;
    path: string;
    range: number[];
    rationale: string;
  }>;
}

interface DatapointsViewerProps {
  data: BusinessData;
}

export function DatapointsViewer({ data: propData }: DatapointsViewerProps) {
  const { data: contextData, updateData, updateAssumption } = useBusinessData();
  const data = contextData || propData;
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const startEdit = (fieldPath: string, currentValue: any) => {
    setEditingField(fieldPath);
    setEditValues({ [fieldPath]: currentValue });
  };

  const saveEdit = (fieldPath: string) => {
    const newValue = editValues[fieldPath];
    updateAssumption(fieldPath, newValue);
    setEditingField(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const renderEditableValue = (
    label: string,
    fieldPath: string,
    value: any,
    unit?: string,
    rationale?: string
  ) => {
    const isEditing = editingField === fieldPath;
    const editValue = editValues[fieldPath];

    return (
      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{label}</span>
          {unit && <Badge variant="outline">{unit}</Badge>}
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEdit(fieldPath, value)}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Input
              type="number"
              step="any"
              value={editValue}
              onChange={(e) => setEditValues({ ...editValues, [fieldPath]: parseFloat(e.target.value) || 0 })}
              className="text-lg font-semibold"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => saveEdit(fieldPath)}>
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-lg font-semibold text-financial-primary">{value}</div>
        )}
        
        {rationale && (
          <p className="text-xs text-muted-foreground">{rationale}</p>
        )}
      </div>
    );
  };

  const formatFieldName = (key: string) => {
    return key.replace(/_/g, ' ')
      .replace(/\bcac\b/gi, 'Customer Acquisition Cost')
      .replace(/\bltv\b/gi, 'Customer Lifetime Value')
      .replace(/\barpu\b/gi, 'Average Revenue Per User')
      .replace(/\bmrr\b/gi, 'Monthly Recurring Revenue')
      .replace(/\barr\b/gi, 'Annual Recurring Revenue')
      .replace(/\baov\b/gi, 'Average Order Value')
      .replace(/\bchurn\b/gi, 'Customer Churn Rate')
      .replace(/\bconversion\b/gi, 'Conversion Rate')
      .replace(/\bcogs\b/gi, 'Cost of Goods Sold')
      .replace(/\bopex\b/gi, 'Operating Expenses')
      .replace(/\bnpv\b/gi, 'Net Present Value')
      .replace(/\birr\b/gi, 'Internal Rate of Return')
      .replace(/\broi\b/gi, 'Return on Investment')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Business Case: {data.meta.title}</CardTitle>
          <p className="text-muted-foreground">{data.meta.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Archetype</div>
              <Badge className="mt-1">{data.meta.archetype}</Badge>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Currency</div>
              <div className="font-semibold">{data.meta.currency}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Time Horizon</div>
              <div className="font-semibold">{data.meta.periods} months</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="economics">Unit Economics</TabsTrigger>
          <TabsTrigger value="opex">Operating Expenses</TabsTrigger>
          <TabsTrigger value="drivers">Sensitivity Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Pricing Assumptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableValue(
                'Average Unit Price',
                'assumptions.pricing.avg_unit_price.value',
                data.assumptions.pricing.avg_unit_price.value,
                data.assumptions.pricing.avg_unit_price.unit,
                data.assumptions.pricing.avg_unit_price.rationale
              )}
              {renderEditableValue(
                'Discount Percentage',
                'assumptions.pricing.discount_pct.value',
                data.assumptions.pricing.discount_pct.value,
                data.assumptions.pricing.discount_pct.unit,
                data.assumptions.pricing.discount_pct.rationale
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.assumptions.customers.segments.map((segment, index) => (
                <div key={segment.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{segment.label}</h4>
                    <Badge variant="outline">{segment.kind}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{segment.rationale}</p>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium">Volume Pattern</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2 font-medium">{segment.volume.type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pattern:</span>
                        <span className="ml-2 font-medium">{segment.volume.pattern_type}</span>
                      </div>
                    </div>
                    
                    {segment.volume.base_year_total && (
                      <div className="p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">Base Year Total:</span>
                        <span className="ml-2 font-medium">
                          {segment.volume.base_year_total.value} {segment.volume.base_year_total.unit}
                        </span>
                      </div>
                    )}
                    
                    {segment.volume.yoy_growth && (
                      <div className="p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">YoY Growth:</span>
                        <span className="ml-2 font-medium">
                          {(segment.volume.yoy_growth.value * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Unit Economics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderEditableValue(
                'Cost of Goods Sold (%)',
                'assumptions.unit_economics.cogs_pct.value',
                data.assumptions.unit_economics.cogs_pct.value,
                data.assumptions.unit_economics.cogs_pct.unit,
                data.assumptions.unit_economics.cogs_pct.rationale
              )}
              {renderEditableValue(
                'Customer Acquisition Cost',
                'assumptions.unit_economics.cac.value',
                data.assumptions.unit_economics.cac.value,
                data.assumptions.unit_economics.cac.unit,
                data.assumptions.unit_economics.cac.rationale
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opex" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.assumptions.opex.map((opexItem, index) => (
                <div key={index}>
                  {renderEditableValue(
                    opexItem.name,
                    `assumptions.opex.${index}.value.value`,
                    opexItem.value.value,
                    opexItem.value.unit,
                    opexItem.value.rationale
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Sensitivity Analysis Drivers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.drivers?.map((driver, index) => (
                <div key={driver.key} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{formatFieldName(driver.key)}</h4>
                    <Badge variant="outline">{driver.path}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{driver.rationale}</p>
                  
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Test Range:</span>
                    <div className="grid grid-cols-5 gap-2">
                      {driver.range.map((value, valueIndex) => (
                        <div key={valueIndex} className="text-center p-2 bg-muted/50 rounded">
                          <div className="text-sm font-medium">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}