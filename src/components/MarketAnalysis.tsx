import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Target } from 'lucide-react';

export function MarketAnalysis() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Market Analysis (Placeholder)</h1>
        <p className="text-muted-foreground">
          This tab currently serves as an informational placeholder. For the full, interactive market research experience, use the separate Market Analyzer tool.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">Placeholder — work in progress</span>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Target className="h-16 w-16 text-blue-600 mx-auto" />
            <h2 className="text-2xl font-bold text-blue-900">Market Analysis Tool</h2>
            <p className="text-blue-700 max-w-2xl mx-auto">
              We've separated market analysis from business case analysis to provide you with a more focused and comprehensive market research experience. The new Market Analyzer includes enhanced features for market sizing, competitive analysis, and volume projections.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-4xl mx-auto">
              <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">✨ Enhanced Features</h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Dedicated market data JSON template</li>
                  <li>• Advanced competitive landscape analysis</li>
                  <li>• Market opportunity scoring</li>
                  <li>• Volume projection exports</li>
                  <li>• Independent market research workflow</li>
                </ul>
              </div>
              
              <div className="bg-white/70 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">🎯 Use Cases</h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• Market size validation and research</li>
                  <li>• Competitive positioning analysis</li>
                  <li>• Volume projections for business cases</li>
                  <li>• Market entry strategy planning</li>
                  <li>• TAM/SAM/SOM modeling</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 text-amber-800 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Migration Note</span>
              </div>
              <p className="text-sm text-amber-700">
                This Market Analysis tab shows overview information only and is a placeholder for now.
                For full market research capabilities (market sizing, competitive analysis, volume exports), open the dedicated Market Analyzer and copy results into your business case as needed.
              </p>
            </div>
            
            <div className="pt-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Informative fallback until routing is added
                  alert('This tab is a placeholder. Please open the Market Analyzer (separate tool) for full market analysis features.');
                }}
              >
                <Target className="h-5 w-5 mr-2" />
                Open Market Analyzer (full tool)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Use the Separated Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">📊 Market Analyzer</h3>
              <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Define your Total Addressable Market (TAM)</li>
                <li>Calculate Serviceable Addressable/Obtainable Markets</li>
                <li>Analyze competitive landscape and positioning</li>
                <li>Set market share targets and penetration strategy</li>
                <li>Generate volume projections</li>
                <li>Export results for business case reference</li>
              </ol>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-700">💼 Business Case Analyzer</h3>
              <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Input volume figures based on market research</li>
                <li>Define pricing, costs, and operational assumptions</li>
                <li>Model cash flows and financial projections</li>
                <li>Run sensitivity analysis on key drivers</li>
                <li>Generate comprehensive business case reports</li>
                <li>Compare scenarios and validate assumptions</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-green-700">
              Start with market analysis to understand realistic volume ranges, then use those insights to 
              inform your business case volume assumptions. This separation allows for more accurate and 
              well-researched business cases.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}