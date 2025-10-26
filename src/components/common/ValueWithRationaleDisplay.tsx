/**
 * Value with Rationale Display Component
 * Shows a value with its rationale in a consistent format
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ValueWithRationaleDisplayProps {
  value: string | number;
  unit?: string;
  rationale?: string;
  label?: string;
  className?: string;
  valueClassName?: string;
  showRationaleIcon?: boolean;
}

export function ValueWithRationaleDisplay({
  value,
  unit,
  rationale,
  label,
  className,
  valueClassName,
  showRationaleIcon = true,
}: ValueWithRationaleDisplayProps) {
  const displayValue = unit ? `${value} ${unit}` : value;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className="text-sm text-muted-foreground">{label}:</span>
      )}
      <span className={cn('font-medium', valueClassName)}>{displayValue}</span>
      {rationale && showRationaleIcon && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">{rationale}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

/**
 * Rationale Badge Component
 * Shows rationale in a badge format
 */
export interface RationaleBadgeProps {
  rationale: string;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function RationaleBadge({
  rationale,
  variant = 'secondary',
  className,
}: RationaleBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-help',
              variant === 'default' && 'bg-primary text-primary-foreground',
              variant === 'outline' && 'border border-input bg-background',
              variant === 'secondary' && 'bg-secondary text-secondary-foreground',
              className
            )}
          >
            <Info className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{rationale}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p className="text-sm">{rationale}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
