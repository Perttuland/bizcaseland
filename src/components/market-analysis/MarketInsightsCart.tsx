/**
 * MarketInsightsCart UI Component
 * 
 * Shopping cart interface for collecting market insights and transferring
 * them to business case analysis. Provides intuitive add/remove functionality
 * with visual feedback and batch operations.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Archive, 
  AlertTriangle,
  CheckCircle,
  Download,
  Package
} from 'lucide-react';

import { MarketInsightsCartService } from '@/lib/market-insights-cart-service';
import { 
  CartItem,
  CartState,
  TransferOperation,
  AnyMarketInsight
} from '@/lib/market-insights-cart';
import { MarketData } from '@/lib/market-calculations';

// ===== COMPONENT PROPS =====

interface MarketInsightsCartProps {
  /** Current market data to extract insights from */
  marketData?: MarketData;
  
  /** Callback when insights are transferred to business case */
  onTransferComplete?: (operation: TransferOperation) => void;
  
  /** Callback when cart state changes (for external state management) */
  onCartChange?: (state: CartState) => void;
  
  /** Custom class name for styling */
  className?: string;
  
  /** Whether to show detailed insight information */
  showDetails?: boolean;
  
  /** Maximum number of items allowed in cart */
  maxItems?: number;
}

// ===== INSIGHT DISPLAY COMPONENTS =====

interface InsightDisplayProps {
  insight: AnyMarketInsight;
  onRemove: () => void;
  showDetails: boolean;
}

