import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Upload, AlertCircle, CheckCircle2, BarChart3, TrendingUp, Calculator, Download, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { JSONTemplate } from './JSONTemplate';
import { DatapointsViewer } from './DatapointsViewer';
import { BusinessCaseAnalysis } from './BusinessCaseAnalysis';

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
  assumptions: any;
  drivers?: any[];
}

export function BusinessCaseAnalyzer() {
  const [jsonData, setJsonData] = useState<BusinessData | null>(null);
  const [inputJson, setInputJson] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'data' | 'analysis'>('input');
  const { toast } = useToast();
  const { updateData } = useBusinessData();

  const handleJsonPaste = (value: string) => {
    setInputJson(value);
    if (!value.trim()) {
      setIsValidJson(null);
      setJsonData(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed.meta && parsed.assumptions) {
        setIsValidJson(true);
        setJsonData(parsed);
        updateData(parsed); // Update context data
        toast({
          title: "JSON Validated",
          description: "Business case data loaded successfully!",
        });
      } else {
        setIsValidJson(false);
        setJsonData(null);
        toast({
          title: "Invalid Format",
          description: "JSON must contain 'meta' and 'assumptions' fields.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValidJson(false);
      setJsonData(null);
      toast({
        title: "Invalid JSON",
        description: "Please check your JSON syntax.",
        variant: "destructive",
      });
    }
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
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-financial-primary text-financial-primary-foreground">
                v0.2
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Data Input</span>
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
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Paste JSON Data</label>
                    {getValidationIcon()}
                    {getValidationBadge()}
                  </div>
                  <Textarea
                    placeholder="Paste your AI-filled JSON here..."
                    value={inputJson}
                    onChange={(e) => handleJsonPaste(e.target.value)}
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Analysis Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'input' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('input')}
                  className="w-full justify-start"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Data Input
                </Button>
                <Button
                  variant={activeTab === 'data' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('data')}
                  className="w-full justify-start"
                  disabled={!jsonData}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Datapoints & Assumptions
                </Button>
                <Button
                  variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('analysis')}
                  className="w-full justify-start"
                  disabled={!jsonData}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Business case analysis
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeTab === 'input' && (
              <Card className="bg-gradient-card shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle>JSON Template & Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">How to Use This Tool:</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        <li>Copy the JSON template using the button above</li>
                        <li>Use any AI tool (GPT, Claude, etc.) to fill in the template with your business case data</li>
                        <li>Paste the completed JSON back into the textarea</li>
                        <li>The tool will validate and analyze your business case automatically</li>
                      </ol>
                    </div>
                    <pre className="bg-card border rounded-lg p-4 text-xs overflow-auto max-h-96">
                      <code>{JSONTemplate}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'data' && jsonData && (
              <div className="animate-fade-in">
                <DatapointsViewer data={jsonData} />
              </div>
            )}

            {activeTab === 'analysis' && jsonData && (
              <div className="animate-fade-in">
                <BusinessCaseAnalysis data={jsonData} />
              </div>
            )}

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