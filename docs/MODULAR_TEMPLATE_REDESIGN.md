# Modular Template Redesign Proposal

**Date:** October 3, 2025  
**Author:** System Analysis  
**Status:** Proposed Solution

---

## Problem Statement

### Current Implementation Issues

The current modular template system tries to maintain ONE giant 382-line JSON template and programmatically filter it:

```typescript
// Current approach (COMPLEX)
export const MarketAnalysisTemplate = `{ /* 382 lines of JSON */ }`;

export function generateModularTemplate(selectedModules: string[]): string {
  const fullTemplate = JSON.parse(MarketAnalysisTemplate); // Parse giant JSON
  const modularTemplate: any = { /* Complex filtering logic */ };
  
  // Filter instructions
  selectedModules.forEach(moduleId => {
    // Copy specific sections
    // Filter presentation_order
    // Filter module_independence
  });
  
  // Add selected module sections
  selectedModules.forEach(moduleId => {
    const keys = MODULE_KEYS[moduleId]; // Map to actual keys
    keys.forEach(key => { /* Copy */ });
  });
  
  return JSON.stringify(modularTemplate, null, 2);
}
```

### Problems with This Approach

1. **High Complexity**: 150+ lines of filtering logic
2. **Maintenance Burden**: Every template change requires updating:
   - The giant template string
   - The filtering logic
   - The MODULE_KEYS mapping
   - The instruction filtering
3. **Error-Prone**: Easy to miss nested sections or break JSON structure
4. **Hard to Test**: 15 possible combinations (2^4 - 1) to verify
5. **Violates DRY**: Duplication between full template and filtering logic
6. **Poor Scalability**: Adding a new module requires changing multiple places

---

## Proposed Solution: Compositional Templates

### Core Concept

**Instead of filtering a giant template, compose from small independent templates.**

Create separate template files for each concern:

```
src/lib/market-analysis-templates/
├── base.json                           # Schema + meta + core instructions
├── modules/
│   ├── market-sizing.json             # Just market_sizing section
│   ├── competitive-intelligence.json  # Just competitive_landscape section
│   ├── customer-analysis.json         # Just customer_analysis section
│   └── strategic-planning.json        # Just strategic_planning section
├── instructions/
│   ├── core-instructions.json         # Base AI instructions
│   └── module-descriptions.json       # Per-module AI guidance
└── index.ts                           # Composition logic
```

### Implementation

#### 1. Base Template (`base.json`)

```json
{
  "schema_version": "2.0",
  "meta": {
    "title": "TODO-Market Analysis Title",
    "description": "TODO-Market analysis description",
    "currency": "EUR",
    "base_year": 2024,
    "analysis_horizon_years": 5,
    "created_date": "TODO-YYYY-MM-DD",
    "analyst": "TODO-Analyst Name"
  }
}
```

#### 2. Module Templates (e.g., `modules/market-sizing.json`)

```json
{
  "market_sizing": {
    "total_addressable_market": {
      "base_value": { "value": 0.0, "unit": "EUR", "rationale": "TODO-..." },
      "growth_rate": { "value": 0.0, "unit": "percentage_per_year", "rationale": "TODO-..." }
    },
    "serviceable_addressable_market": { /* ... */ },
    "serviceable_obtainable_market": { /* ... */ }
  },
  "market_share": {
    "current_position": { /* ... */ },
    "target_position": { /* ... */ }
  }
}
```

#### 3. Composition Logic (`index.ts`)

```typescript
import baseTemplate from './base.json';
import marketSizingModule from './modules/market-sizing.json';
import competitiveModule from './modules/competitive-intelligence.json';
import customerModule from './modules/customer-analysis.json';
import strategicModule from './modules/strategic-planning.json';
import coreInstructions from './instructions/core-instructions.json';
import moduleDescriptions from './instructions/module-descriptions.json';

type ModuleId = 'market_sizing' | 'competitive_intelligence' | 'customer_analysis' | 'strategic_planning';

interface TemplateOptions {
  modules: ModuleId[];
  includeInstructions?: boolean;
}

/**
 * Compose a market analysis template from selected modules
 * @param options Configuration for template generation
 * @returns Composed JSON template as string
 */
export function composeMarketAnalysisTemplate(options: TemplateOptions): string {
  const { modules, includeInstructions = true } = options;
  
  // Start with base template
  const composed: any = {
    ...baseTemplate
  };
  
  // Add instructions if requested
  if (includeInstructions) {
    composed.instructions = buildInstructions(modules);
  }
  
  // Add each selected module (simple object spreading!)
  if (modules.includes('market_sizing')) {
    Object.assign(composed, marketSizingModule);
  }
  
  if (modules.includes('competitive_intelligence')) {
    Object.assign(composed, competitiveModule);
  }
  
  if (modules.includes('customer_analysis')) {
    Object.assign(composed, customerModule);
  }
  
  if (modules.includes('strategic_planning')) {
    Object.assign(composed, strategicModule);
  }
  
  // Update meta description with selected modules
  if (modules.length > 0) {
    composed.meta.description = `Market analysis template - Modules: ${modules.join(', ')}`;
  }
  
  return JSON.stringify(composed, null, 2);
}

/**
 * Build instruction section based on selected modules
 */
function buildInstructions(modules: ModuleId[]) {
  return {
    ...coreInstructions,
    module_independence: {
      note: `This template includes: ${modules.map(getModuleName).join(', ')}`,
      modules: modules.reduce((acc, moduleId) => {
        acc[moduleId] = moduleDescriptions[moduleId];
        return acc;
      }, {} as any)
    }
  };
}

function getModuleName(moduleId: ModuleId): string {
  const names: Record<ModuleId, string> = {
    market_sizing: 'Market Sizing',
    competitive_intelligence: 'Competitive Intelligence',
    customer_analysis: 'Customer Analysis',
    strategic_planning: 'Strategic Planning'
  };
  return names[moduleId];
}

/**
 * Get the full template with all modules
 */
export function getFullTemplate(): string {
  return composeMarketAnalysisTemplate({
    modules: ['market_sizing', 'competitive_intelligence', 'customer_analysis', 'strategic_planning']
  });
}

/**
 * Get a minimal template with only selected modules
 */
export function getModularTemplate(moduleIds: string[]): string {
  return composeMarketAnalysisTemplate({
    modules: moduleIds as ModuleId[]
  });
}
```

