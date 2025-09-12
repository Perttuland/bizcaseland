## Copilot instructions for Bizcaseland

Purpose: help an AI coding agent become productive quickly in this repo by describing the architecture, data model, conventions, developer workflows, integration points and a few project-specific gotchas.

**IMPORTANT**: Avoid using terminal commands. When you do use `;` instead of `&&` as we are in VSCode.

## Big Picture Architecture

- **Dual-Purpose Application**: React + Vite + TypeScript app with two main analysis suites:
  1. **Business Case Analyzer**: Financial modeling and business case development
  2. **Market Analysis Suite**: Comprehensive market research with interactive visualizations

- **Entry Points**: `src/main.tsx` -> `App` (`src/App.tsx`) -> routes:
  - `/` - Landing page (`src/pages/Index.tsx`)
  - `/business` - Business Case Analyzer
  - `/market` - Market Analysis Suite

- **State Management**: 
  - **Global App State**: `AppContext` (`src/contexts/AppContext.tsx`) - unified state with localStorage persistence
  - **Business Case State**: `BusinessDataContext` (`src/contexts/BusinessDataContext.tsx`) - legacy, being migrated to AppContext
  - **Market Analysis State**: Uses AppContext with `MarketData` interface

- **Component Organization** (reorganized for maintainability):
  ```
  src/components/
  ├── business-case/     # Business case analysis components
  ├── market-analysis/   # Market research suite with 6 specialized modules
  ├── landing/          # Landing page components
  ├── shared/           # Reusable components across both suites
  └── ui/              # shadcn/ui base components
  ```

## Data Models & Contracts

### Business Case Data (`BusinessData` interface)
- **Location**: `src/contexts/BusinessDataContext.tsx` and `src/types/business-data.ts`
- **Financial Engine**: `src/lib/calculations.ts` — canonical source for all financial calculations
- **Key Rules**:
  - Every numeric datum: `{ value: number, unit: string, rationale: string }`
  - Drivers use `path` strings (e.g., `assumptions.pricing.avg_unit_price.value`)
  - Driver `range` is array of numeric test points
  - Only one growth pattern per segment (geom_growth, seasonal_growth, or linear_growth)
  - Default horizon: 60 periods unless overridden in `meta.periods`

### Market Analysis Data (`MarketData` interface)
- **Location**: `src/lib/market-calculations.ts` and `src/lib/market-suite-calculations.ts`
- **Key Structure**:
  ```typescript
  interface MarketData {
    schema_version: string;
    meta: ProjectMetadata;
    market_sizing: { tam, sam, som };
    market_share: MarketShareData;
    competitive_landscape: CompetitiveLandscapeData;
    customer_analysis: CustomerAnalysisData;
  }
  ```
- **Calculations**: `calculateSuiteMetrics()` and `validateMarketSuiteData()` in `market-suite-calculations.ts`

### Test Data Locations
- **Business Case**: `Bizcase analyst/Test data/0.62/`
- **Market Analysis**: Sample data embedded in DataManagementModule and MarketAnalysisTemplate.ts

## Market Analysis Suite Architecture

The Market Analysis Suite is a comprehensive market research tool with 6 specialized modules:

### Core Components
- **Main Orchestrator**: `src/components/market-analysis/MarketAnalysisSuite.tsx`
- **Integration Wrapper**: `src/components/MarketAnalysis.tsx` (used by BusinessCaseAnalyzer)
- **Data Templates**: `src/components/market-analysis/MarketAnalysisTemplate.ts`

### Six Specialized Modules (all in `src/components/market-analysis/modules/`)
1. **MarketSizingModule.tsx** - TAM/SAM/SOM analysis with PieChart, BarChart, LineChart, AreaChart
2. **CompetitiveIntelligenceModule.tsx** - Competitor analysis with ScatterChart, RadarChart, BarChart
3. **CustomerAnalysisModule.tsx** - Customer segmentation with BarChart, LineChart
4. **StrategicPlanningModule.tsx** - Strategic planning with AreaChart, LineChart
5. **OpportunityAssessmentModule.tsx** - Market opportunity assessment with custom visualizations
6. **DataManagementModule.tsx** - JSON import/export, templates, validation

