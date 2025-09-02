import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit3, Save, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessData } from '@/contexts/BusinessDataContext';

interface BusinessData {
  meta: any;
  assumptions: any;
  drivers?: any[];
}

interface DatapointsViewerProps {
  data: BusinessData;
}

interface EditableItem {
  value: any;
  unit: string;
  rationale: string;
}

export function DatapointsViewer({ data }: DatapointsViewerProps) {
  const { updateData, updateDriver, updateAssumption, exportData } = useBusinessData();
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, EditableItem>>({});
  const { toast } = useToast();

  const handleEdit = (path: string, item: EditableItem) => {
    setEditingItems(prev => ({ ...prev, [path]: true }));
    setTempValues(prev => ({ ...prev, [path]: { ...item } }));
  };

  const handleSave = (path: string) => {
    const tempValue = tempValues[path];
    if (tempValue) {
      updateAssumption(path, tempValue);
      setEditingItems(prev => ({ ...prev, [path]: false }));
      toast({
        title: "Updated",
        description: "Value updated successfully",
      });
    }
  };

  const handleCancel = (path: string) => {
    setEditingItems(prev => ({ ...prev, [path]: false }));
    setTempValues(prev => {
      const newValues = { ...prev };
      delete newValues[path];
      return newValues;
    });
  };

  const handleExport = () => {
    const jsonString = exportData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-case-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Data exported successfully",
    });
  };

  const renderEditableItem = (item: EditableItem, path: string, label: string) => {
    const isEditing = editingItems[path];
    const tempValue = tempValues[path] || item;

    if (isEditing) {
      return (
        <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{label}</span>
            <div className="flex space-x-2">
              <Button size="sm" variant="default" onClick={() => handleSave(path)}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCancel(path)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Value</label>
              <Input
                type="number"
                value={tempValue.value}
                onChange={(e) => setTempValues(prev => ({
                  ...prev,
                  [path]: { ...tempValue, value: parseFloat(e.target.value) || 0 }
                }))}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unit</label>
              <Input
                value={tempValue.unit}
                onChange={(e) => setTempValues(prev => ({
                  ...prev,
                  [path]: { ...tempValue, unit: e.target.value }
                }))}
                className="text-sm"
              />
            </div>
            <div className="col-span-1">
              <label className="text-xs text-muted-foreground">Rationale</label>
              <Textarea
                value={tempValue.rationale}
                onChange={(e) => setTempValues(prev => ({
                  ...prev,
                  [path]: { ...tempValue, rationale: e.target.value }
                }))}
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-sm">{label}</span>
            <Badge variant="secondary" className="text-xs">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value} {item.unit}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{item.rationale}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => handleEdit(path, item)}>
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const renderCustomerSegment = (segment: any, index: number) => {
    return (
      <div key={segment.id} className="space-y-3 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{segment.label}</h4>
          <Badge variant="outline">{segment.kind}</Badge>
        </div>
        
        <p className="text-sm text-muted-foreground">{segment.rationale}</p>
        
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Volume Pattern</h5>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span> {segment.volume.type}
            </div>
            <div>
              <span className="text-muted-foreground">Pattern:</span> {segment.volume.pattern_type}
            </div>
          </div>
          
          {segment.volume.base_year_total && renderEditableItem(
            segment.volume.base_year_total,
            `assumptions.customers.segments.${index}.volume.base_year_total`,
            "Base Year Total"
          )}
          
          {segment.volume.yoy_growth && renderEditableItem(
            segment.volume.yoy_growth,
            `assumptions.customers.segments.${index}.volume.yoy_growth`,
            "YoY Growth"
          )}
          
          {segment.volume.seasonality_index_12 && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Seasonality Index (12 months)</span>
              <div className="grid grid-cols-6 gap-1 text-xs">
                {segment.volume.seasonality_index_12.map((value: number, monthIndex: number) => (
                  <div key={monthIndex} className="text-center p-1 bg-muted rounded">
                    {value.toFixed(1)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Datapoints & Assumptions</CardTitle>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["pricing", "customers", "economics", "opex"]} className="w-full">
            
            {/* Meta Information */}
            <AccordionItem value="meta">
              <AccordionTrigger>Meta Information</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Title:</span> {data.meta.title}</div>
                  <div><span className="font-medium">Archetype:</span> {data.meta.archetype}</div>
                  <div><span className="font-medium">Currency:</span> {data.meta.currency}</div>
                  <div><span className="font-medium">Periods:</span> {data.meta.periods}</div>
                </div>
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{data.meta.description}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Pricing */}
            <AccordionItem value="pricing">
              <AccordionTrigger>Pricing</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {renderEditableItem(
                  data.assumptions.pricing.avg_unit_price,
                  'assumptions.pricing.avg_unit_price',
                  'Average Unit Price'
                )}
                {renderEditableItem(
                  data.assumptions.pricing.discount_pct,
                  'assumptions.pricing.discount_pct',
                  'Discount Percentage'
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Customer Segments */}
            <AccordionItem value="customers">
              <AccordionTrigger>Customer Segments</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {data.assumptions.customers.segments.map((segment: any, index: number) => 
                  renderCustomerSegment(segment, index)
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Unit Economics */}
            <AccordionItem value="economics">
              <AccordionTrigger>Unit Economics</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {renderEditableItem(
                  data.assumptions.unit_economics.cogs_pct,
                  'assumptions.unit_economics.cogs_pct',
                  'COGS Percentage'
                )}
                {renderEditableItem(
                  data.assumptions.unit_economics.cac,
                  'assumptions.unit_economics.cac',
                  'Customer Acquisition Cost'
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Operating Expenses */}
            <AccordionItem value="opex">
              <AccordionTrigger>Operating Expenses</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {data.assumptions.opex.map((opex: any, index: number) => 
                  renderEditableItem(
                    opex.value,
                    `assumptions.opex.${index}.value`,
                    opex.name
                  )
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Financial Assumptions */}
            <AccordionItem value="financial">
              <AccordionTrigger>Financial Assumptions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {renderEditableItem(
                  data.assumptions.financial.interest_rate,
                  'assumptions.financial.interest_rate',
                  'Interest/Discount Rate'
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Sensitivity Drivers */}
            {data.drivers && data.drivers.length > 0 && (
              <AccordionItem value="drivers">
                <AccordionTrigger>Sensitivity Analysis Drivers</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {data.drivers.map((driver: any, index: number) => (
                    <div key={driver.key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{driver.key}</h4>
                        <Badge variant="outline">{driver.path}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{driver.rationale}</p>
                      <div>
                        <span className="text-sm font-medium">Range Values:</span>
                        <div className="flex space-x-2 mt-1">
                          {driver.range.map((value: number, rangeIndex: number) => (
                            <Badge key={rangeIndex} variant="secondary">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}