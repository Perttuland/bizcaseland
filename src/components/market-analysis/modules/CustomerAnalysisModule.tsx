import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { Users, DollarSign } from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketSuiteMetrics } from '@/lib/market-suite-calculations';
import { ModuleDataTools } from './ModuleDataTools';
import { ValueWithRationale } from '../ValueWithRationale';

interface CustomerAnalysisModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function CustomerAnalysisModule({ marketData, onDataUpdate, metrics }: CustomerAnalysisModuleProps) {
  const segments = marketData?.customer_analysis?.market_segments || [];
  const currency = marketData?.meta?.currency || 'EUR';

  const segmentValueData = useMemo(() => {
    return segments.map((segment, index) => ({
      name: segment.name,
      value: segment.size_value?.value || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [segments]);

  const marketSplitData = useMemo(() => {
    return segments.map((segment, index) => ({
      name: segment.name,
      value: segment.size_percentage?.value || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [segments]);

  const totalMarketSize = useMemo(() => {
    return segments.reduce((sum, seg) => sum + (seg.size_value?.value || 0), 0);
  }, [segments]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `€${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Customer Analysis</h2>
      </div>

      <ModuleDataTools
        moduleName="Customer Analysis"
        moduleKey="customer_analysis"
        marketData={marketData}
        onDataUpdate={onDataUpdate}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Total Market Size</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalMarketSize)}
          </div>
          <div className="text-sm text-muted-foreground">
            Combined value across all segments
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Segment Size (Market Value)</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentValueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentValueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="value" name="Market Value">
                    {segmentValueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No segment value data available</p>
                <p className="text-sm">Add size_value to segments to see chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Split by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            {marketSplitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={marketSplitData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                  >
                    {marketSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No market split data available</p>
                <p className="text-sm">Add segments to see distribution</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length > 0 ? (
            <div className="space-y-6">
              {segments.map((segment, index) => (
                <Card key={segment.id} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Size: <ValueWithRationale
                            value={formatCurrency(segment.size_value?.value || 0)}
                            rationale={segment.size_value?.rationale}
                            link={segment.size_value?.link}
                            inline
                          /></span>
                          <span>Growth: <ValueWithRationale
                            value={`${segment.growth_rate?.value || 0}%`}
                            rationale={segment.growth_rate?.rationale}
                            link={segment.growth_rate?.link}
                            inline
                          /> annually</span>
                          <span>Share: <ValueWithRationale
                            value={`${segment.size_percentage?.value || 0}%`}
                            rationale={segment.size_percentage?.rationale}
                            link={segment.size_percentage?.link}
                            inline
                          /> of market</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: `${COLORS[index % COLORS.length]}15`,
                          borderColor: COLORS[index % COLORS.length]
                        }}
                      >
                        Segment {index + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {segment.demographics && (
                      <div>
                        <h5 className="font-semibold mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Demographics
                        </h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {segment.demographics}
                        </p>
                      </div>
                    )}

                    {segment.pain_points && (
                      <div>
                        <h5 className="font-semibold mb-2">Pain Points & Unmet Needs</h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {segment.pain_points}
                        </p>
                      </div>
                    )}

                    {segment.customer_profile && (
                      <div>
                        <h5 className="font-semibold mb-2">Customer Profile</h5>
                        <p className="text-sm text-muted-foreground">
                          {segment.customer_profile}
                        </p>
                      </div>
                    )}

                    {segment.value_drivers && segment.value_drivers.length > 0 && (
                      <div>
                        <h5 className="font-semibold mb-2">Value Drivers</h5>
                        <div className="flex flex-wrap gap-2">
                          {segment.value_drivers.map((driver, idx) => (
                            <Badge key={idx} variant="secondary">
                              {driver}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {segment.entry_strategy && (
                      <div>
                        <h5 className="font-semibold mb-2">Entry Strategy</h5>
                        <p className="text-sm text-muted-foreground">
                          {segment.entry_strategy}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Customer Segments Defined</h3>
              <p className="text-sm mb-4">Add customer segments to understand your target market</p>
              <p className="text-xs">
                Use the template or import tools above to add segment data with demographics, pain points, and market value
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
