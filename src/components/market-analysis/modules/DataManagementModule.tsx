import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/lib/clipboard-utils';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Sparkles,
  Brain,
  FileDown
} from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketAnalysisTemplate, generateModularTemplate } from '../MarketAnalysisTemplate';
import { ExampleMarketAnalyses } from '../ExampleMarketAnalyses';
import { exportMarketAnalysisToPDF } from '@/lib/pdf-export-market';

interface DataManagementModuleProps {
  marketData?: MarketData | null;
  onDataLoad: (data: MarketData) => void;
  onDataUpdate?: (data: MarketData) => void;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
  showUploadOnly?: boolean;
}

export function DataManagementModule({ 
  marketData, 
  onDataLoad, 
  onDataUpdate, 
  validation,
  showUploadOnly = false 
}: DataManagementModuleProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('examples');
  const [selectedModules, setSelectedModules] = useState<string[]>(['market_sizing']); // Market Sizing checked by default
  const { toast } = useToast();

  const handleLoadExample = async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/sample-data/market-analysis/${caseId}.json`);
      if (!response.ok) {
        throw new Error('Failed to load example');
      }
      const exampleData = await response.json();
      onDataLoad(exampleData as MarketData);
      toast({
        title: "Example loaded successfully!",
        description: "Market analysis data ready for exploration.",
      });
    } catch (err) {
      setError('Failed to load example. Please try again.');
      toast({
        title: "Failed to load example",
        description: "Please try again or load data manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonImport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedData = JSON.parse(jsonInput);
      onDataLoad(parsedData as MarketData);
      setJsonInput('');
    } catch (err) {
      setError('Invalid JSON format. Please check your input and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonExport = () => {
    if (!marketData) return;
    
    const jsonString = JSON.stringify(marketData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePDFExport = async () => {
    if (!marketData) {
      toast({
        title: "No Data Available",
        description: "Please load market analysis data before exporting to PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF...",
        description: "Please wait while we create your market analysis report.",
      });

      await exportMarketAnalysisToPDF(marketData);

      toast({
        title: "PDF Export Successful",
        description: "Your market analysis report has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTemplateLoad = () => {
    // Generate template based on selected modules
    const template = selectedModules.length > 0 
      ? generateModularTemplate(selectedModules)
      : MarketAnalysisTemplate;
    setJsonInput(template);
    setActiveTab('import');
  };

  const handleTemplateCopy = async () => {
    try {
      // Generate template based on selected modules
      const template = selectedModules.length > 0 
        ? generateModularTemplate(selectedModules)
        : MarketAnalysisTemplate;
      const result = await copyTextToClipboard(template);
      
      if (result.success) {
        toast({
          title: "🎉 Template Copied Successfully!",
          description: "Market analysis template is ready for your AI assistant. Now you can create amazing market research!",
          variant: "default",
          duration: 4000,
        });
      } else {
        // Handle manual fallback case
        toast({
          title: "Manual Copy Required",
          description: result.error || "Please manually select and copy the text below.",
          variant: "default",
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Failed to copy template:', err);
      toast({
        title: "Copy Failed",
        description: "Failed to copy template to clipboard. Please manually select and copy the text.",
        variant: "destructive",
      });
    }
  };

  if (showUploadOnly) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Import Market Research Data</h3>
            <p className="text-sm text-muted-foreground">
              Start with examples or import your own market analysis data
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="examples">Example Markets</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="examples" className="mt-6">
            <ExampleMarketAnalyses 
              onLoadExample={handleLoadExample}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <div className="space-y-4">
              {/* Module Selection */}
              <Card className="border-2 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Select Modules to Include
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which analysis modules you want to include in your template. 
                      This generates a smaller, focused template based on your needs.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'market_sizing', label: 'Market Sizing', description: 'TAM/SAM/SOM analysis' },
                        { id: 'competitive_intelligence', label: 'Competitive Intelligence', description: 'Competitor analysis' },
                        { id: 'customer_analysis', label: 'Customer Analysis', description: 'Segment scoring' },
                        { id: 'strategic_planning', label: 'Strategic Planning', description: 'Market entry strategies' }
                      ].map((module) => (
                        <div key={module.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={module.id}
                            checked={selectedModules.includes(module.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedModules([...selectedModules, module.id]);
                              } else {
                                setSelectedModules(selectedModules.filter(m => m !== module.id));
                              }
                            }}
                          />
                          <div className="grid gap-1 leading-none">
                            <Label
                              htmlFor={module.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {module.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedModules.length === 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please select at least one module to generate a template.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedModules.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Selected:</strong> {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} 
                          <span className="text-muted-foreground ml-2">
                            (≈{selectedModules.length * 60} lines of JSON)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Use AI tools like ChatGPT or Claude to research your market and populate the template with real data.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  onClick={handleTemplateLoad} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Load Template
                </Button>
                <Button 
                  onClick={handleTemplateCopy} 
                  variant="outline" 
                  className="flex items-center gap-2"
                  disabled={selectedModules.length === 0}
                >
                  <Copy className="h-4 w-4" />
                  Copy Template
                </Button>
              </div>

              <div className="space-y-3">
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your market analysis data here..."
                  className="min-h-[200px] font-mono text-sm"
                />
                
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={handleJsonImport}
                  disabled={!jsonInput.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Processing...' : 'Import Market Data'}
                </Button>
              </div>

              {/* GenAI Workflow */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    GenAI Workflow for Market Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong>1. Copy Template:</strong> Use the "Copy Template" button above
                    </div>
                    <div>
                      <strong>2. Research with AI:</strong> Ask ChatGPT/Claude: "Research the [your market] and fill out this market analysis template with real data: [paste template]"
                    </div>
                    <div>
                      <strong>3. Import Results:</strong> Paste the completed template and click "Import Market Data"
                    </div>
                    <div className="text-blue-600 text-xs mt-2">
                      💡 <strong>Pro tip:</strong> Be specific about geographic regions, time frames, and market segments for better AI research
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold">Data Management</h2>
      </div>

      {/* Validation status */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Data Validation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validation.isValid ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All data validation checks passed. Your market analysis data is complete and ready for analysis.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {validation.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Errors found:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {validation.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Results</TabsTrigger>
          <TabsTrigger value="template">Template & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Example Market Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <ExampleMarketAnalyses 
                onLoadExample={handleLoadExample}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Market Research Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tip:</strong> Use AI tools like ChatGPT or Claude to research your market and populate the template with real data.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={handleTemplateLoad} variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Load Template
                </Button>
              </div>

              <Textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste your market analysis data here..."
                className="min-h-[300px] font-mono text-sm"
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleJsonImport}
                disabled={!jsonInput.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Processing...' : 'Import Market Data'}
              </Button>

              {/* GenAI Workflow */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    GenAI Workflow for Market Research
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 text-sm text-blue-800">
                    <div>
                      <strong>1. Copy Template:</strong> Use the "Copy Template" button above
                    </div>
                    <div>
                      <strong>2. Research with AI:</strong> Ask ChatGPT/Claude: "Research the [your market] and fill out this market analysis template with real data: [paste template]"
                    </div>
                    <div>
                      <strong>3. Import Results:</strong> Paste the completed template and click "Import Market Data"
                    </div>
                    <div className="text-blue-600 text-xs mt-2">
                      💡 <strong>Pro tip:</strong> Be specific about geographic regions, time frames, and market segments for better AI research
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Export your market analysis data and results for backup, sharing, or integration with business case analysis.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Raw Data Export</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export the complete market analysis dataset as JSON for backup or modification.
                    </p>
                    <Button 
                      onClick={handleJsonExport}
                      disabled={!marketData}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Professional PDF Report</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate a comprehensive PDF report with market sizing, competitive analysis, and customer insights.
                    </p>
                    <Button 
                      onClick={handlePDFExport}
                      disabled={!marketData}
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export as PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {marketData && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-green-800">Data Ready for Export</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Your market analysis contains data for: {marketData.meta?.title || 'Untitled Analysis'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Last modified: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>JSON Template & Usage Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Use our JSON template to structure your market research data. This template can be populated manually or with AI assistance.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">AI-Powered Workflow</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>Copy the JSON template below</li>
                    <li>Provide it to an AI assistant with your market research context</li>
                    <li>Ask the AI to populate the template with your specific market data</li>
                    <li>Import the completed JSON into the Market Analysis tool</li>
                    <li>Review and refine the analysis with our interactive tools</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleTemplateCopy} variant="outline" className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Template
                  </Button>
                  <Button onClick={handleTemplateLoad} variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Load into Editor
                  </Button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h5 className="font-medium mb-2">Template Structure</h5>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Market Sizing:</strong> TAM, SAM, SOM definitions and constraints</li>
                    <li>• <strong>Competitive Landscape:</strong> Competitor analysis and market structure</li>
                    <li>• <strong>Customer Analysis:</strong> Segment breakdown and customer economics</li>
                    <li>• <strong>Market Share:</strong> Current position and penetration strategy</li>
                    <li>• <strong>Market Dynamics:</strong> Growth drivers, risks, and technology trends</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Data Format:</strong> All numeric values should follow the format: 
                    <code className="ml-1 px-1 bg-gray-200 rounded">{"{ value: number, unit: string, rationale: string }"}</code>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
