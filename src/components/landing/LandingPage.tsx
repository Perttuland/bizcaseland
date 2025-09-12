import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Trophy,
  ArrowRight,
  FileText,
  PieChart,
  Lightbulb
} from 'lucide-react';

// Simple hook to check localStorage for existing data
function useDataStatus() {
  const [hasBusinessData, setHasBusinessData] = React.useState(false);
  const [hasMarketData, setHasMarketData] = React.useState(false);

  React.useEffect(() => {
    try {
      const businessData = localStorage.getItem('businessCaseData');
      const marketData = localStorage.getItem('bizcaseland_market_data');
      
      setHasBusinessData(!!businessData);
      setHasMarketData(!!marketData);
    } catch (error) {
      console.warn('Error checking localStorage:', error);
    }
  }, []);

  return { hasBusinessData, hasMarketData };
}

export function LandingPage() {
  const navigate = useNavigate();
  const { hasBusinessData, hasMarketData } = useDataStatus();

  const switchToBusinessMode = () => navigate('/business');
  const switchToMarketMode = () => navigate('/market');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Bizcaseland</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive business analysis platform combining market research intelligence 
            with financial modeling for data-driven decision making.
          </p>
        </div>

        {/* Main Choice Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Business Case Analysis Card */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 group-hover:from-blue-600/10 group-hover:to-indigo-600/10 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Calculator className="h-8 w-8 text-blue-600" />
                </div>
                {hasBusinessData && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Data Available
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">Business Case Analysis</CardTitle>
              <p className="text-gray-600">
                Build comprehensive financial models with cash flow projections, 
                sensitivity analysis, and ROI calculations for investment decisions.
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>Financial Modeling</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span>Cash Flow Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PieChart className="h-4 w-4 text-blue-500" />
                    <span>Sensitivity Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Scenario Planning</span>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Perfect for:</h4>
                  <p className="text-sm text-blue-700">
                    Investment decisions, project evaluation, pricing strategies, 
                    and financial planning with detailed assumptions and drivers.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={switchToBusinessMode}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-lg transition-all"
                size="lg"
              >
                {hasBusinessData ? 'Continue Business Analysis' : 'Start Business Case'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Market Analysis Card */}
          <Card className="relative overflow-hidden border-2 hover:border-green-500 transition-all duration-300 hover:shadow-xl group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/5 to-emerald-600/5 group-hover:from-green-600/10 group-hover:to-emerald-600/10 transition-all duration-300" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                {hasMarketData && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Data Available
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">Market Analysis</CardTitle>
              <p className="text-gray-600">
                Conduct comprehensive market research with TAM/SAM/SOM analysis, 
                competitive intelligence, and strategic market entry planning.
              </p>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>TAM/SAM/SOM</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-green-500" />
                    <span>Competitive Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-green-500" />
                    <span>Customer Segmentation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-green-500" />
                    <span>Strategic Planning</span>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-1">Perfect for:</h4>
                  <p className="text-sm text-green-700">
                    Market validation, competitive positioning, customer analysis, 
                    and strategic market entry planning with risk assessment.
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={switchToMarketMode}
                className="w-full bg-green-600 hover:bg-green-700 text-white group-hover:shadow-lg transition-all"
                size="lg"
              >
                {hasMarketData ? 'Continue Market Analysis' : 'Start Market Research'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Integration Message */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-purple-900 mb-2">Powerful Integration</h3>
            <p className="text-purple-700 mb-4">
              Start with market analysis to validate opportunities and size markets, 
              then use those insights to build detailed business cases with realistic volume projections.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-purple-600">
              <span>• Switch between tools anytime</span>
              <span>• Data is automatically saved</span>
              <span>• Export insights between tools</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {(hasBusinessData || hasMarketData) && (
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Analysis Progress</h3>
            <div className="flex items-center justify-center gap-8">
              {hasBusinessData && (
                <div className="flex items-center gap-2 text-green-600">
                  <Calculator className="h-5 w-5" />
                  <span className="font-medium">Business Case Ready</span>
                </div>
              )}
              {hasMarketData && (
                <div className="flex items-center gap-2 text-green-600">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Market Analysis Complete</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