---

## Comparison: Before vs After

### Before (Current System)

```typescript
// 382-line string literal
export const MarketAnalysisTemplate = `{ /* huge JSON */ }`;

// 150+ lines of filtering logic
export function generateModularTemplate(selectedModules: string[]): string {
  const fullTemplate = JSON.parse(MarketAnalysisTemplate);
  const modularTemplate: any = { /* complex filtering */ };
  // ... 150 more lines ...
  return JSON.stringify(modularTemplate, null, 2);
}
```

**Complexity:**
- 1 giant file with 382 lines of JSON
- Complex filtering with nested logic
- Manual key mapping: `MODULE_KEYS`
- Instruction filtering logic
- Hard to maintain

### After (Proposed System)

```typescript
// Simple composition from small files
import baseTemplate from './base.json';
import marketSizingModule from './modules/market-sizing.json';
// ... other modules ...

export function composeMarketAnalysisTemplate(options: TemplateOptions): string {
  const composed = {
    ...baseTemplate,
    ...(options.modules.includes('market_sizing') ? marketSizingModule : {}),
    ...(options.modules.includes('competitive') ? competitiveModule : {}),
    // ... etc.
  };
  
  return JSON.stringify(composed, null, 2);
}
```

**Simplicity:**
- 6 small, focused JSON files
- Simple object spreading
- Clear, declarative composition
- Easy to maintain and extend

---

## Benefits

### 1. Drastically Reduced Complexity

**Before:** ~530 lines (382 template + 150 filtering logic)  
**After:** ~450 lines total across 6 files + ~100 lines simple composition  
**Net:** ~20% reduction + much simpler logic

### 2. Easier Maintenance

- **Edit one module**: Just edit that module's JSON file
- **Add new module**: Create new file, add one line to composition
- **Update instructions**: Edit instruction files independently
- **No risk of breaking other modules**: Each file is isolated

### 3. Better Testing

```typescript
// Test each module independently
describe('Market Sizing Module', () => {
  it('has valid JSON structure', () => {
    expect(() => JSON.parse(marketSizingModule)).not.toThrow();
  });
  
  it('includes required fields', () => {
    const module = JSON.parse(marketSizingModule);
    expect(module.market_sizing).toBeDefined();
    expect(module.market_sizing.total_addressable_market).toBeDefined();
  });
});

// Test composition
describe('Template Composition', () => {
  it('composes multiple modules correctly', () => {
    const template = composeMarketAnalysisTemplate({
      modules: ['market_sizing', 'competitive_intelligence']
    });
    const parsed = JSON.parse(template);
    expect(parsed.market_sizing).toBeDefined();
    expect(parsed.competitive_landscape).toBeDefined();
    expect(parsed.customer_analysis).toBeUndefined(); // Not selected
  });
});
```

### 4. Type Safety

```typescript
// Each module can have its own interface
interface MarketSizingTemplate {
  market_sizing: {
    total_addressable_market: TAMData;
    serviceable_addressable_market: SAMData;
    serviceable_obtainable_market: SOMData;
  };
  market_share: MarketShareData;
}

// Composition is type-checked
const template: MarketAnalysisTemplate = composeTemplate({ /* ... */ });
```

### 5. Reusability

```typescript
// Other tools can import modules directly
import marketSizingModule from '@/lib/templates/modules/market-sizing.json';

// Or compose custom combinations
const customTemplate = {
  ...baseTemplate,
  ...marketSizingModule,
  custom_section: myCustomData
};
```

### 6. Version Control Friendly

- Small, focused diffs when modules change
- Easy to track changes per module
- Easier code reviews
- Clear git history

### 7. Internationalization Ready

