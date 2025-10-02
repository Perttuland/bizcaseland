# Market Analysis Template v2.0 - Migration Guide

## Overview
Updated the Market Analysis Template from v1.0 to v2.0 with AI-optimized instructions and improved module structure.

## Major Changes

### 1. Schema Version
- **Changed**: `schema_version` from `"1.0"` to `"2.0"`
- **Reason**: Major structural changes warrant version bump

### 2. Instructions Rewrite (AI-Optimized)
The instructions section has been completely rewritten for AI consumption (99% of users):

#### New Structure:
```json
{
  "purpose": "AI-Human collaborative market analysis...",
  "ai_workflow_protocol": {
    "initial_prompt": "Ask user about collaborative vs autonomous mode",
    "collaborative_mode": {
      "process": [...],
      "presentation_order": {...}
    },
    "autonomous_mode": "...",
    "mode_switching": "..."
  },
  "module_independence": {...},
  "rationale_requirements": {
    "mandatory_elements": [...],
    "quality_standards": {...},
    "ai_research_guidance": {...}
  },
  "data_format_rules": [...]
}
```

#### Key Features:
- **Collaborative Mode**: AI presents data points one at a time for validation
- **Autonomous Mode**: AI completes everything independently
- **Mode Switching**: Users can switch between modes anytime
- **Rationale Standards**: Clear examples of good vs poor rationales
- **AI Research Guidance**: Source hierarchy (primary → secondary → AI-synthesized)

### 3. Module Restructure

#### REMOVED: `market_dynamics`
The entire `market_dynamics` section has been removed as it provided low value and added unnecessary bulk.

**Old structure (removed):**
```json
"market_dynamics": {
  "growth_drivers": [...],
  "market_risks": [...],
  "technology_trends": [...]
}
```

#### ADDED: `strategic_planning`
New consolidated module focused on execution strategy:

```json
"strategic_planning": {
  "note": "Define how to capture the market opportunity...",
  "execution_strategy": {
    "go_to_market_approach": "...",
    "penetration_strategy": "linear|exponential|s_curve",
    "penetration_strategy_rationale": "...",
    "penetration_definitions": {...},
    "key_tactics": [...],
    "competitive_response_plan": "..."
  },
  "execution_milestones": [...],
  "volume_projections": {
    "calculation_method": "market_share_based",
    "note": "...",
    "assumptions": {...},
    "sensitivity_analysis": [...]
  }
}
```

### 4. Module Organization

#### Market Sizing (Unchanged)
- ✅ TAM, SAM, SOM definitions
- ✅ market_share (current and target positions)
- **Purpose**: Defines the market opportunity

#### Competitive Intelligence (Unchanged)
- ✅ competitive_landscape
- **Purpose**: Analyzes market structure and competitors

#### Customer Analysis (Unchanged)
- ✅ customer_analysis
- **Purpose**: Segments customers and analyzes economics

#### Strategic Planning (NEW)
- ✅ Execution strategy and tactics
- ✅ Milestones with measurable targets
- ✅ Volume projections (moved from separate section)
- **Purpose**: Defines HOW to capture the opportunity

## Code Changes

### Files Modified:

1. **MarketAnalysisTemplate.ts**
   - Updated schema_version to "2.0"
   - Rewrote instructions section
   - Removed market_dynamics section
   - Added strategic_planning section
   - Updated MODULE_KEYS mapping

2. **market-calculations.ts**
   - Updated MarketData interface
   - Removed market_dynamics type
   - Added strategic_planning type

3. **market-suite-calculations.ts**
   - Removed market_dynamics validation
   - Removed market_dynamics calculations
   - Updated module presence checks
   - Set baseline risk score (50) instead of calculating from market_dynamics

4. **StrategicPlanningModule.tsx**
   - Changed moduleKey from "market_dynamics" to "strategic_planning"

5. **ModuleDataTools.tsx**
   - Updated MODULE_KEY_TO_ID mapping
   - Removed market_dynamics reference

## User Impact

### For AI Agents:
- Clear workflow instructions (collaborative vs autonomous)
- Specific rationale requirements with examples
- Research source hierarchy guidance
- Module independence clearly stated

### For Human Users:
- Smaller, more focused template
- Better organized strategic planning section
- Clearer module purposes
- Removed low-value market_dynamics section

## Migration Notes

### Breaking Changes:
- ⚠️ v1.0 templates with `market_dynamics` will need manual migration
- ⚠️ `volume_projections` is now nested under `strategic_planning.volume_projections`

### Backward Compatibility:
- NOT provided - this is a breaking change
- Recommendation: Start fresh with v2.0 for new analyses

## Testing

- ✅ Build successful
- ✅ No TypeScript errors
- ✅ Module key mappings updated
- ✅ Validation logic updated
- ✅ Calculation logic updated

## Next Steps

Users should:
1. Copy the new template from Data Management tab
2. Use AI collaborative mode for best results
3. Start with Market Sizing, add other modules as needed
4. All modules work independently
