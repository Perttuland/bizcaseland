# Market Analysis Assumptions Tab - Implementation Plan

## Executive Summary

Add an "Assumptions" tab to the Market Analysis Suite that provides inline editing capabilities matching the Business Case Analyzer's assumptions tab. This will allow users to edit market sizing values, growth rates, competitive intelligence data, and customer segment information directly without modal dialogs.

## Current State Analysis

### Market Analysis Structure
- **Main Component**: `MarketAnalysisSuite.tsx` (812 lines)
- **Tab System**: 6 tabs currently (Overview, Market Sizing, Competition, Customers, Opportunities, Data)
- **Data Context**: Uses `AppContext` with `marketData` state
- **Data Type**: `MarketData` interface from `market-calculations.ts`
- **Modules**: Separate module components for each analysis area

### Market Data Structure (`MarketData` interface)
Key editable fields across modules:
1. **Market Sizing**:
   - TAM: `base_value`, `growth_rate` (both `ValueWithMeta`)
   - SAM: `percentage_of_tam` (ValueWithMeta)
   - SOM: `percentage_of_sam` (ValueWithMeta)

2. **Market Share**:
   - Current: `current_share`, `current_revenue` (ValueWithMeta)
   - Target: `target_share`, `target_timeframe` (ValueWithMeta)

3. **Competitive Landscape**:
   - Competitors array: Each has `market_share` (ValueWithMeta)
   - Competitive advantages: Array of advantages

4. **Customer Analysis**:
   - Market segments array: Each has `size_percentage`, `size_value`, `growth_rate` (all ValueWithMeta)

5. **Strategic Planning**:
   - Execution milestones, tactics, projections

### ValueWithMeta Structure
```typescript
interface ValueWithMeta {
  value: number;
  unit: string;
  rationale: string;
  link?: string;
}
```
This is **identical in structure** to Business Case assumptions!

## Implementation Plan

### Phase 1: Core Infrastructure Setup ✅ (Already Done)
**Status**: Complete - reuse existing components

1. ✅ Value parsers (`value-parsers.ts`) - Already handles all unit types
2. ✅ EditableValueCell component - Works with any numeric field
3. ✅ EditableRationaleCell component - Works with any text field
4. ✅ SensitivityDriverBadge component - Reusable for market drivers

### Phase 2: Context Layer Updates (2-3 hours)

#### 2.1 Update AppContext (`src/contexts/AppContext.tsx`)
**Current State**: Has `marketData` state, but limited update methods

**Tasks**:
1. Add `updateMarketAssumption(path: string, value: any): void` method
   - Similar to `updateAssumption` in BusinessDataContext
   - Uses `setNestedValue` utility for deep updates
   - Updates `marketData` state and syncs to localStorage

2. Add driver management methods:
   - `addMarketDriver(label: string, path: string, range: number[], rationale: string): void`
   - `removeMarketDriver(path: string): void`
   - `updateMarketDriverRange(path: string, range: number[]): void`

3. Add `drivers` array to market data storage:
   ```typescript
   interface MarketDataWithDrivers extends MarketData {
     drivers?: Array<{
       key: string;
       path: string;
       range: number[];
       rationale: string;
     }>;
   }
   ```

**Files to Modify**:
- `src/contexts/AppContext.tsx` (add methods)
- `src/lib/market-calculations.ts` (extend MarketData type if needed)

#### 2.2 Path Generation Utilities
**Create**: `src/lib/market-path-utils.ts`

Generate data paths for market data structure:
```typescript
// Examples:
'market_sizing.total_addressable_market.base_value.value'
'market_sizing.total_addressable_market.growth_rate.value'
'competitive_landscape.competitors[0].market_share.value'
'customer_analysis.market_segments[0].size_percentage.value'
```

**Functions needed**:
- `generateMarketPath(category: string, index?: number, field?: string): string`
- `parseMarketPath(path: string): { category: string; index?: number; field?: string }`

### Phase 3: Assumptions Tab Component (4-6 hours)

#### 3.1 Create MarketAssumptionsTab Component
**New File**: `src/components/market-analysis/MarketAssumptionsTab.tsx`

**Structure** (mirror AssumptionsTab):
```typescript
interface MarketAssumptionRow {
  label: string;
  value?: any;
  unit?: string;
  rationale?: string;
  category: 'market_sizing' | 'competition' | 'customers' | 'share';
  isSubItem?: boolean;
  icon?: any;
  color?: string;
  sensitivityDriver?: SensitivityDriver;
  dataPath?: string;
}
```

**State Management**:
- `changedValuePaths: Set<string>` - Track edited values
- `hoveredCell: string | null` - Hover effects

