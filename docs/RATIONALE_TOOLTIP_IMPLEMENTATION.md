# Rationale Tooltip Implementation

## Overview
Complete implementation of hover tooltips for displaying rationales and assumptions throughout the Market Analysis tool.

## Features Implemented

### 1. **Consistent Font Styling**
- Tooltips use clean, standard system font: `ui-sans-serif, system-ui, sans-serif`
- Not inherited from data point styling
- Consistent text sizing: 
  - Label: `text-sm font-semibold`
  - Rationale header: `text-xs font-medium text-muted-foreground`
  - Rationale content: `text-sm text-foreground leading-relaxed`

### 2. **Click-to-Pin Functionality**
- **Hover**: Shows tooltip on mouse hover
- **Click**: Pins tooltip open so links can be clicked
- **Close**: Click outside tooltip or click value again to close
- Visual indicator when pinned: "Click outside to close" message

### 3. **Link Support**

#### Direct Link Field
```typescript
{
  value: 50000000,
  unit: "EUR",
  rationale: "Market size based on industry report",
  link: "https://example.com/report"  // Optional
}
```

#### Markdown Links in Rationale Text
```typescript
{
  value: 50000000,
  unit: "EUR",
  rationale: "Based on [Gartner 2024 Report](https://gartner.com/report) and [McKinsey Analysis](https://mckinsey.com/analysis)"
}
```

### 4. **Visual Design**
- **Underline**: Dashed border under values with rationales
- **Info Icon**: Small info icon (h-3 w-3) next to values
- **Tooltip Card**: 
  - White background (`bg-card`)
  - Border and shadow (`border border-border shadow-lg`)
  - Rounded corners (`rounded-lg`)
  - Proper spacing (`p-3`)
  - Min width: 250px, Max width: 400px
  - Z-index: 100 (appears above other content)
  - Smooth animation (`animate-in fade-in-0 zoom-in-95 duration-200`)

### 5. **Support for Missing Rationales**
- Component gracefully handles fields without rationales
- Simply displays the value without underline or info icon
- Easy to add rationales later - just update the data

## Files Modified

### Core Component
- **`src/components/market-analysis/ValueWithRationale.tsx`** (NEW)
  - Main tooltip component
  - 160+ lines with full functionality
  - Props: `value`, `rationale`, `label`, `className`, `inline`, `link`
  - State management for hover and pinned states
  - Link parsing for markdown-style links
  - Click-outside detection for closing pinned tooltips

### Type Definitions
- **`src/lib/market-calculations.ts`**
  - Added `ValueWithMeta` interface:
    ```typescript
    export interface ValueWithMeta {
      value: number;
      unit: string;
      rationale: string;
      link?: string;
    }
    ```
  - Updated all interfaces to use `ValueWithMeta` for TAM, SAM, SOM, market shares, growth rates, etc.

### Module Integration
- **`src/components/market-analysis/modules/MarketSizingModule.tsx`**
  - TAM base value with rationale
  - TAM growth rate with rationale
  - SAM value and percentage with rationales
  - SOM value and percentage with rationales

- **`src/components/market-analysis/modules/CustomerAnalysisModule.tsx`**
  - Segment size values with rationales
  - Segment growth rates with rationales
  - Segment market share percentages with rationales

- **`src/components/market-analysis/modules/CompetitiveIntelligenceModule.tsx`**
  - Competitor market shares with rationales

- **`src/components/market-analysis/modules/StrategicPlanningModule.tsx`**
  - Import added (ready for future integration)

### Template Documentation
- **`src/components/market-analysis/MarketAnalysisTemplate.ts`**
  - Added comprehensive documentation about link support
  - Example usage with both direct links and markdown links
  - Best practices for AI when adding links
  - Updated TAM fields to show link field examples

## Usage Examples

### Basic Usage
```tsx
<ValueWithRationale
  value="€50M"
  rationale="Based on Gartner 2024 industry report"
  label="TAM"
  inline
/>
```

