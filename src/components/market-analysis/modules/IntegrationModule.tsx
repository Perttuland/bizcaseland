import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Send, BarChart3 } from 'lucide-react';
import { MarketToBusinessTransfer } from '@/components/shared/CrossToolDataTransfer';
import { useDataManager } from '@/contexts/DataManagerContext';
import { MarketData } from '@/lib/market-calculations';

interface MarketAnalysisIntegrationPanelProps {
  marketData: MarketData;
  onUpdateMarketData: (data: MarketData) => void;
}

/**
 * Integration panel to be added to the Market Analysis Suite
 * Shows cross-tool integration opportunities and status
 */
export function MarketAnalysisIntegrationPanel({ 
  marketData, 
  onUpdateMarketData 
}: MarketAnalysisIntegrationPanelProps) {
  const { currentProject, validateDataConsistency } = useDataManager();
  
  const validationResults = validateDataConsistency();
  const hasBusinessCase = !!currentProject?.businessData;
  
  // Check if market analysis is complete enough for transfer
  const isMarketAnalysisComplete = !!(
    marketData.market_sizing?.total_addressable_market?.base_value?.value &&
    marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value &&
    marketData.market_share?.target_position?.target_share?.value
  );

  const volumeProjection = isMarketAnalysisComplete ? 
    (marketData.market_sizing!.total_addressable_market!.base_value!.value *
     (marketData.market_sizing!.serviceable_addressable_market!.percentage_of_tam!.value / 100) *
     (marketData.market_share!.target_position!.target_share!.value / 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* Integration Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cross-Tool Integration
          </CardTitle>
          <CardDescription>
            Connect your market analysis with business case planning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Current Project Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Current Project</p>
              <p className="font-semibold">{currentProject?.projectName || 'No project selected'}</p>
              <div className="flex gap-2">
                <Badge variant={currentProject?.marketData ? 'default' : 'secondary'}>
                  Market Analysis {currentProject?.marketData ? '✓' : '○'}
                </Badge>
                <Badge variant={hasBusinessCase ? 'default' : 'secondary'}>
                  Business Case {hasBusinessCase ? '✓' : '○'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Analysis Completeness</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {marketData.market_sizing?.total_addressable_market ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  }
                  <span className="text-sm">TAM Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  {marketData.market_sizing?.serviceable_addressable_market ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  }
                  <span className="text-sm">SAM Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  {marketData.market_share?.target_position ? 
                    <CheckCircle className="h-4 w-4 text-green-600" /> : 
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  }
                  <span className="text-sm">Market Share Strategy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Projection Summary */}
          {isMarketAnalysisComplete && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Market Analysis Complete</span>
              </div>
              <p className="text-sm text-green-700">
                Projected annual volume: <strong>{volumeProjection.toLocaleString()} units</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Ready to transfer to business case for financial modeling
              </p>
            </div>
          )}

          {/* Integration Warnings */}
          {validationResults.filter(r => r.category === 'crossTool').map((result, index) => (
            <Alert key={index} variant={result.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Integration Issue:</strong> {result.message}
                {result.suggestedAction && (
                  <span className="block mt-1 text-xs">
                    Suggestion: {result.suggestedAction}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ))}

          {/* Next Steps */}
          <div className="space-y-3">
            {!hasBusinessCase && isMarketAnalysisComplete && (
              <Alert>
                <Send className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready for Business Case:</strong> Your market analysis is complete. 
                  Create a business case to build financial projections based on these market insights.
                  <Button variant="link" className="p-0 h-auto ml-2">
                    Create Business Case →
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {!isMarketAnalysisComplete && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Complete Market Analysis:</strong> Finish TAM/SAM analysis and market share strategy 
                  to enable business case integration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Transfer Component */}
      {isMarketAnalysisComplete && (
        <MarketToBusinessTransfer
          marketData={marketData}
          onTransferComplete={(transferData) => {
            // Handle successful transfer
            console.log('Data transferred:', transferData);
            // Could show success message, navigate to business case, etc.
          }}
        />
      )}

      {/* Integration History */}
      {currentProject?.businessData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integration History</CardTitle>
            <CardDescription>
              Track data transfers and synchronization between tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* This would show actual transfer history */}
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="text-sm font-medium">Volume Projection Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    Transferred {volumeProjection.toLocaleString()} units to Customer Segment 1
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Transfer data to business case to see integration history
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Usage example: How to integrate this into MarketAnalysisSuite.tsx
 */
export function MarketAnalysisSuiteWithIntegration() {
  // ... existing market analysis state and logic
  // const [marketData, setMarketData] = useState<MarketData>(...);
  
  return (
    <div className="space-y-6">
      {/* Existing market analysis modules */}
      
      {/* Add the integration panel as a new tab or section */}
      {/* 
      <MarketAnalysisIntegrationPanel 
        marketData={marketData}
        onUpdateMarketData={setMarketData}
      />
      */}
    </div>
  );
}
