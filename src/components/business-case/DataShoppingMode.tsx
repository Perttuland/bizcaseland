/**
 * Data Shopping Mode Component
 * 
 * Provides a sophisticated interface for gathering market data to be used in business case analysis.
 * Combines market analysis tools with shopping cart functionality for seamless data collection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Eye,
  Filter,
  Download
} from 'lucide-react';
import { dataShoppingService } from '@/lib/data-shopping-service';
import { MarketDataShoppingCart } from './MarketDataShoppingCart';
import type { 
  ShoppingCart as IShoppingCart, 
  DataShoppingItem, 
  TransferOperation,
  DataExtractionTarget,
  ValidationResult
} from '@/lib/data-shopping-types';

interface DataShoppingModeProps {
  marketData: any; // Market analysis data from existing context
  onTransferComplete?: (operation: TransferOperation) => void;
  className?: string;
}

interface MarketDataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  dataPoints: string[];
  extractionTargets: DataExtractionTarget[];
}

const MARKET_DATA_CATEGORIES: MarketDataCategory[] = [
  {
    id: 'market-size',
    name: 'Market Size & Growth',
    description: 'Total addressable market, growth rates, and market segmentation data',
    icon: TrendingUp,
    dataPoints: ['TAM', 'SAM', 'SOM', 'CAGR', 'Market Segments', 'Regional Data'],
    extractionTargets: [
      { path: 'marketSize.total', displayName: 'Total Market Size', confidence: 0.95 },
      { path: 'marketSize.addressable', displayName: 'Addressable Market', confidence: 0.90 },
      { path: 'marketSize.serviceable', displayName: 'Serviceable Market', confidence: 0.85 },
      { path: 'growthRates.historical', displayName: 'Historical Growth', confidence: 0.88 },
      { path: 'growthRates.projected', displayName: 'Projected Growth', confidence: 0.75 },
      { path: 'marketSegments', displayName: 'Market Segments', confidence: 0.92 }
    ]
  },
  {
    id: 'competitive-landscape',
    name: 'Competitive Landscape',
    description: 'Competitor analysis, market share, and competitive positioning',
    icon: Target,
    dataPoints: ['Competitors', 'Market Share', 'Pricing', 'Features', 'Positioning'],
    extractionTargets: [
      { path: 'competitors.major', displayName: 'Major Competitors', confidence: 0.93 },
      { path: 'competitors.marketShare', displayName: 'Market Share Data', confidence: 0.87 },
      { path: 'competitors.pricing', displayName: 'Competitive Pricing', confidence: 0.82 },
      { path: 'competitors.features', displayName: 'Feature Comparison', confidence: 0.78 },
      { path: 'competitors.positioning', displayName: 'Market Positioning', confidence: 0.80 }
    ]
  },
  {
    id: 'customer-economics',
    name: 'Customer Economics',
    description: 'Customer acquisition costs, lifetime value, and revenue metrics',
    icon: DollarSign,
    dataPoints: ['CAC', 'LTV', 'ARPU', 'Churn Rate', 'Revenue Models'],
    extractionTargets: [
      { path: 'customerEconomics.acquisitionCost', displayName: 'Customer Acquisition Cost', confidence: 0.91 },
      { path: 'customerEconomics.lifetimeValue', displayName: 'Customer Lifetime Value', confidence: 0.89 },
      { path: 'customerEconomics.arpu', displayName: 'Average Revenue Per User', confidence: 0.85 },
      { path: 'customerEconomics.churnRate', displayName: 'Customer Churn Rate', confidence: 0.88 },
      { path: 'customerEconomics.revenueModel', displayName: 'Revenue Model', confidence: 0.83 }
    ]
  },
  {
    id: 'customer-segments',
    name: 'Customer Segments',
    description: 'Target demographics, behavior patterns, and customer profiles',
    icon: Users,
    dataPoints: ['Demographics', 'Behavior', 'Preferences', 'Personas', 'Journey'],
    extractionTargets: [
      { path: 'customerSegments.demographics', displayName: 'Customer Demographics', confidence: 0.90 },
      { path: 'customerSegments.behavior', displayName: 'Behavior Patterns', confidence: 0.86 },
      { path: 'customerSegments.preferences', displayName: 'Customer Preferences', confidence: 0.82 },
      { path: 'customerSegments.personas', displayName: 'Customer Personas', confidence: 0.84 },
      { path: 'customerSegments.journey', displayName: 'Customer Journey', confidence: 0.79 }
    ]
  }
];

export function DataShoppingMode({ marketData, onTransferComplete, className }: DataShoppingModeProps) {
  const [activeCart, setActiveCart] = useState<IShoppingCart | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('market-size');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableData, setAvailableData] = useState<Map<string, any>>(new Map());
  const [cartItems, setCartItems] = useState<DataShoppingItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();

  // Initialize cart
  const initializeCart = useCallback(async () => {
    try {
      const cart = await dataShoppingService.createCart('market-data-shopping');
      setActiveCart(cart);
    } catch (error) {
      toast({
        title: 'Failed to initialize cart',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Extract market data for a specific category
  const extractCategoryData = useCallback(async (category: MarketDataCategory) => {
    if (!marketData || !activeCart) return;

    setIsExtracting(true);
    try {
      const extractedItems = await dataShoppingService.extractMarketData(
        marketData,
        category.extractionTargets,
        activeCart.id
      );
      
      toast({
        title: 'Data extracted',
        description: `Added ${extractedItems.length} items to cart from ${category.name}`,
      });
    } catch (error) {
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  }, [marketData, activeCart, toast]);

  // Add specific data point to cart
  const addDataPointToCart = useCallback(async (
    categoryId: string, 
    extractionTarget: DataExtractionTarget
  ) => {
    if (!marketData || !activeCart) return;

    try {
      const item = await dataShoppingService.addToCart(
        activeCart.id,
        extractionTarget.path,
        extractionTarget.displayName,
        marketData,
        'market-analysis'
      );
      
      toast({
        title: 'Added to cart',
        description: `${extractionTarget.displayName} added to shopping cart`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add item',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [marketData, activeCart, toast]);

  // Filter data points based on search
  const getFilteredDataPoints = useCallback((category: MarketDataCategory) => {
    if (!searchQuery.trim()) return category.extractionTargets;
    
    return category.extractionTargets.filter(target =>
      target.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.path.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Setup event listeners
  useEffect(() => {
    const unsubscribeCartChange = dataShoppingService.onCartChange((updatedCart) => {
      if (activeCart && updatedCart.id === activeCart.id) {
        setActiveCart(updatedCart);
        setCartItems(updatedCart.items);
      }
    });

    return () => {
      unsubscribeCartChange();
    };
  }, [activeCart]);

  // Initialize cart on mount
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // Load available data
  useEffect(() => {
    if (marketData) {
      const dataMap = new Map();
      MARKET_DATA_CATEGORIES.forEach(category => {
        category.extractionTargets.forEach(target => {
          const value = getNestedValue(marketData, target.path);
          if (value !== undefined) {
            dataMap.set(target.path, value);
          }
        });
      });
      setAvailableData(dataMap);
    }
  }, [marketData]);

  const selectedCategoryData = MARKET_DATA_CATEGORIES.find(cat => cat.id === selectedCategory);
  const filteredDataPoints = selectedCategoryData ? getFilteredDataPoints(selectedCategoryData) : [];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Data Selection Panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Market Data Shopping
            </CardTitle>
            <CardDescription>
              Select and gather market data for your business case analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search data points..."
                  className="pl-9"
                />
              </div>

              {/* Category Tabs */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  {MARKET_DATA_CATEGORIES.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <TabsTrigger key={category.id} value={category.id} className="text-xs">
                        <IconComponent className="h-4 w-4 mr-1" />
                        {category.name.split(' ')[0]}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {MARKET_DATA_CATEGORIES.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Button
                        onClick={() => extractCategoryData(category)}
                        disabled={isExtracting || !activeCart}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add All
                      </Button>
                    </div>

                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {filteredDataPoints.map((target) => {
                          const hasData = availableData.has(target.path);
                          const value = availableData.get(target.path);
                          
                          return (
                            <Card key={target.path} className={`cursor-pointer transition-colors ${
                              hasData ? 'hover:bg-muted/50' : 'opacity-50'
                            }`}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm">{target.displayName}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        {(target.confidence * 100).toFixed(0)}%
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{target.path}</p>
                                    {hasData && (
                                      <div className="text-xs mt-1 p-1 bg-muted rounded">
                                        <span className="font-medium">Preview:</span> {
                                          typeof value === 'object' 
                                            ? JSON.stringify(value).substring(0, 50) + '...'
                                            : String(value).substring(0, 50)
                                        }
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-3">
                                    {hasData ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addDataPointToCart(category.id, target)}
                                        disabled={!activeCart}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="ghost" disabled>
                                        <Eye className="h-3 w-3 text-muted-foreground" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Cart Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
              {cartItems.length > 0 && (
                <Badge variant="default">{cartItems.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCart ? (
              <MarketDataShoppingCart
                cartId={activeCart.id}
                onTransferComplete={onTransferComplete}
                onCartUpdate={setActiveCart}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                <p>Initializing cart...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                if (selectedCategoryData) {
                  extractCategoryData(selectedCategoryData);
                }
              }}
              disabled={isExtracting || !activeCart || !selectedCategoryData}
            >
              <Download className="h-4 w-4 mr-2" />
              Extract Current Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                Promise.all(
                  MARKET_DATA_CATEGORIES.map(category => extractCategoryData(category))
                );
              }}
              disabled={isExtracting || !activeCart}
            >
              <Download className="h-4 w-4 mr-2" />
              Extract All Categories
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export default DataShoppingMode;
