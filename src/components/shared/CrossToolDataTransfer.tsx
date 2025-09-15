import React, { useState, useCallback } from 'react';
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
import { 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  History,
  BarChart3
} from 'lucide-react';
import { useDataManager } from '@/contexts/DataManagerContext';
import { CrossToolDataService, MarketVolumeTransfer, SourcedBusinessAssumption } from '@/lib/utils/cross-tool-integration';
import { MarketData } from '@/lib/market-calculations';

interface MarketToBusinessTransferProps {
  marketData: MarketData;
  onTransferComplete?: (transferData: MarketVolumeTransfer) => void;
}

export function MarketToBusinessTransfer({ 
  marketData, 
  onTransferComplete 
}: MarketToBusinessTransferProps) {
  const { currentProject, updateBusinessData } = useDataManager();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [targetSegment, setTargetSegment] = useState<string>('');
  const [userNotes, setUserNotes] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Extract volume data for preview
  const volumePreview = CrossToolDataService.extractVolumeFromMarket(marketData);
  
  const handleTransfer = useCallback(async () => {
    if (!currentProject || !targetSegment) return;

    setIsTransferring(true);
    
    try {
      // Create sourced assumption with market data
      const sourcedAssumption = CrossToolDataService.transferMarketVolume(
        marketData,
        targetSegment,
        { preserveUserData: true, confidence_threshold: 0.7 }
      );

      // Add user notes if provided
      if (userNotes) {
        sourcedAssumption.sources.market_analysis!.source_metadata.user_notes = userNotes;
      }

      // Update business data with new sourced assumption
      // This would integrate with your existing business data structure
      const updatedBusinessData = {
        ...currentProject.businessData,
        assumptions: {
          ...currentProject.businessData?.assumptions,
          customers: {
            ...currentProject.businessData?.assumptions?.customers,
            segments: currentProject.businessData?.assumptions?.customers?.segments?.map(segment => 
              segment.id === targetSegment 
                ? {
                    ...segment,
                    volume: {
                      ...segment.volume,
                      // Use modern data structure
                      base_value: sourcedAssumption?.value || sourcedAssumption, // Support both value object and direct value
                      unit: sourcedAssumption?.unit || 'units_per_year',
                      rationale: sourcedAssumption?.rationale || 'Sourced from market analysis',
                      // Keep legacy structure for backward compatibility
                      base_year_total: sourcedAssumption
                    }
                  }
                : segment
            )
          }
        }
      };

      updateBusinessData(updatedBusinessData);
      
      if (onTransferComplete && volumePreview) {
        onTransferComplete(volumePreview);
      }

      setIsDialogOpen(false);
      setUserNotes('');
      
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  }, [currentProject, targetSegment, userNotes, marketData, updateBusinessData, onTransferComplete, volumePreview]);

  // Get available customer segments from current business data
  const availableSegments = currentProject?.businessData?.assumptions?.customers?.segments || [];

  const confidenceLevel = volumePreview?.source_analysis.confidence_level || 'low';
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
          Send to Business Case
        </CardTitle>
        <CardDescription>
          Transfer market-based volume projections to business case assumptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Volume Preview */}
        {volumePreview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium">Projected Volume</p>
              <p className="text-2xl font-bold">
                {((volumePreview.volume_projection as any).base_year_total || (volumePreview.volume_projection as any).base_value || 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {volumePreview.volume_projection.unit}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Confidence Level</p>
              <Badge variant={confidenceLevel === 'high' ? 'default' : 'secondary'}>
                <span className={confidenceColor}>{confidenceLevel.toUpperCase()}</span>
              </Badge>
              <p className="text-xs text-muted-foreground">
                Based on TAM analysis and market share projections
              </p>
            </div>
          </div>
        )}

        {/* Analysis Details */}
        {volumePreview && (
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              <strong>Market Analysis:</strong> TAM €{volumePreview.source_analysis.tam_value.toLocaleString()} 
              × {volumePreview.source_analysis.target_market_share}% target share 
              = {((volumePreview.volume_projection as any).base_year_total || (volumePreview.volume_projection as any).base_value || 0).toLocaleString()} units/year
            </AlertDescription>
          </Alert>
        )}

        {/* Transfer Action */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={!currentProject?.businessData || !volumePreview}
            >
              <Send className="h-4 w-4 mr-2" />
              Transfer Volume Data
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Market Volume to Business Case</DialogTitle>
              <DialogDescription>
                This will create a new data source for your business case volume assumptions.
                Your existing data will be preserved and you can switch between sources.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Target Segment Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Customer Segment</label>
                <Select value={targetSegment} onValueChange={setTargetSegment}>
                  <SelectTrigger>
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
                  <p className="text-xs text-muted-foreground">
                    No customer segments found. Create segments in the business case first.
                  </p>
                )}
              </div>

              {/* User Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  placeholder="Add context about this market analysis transfer..."
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Impact Warning */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Data Source Management:</strong> This will add "Market Analysis" as a data source 
                  for the selected segment. You can switch between market-based and user input at any time.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransfer}
                disabled={!targetSegment || isTransferring}
              >
                {isTransferring ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Transfer Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Messages */}
        {!currentProject?.businessData && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No business case data found. Create a business case project first.
            </AlertDescription>
          </Alert>
        )}

        {!volumePreview && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Insufficient market analysis data for volume projection. 
              Complete TAM/SAM/SOM analysis first.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Component for managing data sources in business case
interface DataSourceManagerProps {
  assumption: SourcedBusinessAssumption;
  onSourceChange: (newSource: SourcedBusinessAssumption) => void;
  fieldName: string;
}

export function DataSourceManager({ 
  assumption, 
  onSourceChange, 
  fieldName 
}: DataSourceManagerProps) {
  const [showHistory, setShowHistory] = useState(false);

  const handleSourceSwitch = (sourceType: keyof typeof assumption.sources) => {
    if (!assumption.sources[sourceType]) return;
    
    const updated = CrossToolDataService.switchDataSource(assumption, sourceType);
    onSourceChange(updated);
  };

  const availableSources = Object.entries(assumption.sources).filter(([_, data]) => data);
  const activeSourceData = assumption.sources[assumption.active_source];

  return (
    <div className="space-y-3 p-3 border rounded-lg">
      
      {/* Current Value Display */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{fieldName}</p>
          <p className="text-2xl font-bold">{assumption.value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{assumption.unit}</p>
        </div>
        
        {/* Active Source Indicator */}
        <div className="text-right">
          <Badge variant={assumption.active_source === 'market_analysis' ? 'default' : 'secondary'}>
            {assumption.active_source.replace('_', ' ')}
          </Badge>
          {activeSourceData?.source_metadata.confidence_score && (
            <p className="text-xs text-muted-foreground mt-1">
              {(activeSourceData.source_metadata.confidence_score * 100).toFixed(0)}% confidence
            </p>
          )}
        </div>
      </div>

      {/* Sync Status */}
      {assumption.sync_status !== 'current' && assumption.active_source === 'market_analysis' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Market data has changed since last sync. Consider updating this assumption.
          </AlertDescription>
        </Alert>
      )}

      {/* Source Selection */}
      <div className="flex gap-2">
        {availableSources.map(([sourceType, sourceData]) => (
          <Button
            key={sourceType}
            variant={assumption.active_source === sourceType ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSourceSwitch(sourceType as keyof typeof assumption.sources)}
          >
            {sourceType === 'market_analysis' ? 'Market Analysis' : 'User Input'}
            {sourceData.user_modified && <span className="ml-1">*</span>}
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-4 w-4" />
        </Button>
      </div>

      {/* Rationale */}
      <p className="text-sm text-muted-foreground italic">
        {assumption.rationale}
      </p>

      {/* Source History */}
      {showHistory && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium">Source History</p>
          {availableSources.map(([sourceType, sourceData]) => (
            <div key={sourceType} className="text-xs space-y-1 p-2 bg-muted rounded">
              <div className="flex justify-between">
                <span className="font-medium">{sourceType.replace('_', ' ')}</span>
                <span>{new Date(sourceData.source_metadata.timestamp).toLocaleDateString()}</span>
              </div>
              <p>Value: {sourceData.data.value.toLocaleString()} {sourceData.data.unit}</p>
              <p className="text-muted-foreground">{sourceData.data.rationale}</p>
              {sourceData.source_metadata.user_notes && (
                <p className="text-blue-600">Notes: {sourceData.source_metadata.user_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