**Key Methods**:
- `buildAssumptionRows()` - Parse marketData into flat row structure
- `handleValueUpdate(path, value)` - Update value, mark rationale as needing update
- `handleRationaleUpdate(path, value)` - Update rationale, clear red indicator
- `rationaleNeedsUpdate(path)` - Check if path in changedValuePaths
- `handleToggleDriver(row)` - Add/remove sensitivity driver
- `isDriver(path)` - Check if path is a driver
- `getDriver(path)` - Get driver by path

**Row Building Logic**:
1. **Market Sizing Section**:
   - TAM Base Value
   - TAM Growth Rate
   - SAM % of TAM
   - SOM % of SAM

2. **Market Share Section**:
   - Current Market Share
   - Current Revenue
   - Target Market Share
   - Target Timeframe

3. **Competitive Intelligence Section**:
   - For each competitor:
     - Competitor Name (read-only label)
     - Market Share (editable)

4. **Customer Segments Section**:
   - For each segment:
     - Segment Name (read-only label)
     - Size Percentage (editable)
     - Size Value (editable)
     - Growth Rate (editable)

**Table Structure**:
```tsx
<table>
  <thead>
    <th>S</th> {/* Checkbox for sensitivity driver */}
    <th>Assumption</th>
    <th>Value</th>
    <th>Unit</th>
    <th>Rationale</th>
  </thead>
  <tbody>
    {/* Map assumptionRows to table rows */}
    {/* Use EditableValueCell for value column */}
    {/* Use EditableRationaleCell for rationale column */}
    {/* Show SensitivityDriverBadge when isDriver */}
  </tbody>
</table>
```

#### 3.2 Integrate into MarketAnalysisSuite
**File**: `src/components/market-analysis/MarketAnalysisSuite.tsx`

**Changes**:
1. Import MarketAssumptionsTab component
2. Add to `moduleConfig` array:
   ```typescript
   {
     id: 'assumptions',
     title: 'Assumptions',
     icon: Settings, // or Calculator
     component: MarketAssumptionsTab
   }
   ```
3. Update TabsList grid: `grid-cols-6` → `grid-cols-7`
4. Add TabsContent for assumptions:
   ```tsx
   <TabsContent value="assumptions">
     <MarketAssumptionsTab />
   </TabsContent>
   ```

### Phase 4: Sensitivity Analysis Integration (2-3 hours)

#### 4.1 Create Market Sensitivity Analysis Component
**Optional Enhancement**: Create market-specific sensitivity analysis

**Options**:
1. **Reuse existing SensitivityAnalysis component**
   - Pass market drivers instead of business drivers
   - Works out of the box if we use same driver structure
   
2. **Create MarketSensitivityAnalysis component**
   - Market-specific visualizations
   - TAM/SAM/SOM impact charts
   - Competitive position sensitivity

**Recommendation**: Start with option 1 (reuse), add option 2 later if needed

#### 4.2 Add Sensitivity Section to Overview Tab
Display active market drivers and their impact on:
- Total Addressable Market
- Market Share projections
- Revenue forecasts

### Phase 5: Testing & Documentation (2-3 hours)

#### 5.1 Manual Testing Checklist
- [ ] Edit TAM base value and growth rate
- [ ] Edit SAM and SOM percentages
- [ ] Edit market share values
- [ ] Edit competitor market shares
- [ ] Edit customer segment values
- [ ] Red indicator appears when value changed
- [ ] Red indicator clears when rationale updated
- [ ] Add/remove sensitivity drivers via checkbox
- [ ] Edit driver ranges via badge popover
- [ ] Percentage values display as % (e.g., 10% not 0.10)
- [ ] Currency values format correctly
- [ ] ESC cancels edits
- [ ] Enter/Ctrl+Enter saves edits
- [ ] Changes persist in localStorage
- [ ] Changes reflect in other tabs (Overview, etc.)

#### 5.2 Update Documentation
**Files to Update**:
1. `docs/INLINE_ASSUMPTIONS_EDITING.md`
   - Add Market Analysis section
   - Document market-specific paths
   - Show examples with ValueWithMeta structure

2. `docs/ARCHITECTURE.md`
   - Update Market Analysis section
   - Document new context methods

3. Create `docs/MARKET_ASSUMPTIONS_TAB.md`
   - Market-specific implementation details
   - Path generation examples
   - Integration with market calculations

## Task Breakdown & Estimates

