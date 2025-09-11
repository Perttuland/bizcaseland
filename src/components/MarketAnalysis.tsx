import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, Users, Target, PieChart, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { useBusinessData } from '@/contexts/BusinessDataContext';
import { 
  calculateTAM, 
  calculateSAM, 
  calculateSOM, 
  calculateMarketShare,
  getMarketMetrics,
  getMarketPenetrationTrajectory,
  validateMarketAssumptions,
  formatCurrency,
  formatPercent
} from '@/lib/calculations';

export function MarketAnalysis() {
  const { data: businessData, updateAssumption } = useBusinessData();
  const [editMode, setEditMode] = useState(false);

  if (!businessData) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No Data Available</h3>
            <p className="text-muted-foreground">Please load business case data to view market analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currency = businessData.meta?.currency || 'EUR';
  const periods = businessData.meta?.periods || 60;
  
  // Calculate current market metrics
  const currentMetrics = useMemo(() => getMarketMetrics(businessData, 0), [businessData]);
  const year1Metrics = useMemo(() => getMarketMetrics(businessData, 12), [businessData]);
  const year3Metrics = useMemo(() => getMarketMetrics(businessData, 36), [businessData]);
  
  // Get market trajectory data
  const trajectoryData = useMemo(() => {
    return getMarketPenetrationTrajectory(businessData, Math.min(periods, 60));
  }, [businessData, periods]);

  // Validate market assumptions
  const validation = useMemo(() => validateMarketAssumptions(businessData), [businessData]);

  // Prepare competitive landscape data for pie chart
  const competitiveData = useMemo(() => {
    const ourShare = currentMetrics.competitivePosition.ourShare * 100;
    const competitors = currentMetrics.competitivePosition.competitorShares.map(comp => ({
      name: comp.name,
      value: comp.share * 100,
      positioning: comp.positioning
    }));
    
    const totalMapped = ourShare + competitors.reduce((sum, comp) => sum + comp.value, 0);
    const others = Math.max(0, 100 - totalMapped);
    
    const result = [
      { name: 'Our Company', value: ourShare, color: '#3b82f6' },
      ...competitors.map((comp, index) => ({
        ...comp,
        color: `hsl(${(index + 1) * 60}, 70%, 50%)`
      }))
    ];
    
    if (others > 0) {
      result.push({ name: 'Others', value: others, color: '#94a3b8' });
    }
    
    return result;
  }, [currentMetrics]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Header with Validation Status */}
      <Card className="bg-gradient-card shadow-elevation relative">
        <div className="absolute top-4 right-4 flex space-x-2">
          {validation.errors.length > 0 && (
            <Badge variant="destructive">
              {validation.errors.length} Errors
            </Badge>
          )}
          {validation.warnings.length > 0 && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              {validation.warnings.length} Warnings
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'View Mode' : 'Edit Mode'}
          </Button>
        </div>
        
        <CardHeader>
          <CardTitle className="text-xl pr-32">Market Analysis</CardTitle>
          <p className="text-muted-foreground">
            Total Addressable Market, competitive positioning, and market penetration strategy
          </p>
          {validation.errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-2">
              <h4 className="font-semibold text-destructive mb-1">Validation Errors:</h4>
              <ul className="text-sm text-destructive space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <h4 className="font-semibold text-yellow-800 mb-1">Warnings:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Key Market Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Addressable Market</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentMetrics.tam, currency)}
                </p>
                <p className="text-xs text-white/70">Year {currentMetrics.year}</p>
              </div>
              <Target className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Serviceable Obtainable Market</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(currentMetrics.som, currency)}
                </p>
                <p className="text-xs text-white/70">Realistic target market</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-card ${currentMetrics.marketShare > 0.1 ? 'bg-gradient-success' : 'bg-gradient-warning'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Current Market Share</p>
                <p className="text-2xl font-bold text-white">
                  {formatPercent(currentMetrics.marketShare)}
                </p>
                <p className="text-xs text-white/70">
                  Target: {formatPercent(year3Metrics.marketShare)} in Year 3
                </p>
              </div>
              <PieChart className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-info shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Market Concentration</p>
                <p className="text-2xl font-bold text-white">
                  {(currentMetrics.competitivePosition.marketConcentration * 100).toFixed(1)}
                </p>
                <p className="text-xs text-white/70">
                  {currentMetrics.competitivePosition.marketConcentration < 0.15 ? 'Competitive' : 
                   currentMetrics.competitivePosition.marketConcentration < 0.25 ? 'Moderately Concentrated' : 'Highly Concentrated'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Landscape</TabsTrigger>
          <TabsTrigger value="penetration">Market Penetration</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* TAM/SAM/SOM Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-financial-primary" />
                  <span>Market Size Evolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trajectoryData.slice(0, 36)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="year" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `${value / 1000000}M`}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value as number, currency), name]}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tam" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f680" 
                        name="TAM"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sam" 
                        stackId="2" 
                        stroke="#10b981" 
                        fill="#10b98180" 
                        name="SAM"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="som" 
                        stackId="3" 
                        stroke="#f59e0b" 
                        fill="#f59e0b80" 
                        name="SOM"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-financial-primary" />
                  <span>Market Share Growth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData.slice(0, 36)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="year" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${((value as number) * 100).toFixed(2)}%`, 'Market Share']}
                        labelFormatter={(label) => `Year ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="marketShare" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-financial-primary" />
                  <span>Market Share Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={competitiveData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {competitiveData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Market Share']}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-financial-primary" />
                  <span>Competitive Positioning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentMetrics.competitivePosition.competitorShares.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No competitor data available. Add competitors in the Assumptions tab.
                    </p>
                  ) : (
                    currentMetrics.competitivePosition.competitorShares.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{competitor.name}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.positioning}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPercent(competitor.share)}</p>
                          <p className="text-xs text-muted-foreground">Market Share</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="penetration" className="space-y-6">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-financial-primary" />
                <span>Market Penetration Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trajectoryData.slice(0, 36)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="year" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Market Share') {
                          return [`${((value as number) * 100).toFixed(2)}%`, name];
                        }
                        return [formatCurrency(value as number, currency), name];
                      }}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="marketValue" 
                      fill="#3b82f680" 
                      name="Market Value"
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="marketShare" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      name="Market Share"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Market Size Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* TAM Configuration */}
                <div className="space-y-2">
                  <Label>Total Addressable Market (TAM)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Base Value"
                      value={businessData?.assumptions?.market_analysis?.total_addressable_market?.base_value?.value || ''}
                      onChange={(e) => updateAssumption('assumptions.market_analysis.total_addressable_market.base_value.value', parseFloat(e.target.value) || 0)}
                      disabled={!editMode}
                    />
                    <Input
                      type="number"
                      placeholder="Growth Rate %"
                      value={((businessData?.assumptions?.market_analysis?.total_addressable_market?.growth_rate?.value || 0) * 100).toString()}
                      onChange={(e) => updateAssumption('assumptions.market_analysis.total_addressable_market.growth_rate.value', (parseFloat(e.target.value) || 0) / 100)}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                {/* SAM Configuration */}
                <div className="space-y-2">
                  <Label>Serviceable Addressable Market (% of TAM)</Label>
                  <Input
                    type="number"
                    placeholder="Percentage"
                    value={businessData?.assumptions?.market_analysis?.serviceable_addressable_market?.percentage_of_tam?.value || ''}
                    onChange={(e) => updateAssumption('assumptions.market_analysis.serviceable_addressable_market.percentage_of_tam.value', parseFloat(e.target.value) || 0)}
                    disabled={!editMode}
                  />
                </div>

                {/* SOM Configuration */}
                <div className="space-y-2">
                  <Label>Serviceable Obtainable Market (% of SAM)</Label>
                  <Input
                    type="number"
                    placeholder="Percentage"
                    value={businessData?.assumptions?.market_analysis?.serviceable_obtainable_market?.percentage_of_sam?.value || ''}
                    onChange={(e) => updateAssumption('assumptions.market_analysis.serviceable_obtainable_market.percentage_of_sam.value', parseFloat(e.target.value) || 0)}
                    disabled={!editMode}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle>Market Share Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Current Share (%)</Label>
                    <Input
                      type="number"
                      placeholder="Current"
                      value={businessData?.assumptions?.market_analysis?.market_share?.current_share?.value || ''}
                      onChange={(e) => updateAssumption('assumptions.market_analysis.market_share.current_share.value', parseFloat(e.target.value) || 0)}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Share (%)</Label>
                    <Input
                      type="number"
                      placeholder="Target"
                      value={businessData?.assumptions?.market_analysis?.market_share?.target_share?.value || ''}
                      onChange={(e) => updateAssumption('assumptions.market_analysis.market_share.target_share.value', parseFloat(e.target.value) || 0)}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Timeframe (Years)</Label>
                  <Input
                    type="number"
                    placeholder="Years"
                    value={businessData?.assumptions?.market_analysis?.market_share?.target_timeframe?.value || ''}
                    onChange={(e) => updateAssumption('assumptions.market_analysis.market_share.target_timeframe.value', parseFloat(e.target.value) || 0)}
                    disabled={!editMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Penetration Strategy</Label>
                  <Select
                    value={businessData?.assumptions?.market_analysis?.market_share?.penetration_strategy || 'linear'}
                    onValueChange={(value) => updateAssumption('assumptions.market_analysis.market_share.penetration_strategy', value)}
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear Growth</SelectItem>
                      <SelectItem value="exponential">Exponential Growth</SelectItem>
                      <SelectItem value="s_curve">S-Curve Growth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Average Customer Value (Annual)</Label>
                  <Input
                    type="number"
                    placeholder="Annual Customer Value"
                    value={businessData?.assumptions?.market_analysis?.avg_customer_value?.annual_value?.value || ''}
                    onChange={(e) => updateAssumption('assumptions.market_analysis.avg_customer_value.annual_value.value', parseFloat(e.target.value) || 0)}
                    disabled={!editMode}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
