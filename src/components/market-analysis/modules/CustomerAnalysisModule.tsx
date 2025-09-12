import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { Users, Star, Target, TrendingUp } from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketSuiteMetrics, CustomerSegmentAnalysis, analyzeCustomerSegments } from '@/lib/market-suite-calculations';

interface CustomerAnalysisModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function CustomerAnalysisModule({ marketData, onDataUpdate, metrics }: CustomerAnalysisModuleProps) {
  // Analyze customer segments
  const segmentAnalysis = useMemo(() => 
    analyzeCustomerSegments(marketData), 
    [marketData]
  );

  // Customer economics data
  const customerEconomics = useMemo(() => {
    const economics = marketData?.customer_analysis?.customer_economics;
    if (!economics) return null;
    
    return {
      annualValue: economics.average_customer_value?.annual_value?.value || 0,
      lifetimeValue: economics.average_customer_value?.lifetime_value?.value || 0,
      acquisitionCost: economics.average_customer_value?.acquisition_cost?.value || 0,
      purchaseFrequency: economics.customer_behavior?.purchase_frequency?.value || 0,
      loyaltyRate: economics.customer_behavior?.loyalty_rate?.value || 0,
      referralRate: economics.customer_behavior?.referral_rate?.value || 0
    };
  }, [marketData]);

  // Segment attractiveness matrix
  const attractivenessMatrix = useMemo(() => {
    return segmentAnalysis.map((segment, index) => ({
      ...segment,
      color: COLORS[index % COLORS.length],
      x: segment.accessibility, // X-axis: Accessibility
      y: segment.attractiveness, // Y-axis: Attractiveness
      size: segment.size / 1000000 // Size for bubble chart
    }));
  }, [segmentAnalysis]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Customer Analysis</h2>
        </div>
        <Badge variant="outline" className="bg-purple-50">
          Segment Analysis
        </Badge>
      </div>

      {/* Customer metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Customer Segments</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {segmentAnalysis.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Identified segments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Avg. Customer Value</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {customerEconomics ? `€${(customerEconomics.annualValue / 1000).toFixed(0)}K` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Annual value per customer
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Customer LTV</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {customerEconomics ? `€${(customerEconomics.lifetimeValue / 1000).toFixed(0)}K` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Lifetime value
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Acquisition Cost</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {customerEconomics ? `€${(customerEconomics.acquisitionCost / 1000).toFixed(1)}K` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Cost to acquire
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Attractiveness Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Attractiveness Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {attractivenessMatrix.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Accessibility"
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Attractiveness"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-semibold">{data.name}</p>
                            <p>Attractiveness: {data.attractiveness.toFixed(0)}</p>
                            <p>Accessibility: {data.accessibility.toFixed(0)}</p>
                            <p>Size: {(data.size / 1000).toFixed(1)}K</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Segments" data={attractivenessMatrix} fill="#8884d8">
                    {attractivenessMatrix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No segment data available</p>
                <p className="text-sm">Add customer segments to see analysis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Segment Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>Segment Scoring Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="attractiveness" fill="#8884d8" name="Attractiveness" />
                  <Bar dataKey="accessibility" fill="#82ca9d" name="Accessibility" />
                  <Bar dataKey="defensibility" fill="#ffc658" name="Defensibility" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No scoring data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed segment analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Segment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {segmentAnalysis.map((segment, index) => (
              <Card key={segment.id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    <Badge 
                      variant={segment.attractiveness > 70 ? 'default' : 
                              segment.attractiveness > 40 ? 'secondary' : 'outline'}
                    >
                      {segment.attractiveness > 70 ? 'High Priority' : 
                       segment.attractiveness > 40 ? 'Medium Priority' : 'Low Priority'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h5 className="font-medium mb-1">Attractiveness</h5>
                      <Progress value={segment.attractiveness} className="h-2" />
                      <span className="text-xs text-muted-foreground">{segment.attractiveness.toFixed(0)}</span>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Accessibility</h5>
                      <Progress value={segment.accessibility} className="h-2" />
                      <span className="text-xs text-muted-foreground">{segment.accessibility.toFixed(0)}</span>
                    </div>
                    <div>
                      <h5 className="font-medium mb-1">Defensibility</h5>
                      <Progress value={segment.defensibility} className="h-2" />
                      <span className="text-xs text-muted-foreground">{segment.defensibility.toFixed(0)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium">Size</h5>
                      <p className="text-muted-foreground">{segment.size.toFixed(1)}% of market</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Growth Rate</h5>
                      <p className="text-muted-foreground">{segment.growthRate.toFixed(1)}% annually</p>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium">Competition Level</h5>
                    <Badge variant="outline" className="mt-1">
                      {segment.competitionLevel}
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="font-medium">Recommended Strategy</h5>
                    <p className="text-sm text-muted-foreground">{segment.recommendedStrategy}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {segmentAnalysis.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customer segments defined</p>
                <p className="text-sm">Add segment data to see detailed analysis</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer economics breakdown */}
      {customerEconomics && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Economics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Customer Value</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Annual Value</span>
                    <span className="font-medium">€{(customerEconomics.annualValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Lifetime Value</span>
                    <span className="font-medium">€{(customerEconomics.lifetimeValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Acquisition Cost</span>
                    <span className="font-medium">€{(customerEconomics.acquisitionCost / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Customer Behavior</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Purchase Frequency</span>
                    <span className="font-medium">{customerEconomics.purchaseFrequency.toFixed(1)}/year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Loyalty Rate</span>
                    <span className="font-medium">{customerEconomics.loyaltyRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Referral Rate</span>
                    <span className="font-medium">{customerEconomics.referralRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Key Ratios</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">LTV/CAC Ratio</span>
                    <span className="font-medium">
                      {customerEconomics.acquisitionCost > 0 ? 
                        (customerEconomics.lifetimeValue / customerEconomics.acquisitionCost).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Payback Period</span>
                    <span className="font-medium">
                      {customerEconomics.annualValue > 0 ? 
                        (customerEconomics.acquisitionCost / customerEconomics.annualValue * 12).toFixed(0) + ' months' : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
