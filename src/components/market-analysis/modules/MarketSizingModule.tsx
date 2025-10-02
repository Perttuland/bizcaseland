import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Target, TrendingUp, DollarSign, Users } from 'lucide-react';

import { MarketData, formatMarketCurrency, formatMarketPercent } from '@/lib/market-calculations';
import { MarketSuiteMetrics } from '@/lib/market-suite-calculations';
import { ModuleDataTools } from './ModuleDataTools';
import { ValueWithRationale } from '../ValueWithRationale';

interface MarketSizingModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function MarketSizingModule({ marketData, onDataUpdate, metrics }: MarketSizingModuleProps) {
  // Calculate TAM/SAM/SOM progression
  const marketSizingData = useMemo(() => {
    const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const samPercentage = (marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100;
    const somPercentage = (marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100;
    
    const sam = tam * samPercentage;
    const som = sam * somPercentage;
    
    return [
      { name: 'TAM', value: tam, percentage: 100, color: '#0088FE' },
      { name: 'SAM', value: sam, percentage: samPercentage * 100, color: '#00C49F' },
      { name: 'SOM', value: som, percentage: somPercentage * samPercentage * 100, color: '#FFBB28' }
    ];
  }, [marketData]);

  // Market growth projection
  const growthProjection = useMemo(() => {
    const baseYear = marketData?.meta?.base_year || 2024;
    const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const growthRate = marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0;
    
    return Array.from({ length: 6 }, (_, i) => ({
      year: baseYear + i,
      tam: tam * Math.pow(1 + growthRate / 100, i),
      sam: tam * Math.pow(1 + growthRate / 100, i) * ((marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100),
      som: tam * Math.pow(1 + growthRate / 100, i) * ((marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0) / 100) * ((marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0) / 100)
    }));
  }, [marketData]);

  // Segment breakdown
  const segmentData = useMemo(() => {
    const segments = marketData?.customer_analysis?.market_segments || [];
    const tam = marketData?.market_sizing?.total_addressable_market?.base_value?.value || 0;
    
    return segments.map((segment, index) => ({
      name: segment.name,
      size: (segment.size_percentage?.value || 0) / 100 * tam,
      percentage: segment.size_percentage?.value || 0,
      growth: segment.growth_rate?.value || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [marketData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Market Sizing Analysis</h2>
      </div>

      {/* Module Data Tools */}
      <ModuleDataTools
        moduleName="Market Sizing"
        moduleKey="market_sizing"
        marketData={marketData}
        onDataUpdate={onDataUpdate}
      />

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Addressable Market</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData[0]?.value || 0)}
                rationale={marketData?.market_sizing?.total_addressable_market?.base_value?.rationale}
                link={marketData?.market_sizing?.total_addressable_market?.base_value?.link}
                label="TAM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              100% of market opportunity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Serviceable Available Market</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData[1]?.value || 0)}
                rationale={marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.rationale}
                label="SAM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <ValueWithRationale
                value={`${marketSizingData[1]?.percentage.toFixed(1)}%`}
                rationale={marketData?.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.rationale}
                label="SAM % of TAM"
                inline
              /> of TAM
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Serviceable Obtainable Market</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              <ValueWithRationale
                value={formatMarketCurrency(marketSizingData[2]?.value || 0)}
                rationale={marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.rationale}
                label="SOM"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <ValueWithRationale
                value={`${marketSizingData[2]?.percentage.toFixed(1)}%`}
                rationale={marketData?.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.rationale}
                label="SOM % of TAM"
                inline
              /> of TAM
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Market Growth Rate</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              <ValueWithRationale
                value={`${(marketData?.market_sizing?.total_addressable_market?.growth_rate?.value || 0).toFixed(1)}%`}
                rationale={marketData?.market_sizing?.total_addressable_market?.growth_rate?.rationale}
                label="Growth Rate"
                inline
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Annual compound growth
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TAM/SAM/SOM Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Market Opportunity Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {marketSizingData.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatMarketCurrency(item.value)}
                    </span>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-3"
                    style={{ 
                      '--progress-foreground': item.color 
                    } as React.CSSProperties}
                  />
                  <div className="text-xs text-muted-foreground">
                    {item.percentage.toFixed(1)}% of total opportunity
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Size Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Market Size Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marketSizingData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {marketSizingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMarketCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Projection */}
        <Card>
          <CardHeader>
            <CardTitle>Market Growth Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthProjection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatMarketCurrency(value)} />
                <Tooltip formatter={(value) => formatMarketCurrency(value as number)} />
                <Area type="monotone" dataKey="tam" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} name="TAM" />
                <Area type="monotone" dataKey="sam" stackId="2" stroke="#00C49F" fill="#00C49F" fillOpacity={0.8} name="SAM" />
                <Area type="monotone" dataKey="som" stackId="3" stroke="#FFBB28" fill="#FFBB28" fillOpacity={1} name="SOM" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Segment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatMarketCurrency(value)} />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatMarketCurrency(value as number),
                      'Market Size'
                    ]}
                    labelFormatter={(label) => `Segment: ${label}`}
                  />
                  <Bar dataKey="size" fill="#8884d8">
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customer segments defined</p>
                <p className="text-sm">Add segment data to see breakdown analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market definition and constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Definition & Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Market Definition</h4>
              <p className="text-sm text-muted-foreground">
                {marketData?.market_sizing?.total_addressable_market?.market_definition || 'No market definition provided'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Data Sources</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {marketData?.market_sizing?.total_addressable_market?.data_sources?.map((source, index) => (
                  <li key={index}>• {source}</li>
                )) || [<li key="0">No data sources specified</li>]}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Constraints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Geographic Constraints</h4>
              <p className="text-sm text-muted-foreground">
                {marketData?.market_sizing?.serviceable_addressable_market?.geographic_constraints || 'No constraints specified'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Regulatory Constraints</h4>
              <p className="text-sm text-muted-foreground">
                {marketData?.market_sizing?.serviceable_addressable_market?.regulatory_constraints || 'No constraints specified'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Capability Constraints</h4>
              <p className="text-sm text-muted-foreground">
                {marketData?.market_sizing?.serviceable_addressable_market?.capability_constraints || 'No constraints specified'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