### With Link
```tsx
<ValueWithRationale
  value="€50M"
  rationale="Based on Gartner 2024 industry report"
  link="https://gartner.com/report-2024"
  label="TAM"
  inline
/>
```

### With Markdown Links in Rationale
```tsx
<ValueWithRationale
  value="€50M"
  rationale="Based on [Gartner 2024 Report](https://gartner.com/report) showing 5% CAGR. Cross-referenced with [McKinsey analysis](https://mckinsey.com/analysis) for validation."
  label="TAM"
  inline
/>
```

### Without Rationale (Graceful Handling)
```tsx
<ValueWithRationale
  value="€50M"
/>
// Simply displays: €50M (no underline, no icon)
```

## AI Template Instructions

The template now includes detailed instructions for AI:

1. **Link Field Usage**:
   - Optional `link` field on any value object
   - Provide direct URLs to source reports
   - Use publicly accessible links when possible

2. **Markdown Links**:
   - Use `[text](url)` syntax in rationale text
   - Multiple links supported
   - Automatically rendered as clickable

3. **Best Practices**:
   - Include both direct link AND markdown links for comprehensive sourcing
   - Link to specific report pages, not just homepages
   - Prioritize publicly accessible sources

## Technical Implementation Details

### Link Parsing
```typescript
const parseLinks = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Parses markdown-style links and renders as <a> tags
  // Stops event propagation to allow clicking within pinned tooltip
}
```

### Click-to-Pin Logic
```typescript
const [isHovered, setIsHovered] = useState(false);
const [isPinned, setIsPinned] = useState(false);

// Show tooltip if either hovered OR pinned
const showTooltip = isHovered || isPinned;

// Toggle pinned state on click
onClick={() => setIsPinned(!isPinned)}

// Close when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (isPinned && !tooltipRef.current.contains(event.target)) {
      setIsPinned(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isPinned]);
```

### Consistent Styling
```typescript
// Tooltip container with explicit font family
<div 
  style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
  className="absolute z-[100] bg-card border border-border rounded-lg p-3 shadow-lg..."
>
  {/* Content with consistent text sizes */}
</div>
```

## Testing Checklist

- [x] Hover over value shows tooltip
- [x] Click value pins tooltip open
- [x] Click outside closes pinned tooltip
- [x] Markdown links in rationale are clickable
- [x] Direct link appears as "View source →"
- [x] Font is consistent across all tooltips
- [x] No rationale = no underline/icon (graceful)
- [x] Tooltips work in all modules (MarketSizing, CustomerAnalysis, CompetitiveIntelligence)
- [x] Z-index prevents tooltip from being hidden
- [x] Animation is smooth (fade-in, zoom-in)
- [x] TypeScript compilation successful
- [x] No console errors

## Future Enhancements

Potential improvements for future iterations:

1. **Smart Positioning**: Auto-adjust tooltip position if near screen edge
2. **Mobile Support**: Touch-friendly interaction patterns
3. **Keyboard Navigation**: Arrow keys to navigate between tooltips
4. **Copy Functionality**: Copy rationale text to clipboard
5. **Citation Export**: Export all rationales with links as bibliography
6. **Rationale Editor**: In-app editing of rationales
7. **Source Quality Indicators**: Visual indicators for source reliability
8. **Historical Tracking**: Track rationale changes over time

## Migration Guide

For existing data without link fields:

1. **No Action Required**: Old data works perfectly (link field is optional)
2. **Gradual Addition**: Add links as you update analyses
3. **Backward Compatible**: All existing rationales display correctly
4. **AI Support**: New AI-generated analyses will include links automatically

## Related Documentation

- [CROSS_TOOL_INTEGRATION.md](./CROSS_TOOL_INTEGRATION.md) - Integration patterns
- [SHARED_DATA_MANAGEMENT.md](./SHARED_DATA_MANAGEMENT.md) - Data flow
- Market Analysis Template - AI workflow and rationale requirements