### Chart Technology
- **Library**: Recharts for all visualizations
- **Pattern**: All modules use ResponsiveContainer with consistent styling
- **Integration**: Charts automatically update when data changes via AppContext

## Project-Specific Conventions & Patterns
### Design & UI Patterns
- **Design Tokens**: HSL CSS variables in `src/index.css` — avoid hard-coded hex colors
- **UI Components**: shadcn-ui patterns in `src/components/ui/` (button.tsx, card.tsx, etc.)
- **Styling**: Tailwind CSS with HSL color system wired through `tailwind.config.ts`
- **Responsive**: Mobile-first approach with Tailwind breakpoints

### Component Organization
- **Barrel Exports**: Each folder has `index.ts` for clean imports
- **Shared Components**: Reusable components in `src/components/shared/`
- **Module Pattern**: Market analysis modules follow standard interface: `{ marketData, onDataUpdate, metrics }`

### State Management Patterns
- **AppContext**: Global state with localStorage persistence for both suites
- **BusinessDataContext**: Legacy context being gradually migrated to AppContext
- **Data Flow**: Props down, callbacks up pattern with centralized state updates
- **Persistence**: Automatic localStorage sync with selective updates for performance

### Routing & Navigation
- **Router**: React Router in `src/App.tsx`
- **Add Routes**: Place new routes above the catch-all `*` route
- **Navigation**: Consistent navigation patterns with back buttons and breadcrumbs

## Integration Points & External Dependencies

- **No Server API**: Pure client-side app with JSON import/export for data persistence
- **Data Ingestion**: UI-based (paste JSON, load samples) with client-side persistence
- **External Integration**: Lovable.dev integration mentioned in `README.md` for auto-commits

### Key Libraries & Versions (see `package.json`)
- **Core**: React 18, Vite, TypeScript
- **UI**: Tailwind CSS, shadcn-ui, Radix primitives
- **Charts**: Recharts for all data visualizations
- **Routing**: React Router for SPA navigation
- **State**: React Context + localStorage (no external state libraries)
- **Testing**: Vitest for unit tests

## Important Gotchas (Do Not Change Lightly)

### Business Case Engine
- **Date Logic**: `src/lib/calculations.ts` uses default start date `new Date('2026-01-01')` for monthly timelines — tests and UI assume consistent periods
- **IRR Calculations**: Returns magic error codes (`IRR_ERROR_CODES`) — use `isIRRError()` and `getIRRErrorMessage()` when exposing results
- **JSON Template Rules**: Missing `rationale` or wrong data shapes will break calculations (see test data structure)

### Market Analysis Engine
- **Data Validation**: `validateMarketSuiteData()` enforces strict schema compliance
- **Chart Integration**: All modules expect data via props, not direct context access
- **Module Interface**: Standard props: `{ marketData, onDataUpdate, metrics }` — don't break this contract

### Styling System
- **HSL Variables**: System expects HSL color values — non-HSL colors will break theming
- **Responsive Design**: Mobile-first Tailwind patterns — don't use fixed pixel sizes
- **Component Isolation**: shadcn/ui components should not be modified directly

### Performance Considerations
- **Bundle Size**: ~911KB minified due to chart libraries — avoid adding heavy dependencies
- **Chart Rendering**: Recharts components wrapped in ResponsiveContainer for performance
- **State Updates**: localStorage persistence is throttled — don't trigger excessive updates

## Where to Change Behavior

### Business Case Functionality
- **Financial Logic**: Edit `src/lib/calculations.ts` and add tests in `src/lib/calculations.test.ts`
- **Data Types**: Update `src/contexts/BusinessDataContext.tsx` and `src/types/business-data.ts` in tandem
- **UI Components**: `src/components/business-case/BusinessCaseAnalyzer.tsx` orchestrates tabs
- **State Updates**: Use `BusinessDataContext.updateAssumption` / `updateDriver` and helpers in `src/lib/utils/*`

### Market Analysis Functionality  
- **Market Logic**: Edit `src/lib/market-calculations.ts` and `src/lib/market-suite-calculations.ts`
- **Data Types**: Update `MarketData` interface in `src/lib/market-calculations.ts`
- **UI Components**: `src/components/market-analysis/MarketAnalysisSuite.tsx` orchestrates modules
- **Chart Modules**: Individual modules in `src/components/market-analysis/modules/`
- **State Updates**: Use AppContext `updateMarketData()` method

