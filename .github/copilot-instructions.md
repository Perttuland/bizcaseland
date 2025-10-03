## Copilot Instructions for Bizcaseland

**Purpose:** Help AI coding agents become productive quickly in this repo.

**IMPORTANT**: Use `;` instead of `&&` when chaining terminal commands (VSCode environment).

---

## 📚 Core Documentation (Read These First!)

Before making changes, consult these master documents:

1. **[docs/SPECIFICATIONS.md](../docs/SPECIFICATIONS.md)** - Product specs, user journey, UX principles, JSON templates
2. **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** - Technical architecture, component structure, state management, calculations
3. **[docs/TEST_ARCHITECTURE.md](../docs/TEST_ARCHITECTURE.md)** - Testing strategy, test patterns, coverage requirements

**Rule:** If specs/architecture docs conflict with this file, the docs/ files are the source of truth.

---

## 🎯 Quick Start

**What is Bizcaseland?**  
An AI-first business analysis platform where users:
1. Export JSON templates from our tool
2. Populate them with AI (ChatGPT/Claude) with rationale
3. Import back to visualize and analyze
4. Edit inline, run sensitivity analysis
5. Export as JSON or PDF

**Two Main Tools:**
- **Business Case Analyzer** (`/business`) - Financial modeling with NPV, IRR, sensitivity analysis
- **Market Analysis Suite** (`/market`) - Market sizing, competitive analysis, customer segmentation

**Entry Point:** `src/main.tsx` → `App.tsx` → React Router → `pages/Index.tsx` (landing) or tool pages

**State:** Global `AppContext` + localStorage persistence (no backend)

---

## 🏗️ Architecture Quick Reference

**Full details:** See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

### Component Structure
```
src/
├── components/
│   ├── business-case/      # Business Case Analyzer tabs
│   ├── market-analysis/    # Market Analysis Suite modules
│   ├── shared/             # Reusable cross-tool components
│   └── ui/                 # shadcn/ui base components
├── lib/                    # Business logic
│   ├── calculations.ts              # Business case financial engine
│   ├── market-calculations.ts       # Market analysis calculations
│   └── market-suite-calculations.ts # Market suite metrics
├── contexts/               # React Context providers
│   ├── AppContext.tsx              # Global state + localStorage
│   └── BusinessDataContext.tsx     # Legacy (being migrated)
└── types/                  # TypeScript interfaces
```

### Key Data Interfaces

**Business Case:**
- Location: `src/types/business-data.ts`
- Pattern: Every number = `{ value, unit, rationale }`
- Calculations: `src/lib/calculations.ts`

**Market Analysis:**
- Location: `src/lib/market-calculations.ts`
- Structure: `{ meta, market_sizing, competitive_landscape, customer_analysis }`
- Calculations: `src/lib/market-suite-calculations.ts`

### State Management
- **AppContext**: Global state for both tools + localStorage persistence
- **BusinessDataContext**: Legacy (being migrated to AppContext)
- **Pattern**: Props down, callbacks up

---

## 🔧 Development Patterns

### Tech Stack
- **Core**: React 18 + Vite + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix primitives
- **Charts**: Recharts (all visualizations)
- **State**: React Context + localStorage (no backend)
- **Testing**: Vitest

### Code Style
- **Language**: TypeScript for all new code
- **Components**: Functional components with typed props
- **Types**: Prefer `interface` over `type` for public shapes
- **Naming**: Descriptive booleans (`isLoading`, `hasError`)
- **Exports**: Named exports for components and helpers
- **Functions**: Use `function` keyword (better stack traces)

