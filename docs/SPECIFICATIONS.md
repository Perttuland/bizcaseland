# Bizcaseland Product Specifications

**Version:** 2.0  
**Last Updated:** October 3, 2025  
**Document Type:** Master Product Specification  

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Core User Journey](#core-user-journey)
3. [User Experience Principles](#user-experience-principles)
4. [Feature Specifications](#feature-specifications)
5. [JSON Data Templates](#json-data-templates)

---

## Product Overview

### What is Bizcaseland?

Bizcaseland is an **AI-first business analysis platform** that enables users to:

1. **Generate JSON templates** for market analysis or business case modeling
2. **Work with AI tools** (ChatGPT, Claude, etc.) to populate data with proper rationale
3. **Import completed JSON** to visualize and analyze data
4. **Edit and refine** all assumptions inline
5. **Run sensitivity analysis** on key business drivers
6. **Export results** as JSON or PDF reports

### Why AI-First?

AI tools (like ChatGPT) are excellent at:
- Understanding structured data formats
- Researching market data and competitive intelligence
- Providing rationale for assumptions
- Generating comprehensive business analysis

Bizcaseland provides:
- **Clean JSON templates** that AI understands perfectly
- **Fast, lightweight visualization** of AI-generated data
- **Interactive editing** for refinement
- **Professional analysis tools** (NPV, IRR, sensitivity)

### Platform Philosophy

1. **JSON as the Interface** - Structured templates for AI-human collaboration
2. **Modular Analysis** - Pick only the modules you need
3. **Rationale-First** - Every number has an explanation
4. **Client-Side Only** - All data stays in browser, no servers
5. **Fast & Responsive** - Lightweight, works on mobile and desktop



---

## Core User Journey

### The Complete Workflow

**Goal:** Create a business case or market analysis with AI assistance

#### Step 1: Get JSON Template (30 seconds)

**In Bizcaseland:**
1. Navigate to tool (Business Case or Market Analysis)
2. Click **"Export Template"** button
3. **Choose modules** (Market Analysis only):
   - User can pick any single module or any combination of modules
   - Only the selected sections of the JSON template are given to the user. The purpose of this is to enable user to make the market analysis in smaller pieces. The user can later build pieces that are missing.  
4. Download minimal JSON template with just the selected sections

**Result:** Clean, focused JSON template ready for AI

#### Step 2: Work with AI (5-30 minutes)

**In ChatGPT/Claude/etc:**
1. Upload JSON template
2. Prompt: *"Help me populate this business case/market analysis with data for [your project]"*
3. AI understands the structure perfectly
4. AI asks clarifying questions
5. AI fills in data with **rationale for every number**
6. User reviews and refines with AI
7. Copy/download completed JSON

**Result:** AI-generated analysis with comprehensive rationale

#### Step 3: Import & Visualize (10 seconds)

**Back in Bizcaseland:**
1. Click **"Import JSON"**
2. Paste or upload completed JSON
3. Tool validates and loads data
4. Instant visualization:
   - **Business Case:** NPV, IRR, cash flow charts, revenue projections
   - **Market Analysis:** TAM/SAM/SOM funnel, competitor landscape, segment breakdown

**Result:** Professional visualization of AI-generated data

#### Step 4: Edit & Refine (5-15 minutes)

**Interactive editing:**
1. Click any number to edit inline
2. Update rationale if needed (red indicator if rationale outdated)
3. Add/remove line items (OPEX, CAPEX, competitors, segments)
4. Mark key assumptions as sensitivity drivers
5. All charts update in real-time

**Result:** Refined, validated analysis

#### Step 5: Sensitivity Analysis (Business Case only, 2-5 minutes)

1. Navigate to **Sensitivity tab**
2. View which assumptions already marked as drivers
3. Define 5-point range for each driver (Very Low → Very High)
4. View tornado chart showing impact
5. Explore scenario matrix with color-coded NPV outcomes

**Result:** Understanding of risk and key value drivers

#### Step 6: Export Results (10 seconds)

**Export options:**
1. **JSON export:** Share with colleagues or save for later
2. **PDF export:** Professional report for stakeholders
3. **CSV export:** Cash flow data for Excel

**Result:** Shareable, professional outputs

---

### Quick Workflows

**Just Market Sizing:** 
Template → AI (5 min) → Import → Done (5 min total)

**Full Market Analysis:** 
Template → AI (20 min) → Import → Edit (10 min) → Export (30 min total)

**Business Case with Sensitivity:** 
Template → AI (15 min) → Import → Edit (10 min) → Sensitivity (5 min) → Export (30 min total)

**Iterate with AI:**
Export JSON → Give to AI → Ask for refinements → Re-import → Repeat

---

## User Experience Principles

### 1. AI-First Design

**Goal:** Make JSON templates that AI tools understand perfectly

- **Clean structure:** Simple, logical hierarchy
- **Clear naming:** Field names that are self-explanatory
- **Required rationale:** Every number has a "rationale" field
- **Modular templates:** User picks only what they need
- **Examples included:** Template shows format with sample data

### 2. Speed & Performance

**Goal:** Fast, lightweight, responsive

- **Instant calculations:** No loading spinners for math
- **Lightweight charts:** Quick rendering, no lag
- **Client-side only:** No server round-trips
- **Optimized for mobile:** Works smoothly on phones
- **Minimal JSON:** Templates are as small as possible

### 3. Information Hierarchy

**Goal:** Show the right info at the right time

- **Progressive disclosure:**
  - Dashboard: High-level metrics only
  - Tabs: Detailed views (Cash Flow, Revenue, etc.)
  - Hover: Additional context (rationale tooltips)
  - Click: Edit mode
- **Visual hierarchy:**
  - Large numbers for key metrics (NPV, IRR)
  - Charts for trends
  - Tables for details
- **Clear navigation:**
  - Tabs for different views
  - Breadcrumbs for context
  - Back to home always visible

### 4. Interactive Editing

**Goal:** Easy refinement without leaving the tool

- **Inline editing:** Click any number to edit
- **Rationale tracking:** Red indicator when value changes but rationale doesn't
- **Source badges:** Know where data came from (AI, user input, market analysis)
- **Real-time updates:** Charts refresh immediately on edit
- **Undo-friendly:** Can always revert or re-import

### 5. Transparency & Trust

**Goal:** User understands every number

- **Rationale visible:** Hover over (i) icon to see explanation
- **Calculation transparency:** Click metric to see formula
- **Source tracking:** Blue "M" badge = from market analysis
- **Assumption documentation:** Full assumptions tab with all inputs
- **Sensitivity analysis:** Show which assumptions matter most

### 6. Responsive Design

**Goal:** Works on any device

- **Mobile-first:** All features work on phone
- **Touch-friendly:** Large tap targets (44px minimum)
- **Responsive tables:** Horizontal scroll or stack on mobile
- **Adaptive charts:** Simplify visualization on small screens
- **Readable text:** 16px minimum body font

### 7. Link Support

**Goal:** Deep linking and shareability

- **URL routing:** Each tab/view has unique URL
- **Query parameters:** Can link directly to specific scenario
- **State in URL:** Sensitivity settings preserved in URL (future)
- **Shareable links:** Copy URL to share exact view with colleague

---

## Feature Specifications

### 1. Landing Page

**Purpose:** Entry point and tool selection

**Key Actions:**
- **Launch Business Case** → Go to Business Case Analyzer
- **Launch Market Analysis** → Go to Market Analysis Suite
- **Load Sample Data** → Quick-load example projects
- **Reset All Data** → Clear localStorage (with confirmation)
- **Theme Toggle** → Switch light/dark mode

**UX Details:**
- Show "Data Available" badge if data exists
- Responsive: Stacks on mobile, side-by-side on desktop
- Fast load: < 100ms

---

### 2. Business Case Analyzer

**Purpose:** Visualize financial projections from AI-generated JSON

**Tabs:**

#### Dashboard Tab
**Shows:** NPV, IRR, Payback Period, Break-Even, Total Revenue, Total Investment  
**Charts:** Monthly cash flow (bar), Cumulative cash flow (line)  
**UX:** Large metric cards, hover for explanation, color-coded (red/green)

#### Cash Flow Tab
**Shows:** Monthly table with Revenue, COGS, Gross Profit, OPEX, EBITDA, CAPEX, Net Cash Flow, Cumulative  
**UX:** Pagination (10/25/50/All), Export to CSV, Number formatting, Sortable columns

#### Revenue Tab
**Shows:** Revenue breakdown by customer segment  
**Charts:** Stacked area (revenue composition), Line chart (customer growth)  
**UX:** Toggle segments on/off, Hover for details

#### Assumptions Tab
**Shows:** All input assumptions organized by category  
**Edit:** Click any value or rationale to edit inline  
**Features:**
- Red indicator when value changes without rationale update
- Mark assumptions as sensitivity drivers (checkbox)
- Hover (i) icon to see full rationale
- Add/remove OPEX/CAPEX items

#### Sensitivity Tab
**Shows:** Impact of assumption changes on NPV  
**Features:**
- Define 5-point range per driver (Very Low → Very High)
- Tornado chart showing biggest impact drivers
- Scenario matrix with color-coded NPV outcomes
- Export results to CSV

**Key UX Details:**
- All calculations instant (no loading)
- Edit any number inline
- Real-time chart updates
- Mobile-responsive tabs

---

### 3. Market Analysis Suite

**Purpose:** Visualize market research from AI-generated JSON

**Modules (User picks which to include in template):**

#### Market Sizing Module
**Shows:** TAM, SAM, SOM with growth projections  
**Charts:** Market funnel (TAM→SAM→SOM), Market share progression  
**Edit:** All values and rationales inline  
**Auto-calculation:** SAM = TAM × %, SOM = SAM × %

#### Competitive Analysis Module
**Shows:** Competitor profiles with market share, strengths, weaknesses, threat level  
**Charts:** Market share pie chart  
**Edit:** Add/remove competitors, edit all fields inline  
**Validation:** Warns if total market share > 100%

#### Customer Analysis Module
**Shows:** Customer segments with size, growth rate, demographics, pain points  
**Charts:** Segment distribution, Growth comparison  
**Edit:** Add/remove segments, edit all fields inline  
**Validation:** Warns if segment sizes don't sum to 100%

#### Assumptions Tab
**Shows:** All market assumptions in one view  
**Edit:** Inline editing for all values and rationales  
**Features:** Red indicator when rationale outdated, Mark as sensitivity driver

**Key UX Details:**
- Modular: Pick only modules you need for template export
- Lightweight: Fast rendering even with complex data
- Mobile-friendly: All charts responsive

---

### 4. Data Import/Export

**Purpose:** Move data in and out of the tool

#### Import JSON
**Action:** Click "Import JSON" → Upload/paste file → Validate → Load  
**UX:** Shows validation errors with line numbers if invalid  
**Result:** Data populates tool, charts render instantly

#### Export Template
**Action:** Click "Export Template"  
**Market Analysis:** Choose modules to include (modular export)  
**Business Case:** Full template with all sections  
**Result:** Minimal JSON file ready for AI

#### Export Data
**Action:** Click "Export JSON"  
**Result:** Complete JSON with all data and rationales

#### Export PDF (Future)
**Action:** Click "Export PDF"  
**Result:** Professional report with charts and tables

#### Export CSV
**Action:** Click "Export CSV" (Cash Flow tab)  
**Result:** Spreadsheet-ready data

---

## JSON Data Templates

### Why JSON?

AI tools like ChatGPT/Claude understand JSON perfectly. By using JSON templates:
- AI knows exactly what data to provide
- Structure is clear and unambiguous
- Rationale fields ensure AI explains every number
- Easy to iterate: export → refine with AI → re-import

### Template Structure Principles

1. **Self-documenting:** Field names explain what data is needed
2. **Rationale-required:** Every numeric field has a "rationale" sibling
3. **Example values:** Templates show format with sample data
4. **Minimal:** Only include what's needed for selected modules
5. **Validated:** Schema version ensures compatibility

---

### Business Case Template Structure

**Key Sections:**

```json
{
  "schema_version": "1.0",
  "meta": {
    "title": "Project Name",
    "description": "Brief description",
    "business_model": "recurring",
    "currency": "EUR",
    "periods": 60,
    "frequency": "monthly"
  },
  "assumptions": {
    "pricing": {
      "avg_unit_price": {
        "value": 99.0,
        "unit": "EUR_per_month",
        "rationale": "Why this price"
      }
    },
    "financial": {
      "interest_rate": {
        "value": 0.12,
        "unit": "ratio",
        "rationale": "Why this discount rate"
      }
    },
    "customers": {
      "churn_pct": {
        "value": 0.05,
        "unit": "monthly_churn_rate",
        "rationale": "Why this churn rate"
      },
      "segments": [
        {
          "id": "small_business",
          "name": "Small Business",
          "rationale": "Why target this segment",
          "volume": {
            "base_value": 50,
            "unit": "customers_per_month",
            "rationale": "Why this volume",
            "pattern_type": "geometric_growth",
            "growth_rate": 0.15,
            "growth_rationale": "Why this growth"
          }
        }
      ]
    },
    "unit_economics": {
      "cogs_pct": {
        "value": 0.20,
        "unit": "percentage_of_revenue",
        "rationale": "Why this cost"
      }
    },
    "opex": [
      {
        "name": "Sales & Marketing",
        "value": {
          "value": 25000.0,
          "unit": "EUR_per_month",
          "rationale": "Why this expense"
        }
      }
    ],
    "capex": [
      {
        "name": "Platform Development",
        "timeline": {
          "type": "time_series",
          "series": [
            {
              "period": 1,
              "value": 150000.0,
              "unit": "EUR",
              "rationale": "Why this investment"
            }
          ]
        }
      }
    ]
  },
  "drivers": [
    {
      "key": "unit_price",
      "path": "assumptions.pricing.avg_unit_price.value",
      "range": [79, 89, 99, 109, 119],
      "rationale": "Price sensitivity range"
    }
  ]
}
```

**Value-Rationale Pattern:**  
Every number has:
- `value`: The number
- `unit`: What it represents
- `rationale`: Why this number (AI must explain)

**Growth Patterns:**
- `linear_growth`: Adds fixed amount each period
- `geometric_growth`: Grows by percentage each period
- `seasonal_pattern`: 12-month repeating pattern
- `time_series`: Explicit values per period

---

### Market Analysis Template Structure

**Key Sections:**

```json
{
  "schema_version": "1.0",
  "meta": {
    "title": "Market Analysis Name",
    "description": "Brief description",
    "analyst": "Your name",
    "currency": "EUR",
    "base_year": 2025,
    "analysis_horizon_years": 5
  },
  "market_sizing": {
    "total_addressable_market": {
      "base_value": {
        "value": 8500000000,
        "unit": "EUR",
        "rationale": "How TAM was calculated"
      },
      "growth_rate": {
        "value": 15,
        "unit": "percentage_per_year",
        "rationale": "Why this growth"
      }
    },
    "serviceable_addressable_market": {
      "percentage_of_tam": {
        "value": 25,
        "unit": "percentage",
        "rationale": "Why this % of TAM"
      }
    },
    "serviceable_obtainable_market": {
      "percentage_of_sam": {
        "value": 8,
        "unit": "percentage",
        "rationale": "Why this % of SAM"
      }
    }
  },
  "competitive_landscape": {
    "competitors": [
      {
        "name": "Competitor Name",
        "market_share": {
          "value": 35,
          "unit": "percentage",
          "rationale": "Their market position"
        },
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "threat_level": "high"
      }
    ]
  },
  "customer_analysis": {
    "market_segments": [
      {
        "id": "segment_1",
        "name": "Segment Name",
        "size_percentage": {
          "value": 40,
          "unit": "percentage",
          "rationale": "Why this segment size"
        },
        "growth_rate": {
          "value": 25,
          "unit": "percentage_per_year",
          "rationale": "Why this growth"
        },
        "demographics": "Who they are",
        "pain_points": "What problems they have"
      }
    ]
  }
}
```

**Modular Export:**  
User can choose to export only:
- Market Sizing only
- Market Sizing + Competitive Analysis
- Market Sizing + Customer Analysis
- All modules

This keeps JSON files small and focused for AI work.

---

### Validation Rules

**Business Case:**
- Periods: 1-60
- Discount rate: 0-100% (as decimal 0-1)
- Churn rate: 0-100% (as decimal 0-1)
- Price: > 0
- Growth rate: Reasonable bounds (-100% to +1000%)
- Rationale: Minimum 10 characters

**Market Analysis:**
- Analysis horizon: 1-10 years
- Market shares: 0-100%
- Sum of competitor shares: ≤ 100% (warning)
- Sum of segment sizes: = 100% (warning if not)
- TAM > SAM > SOM (logical hierarchy)

---

## Key UX Details

### Visual Indicators

**Badges:**
- 🟢 "Data Available" - Tool has loaded data
- 🔵 "M" - Data from Market Analysis
- 🟠 "S" - Marked as Sensitivity Driver
- 🔴 Red text - Rationale needs update after value change

**Hover Tooltips:**
- (i) icon - Shows full rationale on hover
- Chart data points - Shows exact values
- Metric cards - Shows calculation formula

**Interactive Elements:**
- Click any number → Edit inline
- Click any rationale → Edit in textarea
- Click chart legend → Toggle series visibility
- Click tab → Switch view

### Performance

**Load Times:**
- Landing page: < 100ms
- Data import: < 1 second for typical JSON (< 500KB)
- Chart rendering: < 200ms
- Calculation updates: Instant (< 50ms)

**Responsiveness:**
- Mobile: Full feature parity
- Touch targets: Minimum 44px
- Tables: Horizontal scroll on mobile
- Charts: Simplified on small screens

### Data Persistence

- Auto-save to localStorage after every edit
- No manual save needed
- Data survives browser refresh
- Clear data with "Reset All Data" button (confirmation required)

---

## Related Documentation

**For technical implementation:** See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Document Status:** ✅ Master Specifications - Active  
**Last Updated:** October 3, 2025