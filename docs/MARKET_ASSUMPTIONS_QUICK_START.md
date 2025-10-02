# Market Analysis Assumptions Tab - Quick Start Guide

## Overview
This guide provides a quick reference for implementing inline editing for market analysis assumptions, mirroring the business case implementation.

## What We're Building

### Before (Current State)
- Market data is view-only
- Users must edit JSON manually in Data tab
- No sensitivity analysis for market assumptions

### After (Target State)
- Click to edit any market assumption value or rationale
- Add/remove sensitivity drivers via checkboxes
- Edit driver ranges for scenario analysis
- Red indicator when value changes but rationale doesn't

## Key Advantages

### 🎯 Reuse Everything
- ✅ EditableValueCell - Already built, works perfectly
- ✅ EditableRationaleCell - Already built, works perfectly
- ✅ SensitivityDriverBadge - Already built, works perfectly
- ✅ value-parsers - Already handles all units (%, currency, numbers)

### 🎯 Data Structure Match
**Market Analysis** uses `ValueWithMeta`:
```typescript
{ value: number, unit: string, rationale: string, link?: string }
```

**Business Case** uses same structure:
```typescript
{ value: number, unit: string, rationale: string }
```

**Result**: Zero new parsing logic needed! 🎉

## Implementation Checklist

### Phase 1: Context Updates
- [ ] Add `updateMarketAssumption(path, value)` to AppContext
- [ ] Add `addMarketDriver()` to AppContext
- [ ] Add `removeMarketDriver()` to AppContext  
- [ ] Add `updateMarketDriverRange()` to AppContext
- [ ] Extend MarketData type with `drivers` array
- [ ] Test context methods in isolation

### Phase 2: Path Utilities
- [ ] Create `src/lib/market-path-utils.ts`
- [ ] Implement `generateMarketPath()` function
- [ ] Handle array indices (competitors[i], segments[i])
- [ ] Add unit tests for path generation

### Phase 3: Assumptions Tab Component
- [ ] Create `src/components/market-analysis/MarketAssumptionsTab.tsx`
- [ ] Copy structure from `AssumptionsTab.tsx`
- [ ] Implement `buildAssumptionRows()` for market data
- [ ] Add table with 5 columns (checkbox, label, value, unit, rationale)
- [ ] Integrate EditableValueCell for value column
- [ ] Integrate EditableRationaleCell for rationale column
- [ ] Add red indicator system (changedValuePaths)
- [ ] Add checkbox column for drivers
- [ ] Integrate SensitivityDriverBadge

### Phase 4: Integration
- [ ] Import MarketAssumptionsTab in MarketAnalysisSuite
- [ ] Add to moduleConfig array
- [ ] Update TabsList grid: `grid-cols-6` → `grid-cols-7`
- [ ] Add TabsContent for assumptions tab
- [ ] Test navigation between tabs

### Phase 5: Testing
- [ ] Edit TAM base value → verify saves
- [ ] Edit growth rate → verify saves  
- [ ] Edit value → verify rationale turns red
- [ ] Edit rationale → verify red clears
- [ ] Add driver → verify checkbox works
- [ ] Remove driver → verify checkbox works
- [ ] Edit driver range → verify popover works
- [ ] Test percentage display (10% not 0.10)
- [ ] Test currency formatting
- [ ] Test ESC to cancel
- [ ] Test Enter to save
- [ ] Verify localStorage persistence

### Phase 6: Documentation
- [ ] Update `INLINE_ASSUMPTIONS_EDITING.md`
- [ ] Update `ARCHITECTURE.md`
- [ ] Add market-specific examples
- [ ] Document path patterns

## Code Examples

### Context Method Pattern
```typescript
// In AppContext
const updateMarketAssumption = useCallback((path: string, value: any) => {
  setMarketData(prev => {
    if (!prev) return prev;
    return setNestedValue(prev, path, value);
  });
  // Sync to localStorage
}, []);
```

### Path Generation Examples
```typescript
// TAM base value
'market_sizing.total_addressable_market.base_value.value'

// TAM growth rate
'market_sizing.total_addressable_market.growth_rate.value'

// Competitor market share (index 0)
'competitive_landscape.competitors[0].market_share.value'

// Customer segment size (index 2)
'customer_analysis.market_segments[2].size_percentage.value'
```