### UI Patterns
- **Design System**: HSL CSS variables in `src/index.css` (don't use hard-coded hex)
- **Components**: Reuse `src/components/ui/*` (shadcn/ui) over raw HTML
- **Responsive**: Mobile-first with Tailwind breakpoints
- **Charts**: Always wrap Recharts in `ResponsiveContainer`

### State & Data Flow
- **Global State**: Use `AppContext` for cross-tool state
- **Data Updates**: Use context methods, not direct mutation
- **Persistence**: Auto-saves to localStorage (no manual save needed)
- **Pattern**: Props down, callbacks up

---

## ⚠️ Critical Rules (Don't Break These!)

### Financial Calculations
- **IRR Error Codes**: Use `isIRRError()` and `getIRRErrorMessage()` — don't expose raw error codes
- **Date Logic**: Default start date is `2026-01-01` — tests assume this
- **Rationale Required**: Every number needs `{ value, unit, rationale }` — missing rationale breaks calculations

### Data Validation
- **JSON Schema**: Both tools enforce strict schema validation — test before committing
- **Market Analysis**: `validateMarketSuiteData()` is the authority
- **Business Case**: All paths must resolve (e.g., `assumptions.pricing.avg_unit_price.value`)

### UI & Styling
- **HSL Colors Only**: Use CSS variables from `src/index.css` — hex colors break theming
- **ResponsiveContainer**: Always wrap Recharts components
- **Mobile-First**: Use Tailwind breakpoints, not fixed pixels
- **Don't Modify**: shadcn/ui components in `src/components/ui/` should not be edited

### Performance
- **Bundle Size**: ~911KB — avoid heavy dependencies
- **Chart Performance**: Use ResponsiveContainer + memoization
- **localStorage**: Auto-throttled — don't trigger excessive updates

---

## 📝 Making Changes

### Business Case Changes
- **Calculations**: Edit `src/lib/calculations.ts` (add tests!)
- **Data Model**: Update `src/types/business-data.ts`
- **UI**: Main orchestrator is `src/components/business-case/BusinessCaseAnalyzer.tsx`
- **State**: Use `AppContext.updateBusinessData()` or legacy `BusinessDataContext` methods

### Market Analysis Changes
- **Calculations**: Edit `src/lib/market-calculations.ts` or `market-suite-calculations.ts`
- **Data Model**: Update `MarketData` interface in `src/lib/market-calculations.ts`
- **UI**: Main orchestrator is `src/components/market-analysis/MarketAnalysisSuite.tsx`
- **Modules**: Individual modules in `src/components/market-analysis/modules/`
- **State**: Use `AppContext.updateMarketData()`

### Global Changes
- **Routing**: Add routes in `src/App.tsx` (above catch-all `*` route)
- **Shared UI**: Add to `src/components/shared/`
- **Global State**: Edit `src/contexts/AppContext.tsx`

### Adding New Features

**New Business Case Tab:**
1. Add tab to `BusinessCaseAnalyzer.tsx`
2. Implement calculations in `calculations.ts`
3. Add tests
4. Update TypeScript interfaces

**New Market Module:**
1. Create in `src/components/market-analysis/modules/`
2. Follow pattern: `{ marketData, onDataUpdate, metrics }` props
3. Wrap charts in `ResponsiveContainer`
4. Add to `MarketAnalysisSuite.tsx` module config

**New Shared Component:**
1. Add to `src/components/shared/`
2. Create TypeScript interfaces
3. Use shadcn/ui primitives
4. Export via barrel file

---

## 🧪 Testing

**Full details:** See [docs/TEST_ARCHITECTURE.md](../docs/TEST_ARCHITECTURE.md)

- **Framework**: Vitest
- **Run Tests**: `npm test`
- **Coverage**: `npm run test:coverage`
- **Key Tests**: `src/lib/calculations.test.ts`, `src/lib/market-calculations.test.ts`
- **Pattern**: Test pure functions, mock React hooks, use realistic data

---

## 🚀 Common Tasks

**Run Development Server:**
```bash
npm run dev
```

**Run Tests:**
```bash
npm test
```

**Build for Production:**
```bash
npm run build
```

**Type Check:**
```bash
npm run type-check
```

---

## 📖 When in Doubt

1. Check **[docs/SPECIFICATIONS.md](../docs/SPECIFICATIONS.md)** for product/UX questions
2. Check **[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)** for technical questions
3. Check **[docs/TEST_ARCHITECTURE.md](../docs/TEST_ARCHITECTURE.md)** for testing questions
4. Look at existing code for patterns (especially in `src/components/market-analysis/modules/`)
5. Verify JSON schema compliance before committing

---

**Last Updated:** October 3, 2025
