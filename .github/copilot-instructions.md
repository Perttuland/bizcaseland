## Copilot instructions for Bizcaseland

Purpose: help an AI coding agent become productive quickly in this repo by describing the architecture, data model, conventions, developer workflows, integration points and a few project-specific gotchas.

- Quick start
  ```bash
  npm i
  npm run dev       # start Vite dev server
  npm run build     # production build
  npm run lint      # run ESLint
  npm run test      # run Vitest (unit tests)
  ```

- Big picture
  - Single-page React + Vite + TypeScript app. Entry: `src/main.tsx` -> `App` (`src/App.tsx`) -> routes (see `src/pages/Index.tsx`).
  - Global business case state is provided by `BusinessDataProvider` (`src/contexts/BusinessDataContext.tsx`).
  - The single source of truth for financial logic is `src/lib/calculations.ts` — treat it as the canonical engine. UI components call into this for derived metrics.
  - Main UI surface: `src/components/BusinessCaseAnalyzer.tsx` (tabs: input, cashflow, analysis, sensitivity, market). Test data and JSON templates live under `Bizcase analyst/Test data/`.

- Data model / contracts to respect
  - Inspect `BusinessData` interface in `src/contexts/BusinessDataContext.tsx` for exact shapes. When updating or generating JSON, follow these rules discovered in the repo:
    - Every numeric datum should be an object: `{ value: number, unit: string, rationale: string }` (see test data `Bizcase analyst/Test data/0.62/*`).
    - Drivers refer to `.value` fields via a `path` string (example: `assumptions.pricing.avg_unit_price.value`). Drivers' `range` is an array of numeric test points.
    - Only one growth pattern per segment (geom_growth, seasonal_growth, or linear_growth). Default horizon is 60 periods unless overridden in `meta.periods`.

- Project-specific conventions & patterns
  - Design tokens are implemented as HSL CSS variables in `src/index.css`. All color values should be HSL and wired through `tailwind.config.ts` — avoid hard-coded hex colors.
  - UI primitives follow shadcn-ui patterns under `src/components/ui/` (e.g., `button.tsx`, `card.tsx`). Reuse those components instead of adding new base styles.
  - Routing: add routes in `src/App.tsx` above the catch-all `*` route.
  - State updates to the business case use helpers in `src/lib/utils/*` (see `nested-operations.ts`) and `BusinessDataContext.updateAssumption` / `updateDriver`.

- Integration points & external deps
  - No server-side API in the repo. Data is ingested via the UI (paste JSON) and persisted client-side. Lovable integration is mentioned in `README.md` — changes may be auto-committed via Lovable.
  - Key libraries: React, Vite, TypeScript, Tailwind, shadcn-ui, react-query, vitest. See `package.json` for exact scripts and versions.

- Important gotchas (do not change lightly)
  - `src/lib/calculations.ts` uses a default start date `new Date('2026-01-01')` for monthly timelines — tests and UI assume consistent periods; search this file when changing date logic.
  - IRR calculation returns magic error codes (`IRR_ERROR_CODES`) — callers expect those codes. Use `isIRRError()` and `getIRRErrorMessage()` when exposing IRR results.
  - JSON template rules are enforced by the engine (see test data `Bizcase analyst/Test data/0.62/*`): missing `rationale` or wrong shapes will produce incorrect calculations.
  - Styling system expects HSL vars — adding non-HSL colors will break theming.

- Where to change behavior
  - Business rules / metrics: edit `src/lib/calculations.ts` and add unit tests in `src/lib/calculations.test.ts` (exists). Keep `calculateBusinessMetrics` as the public contract for other components.
  - Types and JSON contracts: update `src/contexts/BusinessDataContext.tsx` and `src/types/business-data.ts` in tandem.
  - UI: `src/components/BusinessCaseAnalyzer.tsx` orchestrates tabs and JSON import/export; small UI components live under `src/components/ui/`.

- Helpful examples
  - Driver path example used in test data: `assumptions.pricing.avg_unit_price.value` (see `Bizcase analyst/Test data/0.62/...`).
  - Revenue calculation centralization: all revenue and benefit math flows from `generateMonthlyData()` -> `calculateDynamicTotalVolumeForMonth()` -> `calculateDynamicUnitPrice()` in `src/lib/calculations.ts`.

### Agent coding rules (added/merged)
These are coding conventions the agent should follow when making edits. Apply them when writing TypeScript/React code in this repo.

- Code style & structure
  - Write concise, technical TypeScript with accurate examples. Prefer functional, declarative patterns; avoid classes.
  - Structure files as: exported component, subcomponents, helpers, static content, types (in that order).
  - Use descriptive boolean/flag names: `isLoading`, `hasError`, `isValid`.

- Naming & exports
  - Directories: lowercase with dashes (e.g., `components/auth-wizard`).
  - Favor named exports for components and helpers.

- TypeScript usage
  - Use TypeScript for all new code. Prefer `interface` over `type` for public shapes. Avoid `enum`; use maps/objects instead.
  - Use functional components typed with interfaces for props.

- Syntax & formatting
  - Use the `function` keyword for pure functions (easier to unit test and stack traces).
  - Favor concise conditionals and declarative JSX. Keep curly braces minimal for short statements.

- UI & styling
  - Use Shadcn UI + Radix primitives and Tailwind utilities. Implement responsive UI mobile-first with Tailwind breakpoints.
  - Reuse `src/components/ui/*` primitives rather than introducing raw HTML + Tailwind for base controls.

- Performance & Next.js guidance
  - Minimize `use client`, `useEffect`, and client state when possible. Prefer server components / SSR patterns when migrating toward Next.js App Router.
  - Wrap client components in `Suspense` with a fallback and use dynamic imports for non-critical code.
  - Optimize images (WebP, size attributes, lazy loading) when adding assets.
  - If adding Next.js App Router files, follow Next.js docs for data fetching and RSC patterns; limit `use client` to the smallest scope required (Web APIs, event handlers).

- Project-specific conventions
  - Use `nuqs` for URL search parameter state if implementing URL-driven UI state.
  - Preserve the HSL token system in `src/index.css` and `tailwind.config.ts`.
