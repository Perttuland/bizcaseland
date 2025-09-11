import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Upload, AlertCircle, CheckCircle2, BarChart3, TrendingUp, Calculator, Download, Edit3, RefreshCw, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { safeJSONParse, validateBusinessData } from '@/lib/utils/json-validation';
import { JSONTemplate } from './JSONTemplate';
import { FinancialAnalysis } from './FinancialAnalysis';
// import { DataVisualization } from './DataVisualization';
import { AssumptionsTab } from './AssumptionsTab';
import { CashFlowStatement } from './CashFlowStatement';
import { MarketAnalysis } from './MarketAnalysis';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';

export function BusinessCaseAnalyzer() {
  const { data: jsonData, updateData } = useBusinessData();
  const [inputJson, setInputJson] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'charts' | 'data' | 'cashflow' | 'market'>('input');
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const { toast } = useToast();

  const handleJsonPaste = (value: string) => {
    setInputJson(value);
    validateJson(value);
  };

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setIsValidJson(null);
      return;
    }

    // Use secure JSON parsing
    const parseResult = safeJSONParse(value);
    
    if (!parseResult.success) {
      setIsValidJson(false);
      toast({
        title: "Invalid JSON",
        description: parseResult.error || "Failed to parse JSON",
        variant: "destructive",
      });
      return;
    }

    // Validate business data structure
    const businessDataValidation = validateBusinessData(parseResult.data);
    
    if (!businessDataValidation.success) {
      setIsValidJson(false);
      toast({
        title: "Invalid Format",
        description: businessDataValidation.error || "Invalid business data format",
        variant: "destructive",
      });
      return;
    }

    setIsValidJson(true);
    
    // Show warnings if any
    if (businessDataValidation.warnings && businessDataValidation.warnings.length > 0) {
      toast({
        title: "Data Warnings",
        description: `${businessDataValidation.warnings.length} validation warnings found. Check console for details.`,
        variant: "default",
      });
      console.warn('Business data validation warnings:', businessDataValidation.warnings);
    }
  };

  const refreshData = () => {
    if (!isValidJson || !inputJson.trim()) {
      toast({
        title: "Cannot Refresh",
        description: "Please ensure JSON is valid before refreshing.",
        variant: "destructive",
      });
      return;
    }

    const parseResult = safeJSONParse(inputJson);
    
    if (!parseResult.success) {
      toast({
        title: "Parse Failed",
        description: parseResult.error || "Failed to parse JSON data.",
        variant: "destructive",
      });
      return;
    }

    const businessDataValidation = validateBusinessData(parseResult.data);
    
    if (!businessDataValidation.success) {
      toast({
        title: "Validation Failed",
        description: businessDataValidation.error || "Invalid business data format.",
        variant: "destructive",
      });
      return;
    }

    try {
      updateData(businessDataValidation.data!);
      
  // Notify other components that data was refreshed from JSON
  window.dispatchEvent(new Event('datarefreshed'));
      setHasUploadedData(true);
      
      // Navigate to business case analysis tab when data is first uploaded
      if (!hasUploadedData) {
        setActiveTab('cashflow');
      }
      
      toast({
        title: "Data Refreshed",
        description: "Business case data updated from JSON!",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Error parsing JSON data.",
        variant: "destructive",
      });
    }
  };

  const resetForNewUpload = () => {
    setInputJson('');
    setIsValidJson(null);
    setHasUploadedData(false);
    setActiveTab('input');
    updateData(null);
    toast({
      title: "Ready for New Data",
      description: "You can now upload a new JSON file.",
    });
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(JSONTemplate);
      toast({
        title: "Template Copied",
        description: "JSON template copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please copy the template manually.",
        variant: "destructive",
      });
    }
  };

  const getValidationIcon = () => {
    if (isValidJson === null) return null;
    return isValidJson ? (
      <CheckCircle2 className="h-5 w-5 text-financial-success" />
    ) : (
      <AlertCircle className="h-5 w-5 text-financial-danger" />
    );
  };

  const getValidationBadge = () => {
    if (isValidJson === null) return null;
    return (
      <Badge variant={isValidJson ? "default" : "destructive"} className="ml-2">
        {isValidJson ? "Valid" : "Invalid"}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-dashboard-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Business Case Analyzer</h1>
                <p className="text-sm text-muted-foreground">Professional financial analysis and validation tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-financial-primary text-financial-primary-foreground">
                v0.3
              </Badge>
              <div className="text-sm text-muted-foreground">Business Case Analyzer v1.0</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Always visible template and upload controls */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={copyTemplate}
                  variant="outline" 
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON Template
                </Button>
                
                <Button 
                  onClick={resetForNewUpload}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Clear & Upload New JSON
                </Button>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">JSON Data</label>
                    {getValidationIcon()}
                    {getValidationBadge()}
                  </div>
                  <Textarea
                    placeholder="Paste your AI-filled JSON here..."
                    value={inputJson}
                    onChange={(e) => handleJsonPaste(e.target.value)}
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <Button 
                    onClick={refreshData}
                    disabled={!isValidJson}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {hasUploadedData ? 'Refresh Data from JSON' : 'Go'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Analysis Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!hasUploadedData && (
                  <Button
                    variant={activeTab === 'input' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('input')}
                    className="w-full justify-start"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Data Input
                  </Button>
                )}

                {/* Move Assumptions (formerly Data Points) to the top of the tools list */}
                <Button 
                  variant={activeTab === 'data' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('data')}
                  disabled={!hasUploadedData}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Assumptions
                </Button>

                <Button
                  variant={activeTab === 'cashflow' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('cashflow')}
                  disabled={!hasUploadedData}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Cash Flow Statement
                </Button>
                <Button 
                  variant={activeTab === 'analysis' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('analysis')}
                  disabled={!hasUploadedData}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Financial Analysis
                </Button>
                {/* Data Visualization tab commented out while placeholder */}
                { /*
                <Button 
                  variant={activeTab === 'charts' ? 'default' : 'ghost'} 
                  onClick={() => {
                    setActiveTab('charts');
                    window.dispatchEvent(new Event('tabchange'));
                  }}
                  disabled={!hasUploadedData}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Data Visualization
                </Button>
                */ }
                {/* Scenario Analysis tab removed */}
                <Button 
                  variant={activeTab === 'market' ? 'default' : 'ghost'} 
                  onClick={() => setActiveTab('market')}
                  disabled={!hasUploadedData}
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  Market Analysis
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'input' && !hasUploadedData && (
              <Card className="bg-gradient-card shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle>JSON Template & Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">How to Use This Tool:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Copy the JSON template</li>
                        <li>Use any AI tool (GPT, Claude, etc.) to fill in the template with your business case data</li>
                        <li>Paste the completed JSON</li>
                        <li>The tool will help you analyze the business case</li>
                      </ol>
                    </div>

                    {/* Prominent copy button for first-time users */}
                    <div className="mt-4">
                      <Button onClick={copyTemplate} variant="default" className="w-full text-lg font-semibold py-3 flex items-center justify-center gap-3">
                        <Copy className="h-5 w-5" />
                        Copy JSON Template
                      </Button>
                    </div>

                    <pre className="bg-card border rounded-lg p-4 text-xs overflow-auto max-h-96">
                      <code>{JSONTemplate}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keep all tabs mounted but show/hide based on activeTab */}
            {jsonData && (
              <>
                <div className={activeTab === 'data' ? 'animate-fade-in' : 'hidden'}>
                  <AssumptionsTab />
                </div>

                <div className={activeTab === 'cashflow' ? 'animate-fade-in' : 'hidden'}>
                  <CashFlowStatement />
                </div>

                <div className={activeTab === 'analysis' ? 'animate-fade-in' : 'hidden'}>
                  <FinancialAnalysis />
                </div>

                {/* Scenario Analysis removed */}

                <div className={activeTab === 'market' ? 'animate-fade-in' : 'hidden'}>
                  <MarketAnalysis />
                </div>
              </>
            )}

            {/* Show "No Data Available" message only when no data is loaded */}
            {!jsonData && activeTab !== 'input' && (
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-semibold">No Data Available</h3>
                    <p className="text-muted-foreground">Please paste valid JSON data to begin analysis.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}