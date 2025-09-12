import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  BarChart3,
  Calculator
} from 'lucide-react';
import { useDataManager } from '@/contexts/DataManagerContext';
import { MarketData } from '@/lib/market-calculations';

interface WorkingMarketToBusinessTransferProps {
  marketData: MarketData;
  onTransferComplete?: (result: { success: boolean; message: string }) => void;
}

export function WorkingMarketToBusinessTransfer({ 
  marketData, 
  onTransferComplete 
}: WorkingMarketToBusinessTransferProps) {
  const { 
    currentProject, 
    transferMarketVolumeToBusinessCase, 
    createProject 
  } = useDataManager();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetSegment, setTargetSegment] = useState<string>('');
  const [userNotes, setUserNotes] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(100); // Default unit price
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{success: boolean; message: string} | null>(null);

  // Calculate volume projection from market data
  const volumeCalculation = useMemo(() => {
    const tam = marketData.market_sizing?.total_addressable_market?.base_value?.value || 0;
    const samPct = marketData.market_sizing?.serviceable_addressable_market?.percentage_of_tam?.value || 0;
    const somPct = marketData.market_sizing?.serviceable_obtainable_market?.percentage_of_sam?.value || 0;
    const targetSharePct = marketData.market_share?.target_position?.target_share?.value || 0;
    
    // Calculate volume assuming unit price
    const marketValue = tam * (samPct / 100) * (somPct / 100) * (targetSharePct / 100);
    const projectedVolume = unitPrice > 0 ? marketValue / unitPrice : 0;
    
    return {
      tam,
      samPct,
      somPct,
      targetSharePct,
      marketValue,
      projectedVolume,
      isComplete: tam > 0 && samPct > 0 && targetSharePct > 0
    };
  }, [marketData, unitPrice]);

  // Get available customer segments from current business data
  const availableSegments = currentProject?.businessData?.assumptions?.customers?.segments || [];

  const handleCreateBusinessCase = useCallback(async () => {
    const projectName = `Business Case - ${marketData.meta?.title || 'Market Analysis'}`;
    const projectId = await createProject(projectName, 'business');
    console.log('Created business case project:', projectId);
  }, [createProject, marketData.meta?.title]);

  const handleTransfer = useCallback(async () => {
    if (!targetSegment || !volumeCalculation.isComplete) return;

    setIsTransferring(true);
    setTransferResult(null);
    
    try {
      const result = await transferMarketVolumeToBusinessCase(targetSegment, {
        preserveUserData: true,
        userNotes: userNotes || undefined
      });

      setTransferResult(result);
      
      if (result.success) {
        setIsDialogOpen(false);
        setUserNotes('');
        setTargetSegment('');
      }
      
      if (onTransferComplete) {
        onTransferComplete(result);
      }

    } catch (error) {
      const errorResult = { 
        success: false, 
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
      setTransferResult(errorResult);
      
      if (onTransferComplete) {
        onTransferComplete(errorResult);
      }
    } finally {
      setIsTransferring(false);
    }
  }, [targetSegment, volumeCalculation.isComplete, transferMarketVolumeToBusinessCase, userNotes, onTransferComplete]);

  const confidenceLevel = volumeCalculation.isComplete ? 
    (volumeCalculation.samPct > 0 && volumeCalculation.somPct > 0 ? 'high' : 'medium') : 'low';
  
  const confidenceColor = {
    high: 'text-green-600',
    medium: 'text-yellow-600', 
    low: 'text-red-600'
  }[confidenceLevel];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer to Business Case
        </CardTitle>
        <CardDescription>
          Convert market analysis insights into business case volume assumptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Market Analysis Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">TAM</p>
            <p className="font-bold">€{volumeCalculation.tam.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">SAM</p>
            <p className="font-bold">{volumeCalculation.samPct.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Target Share</p>
            <p className="font-bold">{volumeCalculation.targetSharePct.toFixed(1)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Market Value</p>
            <p className="font-bold">€{volumeCalculation.marketValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Volume Calculation */}
        {volumeCalculation.isComplete && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="font-medium">Volume Calculation</span>
              <Badge variant={confidenceLevel === 'high' ? 'default' : 'secondary'}>
                <span className={confidenceColor}>{confidenceLevel.toUpperCase()}</span>
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="unit-price">Assumed Unit Price (€)</Label>
                <Input
                  id="unit-price"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  min={0.01}
                  step={0.01}
                />
                <p className="text-xs text-muted-foreground">
                  Price per unit for volume calculation
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Projected Annual Volume</p>
                <p className="text-2xl font-bold">
                  {volumeCalculation.projectedVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">units/year</p>
              </div>
            </div>
            
            <Alert>
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                <strong>Calculation:</strong> €{volumeCalculation.marketValue.toLocaleString()} market value ÷ €{unitPrice} unit price = {volumeCalculation.projectedVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} units/year
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Transfer Status */}
        {transferResult && (
          <Alert variant={transferResult.success ? 'default' : 'destructive'}>
            {transferResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{transferResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Transfer Action */}
        {!currentProject?.businessData ? (
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No business case project found. Create one to transfer market insights.
              </AlertDescription>
            </Alert>
            <Button onClick={handleCreateBusinessCase} className="w-full">
              Create Business Case Project
            </Button>
          </div>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={!volumeCalculation.isComplete}
              >
                <Send className="h-4 w-4 mr-2" />
                Transfer Volume Data ({volumeCalculation.projectedVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} units)
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Transfer Market Volume to Business Case</DialogTitle>
                <DialogDescription>
                  This will update the volume assumptions for a customer segment with market-based projections.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Target Segment Selection */}
                <div className="space-y-2">
                  <Label htmlFor="segment-select">Target Customer Segment</Label>
                  <Select value={targetSegment} onValueChange={setTargetSegment}>
                    <SelectTrigger id="segment-select">
                      <SelectValue placeholder="Select customer segment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSegments.map(segment => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableSegments.length === 0 && (
                    <p className="text-xs text-destructive">
                      No customer segments found. Create segments in the business case first.
                    </p>
                  )}
                </div>

                {/* Transfer Summary */}
                <div className="p-3 bg-muted rounded border-l-4 border-primary">
                  <p className="text-sm font-medium">Transfer Summary</p>
                  <p className="text-sm">Volume: {volumeCalculation.projectedVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} units/year</p>
                  <p className="text-xs text-muted-foreground">
                    Based on {volumeCalculation.targetSharePct}% market share of €{volumeCalculation.marketValue.toLocaleString()} market opportunity
                  </p>
                </div>

                {/* User Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add context about this transfer (e.g., assumptions, methodology notes)..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Impact Warning */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This will update the base year volume for the selected segment. 
                    The original rationale will include market analysis source information.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleTransfer}
                  disabled={!targetSegment || isTransferring || !volumeCalculation.isComplete}
                >
                  {isTransferring ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Transfer Volume
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Status Messages */}
        {!volumeCalculation.isComplete && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Incomplete market analysis. Complete TAM/SAM analysis and market share strategy to enable transfer.
              <ul className="mt-2 text-xs list-disc list-inside">
                {volumeCalculation.tam === 0 && <li>Add Total Addressable Market (TAM)</li>}
                {volumeCalculation.samPct === 0 && <li>Add Serviceable Addressable Market (SAM)</li>}
                {volumeCalculation.targetSharePct === 0 && <li>Add Target Market Share</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