### Critical Path Tasks:
| Task | Est. Time | Dependencies | Priority |
|------|-----------|--------------|----------|
| 2.1 - Update AppContext | 2h | None | HIGH |
| 2.2 - Path utilities | 1h | None | HIGH |
| 3.1 - Create MarketAssumptionsTab | 4h | 2.1, 2.2 | HIGH |
| 3.2 - Integrate into Suite | 1h | 3.1 | HIGH |
| 5.1 - Testing | 2h | 3.2 | HIGH |
| 5.2 - Documentation | 1h | 5.1 | MEDIUM |

### Optional Enhancements:
| Task | Est. Time | Dependencies | Priority |
|------|-----------|--------------|----------|
| 4.1 - Market sensitivity component | 3h | 3.2 | LOW |
| 4.2 - Overview integration | 2h | 4.1 | LOW |

**Total Critical Path**: ~11 hours
**With Optional**: ~16 hours

## Implementation Order

### Sprint 1: Foundation (3 hours)
1. ✅ Update AppContext with market update methods
2. ✅ Create market path utilities
3. ✅ Test context methods in isolation

### Sprint 2: Core Component (5 hours)
1. ✅ Create MarketAssumptionsTab skeleton
2. ✅ Implement row building logic
3. ✅ Add EditableValueCell integration
4. ✅ Add EditableRationaleCell integration
5. ✅ Add red indicator system

### Sprint 3: Sensitivity Drivers (3 hours)
1. ✅ Add checkbox column
2. ✅ Integrate SensitivityDriverBadge
3. ✅ Implement driver management methods
4. ✅ Test driver add/remove/update

### Sprint 4: Integration & Testing (3 hours)
1. ✅ Add tab to MarketAnalysisSuite
2. ✅ Manual testing all features
3. ✅ Fix bugs
4. ✅ Update documentation

## Technical Considerations

### Reusable Components
**Huge advantage**: We can reuse ALL core components:
- ✅ EditableValueCell - works with any numeric + unit
- ✅ EditableRationaleCell - works with any text
- ✅ SensitivityDriverBadge - works with any driver
- ✅ value-parsers utilities - handle all unit types

### Data Structure Compatibility
**ValueWithMeta = Business Case Assumption Structure**:
```typescript
// Both have the same shape:
{ value: number, unit: string, rationale: string }
```
This means **zero additional parsing logic needed**!

### Context Pattern Consistency
AppContext will mirror BusinessDataContext:
- Same method signatures
- Same driver structure
- Same localStorage sync pattern

### Path Complexity
Market data has more nested arrays than business data:
- `competitors[i]` - dynamic length
- `market_segments[i]` - dynamic length
- `key_tactics[i]` - dynamic length

**Solution**: Path utility handles array indices like:
- `competitive_landscape.competitors[2].market_share.value`

### Edge Cases to Handle
1. **Empty arrays**: What if no competitors defined?
   - Show "Add competitor" row
   - Or just hide competitive section
2. **Missing sections**: Not all market analyses have all sections
   - Conditionally render sections
   - Only show what exists in data
3. **Link field**: ValueWithMeta has optional `link` field
   - Display as clickable link icon next to rationale?
   - Or just ignore for now (not critical)

## Success Criteria

### Must Have:
- [x] Users can edit all ValueWithMeta fields inline
- [x] Red indicator system works for market assumptions
- [x] Sensitivity drivers can be added/removed
- [x] Driver ranges can be edited
- [x] Changes persist to localStorage
- [x] No compilation errors
- [x] Basic documentation updated

### Nice to Have:
- [ ] Market-specific sensitivity visualizations
- [ ] TAM/SAM/SOM recalculation on edit
- [ ] Competitor comparison with edited values
- [ ] Link field support (clickable sources)
- [ ] Undo/redo for edits

## Risk Mitigation

### Risk: Data structure inconsistencies
**Mitigation**: Create comprehensive path utilities with tests

### Risk: Performance with large datasets
**Mitigation**: Use same Set-based tracking as business case (O(1) lookups)

### Risk: Breaking existing market analysis features
**Mitigation**: 
- Keep existing components unchanged
- Add assumptions tab as new feature
- Test all existing tabs after integration

### Risk: localStorage quota exceeded
**Mitigation**: Same as business case - rely on browser limits, add warning if needed

## Next Steps

1. **Review this plan** - Get feedback on approach
2. **Start Sprint 1** - Update AppContext
3. **Create skeleton** - Minimal working assumptions tab
4. **Iterate** - Add features incrementally
5. **Test thoroughly** - Manual testing checklist
6. **Document** - Update all relevant docs

## References
- Business Case Implementation: `docs/INLINE_ASSUMPTIONS_EDITING.md`
- Market Data Structure: `src/lib/market-calculations.ts`
- Context Pattern: `src/contexts/BusinessDataContext.tsx`
- Component Examples: `src/components/business-case/AssumptionsTab.tsx`
