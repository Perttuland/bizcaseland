import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sliders, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensitivityDriverBadgeProps {
  path: string;
  currentRange?: number[];
  onUpdateRange: (range: number[]) => void;
  onRemove: () => void;
}

export function SensitivityDriverBadge({
  path,
  currentRange = [0, 0, 0, 0, 0],
  onUpdateRange,
  onRemove
}: SensitivityDriverBadgeProps) {
  const [range, setRange] = useState<number[]>(currentRange);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onUpdateRange(range);
    setIsOpen(false);
  };

  const handleRangeChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRange = [...range];
    newRange[index] = numValue;
    setRange(newRange);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
        >
          <Sliders className="h-3 w-3" />
          <span className="text-xs font-medium">S</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Sensitivity Driver Range</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Define 5 values for sensitivity analysis. These will be used to test different scenarios.
          </p>

          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center gap-2">
                <Label className="text-xs w-16">Value {index + 1}:</Label>
                <Input
                  type="number"
                  value={range[index]}
                  onChange={(e) => handleRangeChange(index, e.target.value)}
                  className="h-8 text-sm"
                  step="any"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
            >
              Save Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
