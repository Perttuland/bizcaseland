import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, Target } from 'lucide-react';

interface BusinessData {
  meta: {
    title: string;
    description: string;
    archetype: string;
    currency: string;
    start_date: string;
    periods: number;
    frequency: string;
  };
  assumptions: any;
  structure: any;
  scenarios: any[];
}

interface FinancialAnalysisProps {
  data: BusinessData;
}

export function FinancialAnalysis({ data }: FinancialAnalysisProps) {
  // Mock financial calculations for demo
  const mockMetrics = {
    totalRevenue: 1250000,
    netProfit: 325000,
    npv: 2100000,
    paybackPeriod: 18,
    roa: 0.26,
    breakEvenMonth: 14
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.meta.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getArchetypeColor = (archetype: string) => {
    const colors = {
      subscription: 'bg-gradient-primary text-white',
      transactional: 'bg-gradient-success text-white',
      licensing: 'bg-financial-warning text-financial-warning-foreground',
      profit_share: 'bg-financial-danger text-financial-danger-foreground',
      hybrid: 'bg-gradient-card text-foreground'
    };
    return colors[archetype as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Business Case Overview */}
      <Card className="bg-gradient-card shadow-elevation">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{data.meta.title}</CardTitle>
            <Badge className={getArchetypeColor(data.meta.archetype)}>
              {data.meta.archetype}
            </Badge>
          </div>
          <p className="text-muted-foreground">{data.meta.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">{data.meta.start_date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <Target className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Time Horizon</p>
                <p className="font-semibold">{data.meta.periods} months</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="h-5 w-5 text-financial-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-semibold">{data.meta.currency}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-success shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-success-foreground/80">Total Revenue (5Y)</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(mockMetrics.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-primary shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-financial-primary-foreground/80">Net Profit (5Y)</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(mockMetrics.netProfit)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-card border-financial-warning border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Present Value</p>
                <p className="text-2xl font-bold text-financial-warning">{formatCurrency(mockMetrics.npv)}</p>
              </div>
              <Target className="h-8 w-8 text-financial-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-primary mb-2">{mockMetrics.paybackPeriod}</div>
              <div className="text-sm text-muted-foreground">Payback Period (months)</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-success mb-2">{formatPercent(mockMetrics.roa)}</div>
              <div className="text-sm text-muted-foreground">Return on Assets</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-financial-warning mb-2">{mockMetrics.breakEvenMonth}</div>
              <div className="text-sm text-muted-foreground">Break-even (months)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions Table */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Key Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.assumptions.pricing && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3 text-financial-primary">Pricing Assumptions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.assumptions.pricing).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium capitalize">{
                          key.replace(/_/g, ' ')
                            .replace(/\bcac\b/gi, 'Customer Acquisition Cost')
                            .replace(/\bltv\b/gi, 'Customer Lifetime Value')
                            .replace(/\barpu\b/gi, 'Average Revenue Per User')
                            .replace(/\bmrr\b/gi, 'Monthly Recurring Revenue')
                            .replace(/\barr\b/gi, 'Annual Recurring Revenue')
                            .replace(/\baov\b/gi, 'Average Order Value')
                            .replace(/\bchurn\b/gi, 'Customer Churn Rate')
                            .replace(/\bconversion\b/gi, 'Conversion Rate')
                            .replace(/\bctr\b/gi, 'Click Through Rate')
                            .replace(/\bcpm\b/gi, 'Cost Per Thousand Impressions')
                            .replace(/\bcpc\b/gi, 'Cost Per Click')
                            .replace(/\bcpa\b/gi, 'Cost Per Acquisition')
                            .replace(/\broas\b/gi, 'Return on Ad Spend')
                            .replace(/\broi\b/gi, 'Return on Investment')
                            .replace(/\b\w/g, l => l.toUpperCase())
                        }</span>
                        <Badge variant="outline">{value.unit}</Badge>
                      </div>
                      <p className="text-lg font-semibold">{value.value}</p>
                      <p className="text-xs text-muted-foreground">{value.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.assumptions.unit_economics && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3 text-financial-primary">Unit Economics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.assumptions.unit_economics).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium capitalize">{
                          key.replace(/_/g, ' ')
                            .replace(/\bcac\b/gi, 'Customer Acquisition Cost')
                            .replace(/\bltv\b/gi, 'Customer Lifetime Value')
                            .replace(/\barpu\b/gi, 'Average Revenue Per User')
                            .replace(/\bmrr\b/gi, 'Monthly Recurring Revenue')
                            .replace(/\barr\b/gi, 'Annual Recurring Revenue')
                            .replace(/\baov\b/gi, 'Average Order Value')
                            .replace(/\bchurn\b/gi, 'Customer Churn Rate')
                            .replace(/\bconversion\b/gi, 'Conversion Rate')
                            .replace(/\bctr\b/gi, 'Click Through Rate')
                            .replace(/\bcpm\b/gi, 'Cost Per Thousand Impressions')
                            .replace(/\bcpc\b/gi, 'Cost Per Click')
                            .replace(/\bcpa\b/gi, 'Cost Per Acquisition')
                            .replace(/\broas\b/gi, 'Return on Ad Spend')
                            .replace(/\broi\b/gi, 'Return on Investment')
                            .replace(/\bcogs\b/gi, 'Cost of Goods Sold')
                            .replace(/\bgross.margin\b/gi, 'Gross Profit Margin')
                            .replace(/\bnet.margin\b/gi, 'Net Profit Margin')
                            .replace(/\b\w/g, l => l.toUpperCase())
                        }</span>
                        <Badge variant="outline">{value.unit}</Badge>
                      </div>
                      <p className="text-lg font-semibold">{value.value}</p>
                      <p className="text-xs text-muted-foreground">{value.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      {data.scenarios && data.scenarios.length > 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Scenarios Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.scenarios.map((scenario, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg text-center">
                  <h4 className="font-semibold mb-2">{scenario.name}</h4>
                  <div className="text-2xl font-bold text-financial-primary mb-1">
                    {formatCurrency(mockMetrics.totalRevenue * (1 + index * 0.1 - 0.1))}
                  </div>
                  <p className="text-xs text-muted-foreground">Projected Revenue</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}