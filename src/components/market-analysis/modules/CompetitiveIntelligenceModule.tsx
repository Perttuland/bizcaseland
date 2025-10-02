import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Trophy, Shield, Zap, AlertTriangle, Target } from 'lucide-react';

import { MarketData } from '@/lib/market-calculations';
import { MarketSuiteMetrics } from '@/lib/market-suite-calculations';
import { ModuleDataTools } from './ModuleDataTools';
import { ValueWithRationale } from '../ValueWithRationale';

interface CompetitiveIntelligenceModuleProps {
  marketData: MarketData;
  onDataUpdate: (data: MarketData) => void;
  metrics: MarketSuiteMetrics | null;
}

const THREAT_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b', 
  low: '#10b981'
};

export function CompetitiveIntelligenceModule({ marketData, onDataUpdate, metrics }: CompetitiveIntelligenceModuleProps) {
  // Competitive positioning matrix data
  const competitorPositioning = useMemo(() => {
    const competitors = marketData?.competitive_landscape?.competitors || [];
    
    return competitors.map((competitor, index) => {
      const marketShare = competitor.market_share?.value || 0;
      const threatLevel = competitor.threat_level === 'high' ? 80 : competitor.threat_level === 'medium' ? 50 : 20;
      const strengthScore = competitor.strengths?.length * 20 || 40;
      
      return {
        name: competitor.name,
        marketShare,
        competitiveStrength: Math.min(100, strengthScore),
        threatLevel: competitor.threat_level,
        x: marketShare, // X-axis: Market Share
        y: Math.min(100, strengthScore), // Y-axis: Competitive Strength
        color: THREAT_COLORS[competitor.threat_level as keyof typeof THREAT_COLORS]
      };
    });
  }, [marketData]);

  // Market structure analysis
  const marketStructure = useMemo(() => {
    const structure = marketData?.competitive_landscape?.market_structure;
    if (!structure) return null;
    
    const concentrationScore = structure.concentration_level === 'highly_concentrated' ? 80 : 
                              structure.concentration_level === 'moderately_concentrated' ? 50 : 20;
    const barrierScore = structure.barriers_to_entry === 'high' ? 80 : 
                        structure.barriers_to_entry === 'medium' ? 50 : 20;
    
    return {
      concentration: concentrationScore,
      barriers: barrierScore,
      competitorCount: marketData?.competitive_landscape?.competitors?.length || 0
    };
  }, [marketData]);

  // Competitive advantages radar
  const competitiveAdvantages = useMemo(() => {
    const advantages = marketData?.competitive_landscape?.competitive_advantages || [];
    
    // Create radar chart data
    const categories = [
      'Product Quality',
      'Technology',
      'Brand Strength',
      'Distribution',
      'Cost Position',
      'Customer Service'
    ];
    
    return categories.map(category => {
      // Simple mapping of advantages to categories
      const relevantAdvantages = advantages.filter(adv => 
        adv.advantage.toLowerCase().includes(category.toLowerCase().split(' ')[0])
      );
      
      const score = relevantAdvantages.length > 0 ? 
        relevantAdvantages.reduce((sum, adv) => {
          const sustainability = adv.sustainability === 'high' ? 100 : adv.sustainability === 'medium' ? 60 : 30;
          return sum + sustainability;
        }, 0) / relevantAdvantages.length : 30;
      
      return {
        category,
        value: Math.min(100, score),
        fullMark: 100
      };
    });
  }, [marketData]);

  // Threat assessment
  const threatAssessment = useMemo(() => {
    const competitors = marketData?.competitive_landscape?.competitors || [];
    
    const threats = competitors.map(competitor => ({
      name: competitor.name,
      marketShare: competitor.market_share?.value || 0,
      threatLevel: competitor.threat_level,
      threatScore: competitor.threat_level === 'high' ? 90 : competitor.threat_level === 'medium' ? 60 : 30,
      strengths: competitor.strengths?.length || 0,
      weaknesses: competitor.weaknesses?.length || 0
    }));
    
    return threats.sort((a, b) => b.threatScore - a.threatScore);
  }, [marketData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-red-600" />
        <h2 className="text-2xl font-bold">Competitive Intelligence</h2>
      </div>

      {/* Module Data Tools */}
      <ModuleDataTools
        moduleName="Competitive Intelligence"
        moduleKey="competitive_landscape"
        marketData={marketData}
        onDataUpdate={onDataUpdate}
      />

      {/* Key competitive metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Market Position</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.competitivePosition || 'Analyzing...'}
            </div>
            <div className="text-sm text-muted-foreground">
              Current positioning
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Competitors</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.competitorCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Active competitors
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Market Concentration</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {metrics ? (metrics.marketConcentration * 100).toFixed(0) : '--'}
            </div>
            <div className="text-sm text-muted-foreground">
              HHI index
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Entry Barriers</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {marketData?.competitive_landscape?.market_structure?.barriers_to_entry?.toUpperCase() || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              Market barriers
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competitive Positioning Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Competitive Positioning Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            {competitorPositioning.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Market Share"
                    unit="%" 
                    domain={[0, 'dataMax + 5']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Competitive Strength"
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
                            <p>Market Share: {data.marketShare}%</p>
                            <p>Strength: {data.competitiveStrength}</p>
                            <p>Threat: {data.threatLevel}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Competitors" data={competitorPositioning} fill="#8884d8">
                    {competitorPositioning.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No competitor data available</p>
                <p className="text-sm">Add competitor information to see positioning analysis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Competitive Advantages Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Competitive Advantages</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={competitiveAdvantages}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Advantage Strength"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Competitor Threat Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threatAssessment.map((threat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{threat.name}</span>
                    <Badge 
                      variant={threat.threatLevel === 'high' ? 'destructive' : 
                              threat.threatLevel === 'medium' ? 'default' : 'secondary'}
                    >
                      {threat.threatLevel} threat
                    </Badge>
                  </div>
                  <Progress 
                    value={threat.threatScore} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Market Share: {threat.marketShare}%</span>
                    <span>Strengths: {threat.strengths} | Weaknesses: {threat.weaknesses}</span>
                  </div>
                </div>
              ))}
              
              {threatAssessment.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No threat assessment data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Market Structure Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Concentration Level</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {marketData?.competitive_landscape?.market_structure?.concentration_level?.replace('_', ' ') || 'Not specified'}
                </Badge>
                {marketStructure && (
                  <Progress value={marketStructure.concentration} className="flex-1 h-2" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {marketData?.competitive_landscape?.market_structure?.concentration_rationale || 'No rationale provided'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Entry Barriers</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {marketData?.competitive_landscape?.market_structure?.barriers_to_entry || 'Not specified'}
                </Badge>
                {marketStructure && (
                  <Progress value={marketStructure.barriers} className="flex-1 h-2" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {marketData?.competitive_landscape?.market_structure?.barriers_description || 'No description provided'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Competitive Landscape</h4>
              <div className="text-sm text-muted-foreground">
                <p>• {marketStructure?.competitorCount || 0} active competitors identified</p>
                <p>• Market concentration score: {marketStructure ? marketStructure.concentration : 'N/A'}</p>
                <p>• Entry barrier level: {marketData?.competitive_landscape?.market_structure?.barriers_to_entry || 'Not assessed'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed competitor profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Competitor Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {marketData?.competitive_landscape?.competitors?.map((competitor, index) => (
              <Card key={index} className="border">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{competitor.name}</CardTitle>
                    <Badge 
                      variant={competitor.threat_level === 'high' ? 'destructive' : 
                              competitor.threat_level === 'medium' ? 'default' : 'secondary'}
                    >
                      {competitor.threat_level} threat
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Market Share: <ValueWithRationale
                      value={`${competitor.market_share?.value || 0}%`}
                      rationale={competitor.market_share?.rationale}
                      link={competitor.market_share?.link}
                      inline
                    />
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-1">Positioning</h5>
                    <p className="text-sm text-muted-foreground">{competitor.positioning}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Strengths</h5>
                    <ul className="text-sm text-muted-foreground">
                      {competitor.strengths?.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      )) || [<li key="0">No strengths listed</li>]}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Weaknesses</h5>
                    <ul className="text-sm text-muted-foreground">
                      {competitor.weaknesses?.map((weakness, idx) => (
                        <li key={idx}>• {weakness}</li>
                      )) || [<li key="0">No weaknesses listed</li>]}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Expected Response</h5>
                    <p className="text-sm text-muted-foreground">{competitor.competitive_response}</p>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No competitor profiles available</p>
                <p className="text-sm">Add competitor data to see detailed profiles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
