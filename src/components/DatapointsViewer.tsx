import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, X } from "lucide-react";
import { useBusinessData } from "@/contexts/BusinessDataContext";

export function DatapointsViewer() {
  const { data, updateValue } = useBusinessData();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);

  if (!data) return null;

  const startEditing = (path: string, currentValue: any) => {
    setEditingItem(path);
    setTempValue(currentValue);
  };

  const saveEdit = (path: string) => {
    updateValue(path, tempValue);
    setEditingItem(null);
    setTempValue(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setTempValue(null);
  };

  const renderValueField = (path: string, valueObj: any, label: string) => {
    const isEditing = editingItem === `${path}.value`;
    
    return (
      <div className="grid grid-cols-12 gap-4 items-start p-3 bg-muted/30 rounded-lg">
        <div className="col-span-3">
          <label className="text-sm font-medium">{label}</label>
        </div>
        <div className="col-span-2">
          {isEditing ? (
            <Input
              type="number"
              value={tempValue || 0}
              onChange={(e) => setTempValue(parseFloat(e.target.value) || 0)}
              className="h-8"
            />
          ) : (
            <span className="text-sm font-mono">{valueObj?.value || 0}</span>
          )}
        </div>
        <div className="col-span-2">
          <span className="text-xs text-muted-foreground">{valueObj?.unit || 'N/A'}</span>
        </div>
        <div className="col-span-4">
          <span className="text-xs text-muted-foreground">{valueObj?.rationale || 'No rationale'}</span>
        </div>
        <div className="col-span-1 flex gap-1">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => saveEdit(`${path}.value`)}>
                <Save className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => startEditing(`${path}.value`, valueObj?.value)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Meta Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <p className="text-sm text-muted-foreground">{data.meta.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Archetype</label>
              <p className="text-sm text-muted-foreground">{data.meta.archetype}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <p className="text-sm text-muted-foreground">{data.meta.currency}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Periods</label>
              <p className="text-sm text-muted-foreground">{data.meta.periods} {data.meta.frequency}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <p className="text-sm text-muted-foreground">{data.meta.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-2">
            <div className="col-span-3">Parameter</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Rationale</div>
            <div className="col-span-1">Actions</div>
          </div>
          {renderValueField('assumptions.pricing.avg_unit_price', data.assumptions.pricing.avg_unit_price, 'Average Unit Price')}
          {renderValueField('assumptions.pricing.discount_pct', data.assumptions.pricing.discount_pct, 'Discount %')}
        </CardContent>
      </Card>

      {/* Financial Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Financial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-2">
            <div className="col-span-3">Parameter</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Rationale</div>
            <div className="col-span-1">Actions</div>
          </div>
          {renderValueField('assumptions.financial.interest_rate', data.assumptions.financial.interest_rate, 'Interest Rate')}
        </CardContent>
      </Card>

      {/* Unit Economics */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Economics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-2">
            <div className="col-span-3">Parameter</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Rationale</div>
            <div className="col-span-1">Actions</div>
          </div>
          {renderValueField('assumptions.unit_economics.cogs_pct', data.assumptions.unit_economics.cogs_pct, 'COGS %')}
          {renderValueField('assumptions.unit_economics.cac', data.assumptions.unit_economics.cac, 'Customer Acquisition Cost')}
        </CardContent>
      </Card>

      {/* Operating Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Operating Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground mb-2">
            <div className="col-span-3">Parameter</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Rationale</div>
            <div className="col-span-1">Actions</div>
          </div>
          {data.assumptions.opex.map((opexItem, index) => 
            renderValueField(`assumptions.opex.${index}.value`, opexItem.value, opexItem.name)
          )}
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.assumptions.customers.segments.map((segment, index) => (
            <div key={segment.id} className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Segment</label>
                  <p className="text-sm text-muted-foreground">{segment.label}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{segment.kind}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Rationale</label>
                <p className="text-sm text-muted-foreground">{segment.rationale}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Volume Pattern</label>
                <p className="text-sm text-muted-foreground">{segment.volume.pattern_type}</p>
              </div>
              {segment.volume.series.map((series, seriesIndex) => (
                <div key={seriesIndex} className="grid grid-cols-12 gap-4 items-start p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-3">
                    <label className="text-sm font-medium">Period {series.period}</label>
                  </div>
                  <div className="col-span-2">
                    {editingItem === `assumptions.customers.segments.${index}.volume.series.${seriesIndex}.value` ? (
                      <Input
                        type="number"
                        value={tempValue || 0}
                        onChange={(e) => setTempValue(parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                    ) : (
                      <span className="text-sm font-mono">{series.value}</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground">{series.unit}</span>
                  </div>
                  <div className="col-span-4">
                    <span className="text-xs text-muted-foreground">{series.rationale}</span>
                  </div>
                  <div className="col-span-1 flex gap-1">
                    {editingItem === `assumptions.customers.segments.${index}.volume.series.${seriesIndex}.value` ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => saveEdit(`assumptions.customers.segments.${index}.volume.series.${seriesIndex}.value`)}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEditing(`assumptions.customers.segments.${index}.volume.series.${seriesIndex}.value`, series.value)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}