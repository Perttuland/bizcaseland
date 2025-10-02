# Application Architecture Documentation

**Last Updated:** October 2, 2025  
**Version:** 2.0

---

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Application Structure](#application-structure)
3. [Core Features](#core-features)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [State Management](#state-management)
7. [Calculation Engines](#calculation-engines)
8. [Routing & Navigation](#routing--navigation)
9. [Persistence Layer](#persistence-layer)
10. [UI/UX Patterns](#uiux-patterns)

---

## High-Level Architecture

Bizcaseland is a **Single Page Application (SPA)** built with React that provides integrated business case analysis and market research capabilities.

### Architecture Pattern
**Layered Architecture with Context-Based State Management**

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                  │
│  (React Components, UI, Charts, User Interactions)  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│              State Management Layer                  │
│    (React Context API, AppContext, Providers)       │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│              Business Logic Layer                    │
│     (Calculation Engines, Validation, Utils)        │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────┐
│              Persistence Layer                       │
│          (localStorage, Data Serialization)          │
└─────────────────────────────────────────────────────┘
```

### Key Design Principles
1. **Separation of Concerns:** Clear boundaries between presentation, logic, and data
2. **Component Reusability:** Shared components across different features
3. **Unidirectional Data Flow:** Props down, events up pattern
4. **Data Persistence:** Automatic localStorage syncing
5. **Type Safety:** Full TypeScript coverage
6. **Responsive Design:** Mobile-first approach with Tailwind CSS

---

## Application Structure

### Directory Organization

```
bizcaseland/
├── src/
│   ├── components/           # React components
│   │   ├── business-case/   # Business case analyzer components
│   │   ├── market-analysis/ # Market analysis suite components
│   │   ├── landing/         # Landing page components
│   │   ├── shared/          # Reusable shared components
│   │   └── ui/             # Base UI components (shadcn/ui)
│   ├── contexts/            # React Context providers
│   │   ├── AppContext.tsx          # Global app state
│   │   ├── BusinessDataContext.tsx # Business case state
│   │   ├── DataManagerContext.tsx  # Data management
│   │   └── ThemeProvider.tsx       # Theme management
│   ├── lib/                 # Business logic & utilities
│   │   ├── calculations.ts          # Business calculations
│   │   ├── market-calculations.ts   # Market calculations
│   │   ├── market-suite-calculations.ts
│   │   ├── json-validation-enhanced.ts
│   │   ├── data-shopping-service.ts
│   │   ├── market-insights-cart-service.ts
│   │   └── utils/                   # General utilities
│   ├── pages/               # Page-level components
│   │   ├── Index.tsx
│   │   ├── CrossToolDemo.tsx
│   │   └── NotFound.tsx
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── test/               # Test suites
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
│   └── sample-data/        # Sample JSON data files
├── docs/                   # Documentation
│   ├── TEST_ARCHITECTURE.md
│   ├── ARCHITECTURE.md (this file)
│   └── ...
├── package.json
└── vite.config.ts
```

---

## Core Features

### 1. Business Case Analyzer

**Purpose:** Financial modeling and ROI analysis for business projects

**Key Capabilities:**
- Multi-period cash flow projections (up to 60 periods)
- NPV (Net Present Value) and IRR (Internal Rate of Return) calculations
- Break-even analysis and payback period
- Multi-segment customer modeling
- Revenue stream management
- OPEX and CAPEX tracking
- Sensitivity analysis
- JSON-based data import/export

**Main Components:**
- `BusinessCaseAnalyzer.tsx` - Main orchestrator component
- `DataInputSection.tsx` - Data loading and validation
- `CashFlowTab.tsx` - Cash flow projections
- `RevenueTab.tsx` - Revenue analysis
- `AssumptionsTab.tsx` - Business assumptions
- `SensitivityTab.tsx` - Sensitivity analysis

**Calculation Engine:**
- Location: `src/lib/calculations.ts` (1,500+ lines)
- Pure functions for all financial calculations
- Comprehensive error handling
- Support for multiple growth patterns (linear, geometric, seasonal)

### 2. Market Analysis Suite

**Purpose:** Market research, competitive analysis, and strategic planning

**Key Capabilities:**
- TAM/SAM/SOM market sizing
- Market share progression modeling
- Competitive landscape analysis
- Customer segmentation
- Strategic planning frameworks
- Market insights shopping cart
- Data export to business case

**Main Components:**
- `MarketAnalysisSuite.tsx` - Main orchestrator
- `MarketOverviewModule.tsx` - Market sizing and overview
- `CompetitiveAnalysisModule.tsx` - Competitive intelligence
- `CustomerAnalysisModule.tsx` - Customer segmentation
- `StrategicPlanningModule.tsx` - Strategic frameworks
- `DataManagementModule.tsx` - Data import/export
- `MarketInsightsCart.tsx` - Shopping cart for insights

**Calculation Engine:**
- Location: `src/lib/market-calculations.ts` (500+ lines)
- Market sizing algorithms
- Growth projection models
- Opportunity scoring

### 3. Cross-Tool Integration

**Purpose:** Seamless data flow between business case and market analysis

**Key Capabilities:**
- Market insights shopping cart
- Data transfer between tools
- Unified data management
- Context switching without data loss

**Main Components:**
- `CrossToolDemo.tsx` - Integration demonstration page
- `VolumeComparison.tsx` - Cross-tool data comparison
- Data shopping service: `src/lib/data-shopping-service.ts`
- Cart service: `src/lib/market-insights-cart-service.ts`

### 4. Landing Page & Navigation

**Purpose:** Entry point and mode selection

**Key Components:**
- `LandingPage.tsx` - Main landing page
- Navigation controls
- Data status indicators
- Quick action buttons

---

## Data Flow

### Global Data Flow Architecture

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  React Component │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│  Context Provider    │
│  (AppContext, etc.)  │
└──────┬───────────────┘
       │
       ├──▶ State Update (useState/useReducer)
       │
       ├──▶ localStorage Sync
       │
       └──▶ Child Components Re-render
```

### State Update Flow

1. **User Interaction** → Event handler in component
2. **Event Handler** → Calls context method (e.g., `updateBusinessData()`)
3. **Context Method** → Updates state and persists to localStorage
4. **State Change** → Triggers re-render of subscribed components
5. **Components** → Receive updated data via context

### Data Persistence Flow

```
Component Update
      ↓
Context Method Called
      ↓
State Updated (useState)
      ↓
useEffect Triggered
      ↓
localStorage.setItem()
      ↓
Data Persisted
```

### Data Loading Flow

```
App Initialization
      ↓
Context Provider Mounts
      ↓
useState Initializer Runs
      ↓
localStorage.getItem()
      ↓
JSON.parse()
      ↓
Initial State Set
      ↓
Components Render with Data
```

---

## Component Architecture

### Component Hierarchy

```
<App>
  └─ <ErrorBoundary>
      └─ <ThemeProvider>
          └─ <QueryClientProvider>
              └─ <TooltipProvider>
                  └─ <AppProvider>
                      └─ <BusinessDataProvider>
                          └─ <DataManagerProvider>
                              └─ <BrowserRouter>
                                  └─ <Routes>
                                      ├─ <LandingPage />
                                      ├─ <BusinessCaseAnalyzer />
                                      ├─ <MarketAnalysisSuite />
                                      ├─ <CrossToolDemo />
                                      └─ <NotFound />
```

### Component Types

#### 1. Page Components
- Top-level route components
- Orchestrate multiple sub-components
- Manage page-specific state
- Examples: `BusinessCaseAnalyzer`, `MarketAnalysisSuite`, `LandingPage`

#### 2. Feature Components
- Self-contained functional units
- Manage internal state
- Interact with contexts
- Examples: `CashFlowTab`, `MarketOverviewModule`, `MarketInsightsCart`

#### 3. Shared Components
- Reusable across features
- Minimal state
- Pure or mostly presentational
- Examples: `ThemeToggle`, `ErrorBoundary`, `VolumeComparison`

#### 4. UI Components
- Base design system components
- From shadcn/ui library
- Styled with Tailwind CSS
- Examples: `Button`, `Card`, `Input`, `Dialog`

### Component Communication Patterns

#### Parent-to-Child (Props)
```tsx
<ChildComponent 
  data={parentData} 
  onUpdate={handleUpdate} 
/>
```

#### Child-to-Parent (Callbacks)
```tsx
const handleUpdate = (newData) => {
  setData(newData);
};
```

#### Sibling-to-Sibling (Context)
```tsx
// Component A
const { updateData } = useApp();
updateData(newValue);

// Component B (automatically re-renders)
const { appState } = useApp();
```

---

## State Management

### Context Architecture

#### 1. AppContext (Global Application State)

**Purpose:** Manages cross-cutting application state

**State:**
```typescript
interface AppState {
  activeMode: 'landing' | 'business' | 'market';
  businessData: BusinessDataSummary | null;
  marketData: MarketDataSummary | null;
  hasBusinessData: boolean;
  hasMarketData: boolean;
}
```

**Key Methods:**
- `switchToBusinessMode()` - Navigate to business case
- `switchToMarketMode()` - Navigate to market analysis
- `switchToLanding()` - Return to landing page
- `updateBusinessData(data)` - Update business case data
- `updateMarketData(data)` - Update market analysis data
- `clearBusinessData()` - Clear business case data
- `clearMarketData()` - Clear market analysis data
- `clearAllData()` - Clear all application data
- `exportAllData()` - Export all data for backup
- `syncDataFromStorage()` - Reload from localStorage

**Storage Keys:**
- `businessCaseData` - Business case data
- `bizcaseland_market_data` - Market analysis data
- `bizcaseland_active_mode` - Current active mode

#### 2. BusinessDataContext (Business Case State)

**Purpose:** Manages business case-specific state and calculations

**State:**
- Business case data structure
- Calculated metrics (NPV, IRR, etc.)
- Monthly projections

**Key Methods:**
- Data validation
- Metric calculations
- Export/import functionality

#### 3. DataManagerContext (Data Management State)

**Purpose:** Manages data import/export and shopping cart

**State:**
- Market insights cart
- Import/export status
- Data validation state

#### 4. ThemeProvider (UI Theme State)

**Purpose:** Manages dark/light theme

**State:**
- Current theme ('light' | 'dark' | 'system')
- System theme preference

---

## Calculation Engines

### Business Case Calculations (`calculations.ts`)

#### Core Financial Metrics

**Net Present Value (NPV)**
```typescript
function calculateNPV(
  cashFlows: number[], 
  discountRate: number
): number
```
- Discounts future cash flows to present value
- Uses periodic discount rate
- Handles negative initial investment

**Internal Rate of Return (IRR)**
```typescript
function calculateIRR(
  cashFlows: number[], 
  initialGuess: number = 0.1
): number | IRR_ERROR
```
- Newton-Raphson iterative method
- Handles multiple solutions
- Comprehensive error codes for edge cases
- Maximum 100 iterations for convergence

**Break-Even Analysis**
```typescript
function calculateBreakEven(
  monthlyData: MonthlyData[]
): number
```
- Finds first month with cumulative positive cash flow
- Returns month number or 0 if never breaks even

**Payback Period**
```typescript
function calculatePaybackPeriod(
  monthlyData: MonthlyData[]
): number
```
- Calculates time to recover initial investment
- Considers time value of money

#### Volume Calculations

**Linear Growth**
```typescript
volume(month) = baseVolume + (monthlyIncrease * month)
```

**Geometric Growth**
```typescript
volume(month) = baseVolume * (1 + growthRate)^month
```

**Seasonal Pattern**
```typescript
volume(month) = baseYearVolume * seasonalIndex[month % 12] * (1 + yoyGrowth)^year
```

**Time Series**
```typescript
volume(month) = series[month].value || interpolated_value
```

#### Revenue Calculations

**Multi-Segment Revenue**
```typescript
totalRevenue(month) = Σ(segment.volume(month) * segment.price(month))
```

**Dynamic Pricing**
- Supports price trajectories over time
- Handles promotional pricing
- Manages tiered pricing models

### Market Analysis Calculations (`market-calculations.ts`)

#### Market Sizing

**Total Addressable Market (TAM)**
```typescript
TAM(year) = baseTAM * (1 + growthRate)^(year - baseYear)
```

**Serviceable Addressable Market (SAM)**
```typescript
SAM(year) = TAM(year) * samPercentage
```

**Serviceable Obtainable Market (SOM)**
```typescript
SOM(year) = SAM(year) * targetSharePercentage
```

#### Market Share Progression

**Linear Market Share Growth**
```typescript
marketShare(month) = currentShare + (targetShare - currentShare) * (month / totalMonths)
```

#### Market Opportunity Score

```typescript
opportunityScore = (
  marketSizeWeight * normalizedMarketSize +
  growthWeight * normalizedGrowthRate +
  competitionWeight * (1 - normalizedCompetition) +
  entryBarrierWeight * (1 - normalizedBarriers)
) * 100
```

---

## Routing & Navigation

### Route Configuration

**Main Routes:**
- `/` - Landing page
- `/business` - Business Case Analyzer
- `/market` - Market Analysis Suite
- `/demo` - Cross-Tool Integration Demo
- `/legacy` - Legacy Index page
- `*` - 404 Not Found

### Navigation Pattern

**Programmatic Navigation:**
```typescript
const navigate = useNavigate();
navigate('/business');
navigate('/market', { state: { initialTab: 'overview' } });
```

**Navigation with State Preservation:**
- All navigation preserves data via AppContext
- No data loss when switching between tools
- Back button support with browser history

**Navigation Flow:**
```
Landing Page
    ├──▶ Business Case Analyzer
    │       ├──▶ Switch to Market Analysis
    │       └──▶ Back to Home
    └──▶ Market Analysis Suite
            ├──▶ Switch to Business Case
            └──▶ Back to Home
```

---

## Persistence Layer

### localStorage Strategy

**Storage Structure:**
```
localStorage
├── businessCaseData: string (JSON)
├── bizcaseland_market_data: string (JSON)
├── bizcaseland_active_mode: string
└── bizcaseland-ui-theme: string
```

### Data Serialization

**Save Operation:**
```typescript
const save = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
};
```

**Load Operation:**
```typescript
const load = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return null;
  }
};
```

### Data Synchronization

**Automatic Sync:**
- Context providers sync to localStorage on every state change
- `useEffect` hooks trigger on state updates
- Debouncing prevents excessive writes

**Manual Sync:**
- `syncDataFromStorage()` method in AppContext
- Useful for debugging or recovery scenarios

### Storage Limits & Handling

- localStorage limit: ~5-10MB (browser dependent)
- Large datasets may require optimization
- Future enhancement: IndexedDB for larger datasets

---

## UI/UX Patterns

### Responsive Design

**Mobile-First Approach:**
- Base styles for mobile (< 640px)
- Tablet breakpoint: `sm:` (640px+)
- Desktop breakpoint: `md:` (768px+), `lg:` (1024px+)

**Mobile Optimizations (October 2025):**
- Title repositioned to top for better space utilization
- Buttons moved below title on small screens
- Condensed button labels on mobile
- Reduced padding and margins
- Removed "Data Loaded" badge (clutter reduction)

**Example Responsive Classes:**
```tsx
<h1 className="text-2xl sm:text-4xl font-bold">
  Bizcaseland
</h1>
```

### Loading States

**Skeleton Loaders:**
- Used for chart loading
- Maintains layout stability
- Provides visual feedback

**Spinner Components:**
- For async operations
- Centered in container
- Accessible labels

### Error Handling

**Error Boundary:**
- Catches React component errors
- Displays user-friendly error message
- Provides recovery actions
- Logs errors to console

**Validation Feedback:**
- Inline validation messages
- Toast notifications for actions
- Form field validation
- JSON validation with error details

### Theme System

**Dark/Light Mode:**
- System preference detection
- Manual toggle
- Persistent preference
- CSS variable-based theming

**Theme Toggle Component:**
```tsx
<ThemeToggle />
```

**Theme Classes:**
- Light: Default Tailwind colors
- Dark: `dark:` prefix classes

### Accessibility

**Current Features:**
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management

**Future Enhancements:**
- Comprehensive ARIA attributes
- Screen reader testing
- Keyboard shortcut system
- High contrast mode

---

## Data Schemas

### Business Case Data Schema

```typescript
interface BusinessData {
  meta: {
    title: string;
    description: string;
    business_model: 'recurring' | 'one-time' | 'hybrid';
    currency: string;
    periods: number; // Max 60
    frequency: 'monthly' | 'quarterly' | 'annual';
  };
  
  assumptions: {
    pricing: PricingAssumptions;
    unit_economics: UnitEconomics;
    financial: FinancialAssumptions;
    customers: CustomerAssumptions;
    opex: OpexItem[];
    capex: CapexItem[];
    growth_settings: GrowthSettings;
  };
  
  // Additional fields...
}
```

### Market Analysis Data Schema

```typescript
interface MarketData {
  schema_version: string;
  
  meta: {
    title: string;
    description: string;
    market_name: string;
    analysis_date: string;
    analyst: string;
  };
  
  market_sizing: {
    total_addressable_market: TAMData;
    serviceable_addressable_market: SAMData;
    serviceable_obtainable_market: SOMData;
  };
  
  market_share: MarketShareData;
  competitive_landscape: CompetitiveLandscapeData;
  customer_analysis: CustomerAnalysisData;
  
  // Additional fields...
}
```

---

## Performance Considerations

### Bundle Size
- **Current:** ~911KB minified
- **Main Contributors:** Recharts, React Router, Tailwind CSS
- **Optimization Strategy:** Code splitting by route (future)

### Rendering Optimization
- **Chart Re-renders:** Memoized with React.memo()
- **Context Updates:** Selective updates to prevent cascade re-renders
- **Large Lists:** Virtualization for 1000+ items (future)

### Calculation Performance
- **Pure Functions:** All calculations are pure, enabling memoization
- **Lazy Calculation:** Only calculate visible tabs/charts
- **Worker Threads:** Move heavy calculations to web workers (future)

---

## Security Considerations

### Data Privacy
- **Client-Side Only:** All data stays in browser
- **No Server Communication:** No data sent to external servers
- **localStorage Security:** Standard browser security model

### Input Validation
- **JSON Schema Validation:** Comprehensive validation for all inputs
- **Type Safety:** TypeScript prevents type errors
- **Sanitization:** User inputs sanitized before display

### XSS Protection
- **React Default Protection:** Automatic escaping of JSX content
- **No dangerouslySetInnerHTML:** Avoided throughout codebase

---

## Future Architecture Enhancements

### Short-Term (3-6 months)
1. **Code Splitting:** Route-based code splitting for faster initial load
2. **Service Worker:** Offline support and caching
3. **Web Workers:** Offload heavy calculations
4. **IndexedDB:** Support for larger datasets

### Medium-Term (6-12 months)
1. **Backend Integration:** Optional cloud sync
2. **Real-Time Collaboration:** Multi-user editing
3. **Advanced Analytics:** ML-based insights
4. **API Layer:** RESTful API for external integrations

### Long-Term (12+ months)
1. **Mobile Apps:** Native iOS/Android apps
2. **Desktop App:** Electron-based desktop application
3. **Enterprise Features:** SSO, audit logs, permissions
4. **Marketplace:** Plugin system for extensions

---

## Development Workflow

### Adding a New Feature

1. **Plan:** Define requirements and architecture
2. **Types:** Create TypeScript interfaces in `src/types/`
3. **Components:** Build React components in appropriate folder
4. **Logic:** Implement business logic in `src/lib/`
5. **Context:** Update contexts if needed
6. **Tests:** Write comprehensive tests
7. **Documentation:** Update relevant docs
8. **Review:** Code review and testing
9. **Deploy:** Merge and deploy

### Code Style Guidelines

**TypeScript:**
- Use interfaces over types for objects
- Prefer explicit return types for functions
- Use strict type checking

**React:**
- Functional components with hooks
- Props destructuring
- Named exports for components

**Naming Conventions:**
- PascalCase: Components, interfaces
- camelCase: Functions, variables
- UPPER_CASE: Constants
- kebab-case: File names for utilities

---

## Monitoring & Debugging

### Logging Strategy
- Console logs for development
- Error logs for exceptions
- Performance marks for optimization

### Debug Tools
- React DevTools for component inspection
- Redux DevTools (if added in future)
- Browser DevTools for network/storage

### Error Tracking
- Error Boundary for React errors
- Try-catch blocks for async operations
- Validation errors with user-friendly messages

---

## Conclusion

Bizcaseland's architecture emphasizes:
- **Modularity:** Clear separation of concerns
- **Maintainability:** Well-organized, documented codebase
- **Type Safety:** Full TypeScript coverage
- **User Experience:** Responsive, accessible interface
- **Data Integrity:** Robust validation and persistence
- **Extensibility:** Easy to add new features

This architecture supports the current feature set while providing a solid foundation for future enhancements.