### Global App Behavior
- **Unified State**: Edit `src/contexts/AppContext.tsx` for cross-suite state management
- **Routing**: Add routes in `src/App.tsx` above the catch-all route
- **Shared Components**: Reusable components in `src/components/shared/`
- **UI Primitives**: Base components in `src/components/ui/` (shadcn/ui)

## Helpful Examples & Patterns

### Business Case Examples
- **Driver Path**: `assumptions.pricing.avg_unit_price.value` (see test data in `Bizcase analyst/Test data/0.62/`)
- **Revenue Calculation Flow**: `generateMonthlyData()` -> `calculateDynamicTotalVolumeForMonth()` -> `calculateDynamicUnitPrice()` in `src/lib/calculations.ts`
- **Data Update Pattern**: `BusinessDataContext.updateAssumption(path, newValue)` 

### Market Analysis Examples
- **Module Development**: See existing modules in `src/components/market-analysis/modules/` for standard patterns
- **Chart Integration**: All charts use Recharts with ResponsiveContainer wrapper
- **Data Flow**: `AppContext.updateMarketData()` -> props to modules -> chart re-render
- **Sample Data**: Comprehensive examples in `MarketAnalysisTemplate.ts` and DataManagementModule

### Common Patterns
- **Component Structure**: Export main component, subcomponents, helpers, types (in that order)
- **Error Handling**: Use ErrorBoundary components and proper loading states
- **State Management**: Props down, callbacks up with centralized state updates
- **Import Organization**: Barrel exports in index.ts files for clean imports

### Adding New Features
1. **New Business Case Tab**: Add to BusinessCaseAnalyzer tabs, implement calculation logic in calculations.ts
2. **New Market Module**: Create in modules/ folder, follow existing interface pattern, add to MarketAnalysisSuite moduleConfig
3. **New Chart Type**: Use Recharts components, wrap in ResponsiveContainer, follow color scheme
4. **New Shared Component**: Add to shared/ folder with proper TypeScript interfaces

## Agent Coding Rules & Standards

### Code Style & Structure
- **Language**: Concise, technical TypeScript with accurate examples
- **Paradigm**: Prefer functional, declarative patterns; avoid classes
- **File Structure**: Exported component, subcomponents, helpers, static content, types (in that order)
- **Naming**: Descriptive boolean/flag names: `isLoading`, `hasError`, `isValid`
- **Directories**: lowercase with dashes (e.g., `components/auth-wizard`)
- **Exports**: Favor named exports for components and helpers

### TypeScript Standards
- **New Code**: Use TypeScript for all new code
- **Types vs Interfaces**: Prefer `interface` over `type` for public shapes
- **Enums**: Avoid `enum`; use maps/objects instead
- **Components**: Functional components with interface-typed props
- **Functions**: Use `function` keyword for pure functions (better stack traces and testing)

### UI & Styling Standards
- **Components**: Use Shadcn UI + Radix primitives with Tailwind utilities
- **Responsive**: Mobile-first implementation with Tailwind breakpoints
- **Primitives**: Reuse `src/components/ui/*` rather than raw HTML + Tailwind
- **Colors**: Preserve HSL token system in `src/index.css` and `tailwind.config.ts`
- **Conditionals**: Favor concise conditionals and declarative JSX

### Performance & Architecture
- **State Management**: Minimize `useEffect` and client state when possible
- **Loading Strategy**: Use `Suspense` with fallback and dynamic imports for non-critical code
- **Images**: Optimize with WebP, size attributes, lazy loading when adding assets
- **Bundle Size**: Be mindful of dependency weight (current bundle ~911KB)

### Project-Specific Rules
- **Chart Integration**: Always wrap Recharts components in ResponsiveContainer
- **Error Handling**: Use established error boundary patterns and IRR error codes
- **Data Validation**: Follow established validation patterns for both business and market data
- **State Updates**: Use established context methods rather than direct state mutation
- **Terminal Usage**: Use `;` instead of `&&` when chaining commands (VSCode environment)
