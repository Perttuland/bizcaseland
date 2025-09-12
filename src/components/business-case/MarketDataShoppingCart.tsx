/**
 * Market Data Shopping Cart Component
 * 
 * A comprehensive shopping cart interface for the data shopping workflow.
 * Integrates with DataShoppingService for real-time cart management and transfer operations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Trash2, 
  Edit3, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Undo2,
  AlertCircle
} from 'lucide-react';
import { dataShoppingService } from '@/lib/data-shopping-service';
import type { 
  ShoppingCart as IShoppingCart, 
  DataShoppingItem, 
  TransferOperation,
  ModificationAuditTrail,
  RollbackPoint,
  ValidationResult
} from '@/lib/data-shopping-types';

interface MarketDataShoppingCartProps {
  cartId: string;
  onTransferComplete?: (operation: TransferOperation) => void;
  onCartUpdate?: (cart: IShoppingCart) => void;
}

export function MarketDataShoppingCart({ cartId, onTransferComplete, onCartUpdate }: MarketDataShoppingCartProps) {
  const [cart, setCart] = useState<IShoppingCart | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [auditTrails, setAuditTrails] = useState<Map<string, ModificationAuditTrail>>(new Map());
  const [rollbackPoints, setRollbackPoints] = useState<Map<string, RollbackPoint[]>>(new Map());
  const [transferValidation, setTransferValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [targetProject, setTargetProject] = useState('');
  const { toast } = useToast();

  // Load cart data
  const loadCart = useCallback(async () => {
    try {
      const cartData = await dataShoppingService.getCart(cartId);
      if (cartData) {
        setCart(cartData);
        onCartUpdate?.(cartData);
      }
    } catch (error) {
      toast({
        title: 'Error loading cart',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [cartId, onCartUpdate, toast]);

  // Load audit trails for items
  const loadAuditTrails = useCallback(async () => {
    if (!cart) return;
    
    const trails = new Map<string, ModificationAuditTrail>();
    const rollbacks = new Map<string, RollbackPoint[]>();
    
    for (const item of cart.items) {
      try {
        const auditTrail = await dataShoppingService.getModificationHistory(cartId, item.id);
        const rollbackPoints = await dataShoppingService.getAvailableRollbackPoints(cartId, item.id);
        trails.set(item.id, auditTrail);
        rollbacks.set(item.id, rollbackPoints);
      } catch (error) {
        console.warn(`Failed to load audit trail for item ${item.id}:`, error);
      }
    }
    
    setAuditTrails(trails);
    setRollbackPoints(rollbacks);
  }, [cart, cartId]);

  // Validate transfer
  const validateTransfer = useCallback(async () => {
    if (!cart || !targetProject.trim()) return;
    
    setIsValidating(true);
    try {
      const validation = await dataShoppingService.validateTransfer(cart, targetProject);
      setTransferValidation(validation);
    } catch (error) {
      toast({
        title: 'Validation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  }, [cart, targetProject, toast]);

  // Execute transfer
  const executeTransfer = useCallback(async () => {
    if (!cart || !targetProject.trim() || !transferValidation?.isValid) return;
    
    try {
      const operation = await dataShoppingService.executeTransfer(cart, targetProject);
      onTransferComplete?.(operation);
      toast({
        title: 'Transfer completed',
        description: `Successfully transferred ${cart.items.length} items to ${targetProject}`,
      });
    } catch (error) {
      toast({
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [cart, targetProject, transferValidation, onTransferComplete, toast]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      await dataShoppingService.removeFromCart(cartId, itemId);
      await loadCart();
      toast({
        title: 'Item removed',
        description: 'Item successfully removed from cart',
      });
    } catch (error) {
      toast({
        title: 'Failed to remove item',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [cartId, loadCart, toast]);

  // Rollback item to previous state
  const rollbackItem = useCallback(async (itemId: string, rollbackPointId: string) => {
    try {
      await dataShoppingService.rollbackToPoint(cartId, itemId, rollbackPointId);
      await loadCart();
      await loadAuditTrails();
      toast({
        title: 'Rollback completed',
        description: 'Item successfully rolled back to previous state',
      });
    } catch (error) {
      toast({
        title: 'Rollback failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  }, [cartId, loadCart, loadAuditTrails, toast]);

  // Setup event listeners
  useEffect(() => {
    const unsubscribeCartChange = dataShoppingService.onCartChange((updatedCart) => {
      if (updatedCart.id === cartId) {
        setCart(updatedCart);
        onCartUpdate?.(updatedCart);
      }
    });

    const unsubscribeTransferComplete = dataShoppingService.onTransferComplete((operation) => {
      if (operation.cartId === cartId) {
        onTransferComplete?.(operation);
      }
    });

    return () => {
      unsubscribeCartChange();
      unsubscribeTransferComplete();
    };
  }, [cartId, onCartUpdate, onTransferComplete]);

  // Initial data load
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    loadAuditTrails();
  }, [loadAuditTrails]);

  useEffect(() => {
    if (targetProject.trim() && cart) {
      const debounceTimer = setTimeout(validateTransfer, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [targetProject, cart, validateTransfer]);

  if (!cart) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Data Shopping Cart
              </CardTitle>
              <CardDescription>
                {cart.items.length} items • Created {new Date(cart.metadata.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={cart.status === 'active' ? 'default' : cart.status === 'transferred' ? 'secondary' : 'destructive'}>
              {cart.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items">Items ({cart.items.length})</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Cart Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {cart.items.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Cart is empty</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    auditTrail={auditTrails.get(item.id)}
                    rollbackPoints={rollbackPoints.get(item.id) || []}
                    onRemove={() => removeItem(item.id)}
                    onRollback={(rollbackPointId) => rollbackItem(item.id, rollbackPointId)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Transfer Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transferValidation ? (
                <ValidationDisplay validation={transferValidation} />
              ) : (
                <p className="text-muted-foreground">Enter target project to validate transfer</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Transfer to Business Case
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Project</label>
                <Input
                  value={targetProject}
                  onChange={(e) => setTargetProject(e.target.value)}
                  placeholder="Enter target business case project name"
                />
              </div>

              {transferValidation && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {transferValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {transferValidation.isValid ? 'Ready for transfer' : 'Validation issues found'}
                    </span>
                  </div>
                  
                  {transferValidation.suggestions.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {transferValidation.suggestions.length} mapping suggestions available
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={executeTransfer}
                disabled={!transferValidation?.isValid || !targetProject.trim() || cart.items.length === 0}
                className="w-full"
              >
                Transfer {cart.items.length} Items
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Modification History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTrailDisplay auditTrails={auditTrails} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Individual cart item component
function CartItemCard({ 
  item, 
  auditTrail, 
  rollbackPoints, 
  onRemove, 
  onRollback 
}: {
  item: DataShoppingItem;
  auditTrail?: ModificationAuditTrail;
  rollbackPoints: RollbackPoint[];
  onRemove: () => void;
  onRollback: (rollbackPointId: string) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{item.displayName}</h4>
              <Badge variant="outline" className="text-xs">
                {item.sourceType}
              </Badge>
              {item.modifications.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {item.modifications.length} modifications
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">{item.sourcePath}</p>
            
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">Original:</span> {JSON.stringify(item.originalValue)}
              </div>
              {item.modifiedValue && (
                <div className="text-sm">
                  <span className="font-medium">Modified:</span> {JSON.stringify(item.modifiedValue)}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Confidence:</span> {(item.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              disabled={!auditTrail}
            >
              <History className="h-4 w-4" />
            </Button>
            {rollbackPoints.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => rollbackPoints.length > 0 && onRollback(rollbackPoints[0].id)}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showHistory && auditTrail && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Modification History</h5>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {auditTrail.modifications.map((mod, index) => (
                  <div key={mod.id} className="text-xs p-2 bg-muted rounded">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{mod.field}</span>
                      <span className="text-muted-foreground">
                        {new Date(mod.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{mod.reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={mod.validationPassed ? "default" : "destructive"} className="text-xs">
                        {(mod.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Validation display component
function ValidationDisplay({ validation }: { validation: ValidationResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {validation.isValid ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        )}
        <span className="font-medium">
          {validation.isValid ? 'Validation Passed' : 'Validation Issues Found'}
        </span>
      </div>

      {validation.errors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-red-600">Errors</h4>
          <div className="space-y-1">
            {validation.errors.map((error, index) => (
              <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                <span className="font-medium">{error.field}:</span> {error.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-600">Warnings</h4>
          <div className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <div key={index} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                <span className="font-medium">{warning.field}:</span> {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {validation.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-blue-600">Mapping Suggestions</h4>
          <div className="space-y-1">
            {validation.suggestions.map((suggestion, index) => (
              <div key={index} className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{suggestion.suggestedMapping}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-muted-foreground">{suggestion.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Audit trail display component
function AuditTrailDisplay({ auditTrails }: { auditTrails: Map<string, ModificationAuditTrail> }) {
  if (auditTrails.size === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Clock className="h-8 w-8 mx-auto mb-2" />
        <p>No modification history available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-4">
        {Array.from(auditTrails.entries()).map(([itemId, trail]) => (
          <div key={itemId} className="border rounded p-3">
            <h4 className="font-medium mb-2">Item: {itemId}</h4>
            <div className="text-sm text-muted-foreground mb-2">
              {trail.totalModifications} modifications • Last modified: {new Date(trail.lastModified).toLocaleString()}
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {trail.modifications.slice(-3).map((mod) => (
                <div key={mod.id} className="text-xs p-1 bg-muted rounded">
                  <span className="font-medium">{mod.field}:</span> {mod.reason}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
