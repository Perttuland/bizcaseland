import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WorkingMarketToBusinessTransfer } from '@/components/shared';
import { MarketData } from '@/lib/market-calculations';

// Sample market data for testing the transfer functionality
const sampleMarketData: MarketData = {
  schema_version: "1.0",
  meta: {
    title: "SaaS Customer Service Platform Market Analysis",
    description: "Market analysis for AI-powered customer service platform",
    currency: "EUR",
    base_year: 2024,
    analysis_horizon_years: 5,
    created_date: "2024-09-12",
    analyst: "Market Research Team"
  },
  market_sizing: {
    total_addressable_market: {
      base_value: { 
        value: 2500000, 
        unit: "EUR", 
        rationale: "European SMB customer service software market, based on industry reports" 
      },
      growth_rate: { 
        value: 12, 
        unit: "percentage_per_year", 
        rationale: "AI-driven growth in customer service automation sector" 
      },
      market_definition: "Customer service software for European SMBs with 10-500 employees",
      data_sources: [
        "Gartner Customer Service BPO Market Report 2024",
        "IDC European Software Market Analysis 2024"
      ]
    },
    serviceable_addressable_market: {
      percentage_of_tam: { 
        value: 60, 
        unit: "percentage", 
        rationale: "Addressable portion considering our technical capabilities and market entry strategy" 
      },
      geographic_constraints: "Initially targeting Germany, Netherlands, and Nordics",
      regulatory_constraints: "GDPR compliance required for all customer data processing",
      capability_constraints: "Limited to companies needing multilingual support (English, German, Dutch)"
    },
    serviceable_obtainable_market: {
      percentage_of_sam: { 
        value: 30, 
        unit: "percentage", 
        rationale: "Realistic market penetration given competitive landscape and resource constraints" 
      },
      resource_constraints: "Limited by sales team capacity and implementation resources",
      competitive_barriers: "Established players like Zendesk and Salesforce Service Cloud",
      time_constraints: "5-year horizon for market penetration"
    }
  },
  market_share: {
    current_position: {
      current_share: { 
        value: 0, 
        unit: "percentage", 
        rationale: "New market entrant, no current market share" 
      },
      market_entry_date: "2025-01-01",
      current_revenue: { 
        value: 0, 
        unit: "EUR_per_year", 
        rationale: "Pre-launch phase" 
      }
    },
    target_position: {
      target_share: { 
        value: 8, 
        unit: "percentage", 
        rationale: "Ambitious but achievable target based on superior AI capabilities and customer success program" 
      },
      target_timeframe: { 
        value: 5, 
        unit: "years", 
        rationale: "5-year strategic planning horizon" 
      },
      penetration_strategy: "exponential",
      key_milestones: [
        { year: 1, milestone: "Initial market entry", target_share: 0.5, rationale: "Focus on early adopters" },
        { year: 2, milestone: "Product-market fit", target_share: 2, rationale: "Proven value proposition" },
        { year: 3, milestone: "Scale up phase", target_share: 4, rationale: "Expanded sales team" },
        { year: 5, milestone: "Market leader in niche", target_share: 8, rationale: "Established market presence" }
      ]
    }
  }
};

// Sample business data with customer segments for testing
const sampleBusinessSegments = [
  {
    id: "smb_tech",
    label: "SMB Tech Companies",
    rationale: "Technology companies with 10-100 employees needing advanced customer service"
  },
  {
    id: "retail_chains", 
    label: "Retail Chains",
    rationale: "Multi-location retail businesses requiring consistent customer service"
  },
  {
    id: "financial_services",
    label: "Financial Services",
    rationale: "Small financial service providers needing compliant customer communication"
  }
];

export function CrossToolIntegrationDemo() {
  const [transferResult, setTransferResult] = useState<{success: boolean; message: string} | null>(null);

  const handleTransferComplete = (result: {success: boolean; message: string}) => {
    setTransferResult(result);
    console.log('Transfer completed:', result);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Cross-Tool Integration Demo</h1>
        <p className="text-muted-foreground">
          First working implementation of Market Analysis → Business Case volume transfer
        </p>
      </div>

      {/* Market Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Market Analysis Data</CardTitle>
          <CardDescription>
            Using sample SaaS platform market analysis for demonstration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">TAM</p>
              <p className="text-2xl font-bold">€2.5M</p>
              <p className="text-xs text-muted-foreground">Total Addressable Market</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">SAM</p>
              <p className="text-2xl font-bold">60%</p>
              <p className="text-xs text-muted-foreground">Serviceable Addressable</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">SOM</p>
              <p className="text-2xl font-bold">30%</p>
              <p className="text-xs text-muted-foreground">Serviceable Obtainable</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Target Share</p>
              <p className="text-2xl font-bold">8%</p>
              <p className="text-xs text-muted-foreground">5-year target</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Business Case Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Available Customer Segments</CardTitle>
          <CardDescription>
            Customer segments available for volume transfer (simulated business case data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleBusinessSegments.map(segment => (
              <div key={segment.id} className="p-3 border rounded-lg">
                <h4 className="font-medium">{segment.label}</h4>
                <p className="text-sm text-muted-foreground mt-1">{segment.rationale}</p>
                <Badge variant="outline" className="mt-2">Ready for transfer</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Result */}
      {transferResult && (
        <Card>
          <CardHeader>
            <CardTitle className={transferResult.success ? "text-green-600" : "text-red-600"}>
              Transfer {transferResult.success ? "Successful" : "Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{transferResult.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Working Transfer Component */}
      <WorkingMarketToBusinessTransfer 
        marketData={sampleMarketData}
        onTransferComplete={handleTransferComplete}
      />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Review the market data:</strong> Sample SaaS platform analysis with TAM of €2.5M</li>
            <li><strong>Adjust unit price:</strong> Change the assumed price per unit to see volume calculations update</li>
            <li><strong>Create business case:</strong> Click to create a sample business case project</li>
            <li><strong>Transfer volume:</strong> Select a customer segment and transfer the calculated volume</li>
            <li><strong>Add notes:</strong> Include context about your assumptions and methodology</li>
            <li><strong>Verify transfer:</strong> Check the business case tool to see the updated volume assumptions</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Expected Result:</strong> Market analysis volume (€2.5M × 60% × 30% × 8% ÷ unit price) 
              will be transferred to the selected customer segment with full traceability and source attribution.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
