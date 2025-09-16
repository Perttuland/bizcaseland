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
import { useNavigate, useLocation } from 'react-router-dom';
import { safeJSONParse, validateBusinessData } from '@/lib/utils/json-validation';
import { JSONTemplateComponent, downloadTemplate } from './JSONTemplateComponent';
import { FinancialAnalysis } from './FinancialAnalysis';
import { AssumptionsTab } from './AssumptionsTab';
import { CashFlowStatement } from './CashFlowStatement';
import { useBusinessData, BusinessData } from '@/contexts/BusinessDataContext';
import { useApp } from '@/contexts/AppContext';
import { ThemeToggle } from '../shared/ThemeToggle';
import { BUSINESS_CASE_SAMPLE_DATA } from './SampleData';
import { ExampleBusinessCases } from './ExampleBusinessCases';

export function BusinessCaseAnalyzer() {
  const { data: jsonData, updateData } = useBusinessData();
  const { syncDataFromStorage, clearAllData } = useApp();
  const [inputJson, setInputJson] = useState('');
  const [isValidJson, setIsValidJson] = useState<boolean | null>(null);
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize activeTab - check for navigation state first, then default based on data
  const getInitialTab = () => {
    // Check if navigated from market analysis with specific tab request
    if (location.state?.initialTab) {
      return location.state.initialTab;
    }
    // Default behavior: show data tab if no data, cashflow if data exists
    return jsonData && Object.keys(jsonData).length > 0 ? 'cashflow' : 'data';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [shouldAutoSwitch, setShouldAutoSwitch] = useState(false);

  // Sync data from localStorage when component mounts
  useEffect(() => {
    syncDataFromStorage();
  }, [syncDataFromStorage]);

  // Handle navigation state changes (e.g., from market analysis switch button)
  useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
      // Clear the state immediately to prevent it from affecting future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.initialTab, navigate]);

  // Set initial tab based on data availability (runs after data is loaded)
  useEffect(() => {
    if (jsonData && Object.keys(jsonData).length > 0 && shouldAutoSwitch) {
      // Only auto-switch if currently on data tab
      if (activeTab === 'data') {
        setActiveTab('cashflow');
      }
      setShouldAutoSwitch(false);
    }
  }, [jsonData, shouldAutoSwitch]); // Only respond to data changes and auto-switch flag

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

  const handleSampleData = () => {
    const sampleJson = JSON.stringify(BUSINESS_CASE_SAMPLE_DATA, null, 2);
    setInputJson(sampleJson);
    validateJson(sampleJson);
    toast({
      title: "Sample Data Loaded",
      description: "Payroll automation sample data has been loaded successfully.",
      variant: "default",
    });
  };

  const loadExampleBusinessCase = async (fileName: string, title: string) => {
    try {
      const response = await fetch(`/sample-data/business-cases/${fileName}`);
      if (!response.ok) throw new Error('Failed to load example');
      
      const exampleData = await response.json();
      const exampleJson = JSON.stringify(exampleData, null, 2);
      
      setInputJson(exampleJson);
      validateJson(exampleJson);
      
      // Also update the data in the context to make it available for analysis
      const parseResult = safeJSONParse(exampleJson);
      if (parseResult.success) {
        const businessDataValidation = validateBusinessData(parseResult.data);
        if (businessDataValidation.success) {
          updateData(parseResult.data as BusinessData);
          setHasUploadedData(true);
          setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
          syncDataFromStorage(); // Sync with AppContext
        }
      }
      
      toast({
        title: "Example Loaded",
        description: `${title} example has been loaded successfully.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to Load Example",
        description: "Could not load the example business case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResetAllData = () => {
    clearAllData();
    // Also clear the BusinessDataContext state
    updateData(null);
    // Clear local state
    setInputJson('');
    setIsValidJson(null);
    setHasUploadedData(false);
    toast({
      title: "All Data Reset",
      description: "All business case and market analysis data has been cleared successfully.",
      variant: "default",
    });
  };

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
    setShouldAutoSwitch(true); // Signal that we should auto-switch after data load
    syncDataFromStorage(); // Sync with AppContext
    
    toast({
      title: "Data Loaded Successfully",
      description: "Business case data has been loaded and validated.",
      variant: "default",
    });
  };

  const loadSampleData = () => {
    const sampleBusinessData = {
      meta: {
        title: "Sample Software Project Business Case",
        description: "Example business case for a software project investment with detailed financial projections",
        business_model: "recurring",
        currency: "EUR",
        periods: 60,
        frequency: "monthly"
      },
      revenue_streams: {
        subscription_revenue: {
          pricing: {
            avg_unit_price: {
              value: 99,
              unit: "EUR_per_month",
              rationale: "Monthly subscription price based on market research"
            }
          },
          volume_drivers: {
            customers: {
              penetration: {
                strategy: "s_curve",
                max_penetration: {
                  value: 5000,
                  unit: "customers",
                  rationale: "Target market penetration over 5 years"
                },
                ramp_up_months: {
                  value: 36,
                  unit: "months",
                  rationale: "3-year ramp up to full market penetration"
                }
              }
            }
          }
        }
      },
      cost_structure: {
        fixed_costs: {
          salaries: {
            value: 50000,
            unit: "EUR_per_month",
            rationale: "Development and operations team salaries"
          },
          office_rent: {
            value: 3000,
            unit: "EUR_per_month",
            rationale: "Office space rental costs"
          },
          software_licenses: {
            value: 2000,
            unit: "EUR_per_month",
            rationale: "Development tools and infrastructure licenses"
          }
        },
        variable_costs: {
          customer_support: {
            value: 15,
            unit: "EUR_per_customer_per_month",
            rationale: "Customer support costs per customer"
          },
          hosting: {
            value: 8,
            unit: "EUR_per_customer_per_month",
            rationale: "Cloud hosting costs per customer"
          }
        }
      },
      investments: {
        initial_development: {
          value: 200000,
          unit: "EUR",
          rationale: "Initial software development investment",
          timing: "month_0"
        },
        marketing_campaign: {
          value: 50000,
          unit: "EUR",
          rationale: "Initial marketing and customer acquisition",
          timing: "month_0"
        }
      },
      assumptions: {
        growth: {
          monthly_churn_rate: {
            value: 2.5,
            unit: "percentage",
            rationale: "Expected monthly customer churn rate"
          }
        },
        financial: {
          discount_rate: {
            value: 10,
            unit: "percentage_per_year",
            rationale: "Company cost of capital for NPV calculations"
          },
          tax_rate: {
            value: 25,
            unit: "percentage",
            rationale: "Corporate tax rate"
          }
        }
      }
    };

    const jsonString = JSON.stringify(sampleBusinessData, null, 2);
    setInputJson(jsonString);
    validateJson(jsonString);
    
    toast({
      title: "Sample Data Loaded",
      description: "Sample business case data has been loaded. Click 'Update Data' to apply it.",
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
              <p className="text-muted-foreground">Build compelling financial projections and ROI calculations for any business project</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/market', { state: { initialTab: 'overview' } })}
              className="hover:bg-green-50 hover:border-green-200"
            >
              <Target className="h-4 w-4 mr-1" />
              Switch to Market Analysis
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you're launching a new product, evaluating cost savings, or planning market expansion - 
            create professional financial projections that help you make confident investment decisions.
          </p>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Get Started with Business Case Analysis
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Choose from ready-made examples below, or import your own business case data
            </p>
          </CardHeader>
          <CardContent>
            {/* Examples Section */}
            <div className="mb-8">
              <ExampleBusinessCases onLoadExample={loadExampleBusinessCase} />
            </div>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or import your own data
                </span>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium mb-2">Import Your Own Business Case</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  If you have your own business case data, you can paste it below or download a template to get started
                </p>
                
                {/* GenAI Workflow Explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">AI</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                        💡 Pro Tip: Use AI to Create Your Business Case
                      </h4>
                      <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                        <p>
                          <strong>Save time with AI assistance!</strong> Instead of creating business case data from scratch, 
                          you can use any AI chat tool (ChatGPT, Claude, Gemini, etc.) to help you:
                        </p>
                        <div className="pl-4 space-y-1">
                          <p>• <strong>Step 1:</strong> Download our template and describe your business idea to the AI</p>
                          <p>• <strong>Step 2:</strong> Ask the AI to fill in the template with realistic numbers and assumptions</p>
                          <p>• <strong>Step 3:</strong> Copy the AI-generated data and paste it here for instant analysis</p>
                        </div>
                        <p className="italic">
                          The template includes detailed instructions that guide AI tools to create comprehensive, 
                          realistic business case data tailored to your specific project.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-center mb-4">
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
                    Business Case Data
                  </label>
                  <ValidationBadge />
                </div>
                <Textarea
                  id="json-input"
                  placeholder="Paste your business case data here (this should be structured data from our template)..."
                  value={inputJson}
                  onChange={(e) => handleJsonPaste(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Use one of the examples above to see how the analysis works, then adapt it for your own project
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={refreshData}
                  disabled={!isValidJson}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Calculator className="h-4 w-4" />
                  Start Analysis
                </Button>
                <Button variant="outline" onClick={() => setInputJson('')} size="lg">
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
          <ThemeToggle />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-red-50 hover:border-red-200 text-red-600 dark:hover:bg-red-900 dark:hover:border-red-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Data
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
                  onClick={handleResetAllData}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reset All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/market', { state: { initialTab: 'overview' } })}
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
                  onClick={loadSampleData}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Load Sample Data
                </Button>
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
