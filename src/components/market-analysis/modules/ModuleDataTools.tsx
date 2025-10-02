import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/lib/clipboard-utils';
import {
  Copy,
  FileText,
  Upload,
  CheckCircle2,
  X
} from 'lucide-react';
import { generateSingleModuleTemplate } from '../MarketAnalysisTemplate';
import { MarketData } from '@/lib/market-calculations';

// Mapping from moduleKey to module identifier for template generation
const MODULE_KEY_TO_ID: Record<string, string> = {
  'market_sizing': 'market_sizing',
  'market_share': 'market_sizing', // market_share is part of market_sizing
  'competitive_landscape': 'competitive_intelligence',
  'customer_analysis': 'customer_analysis',
  'strategic_planning': 'strategic_planning'
};

interface ModuleDataToolsProps {
  moduleName: string;
  moduleKey: string;
  marketData?: MarketData | null;
  onDataUpdate: (data: MarketData) => void;
}

export function ModuleDataTools({
  moduleName,
  moduleKey,
  marketData,
  onDataUpdate
}: ModuleDataToolsProps) {
  const [showImport, setShowImport] = useState(false);
  const [moduleInput, setModuleInput] = useState('');
  const { toast } = useToast();

  // Check if this module has data
  const hasData = !!(marketData as any)?.[moduleKey];

  const handleCopyCurrentData = async () => {
    if (!hasData || !marketData) return;

    const moduleData: any = {
      schema_version: marketData.schema_version || "1.0",
      meta: marketData.meta
    };

    // Add the module-specific data
    moduleData[moduleKey] = (marketData as any)[moduleKey];

    // For market_sizing, also include market_share as they go together
    if (moduleKey === 'market_sizing' && (marketData as any).market_share) {
      moduleData.market_share = (marketData as any).market_share;
    }

    try {
      const result = await copyTextToClipboard(JSON.stringify(moduleData, null, 2));

      if (result.success) {
        toast({
          title: "Current data copied!",
          description: `Your ${moduleName} data is ready to paste and modify.`,
        });
      } else {
        toast({
          title: "Copy failed",
          description: result.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "An error occurred while copying data.",
        variant: "destructive"
      });
    }
  };

  const handleCopyTemplate = async () => {
    try {
      // Convert moduleKey to module identifier for template generation
      const moduleId = MODULE_KEY_TO_ID[moduleKey] || moduleKey;
      const template = generateSingleModuleTemplate(moduleId);
      const result = await copyTextToClipboard(template);

      if (result.success) {
        toast({
          title: "Template copied!",
          description: `Fresh ${moduleName} template ready for AI research.`,
        });
      } else {
        toast({
          title: "Copy failed",
          description: result.error || "Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "An error occurred while copying template.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = () => {
    try {
      const parsed = JSON.parse(moduleInput);

      // Create updated data object
      const updated: any = {
        ...marketData,
        schema_version: parsed.schema_version || marketData?.schema_version || "1.0",
        meta: parsed.meta || marketData?.meta || {}
      };

      // Update the specific module data
      if (parsed[moduleKey]) {
        updated[moduleKey] = parsed[moduleKey];
      }

      // For market_sizing, also handle market_share if present
      if (moduleKey === 'market_sizing' && parsed.market_share) {
        updated.market_share = parsed.market_share;
      }

      onDataUpdate(updated as MarketData);
      setModuleInput('');
      setShowImport(false);

      toast({
        title: "Module updated!",
        description: `${moduleName} data has been imported successfully.`,
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON format and try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardContent className="pt-4 pb-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-semibold text-sm">Module Data Tools</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasData && (
              <Button
                onClick={handleCopyCurrentData}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Current Data
              </Button>
            )}

            <Button
              onClick={handleCopyTemplate}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Copy Fresh Template
            </Button>

            <Button
              onClick={() => setShowImport(!showImport)}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {showImport ? 'Hide Import' : 'Import Module Data'}
            </Button>
          </div>

          {showImport && (
            <div className="space-y-2 pt-2 border-t">
              <Textarea
                value={moduleInput}
                onChange={(e) => setModuleInput(e.target.value)}
                placeholder={`Paste ${moduleName} JSON data here...`}
                className="min-h-[120px] font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button onClick={handleImportData} size="sm">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Update Module
                </Button>
                <Button
                  onClick={() => {
                    setModuleInput('');
                    setShowImport(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
