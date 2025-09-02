import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Database, User, DollarSign, Settings, Target } from 'lucide-react';

interface BusinessData {
  meta: any;
  assumptions: any;
  structure: any;
  scenarios: any[];
  drivers?: any[];
}

interface JSONDataViewerProps {
  data: BusinessData;
}

export function JSONDataViewer({ data }: JSONDataViewerProps) {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    meta: true,
    assumptions: true,
    structure: false,
    scenarios: false,
    drivers: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderValue = (value: any, key: string = ''): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value.toString()}
        </Badge>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-financial-success font-mono">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-foreground">{value}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="pl-4 border-l-2 border-border">
              <div className="text-xs text-muted-foreground mb-1">Item {index + 1}</div>
              {renderObjectStructure(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return renderObjectStructure(value);
    }

    return <span>{String(value)}</span>;
  };

  const renderObjectStructure = (obj: any): React.ReactNode => {
    return (
      <div className="space-y-3">
        {Object.entries(obj).map(([key, value]: [string, any]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-financial-primary">
                {key.replace(/_/g, ' ')}
              </span>
              {value?.unit && (
                <Badge variant="outline" className="text-xs">
                  {value.unit}
                </Badge>
              )}
            </div>
            
            {value?.value !== undefined ? (
              <div className="space-y-1">
                <div className="text-lg font-semibold">{renderValue(value.value)}</div>
                {value.rationale && (
                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                    <strong>Rationale:</strong> {value.rationale}
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-3">{renderValue(value, key)}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getSectionIcon = (section: string) => {
    const icons = {
      meta: Database,
      assumptions: Settings,
      structure: Target,
      scenarios: DollarSign,
      drivers: User,
    };
    const Icon = icons[section as keyof typeof icons] || Database;
    return <Icon className="h-4 w-4" />;
  };

  const sections = [
    { key: 'meta', title: 'Business Metadata', data: data.meta },
    { key: 'assumptions', title: 'Business Assumptions', data: data.assumptions },
    { key: 'structure', title: 'Revenue & Cost Structure', data: data.structure },
    { key: 'scenarios', title: 'Scenario Analysis', data: data.scenarios },
    { key: 'drivers', title: 'Key Drivers', data: data.drivers },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Complete JSON Data Structure</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View all loaded business case data with assumptions and rationales
          </p>
        </CardHeader>
      </Card>

      {sections.map(({ key, title, data: sectionData }) => {
        if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
          return null;
        }

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
                      {getSectionIcon(key)}
                      <span>{title}</span>
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
                <CardContent>
                  {renderValue(sectionData)}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}