const InsightDisplay: React.FC<InsightDisplayProps> = ({ 
  insight, 
  onRemove, 
  showDetails 
}) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'volume_projection': return <Package className="h-4 w-4" />;
      case 'market_sizing': return <Archive className="h-4 w-4" />;
      case 'customer_segment': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getInsightColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center space-x-3 flex-1">
        <div className="text-blue-600">
          {getInsightIcon(insight.type)}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{insight.title}</div>
          {showDetails && (
            <div className="text-xs text-gray-600 mt-1">
              {insight.description}
            </div>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {insight.type.replace('_', ' ')}
            </Badge>
            <Badge 
              className={`text-xs ${getInsightColor(insight.confidence.score)}`}
            >
              {Math.round(insight.confidence.score)}% confidence
            </Badge>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-red-600 hover:bg-red-50"
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ===== MARKET DATA INSIGHTS DISPLAY =====

interface MarketDataInsightsProps {
  marketData: MarketData;
  onAddToCart: (insight: AnyMarketInsight) => void;
  disabledInsights: Set<string>;
  showDetails: boolean;
}

const MarketDataInsights: React.FC<MarketDataInsightsProps> = ({
  marketData,
  onAddToCart,
  disabledInsights,
  showDetails
}) => {
  const cartService = useMemo(() => new MarketInsightsCartService(), []);
  const [availableInsights, setAvailableInsights] = useState<readonly AnyMarketInsight[]>([]);
  const [loading, setLoading] = useState(false);
  
  React.useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const insights = await cartService.extractInsightsFromMarket(marketData);
        setAvailableInsights(insights);
      } catch (error) {
        console.error('Failed to extract insights:', error);
        setAvailableInsights([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInsights();
  }, [marketData, cartService]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Extracting insights...</p>
      </div>
    );
  }

  if (availableInsights.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No insights available from current market data. Please ensure market data contains 
          market sizing, customer segments, or competitive information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">Available Market Insights</h4>
      {availableInsights.map((insight) => {
        const isDisabled = disabledInsights.has(insight.id);
        
        return (
          <div
            key={insight.id}
            className={`flex items-center justify-between p-3 border rounded-lg ${
              isDisabled ? 'bg-gray-100 opacity-50' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{insight.title}</div>
              {showDetails && (
                <div className="text-xs text-gray-600 mt-1">
                  {insight.description}
                </div>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {insight.type.replace('_', ' ')}
                </Badge>
                <Badge className="text-xs bg-blue-100 text-blue-800">
                  {Math.round(insight.confidence.score)}% confidence
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddToCart(insight)}
              disabled={isDisabled}
              className="text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

// ===== MAIN COMPONENT =====

export const MarketInsightsCart: React.FC<MarketInsightsCartProps> = ({
  marketData,
  onTransferComplete,
  onCartChange,
  className = '',
  showDetails = false,
  maxItems = 10
}) => {
  // ===== STATE =====
  
  const [cartService] = useState(() => new MarketInsightsCartService({
    maxCartItems: maxItems,
    autoValidation: false,
    persistenceEnabled: false
  }));
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferOperation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ===== COMPUTED VALUES =====
  
  const cartState = useMemo(() => cartService.getCartState(), [cartItems]);
  const disabledInsights = useMemo(() => {
    return new Set(cartItems.map(item => item.insight.id));
  }, [cartItems]);
  
  // Calculate summary stats
  const summary = useMemo(() => {
    const totalItems = cartItems.length;
    const highConfidenceCount = cartItems.filter(item => item.insight.confidence.score >= 80).length;
    const averageConfidence = totalItems > 0 
      ? cartItems.reduce((sum, item) => sum + item.insight.confidence.score, 0) / totalItems 
      : 0;
    
    return {
      totalItems,
      highConfidenceCount,
      averageConfidence
    };
  }, [cartItems]);

  // ===== EVENT HANDLERS =====
  
  const handleAddToCart = useCallback(async (insight: AnyMarketInsight) => {
    try {
      const success = await cartService.addInsight(insight);
      if (success) {
        const newState = cartService.getCartState();
        setCartItems(newState.items as CartItem[]);
        setError(null);
        
        // Notify parent of cart change
        onCartChange?.(newState);
      } else {
        setError('Failed to add item to cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to cart');
    }
  }, [cartService, onCartChange]);

  const handleRemoveFromCart = useCallback(async (insightId: string) => {
    try {
      const success = await cartService.removeInsight(insightId);
      if (success) {
        const newState = cartService.getCartState();
        setCartItems(newState.items as CartItem[]);
        setError(null);
        
        // Notify parent of cart change
        onCartChange?.(newState);
      } else {
        setError('Failed to remove item from cart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from cart');
    }
  }, [cartService, onCartChange]);

  const handleClearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
      const newState = cartService.getCartState();
      setCartItems(newState.items as CartItem[]);
      setTransferResult(null);
      setError(null);
      
      // Notify parent of cart change
      onCartChange?.(newState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  }, [cartService, onCartChange]);

  const handleTransferToBusinessCase = useCallback(async () => {
    if (cartItems.length === 0) {
      setError('Cart is empty. Add some insights before transferring.');
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      // Create transfer operation
      const operation = cartService.createTransferOperation(cartItems, {
        id: `transfer_${Date.now()}`,
        targetBusinessCaseId: 'current-business-case',
        transferType: 'bulk',
        options: {
          preserveExistingData: true,
          mergeStrategy: 'smart_merge',
          validateBeforeTransfer: true
        },
        metadata: {
          title: 'Market Insights Transfer',
          description: 'Transfer of market insights to business case analysis'
        }
      });

      setTransferResult(operation);
      
      // Clear cart after successful transfer
      await cartService.clearCart();
      const newState = cartService.getCartState();
      setCartItems(newState.items as CartItem[]);

      // Notify parent
      onTransferComplete?.(operation);
      onCartChange?.(newState);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  }, [cartItems, cartService, onTransferComplete, onCartChange]);

  // ===== RENDER =====

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Market Insights Selection */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5" />
              <span>Market Data Insights</span>
              <Badge variant="outline">
                {marketData.meta.title}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarketDataInsights
              marketData={marketData}
              onAddToCart={handleAddToCart}
              disabledInsights={disabledInsights}
              showDetails={showDetails}
            />
          </CardContent>
        </Card>
      )}

      {/* Shopping Cart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Market Insights Cart</span>
              <Badge variant="outline">
                {summary.totalItems} item{summary.totalItems !== 1 ? 's' : ''}
              </Badge>
            </div>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add market insights from the data above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, index) => (
                <InsightDisplay
                  key={item.insight.id}
                  insight={item.insight}
                  onRemove={() => handleRemoveFromCart(item.insight.id)}
                  showDetails={showDetails}
                />
              ))}
              
              {/* Cart Summary */}
              <div className="border-t pt-3 mt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total Insights:</span>
                  <span>{summary.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>High Confidence:</span>
                  <span>{summary.highConfidenceCount}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Average Confidence:</span>
                  <span>{Math.round(summary.averageConfidence * 100)}%</span>
                </div>
              </div>

              {/* Transfer Actions */}
              <div className="border-t pt-3 mt-4">
                <Button
                  onClick={handleTransferToBusinessCase}
                  disabled={isTransferring || cartItems.length === 0}
                  className="w-full"
                >
                  {isTransferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Transfer to Business Case
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transfer Success */}
      {transferResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully transferred {transferResult.items.length} insight{transferResult.items.length !== 1 ? 's' : ''} 
            to business case analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MarketInsightsCart;
