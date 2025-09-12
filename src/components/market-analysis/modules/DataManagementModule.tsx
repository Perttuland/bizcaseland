import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketAnalysisTemplate } from '../MarketAnalysisTemplate';

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
  const [activeTab, setActiveTab] = useState('import');

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

  const handleTemplateLoad = () => {
    setJsonInput(MarketAnalysisTemplate);
    setActiveTab('import');
  };

  const handleTemplateCopy = async () => {
    try {
      await navigator.clipboard.writeText(MarketAnalysisTemplate);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  if (showUploadOnly) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Import Market Analysis Data</h3>
        </div>
        
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Import market analysis data using our JSON template. You can use AI to populate the template with market research data.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={handleTemplateLoad} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Load Template
          </Button>
          <Button onClick={handleTemplateCopy} variant="outline" className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Copy Template
          </Button>
        </div>

        <div className="space-y-3">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your market analysis JSON data here..."
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
            {isLoading ? 'Processing...' : 'Import Analysis Data'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-bold">Data Management</h2>
        </div>
        <Badge variant="outline" className="bg-gray-50">
          Import/Export Tools
        </Badge>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Results</TabsTrigger>
          <TabsTrigger value="template">Template & Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Market Analysis Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Import market analysis data using our JSON template. You can use AI to populate the template with your market research data.
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
                placeholder="Paste your market analysis JSON data here..."
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
                {isLoading ? 'Processing...' : 'Import Analysis Data'}
              </Button>
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
                    <h4 className="font-semibold mb-2">Business Case Integration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export volume projections and key insights for business case analysis.
                    </p>
                    <Button 
                      disabled={!marketData}
                      variant="outline"
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Export for Business Case
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
