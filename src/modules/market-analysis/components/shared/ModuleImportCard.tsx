/**
 * ModuleImportCard - Compact card for importing individual modules
 * Shows when a module has no data, allows user to get template and paste data
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/core/engine';
import { getSingleModuleTemplate, ModuleId } from '../MarketAnalysisTemplate';
import { 
  Copy, 
  FileInput, 
  Target, 
  Users, 
  TrendingUp, 
  PieChart,
  Loader2
} from 'lucide-react';
import { MarketData } from '@/core/types';

interface ModuleImportCardProps {
  moduleId: ModuleId;
  moduleName: string;
  icon?: 'Target' | 'Users' | 'TrendingUp' | 'PieChart';
  description?: string;
  onDataUpload: (data: Partial<MarketData>) => void;
}

const iconMap = {
  Target,
  Users,
  TrendingUp,
  PieChart
};

export function ModuleImportCard({
  moduleId,
  moduleName,
  icon = 'Target',
  description,
  onDataUpload
}: ModuleImportCardProps) {
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPasteDialogOpen, setIsPasteDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const { toast } = useToast();

  const Icon = iconMap[icon] || Target;

  const handleGetTemplate = async () => {
    try {
      setIsLoadingTemplate(true);
      
      // Generate template for this specific module
      const template = getSingleModuleTemplate(moduleId);
      
      // Copy to clipboard
      const result = await copyTextToClipboard(template);
      
      if (result.success) {
        toast({
          title: "✨ Template Copied!",
          description: `${moduleName} template is ready for your AI assistant. Just paste and complete!`,
          variant: "default",
          duration: 4000,
        });
      } else {
        toast({
          title: "Manual Copy Required",
          description: result.error || "Please copy the template manually from the Data Management tab.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error copying template:', error);
      toast({
        title: "Error",
        description: "Failed to copy template to clipboard",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handlePasteClick = () => {
    setIsPasteDialogOpen(true);
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) return;

    try {
      setIsImporting(true);
      
      const jsonData = JSON.parse(jsonInput);
      
      // Call the upload handler
      onDataUpload(jsonData);
      
      toast({
        title: "🎉 Data Imported Successfully!",
        description: `${moduleName} data has been imported.`,
        variant: "default",
        duration: 3000,
      });
      
      // Reset and close
      setJsonInput('');
      setIsPasteDialogOpen(false);
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Invalid JSON format. Please check your input.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const defaultDescription = description || `Get started by adding ${moduleName.toLowerCase()} data to your analysis`;

  return (
    <Card className="border-2 border-dashed border-muted-foreground/20">
      <CardContent className="py-8 px-6">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-muted/50">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2">
            No {moduleName} Data
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {defaultDescription}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={handleGetTemplate}
              disabled={isLoadingTemplate || isImporting}
              variant="default"
              className="w-full sm:w-auto"
            >
              {isLoadingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Get Template
                </>
              )}
            </Button>

            <Button
              onClick={handlePasteClick}
              disabled={isLoadingTemplate || isImporting}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <FileInput className="h-4 w-4 mr-2" />
              Paste Data
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-4">
            Copy template → Use with ChatGPT/Claude → Paste completed JSON
          </p>
        </div>
      </CardContent>

      {/* Paste Data Dialog */}
      <Dialog open={isPasteDialogOpen} onOpenChange={setIsPasteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import {moduleName} Data</DialogTitle>
            <DialogDescription>
              Paste the completed JSON data for {moduleName.toLowerCase()} below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Paste your ${moduleName.toLowerCase()} JSON here...`}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasteDialogOpen(false);
                setJsonInput('');
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!jsonInput.trim() || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
