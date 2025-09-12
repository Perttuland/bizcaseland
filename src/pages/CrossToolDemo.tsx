/**
 * Enhanced Cross-Tool Integration Demo with Data Shopping Mode
 * 
 * This page demonstrates the sophisticated data shopping paradigm for gathering market data
 * to be used in business case analysis. Users can explore market data, add insights to cart,
 * and transfer them with intelligent validation and mapping.
 * 
 * Features:
 * - Data Shopping Mode with shopping cart paradigm
 * - Comprehensive market data extraction
 * - Real-time validation and transfer operations  
 * - Modification tracking with audit trails
 * - Rollback capabilities and business rules validation
 * - Integration with DataManagerContext for reactive updates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Database, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Package,
  TrendingUp
} from 'lucide-react';

import { DataShoppingMode } from '@/components/business-case/DataShoppingMode';
import { useDataManager } from '@/contexts/DataManagerContext';
import { 
  marketDataScenarios, 
  scenarioDescriptions,
  getScenarioTestData 
} from '@/lib/market-insights-test-data';
import { MarketData } from '@/lib/market-calculations';
import { TransferOperation } from '@/lib/data-shopping-types';

// ===== DEMO SCENARIOS =====

type ScenarioKey = keyof typeof marketDataScenarios;

const DEMO_SCENARIOS: { key: ScenarioKey; label: string; description: string }[] = [
  {
    key: 'saas',
    label: 'SaaS Platform',
    description: 'High-growth European customer service SaaS with comprehensive market data'
  },
  {
    key: 'iot',
    label: 'IoT Platform',
    description: 'Industrial IoT platform with sensor network market opportunities'
  },
  {
    key: 'fintech',
    label: 'FinTech Solution',
    description: 'Digital payment solution targeting European SMB market'
  },
  {
    key: 'healthcare',
    label: 'Healthcare AI',
    description: 'AI-powered diagnostic platform for healthcare providers'
  }
];

// ===== MAIN COMPONENT =====

export function CrossToolDemo() {
  // ===== STATE MANAGEMENT =====
  
  const { 
    currentProject,
    createProject,
    updateMarketData
  } = useDataManager();
  
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('saas');
  const [currentMarketData, setCurrentMarketData] = useState<MarketData>(marketDataScenarios.saas);
  const [transferHistory, setTransferHistory] = useState<TransferOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'overview' | 'shopping'>('shopping');

  // ===== SCENARIO MANAGEMENT =====
  
  const loadScenario = async (scenarioKey: ScenarioKey) => {
    setIsLoading(true);
    try {
      const scenarioData = marketDataScenarios[scenarioKey];
      setCurrentMarketData(scenarioData);
      setSelectedScenario(scenarioKey);
      
      // Update the market data in the data manager context
      if (currentProject) {
        await updateMarketData(currentProject.id, scenarioData);
      }
    } catch (error) {
      console.error('Failed to load scenario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TRANSFER HANDLING =====
  
  const handleTransferComplete = (operation: TransferOperation) => {
    setTransferHistory(prev => [operation, ...prev]);
    
    // Show success notification
    console.log('Transfer completed:', {
      operation: operation.id,
      items: operation.itemCount,
      target: operation.targetProject
    });
  };

  // ===== EFFECTS =====
  
  useEffect(() => {
    loadScenario(selectedScenario);
  }, [selectedScenario]);

  // ===== RENDER =====
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Data Shopping Mode placeholder</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Gather market data to be used in business case analysis. 
          Explore comprehensive market insights, add them to your shopping cart, 
          and transfer with intelligent validation and mapping.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex justify-center">
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as typeof activeMode)}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Data Shopping
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Market Data Scenarios
          </CardTitle>
          <CardDescription>
            Choose a market scenario to explore comprehensive data sets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_SCENARIOS.map((scenario) => (
              <Card 
                key={scenario.key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedScenario === scenario.key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => loadScenario(scenario.key)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{scenario.label}</h3>
                    {selectedScenario === scenario.key && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  {isLoading && selectedScenario === scenario.key && (
                    <div className="flex items-center gap-2 mt-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Loading...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeMode} className="space-y-6">
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Data Overview
              </CardTitle>
              <CardDescription>
                Current scenario: {DEMO_SCENARIOS.find(s => s.key === selectedScenario)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Market Size */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Market Size</h4>
                    <div className="space-y-1 text-sm">
                      <div>TAM: ${currentMarketData.marketSize?.total?.toLocaleString() || 'N/A'}</div>
                      <div>SAM: ${currentMarketData.marketSize?.addressable?.toLocaleString() || 'N/A'}</div>
                      <div>SOM: ${currentMarketData.marketSize?.serviceable?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Rates */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Growth Rates</h4>
                    <div className="space-y-1 text-sm">
                      <div>Historical: {((currentMarketData.growthRates?.historical || 0) * 100).toFixed(1)}%</div>
                      <div>Projected: {((currentMarketData.growthRates?.projected || 0) * 100).toFixed(1)}%</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Economics */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Customer Economics</h4>
                    <div className="space-y-1 text-sm">
                      <div>CAC: ${currentMarketData.customerEconomics?.acquisitionCost || 'N/A'}</div>
                      <div>LTV: ${currentMarketData.customerEconomics?.lifetimeValue || 'N/A'}</div>
                      <div>ARPU: ${currentMarketData.customerEconomics?.arpu || 'N/A'}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Competitors */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Competition</h4>
                    <div className="space-y-1 text-sm">
                      <div>Major Players: {currentMarketData.competitors?.major?.length || 0}</div>
                      <div>Market Share: Available</div>
                      <div>Pricing: Available</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data Quality Indicators */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Data Quality:</strong> High confidence market data with comprehensive coverage
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Coverage:</strong> Market size, customer economics, competitive landscape
                  </AlertDescription>
                </Alert>
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Ready for:</strong> Business case analysis and financial modeling
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Shopping Tab */}
        <TabsContent value="shopping" className="space-y-6">
          <DataShoppingMode
            marketData={currentMarketData}
            onTransferComplete={handleTransferComplete}
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Transfer History
            </CardTitle>
            <CardDescription>
              Recent data transfers to business case projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transferHistory.slice(0, 5).map((transfer, index) => (
                <div key={transfer.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Transfer to {transfer.targetProject}</h4>
                    <p className="text-sm text-muted-foreground">
                      {transfer.itemCount} items • {new Date(transfer.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={transfer.status === 'completed' ? 'default' : transfer.status === 'failed' ? 'destructive' : 'secondary'}>
                    {transfer.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Data Shopping Mode enables sophisticated market data collection for business case analysis.
          Select data points, manage modifications, and transfer with comprehensive validation.
        </p>
      </div>
    </div>
  );
}

export default CrossToolDemo;