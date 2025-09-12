import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Calculator, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  BarChart3, 
  TrendingUp, 
  Download, 
  Edit3, 
  RefreshCw, 
  Target, 
  ArrowLeft,
  FileText,
  PieChart,
  DollarSign,
  Activity,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { safeJSONParse, validateBusinessData } from '@/lib/utils/json-validation';
import { JSONTemplateComponent, downloadTemplate } from './JSONTemplateComponent';
import { FinancialAnalysis } from './FinancialAnalysis';
import { AssumptionsTab } from './AssumptionsTab';
import { CashFlowStatement } from './CashFlowStatement';
import { MarketAnalysis } from '../market-analysis/MarketAnalysis';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { useApp } from '@/contexts/AppContext';

export function BusinessCaseAnalyzer() {
  const { data: jsonData, updateData } = useBusinessData();
  const { syncDataFromStorage, clearAllData } = useApp();
  const [inputJson, setInputJson] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('data');
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sync data from localStorage when component mounts
  useEffect(() => {
    syncDataFromStorage();
  }, [syncDataFromStorage]);

  const moduleConfig = [
    {
      id: 'cashflow',
      title: 'Cash Flow',
      icon: TrendingUp,
      description: 'Cash flow projections and analysis',
      color: 'bg-purple-500'
    },
    {
      id: 'financial',
      title: 'Financial Analysis',
      icon: DollarSign,
      description: 'Revenue models and profitability',
      color: 'bg-green-500'
    },
    {
      id: 'assumptions',
      title: 'Assumptions',
      icon: Activity,
      description: 'Business assumptions and drivers',
      color: 'bg-orange-500'
    },
    {
      id: 'data',
      title: 'Data Management',
      icon: FileText,
      description: 'Import, export, and template tools',
      color: 'bg-gray-500'
    }
  ];

  const handleJsonPaste = (value: string) => {
    setInputJson(value);
    validateJson(value);
  };

  const validateJson = (value: string) => {
    if (!value.trim()) {
      setIsValidJson(null);
      return;
    }

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
        description: businessDataValidation.error || "Data validation failed.",
        variant: "destructive",
      });
      return;
    }

    updateData(parseResult.data as BusinessData);
    setHasUploadedData(true);
    setActiveTab('cashflow'); // Set to cash flow when data is loaded
    syncDataFromStorage(); // Sync with AppContext
    
    toast({
      title: "Data Loaded Successfully",
      description: "Business case data has been loaded and validated.",
      variant: "default",
    });
  };

  const exportData = () => {
    if (!jsonData) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-case-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Business case data exported successfully.",
      variant: "default",
    });
  };

  const ValidationBadge = () => {
    if (isValidJson === null) return null;
    return (
      <Badge variant={isValidJson ? "default" : "destructive"} className="ml-2">
        {isValidJson ? "Valid" : "Invalid"}
      </Badge>
    );
  };

  // Show data input screen if no data
  if (!jsonData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
              className="mr-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Business Case Analyzer</h1>
              <p className="text-muted-foreground">Professional financial analysis and validation tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/market')}
              className="hover:bg-green-50 hover:border-green-200"
            >
              <Target className="h-4 w-4 mr-1" />
              Switch to Market Analysis
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-red-50 hover:border-red-200 text-red-600"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all business case and market analysis data. 
                    This action cannot be undone. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      clearAllData();
                      toast({
                        title: "Data Reset",
                        description: "All data has been cleared successfully.",
                        variant: "default",
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reset All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Build comprehensive financial models with cash flow projections, sensitivity analysis, 
            and ROI calculations for data-driven investment decisions.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Get Started with Business Case Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {moduleConfig.slice(0, 4).map((module) => {
                const IconComponent = module.icon;
                return (
                  <div key={module.id} className="text-center p-4 border rounded-lg">
                    <div className={`${module.color} text-white p-3 rounded-full w-fit mx-auto mb-3`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold mb-2">{module.title}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <JSONTemplateComponent />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="json-input" className="text-sm font-medium">
                    Business Case JSON Data
                  </label>
                  <ValidationBadge />
                </div>
                <Textarea
                  id="json-input"
                  placeholder="Paste your business case JSON data here..."
                  value={inputJson}
                  onChange={(e) => handleJsonPaste(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={refreshData}
                  disabled={!isValidJson}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Load Business Case Data
                </Button>
                <Button variant="outline" onClick={() => setInputJson('')}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main analysis interface with tabs
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')}
            className="mr-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
          <Calculator className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Business Case Analyzer</h1>
            <p className="text-muted-foreground">
              {jsonData?.meta?.title || 'Untitled Business Case'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/market')}
            className="hover:bg-green-50 hover:border-green-200"
          >
            <Target className="h-4 w-4 mr-1" />
            Switch to Market Analysis
          </Button>
          <Badge variant="default" className="bg-green-500">
            Data Loaded
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:border-red-200 text-red-600"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all business case and market analysis data. 
                  This action cannot be undone. Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    clearAllData();
                    toast({
                      title: "Data Reset",
                      description: "All data has been cleared successfully.",
                      variant: "default",
                    });
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reset All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {moduleConfig.map((module) => {
            const IconComponent = module.icon;
            return (
              <TabsTrigger 
                key={module.id} 
                value={module.id}
                className="flex items-center gap-2 text-xs"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{module.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="cashflow" className="space-y-6">
          <CashFlowStatement />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialAnalysis />
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <AssumptionsTab />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <JSONTemplateComponent />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportData}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Current Data
                </Button>
              </div>

              <div className="space-y-2">
                <label htmlFor="json-update" className="text-sm font-medium">
                  Update Business Case Data
                </label>
                <Textarea
                  id="json-update"
                  placeholder="Paste updated JSON data here..."
                  value={inputJson}
                  onChange={(e) => handleJsonPaste(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <ValidationBadge />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={refreshData}
                  disabled={!isValidJson}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Update Data
                </Button>
                <Button variant="outline" onClick={() => setInputJson('')}>
                  Clear Input
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