```
templates/
├── en/
│   ├── base.json
│   └── modules/
│       └── market-sizing.json
├── fi/
│   ├── base.json
│   └── modules/
│       └── market-sizing.json
└── index.ts  # Language-aware composition
```

---

## Migration Plan

### Phase 1: Create New Structure (1-2 hours)

1. Create `src/lib/market-analysis-templates/` directory
2. Split `MarketAnalysisTemplate.ts` into separate JSON files:
   - Extract base template → `base.json`
   - Extract market_sizing section → `modules/market-sizing.json`
   - Extract competitive_landscape → `modules/competitive-intelligence.json`
   - Extract customer_analysis → `modules/customer-analysis.json`
   - Extract strategic_planning → `modules/strategic-planning.json`
   - Extract instructions → `instructions/core-instructions.json`
3. Create composition logic in `index.ts`

### Phase 2: Update Imports (30 minutes)

1. Update `DataManagementModule.tsx`:
   ```typescript
   // Before
   import { generateModularTemplate } from '../MarketAnalysisTemplate';
   
   // After
   import { composeMarketAnalysisTemplate } from '@/lib/market-analysis-templates';
   ```

2. Update all calls:
   ```typescript
   // Before
   const template = generateModularTemplate(selectedModules);
   
   // After
   const template = composeMarketAnalysisTemplate({ modules: selectedModules });
   ```

### Phase 3: Testing (1 hour)

1. Test each module template individually
2. Test all 15 combinations of modules
3. Verify UI still works correctly
4. Test export/import functionality

### Phase 4: Cleanup (15 minutes)

1. Delete old `MarketAnalysisTemplate.ts`
2. Delete old `generateModularTemplate` function
3. Update documentation

**Total Migration Time:** ~4 hours

---

## Code Examples

### Example 1: Full Template

```typescript
import { getFullTemplate } from '@/lib/market-analysis-templates';

const fullTemplate = getFullTemplate();
// Returns JSON with all 4 modules
```

### Example 2: Partial Template

```typescript
import { composeMarketAnalysisTemplate } from '@/lib/market-analysis-templates';

const partialTemplate = composeMarketAnalysisTemplate({
  modules: ['market_sizing', 'competitive_intelligence']
});
// Returns JSON with only market sizing + competitive modules
```

### Example 3: Custom Instructions

```typescript
const templateForAI = composeMarketAnalysisTemplate({
  modules: ['market_sizing'],
  includeInstructions: true  // Include AI prompts
});

const templateForExport = composeMarketAnalysisTemplate({
  modules: ['market_sizing'],
  includeInstructions: false  // Clean data only
});
```

---

## File Structure After Migration

```
src/lib/market-analysis-templates/
├── base.json                          (20 lines)
├── modules/
│   ├── market-sizing.json            (80 lines)
│   ├── competitive-intelligence.json  (90 lines)
│   ├── customer-analysis.json        (70 lines)
│   └── strategic-planning.json       (85 lines)
├── instructions/
│   ├── core-instructions.json        (60 lines)
│   └── module-descriptions.json      (40 lines)
└── index.ts                          (100 lines - composition logic)
```

**Total:** ~545 lines across 8 files (vs 530 lines in 1 file)  
**But:** Much simpler, more maintainable, easier to test

---

## Alternative Considered: Template Builder Class

```typescript
class MarketAnalysisTemplateBuilder {
  private template: any;
  
  constructor() {
    this.template = { ...baseTemplate };
  }
  
  withMarketSizing(): this {
    Object.assign(this.template, marketSizingModule);
    return this;
  }
  
  withCompetitiveIntelligence(): this {
    Object.assign(this.template, competitiveModule);
    return this;
  }
  
  build(): string {
    return JSON.stringify(this.template, null, 2);
  }
}

// Usage
const template = new MarketAnalysisTemplateBuilder()
  .withMarketSizing()
  .withCompetitiveIntelligence()
  .build();
```

**Pros:** Fluent API, extensible  
**Cons:** Overkill for this use case, more verbose

**Decision:** Stick with simple function-based composition

---

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality

**Mitigation:** 
- Keep old system during migration
- Comprehensive testing before removal
- Feature flag for gradual rollout

### Risk 2: JSON File Loading Issues

**Mitigation:**
- Bundle JSON files with Vite
- TypeScript imports handle JSON natively
- Test in build environment

### Risk 3: Loss of Instructions Context

**Mitigation:**
- Keep instructions in separate files
- Compose them dynamically based on selected modules
- Maintain same level of detail

---

## Recommendation

✅ **Proceed with Compositional Templates**

**Why:**
1. **Significantly simpler** - No complex filtering logic
2. **Easier to maintain** - Each module is independent
3. **More testable** - Unit test each module separately
4. **Better scalability** - Easy to add new modules
5. **Low risk** - Can migrate incrementally
6. **Quick migration** - ~4 hours total effort

**Next Steps:**
1. Review this proposal with team
2. Create proof-of-concept with one module
3. If approved, execute full migration
4. Update documentation

---

**Status:** Ready for Implementation  
**Estimated ROI:** Save 2-3 hours per month in maintenance  
**Technical Debt Reduction:** High

