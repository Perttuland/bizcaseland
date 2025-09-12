import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts';
import { Lightbulb, Rocket, Clock, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketSuiteMetrics, StrategicOption, generateStrategicOptions } from '@/lib/market-suite-calculations';

interface StrategicPlanningModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const RISK_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export function StrategicPlanningModule({ marketData, onDataUpdate, metrics }: StrategicPlanningModuleProps) {
  // Generate strategic options
  const strategicOptions = useMemo(() => 
    generateStrategicOptions(marketData), 
    [marketData]
  );

  // Market entry timeline
  const entryTimeline = useMemo(() => {
    return strategicOptions.map((option, index) => ({
      ...option,
      color: COLORS[index % COLORS.length],
      roi: option.expectedReturn > 0 ? (option.expectedReturn / option.investmentRequired - 1) * 100 : 0
    }));
  }, [strategicOptions]);

  // Risk vs Return analysis
  const riskReturnData = useMemo(() => {
    return strategicOptions.map((option, index) => ({
      ...option,
      x: option.riskLevel === 'low' ? 20 : option.riskLevel === 'medium' ? 50 : 80, // Risk score
      y: option.expectedReturn / 1000000, // Return in millions
      size: option.probability,
      color: COLORS[index % COLORS.length]
    }));
  }, [strategicOptions]);

  // Key strategic drivers
  const penetrationDrivers = useMemo(() => {
    const drivers = marketData?.market_share?.penetration_drivers || [];
    return drivers.map(driver => ({
      ...driver,
      impactScore: driver.impact === 'high' ? 80 : driver.impact === 'medium' ? 50 : 20
    }));
  }, [marketData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold">Strategic Planning</h2>
        </div>
        <Badge variant="outline" className="bg-orange-50">
          Market Entry Strategy
        </Badge>
      </div>

      {/* Strategic metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Strategic Options</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {strategicOptions.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Available strategies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Fastest Entry</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {strategicOptions.length > 0 ? Math.min(...strategicOptions.map(o => o.timeToMarket)) : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Months to market
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Min. Investment</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {strategicOptions.length > 0 ? 
                `€${(Math.min(...strategicOptions.map(o => o.investmentRequired)) / 1000000).toFixed(1)}M` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Lowest investment option
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Best ROI</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {strategicOptions.length > 0 ? 
                `${Math.max(...entryTimeline.map(o => o.roi)).toFixed(0)}%` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              Highest return potential
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategic Options Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Strategic Options Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {strategicOptions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={entryTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'roi' ? `${value}%` : 
                      name === 'investmentRequired' ? `€${(value as number / 1000000).toFixed(1)}M` :
                      name === 'expectedReturn' ? `€${(value as number / 1000000).toFixed(1)}M` :
                      name === 'timeToMarket' ? `${value} months` :
                      name === 'probability' ? `${value}%` : value,
                      name === 'roi' ? 'ROI' :
                      name === 'investmentRequired' ? 'Investment' :
                      name === 'expectedReturn' ? 'Expected Return' :
                      name === 'timeToMarket' ? 'Time to Market' :
                      name === 'probability' ? 'Probability' : name
                    ]}
                  />
                  <Bar dataKey="roi" fill="#8884d8" name="ROI %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No strategic options generated</p>
                <p className="text-sm">Complete market analysis to generate strategies</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk vs Return Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Risk vs Return Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {strategicOptions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Risk Level"
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Expected Return"
                    domain={[0, 'dataMax + 1']}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-semibold">{data.name}</p>
                            <p>Risk: {data.riskLevel}</p>
                            <p>Return: €{(data.expectedReturn / 1000000).toFixed(1)}M</p>
                            <p>Probability: {data.probability}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Strategies" data={riskReturnData} fill="#8884d8">
                    {riskReturnData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No risk analysis available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penetration Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Market Penetration Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            {penetrationDrivers.length > 0 ? (
              <div className="space-y-4">
                {penetrationDrivers.map((driver, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{driver.driver}</span>
                      <Badge 
                        variant={driver.impact === 'high' ? 'default' : 
                                driver.impact === 'medium' ? 'secondary' : 'outline'}
                      >
                        {driver.impact} impact
                      </Badge>
                    </div>
                    <Progress value={driver.impactScore} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Timeline:</strong> {driver.timeline}</p>
                      <p>{driver.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No penetration drivers defined</p>
                <p className="text-sm">Add market penetration strategy</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategic Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Strategic Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            {marketData?.market_share?.target_position?.key_milestones ? (
              <div className="space-y-4">
                {marketData.market_share.target_position.key_milestones.map((milestone, index) => (
                  <div key={index} className="border-l-2 border-blue-500 pl-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Year {milestone.year}</h4>
                      <Badge variant="outline">{milestone.target_share}% market share</Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">{milestone.milestone}</p>
                    <p className="text-sm text-muted-foreground">{milestone.rationale}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No strategic milestones defined</p>
                <p className="text-sm">Set target milestones for market penetration</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Strategic Options */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Strategic Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {strategicOptions.map((option, index) => (
              <Card key={option.id} className="border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{option.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge 
                        variant={option.riskLevel === 'low' ? 'default' : 
                                option.riskLevel === 'medium' ? 'secondary' : 'destructive'}
                      >
                        {option.riskLevel} risk
                      </Badge>
                      <Badge variant="outline">
                        {option.probability}% probability
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium">Investment Required</h5>
                      <p className="text-muted-foreground">€{(option.investmentRequired / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Expected Return</h5>
                      <p className="text-muted-foreground">€{(option.expectedReturn / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Time to Market</h5>
                      <p className="text-muted-foreground">{option.timeToMarket} months</p>
                    </div>
                    <div>
                      <h5 className="font-medium">Strategic Fit</h5>
                      <div className="flex items-center gap-2">
                        <Progress value={option.strategicFit} className="flex-1 h-2" />
                        <span className="text-xs">{option.strategicFit}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">ROI Potential</h5>
                    <div className="text-lg font-bold text-green-600">
                      {option.expectedReturn > 0 ? 
                        `${((option.expectedReturn / option.investmentRequired - 1) * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Develop Strategy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {strategicOptions.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No strategic options available</p>
                <p className="text-sm">Complete market data to generate strategic options</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