### Row Building Pattern
```typescript
const buildAssumptionRows = (): MarketAssumptionRow[] => {
  const rows: MarketAssumptionRow[] = [];
  
  // Market Sizing Section
  if (marketData?.market_sizing?.total_addressable_market) {
    rows.push({
      label: 'Total Addressable Market (TAM)',
      category: 'market_sizing',
      icon: Target,
      color: 'text-blue-600'
    });
    
    const tam = marketData.market_sizing.total_addressable_market;
    
    rows.push({
      label: '  Base Value',
      value: tam.base_value.value,
      unit: tam.base_value.unit,
      rationale: tam.base_value.rationale,
      category: 'market_sizing',
      isSubItem: true,
      dataPath: 'market_sizing.total_addressable_market.base_value.value'
    });
    
    rows.push({
      label: '  Growth Rate',
      value: tam.growth_rate.value,
      unit: tam.growth_rate.unit,
      rationale: tam.growth_rate.rationale,
      category: 'market_sizing',
      isSubItem: true,
      dataPath: 'market_sizing.total_addressable_market.growth_rate.value'
    });
  }
  
  // Add more sections...
  return rows;
};
```

### Table Rendering Pattern
```tsx
<table className="w-full">
  <thead>
    <tr>
      <th className="w-12">S</th> {/* Sensitivity driver checkbox */}
      <th className="text-left">Assumption</th>
      <th className="w-32">Value</th>
      <th className="w-24">Unit</th>
      <th className="text-left">Rationale</th>
    </tr>
  </thead>
  <tbody>
    {assumptionRows.map((row, index) => {
      if (row.category === 'header' || row.category === 'spacer') {
        return <tr key={index}>...</tr>; // Header/spacer rows
      }
      
      return (
        <tr key={index}>
          <td>
            {row.dataPath && (
              <Checkbox
                checked={isDriver(row.dataPath)}
                onCheckedChange={() => handleToggleDriver(row)}
              />
            )}
          </td>
          <td>{row.label}</td>
          <td>
            <EditableValueCell
              value={row.value}
              unit={row.unit}
              path={row.dataPath}
              onValueChanged={(path) => handleValueUpdate(path, value)}
            />
            {isDriver(row.dataPath) && (
              <SensitivityDriverBadge
                driver={getDriver(row.dataPath)}
                onUpdateRange={(range) => updateMarketDriverRange(path, range)}
                onRemove={() => removeMarketDriver(path)}
              />
            )}
          </td>
          <td>{row.unit}</td>
          <td>
            <EditableRationaleCell
              value={row.rationale}
              path={row.dataPath}
              needsUpdate={rationaleNeedsUpdate(row.dataPath)}
              onRationaleChanged={(path) => handleRationaleUpdate(path)}
            />
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

## Time Estimates

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Context Updates | 2 hours |
| Phase 2: Path Utilities | 1 hour |
| Phase 3: Assumptions Tab | 4 hours |
| Phase 4: Integration | 1 hour |
| Phase 5: Testing | 2 hours |
| Phase 6: Documentation | 1 hour |
| **Total** | **11 hours** |

## Common Pitfalls to Avoid

### ❌ Don't Create New Parsers
The existing value-parsers handle ALL cases. Just use them.

### ❌ Don't Copy-Paste Without Understanding
Understand the pattern, then adapt for market data structure.

### ❌ Don't Forget Array Indices
Market data has arrays (competitors, segments). Paths must include `[i]`.

### ❌ Don't Skip Red Indicator
Users need to know when rationale is stale. Implement changedValuePaths tracking.

### ❌ Don't Test Only Happy Path
Test edge cases: empty arrays, missing sections, invalid values.

## Success Checklist

Before considering the feature "done":

- [ ] All editable fields work (click → edit → save)
- [ ] Red indicator system works
- [ ] Sensitivity drivers work (add/remove/edit range)
- [ ] Changes persist across page refresh
- [ ] No TypeScript errors
- [ ] No runtime errors in console
- [ ] Manual testing complete
- [ ] Documentation updated
- [ ] Code reviewed (if applicable)

## Quick Commands

```bash
# Run development server
npm run dev

# Build to check for errors
npm run build

# Run tests (when added)
npm run test
```

## Need Help?

Reference these files:
- Business Case Implementation: `src/components/business-case/AssumptionsTab.tsx`
- Context Pattern: `src/contexts/BusinessDataContext.tsx`
- Value Parsers: `src/lib/value-parsers.ts`
- Editable Components: `src/components/business-case/Editable*.tsx`

## Next Action

**Start with Phase 1**: Update AppContext with market update methods. This is the foundation for everything else.

```typescript
// src/contexts/AppContext.tsx
// Add these methods to the context:

const updateMarketAssumption = useCallback((path: string, value: any) => {
  // TODO: Implement
}, []);

const addMarketDriver = useCallback((label: string, path: string, range: number[], rationale: string) => {
  // TODO: Implement
}, []);

// ... etc
```

Good luck! 🚀
