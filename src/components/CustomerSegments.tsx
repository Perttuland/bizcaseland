import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, TrendingUp, Info, Target, Calendar } from 'lucide-react';
import { BusinessData } from '@/contexts/BusinessDataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface CustomerSegmentsProps {
  data: BusinessData;
}

interface VolumeProjection {
  month: number;
  total: number;
  segments: Record<string, number>;
}

export function CustomerSegments({ data }: CustomerSegmentsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGrowthPatternDescription = (patternTypeOrSegment: string | any) => {
    // Handle direct pattern type string
    if (typeof patternTypeOrSegment === 'string') {
      switch (patternTypeOrSegment) {
        case 'geom_growth':
          return 'Geometric';
        case 'seasonal_growth':
          return 'Seasonal';
        case 'linear_growth':
          return 'Linear';
        default:
          return 'Custom';
      }
    }
    
    // Handle full segment object
    const segment = patternTypeOrSegment;
    if (!segment.volume) return 'No pattern';
    
    const { type, pattern_type } = segment.volume;
    
    if (type === 'pattern') {
      switch (pattern_type) {
        case 'geom_growth':
          return 'Geometric growth (compound monthly growth rate)';
        case 'seasonal_growth':
          return 'Seasonal pattern (yearly cycles with optional growth)';
        case 'linear_growth':
          return 'Linear growth (fixed monthly increase)';
        default:
          return 'Custom growth pattern';
      }
    } else if (type === 'time_series') {
      return 'Custom time series data';
    }
    
    return 'Growth pattern not specified';
  };

  // Calculate volume projections for visualization
  const calculateVolumeProjections = (): VolumeProjection[] => {
    const projections: VolumeProjection[] = [];
    const segments = data.assumptions?.customers?.segments || [];
    
    // Generate 60 months of projections
    for (let month = 1; month <= 60; month++) {
      const projection: VolumeProjection = {
        month,
        total: 0,
        segments: {}
      };

      segments.forEach((segment) => {
        let segmentVolume = 0;

        if (segment.volume?.type === 'time_series' && segment.volume.series) {
          // Use time series data if available
          const seriesData = segment.volume.series.find((s: any) => s.period === month);
          segmentVolume = seriesData?.value || 0;
        } else if (segment.volume?.type === 'pattern') {
          // Calculate based on pattern type
          const firstPeriod = segment.volume.series?.[0];
          const startValue = firstPeriod?.value || 0;
          
          switch (segment.volume.pattern_type) {
            case 'geom_growth':
              // For now, assume 5% monthly growth as example
              segmentVolume = startValue * Math.pow(1.05, month - 1);
              break;
            case 'linear_growth':
              // For now, assume 100 units monthly increase as example
              segmentVolume = startValue + (100 * (month - 1));
              break;
            case 'seasonal_growth':
              // Simple seasonal pattern - higher in certain months
              const seasonalMultiplier = 1 + 0.3 * Math.sin((month - 1) * Math.PI / 6);
              segmentVolume = startValue * seasonalMultiplier * Math.pow(1.02, Math.floor((month - 1) / 12));
              break;
            default:
              segmentVolume = startValue;
          }
        }

        projection.segments[segment.id] = Math.max(0, Math.round(segmentVolume));
        projection.total += projection.segments[segment.id];
      });

      projections.push(projection);
    }

    return projections;
  };

  const volumeProjections = calculateVolumeProjections();
  
  // Prepare chart data (show first 24 months)
  const chartData = volumeProjections.slice(0, 24).map(p => ({
    month: `M${p.month}`,
    total: p.total,
    ...p.segments
  }));

  const segments = data.assumptions?.customers?.segments || [];
  const totalStartVolume = segments.reduce((sum, segment) => {
    return sum + (segment.volume?.series?.[0]?.value || 0);
  }, 0);

  const totalYear5Volume = volumeProjections[59]?.total || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Customer Segments & Volume Projection</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build the demand side of your business case by defining customer segments and their volume growth patterns over time.
          </p>
        </CardHeader>
      </Card>

      {/* Volume Overview */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Volume Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/30 border-l-4 border-l-financial-primary">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-financial-primary" />
                  <h4 className="font-medium text-sm">Starting Volume (Month 1)</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {totalStartVolume.toLocaleString()} units
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  {segments.length} segment{segments.length !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-l-4 border-l-financial-secondary">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-financial-secondary" />
                  <h4 className="font-medium text-sm">Projected Volume (Year 5)</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {totalYear5Volume.toLocaleString()} units
                </div>
                <Badge variant="outline" className="text-xs mt-2">
                  {totalYear5Volume > 0 && totalStartVolume > 0 
                    ? `${((totalYear5Volume / totalStartVolume - 1) * 100).toFixed(0)}% growth`
                    : 'No growth data'
                  }
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-l-4 border-l-financial-accent">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-financial-accent" />
                  <h4 className="font-medium text-sm">Total Revenue Potential</h4>
                </div>
                <div className="text-2xl font-bold text-financial-success">
                  {formatCurrency(totalYear5Volume * (data.assumptions?.pricing?.avg_unit_price?.value || 0))}
                </div>
                <Badge variant="outline" className="text-xs mt-2">Annual (Year 5)</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Volume Growth Chart */}
          <div className="h-64 w-full">
            <h4 className="font-medium mb-4">24-Month Volume Projection</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: any, name: string) => [
                    `${Number(value).toLocaleString()} units`,
                    name === 'total' ? 'Total Volume' : `${name} segment`
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--financial-primary))" 
                  strokeWidth={3}
                  name="Total Volume"
                />
                {segments.map((segment, index) => (
                  <Line
                    key={segment.id}
                    type="monotone"
                    dataKey={segment.id}
                    stroke={`hsl(${200 + index * 30}, 70%, 50%)`}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name={segment.label}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments Details */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Customer Segments</span>
            <Badge variant="secondary">{segments.length} segments</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customer segments defined in the business data.</p>
              <p className="text-sm">Customer segments drive the volume side of your business case.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {segments.map((segment, index) => (
                <Card key={segment.id} className="bg-muted/30 border-l-4 border-l-financial-primary">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{segment.label}</h4>
                          <Badge variant="outline" className="mt-1">{getGrowthPatternDescription(segment.volume?.pattern_type)}</Badge>
                        </div>
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-sm">
                              <p className="text-xs">{segment.rationale}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Growth Pattern:</span>
                          <Badge variant="secondary" className="text-xs">
                            {getGrowthPatternDescription(segment)}
                          </Badge>
                        </div>

                        {segment.volume?.series?.[0] && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Starting Volume:</span>
                            <span className="font-medium">
                              {segment.volume.series[0].value?.toLocaleString() || 0} {segment.volume.series[0].unit}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">5-Year Projection:</span>
                          <span className="font-medium text-financial-success">
                            {(volumeProjections[59]?.segments[segment.id] || 0).toLocaleString()} units
                          </span>
                        </div>
                      </div>

                      {segment.volume?.series?.[0]?.rationale && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>Rationale:</strong> {segment.volume.series[0].rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}