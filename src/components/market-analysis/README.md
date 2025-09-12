# Market Analysis Suite

## Overview

The Market Analysis Suite is a comprehensive React-based application for conducting detailed market analysis with interactive visualizations and data management capabilities. It provides specialized modules for different aspects of market research including market sizing, competitive intelligence, customer analysis, strategic planning, and opportunity assessment.

## Architecture

### Core Components

```
market-analysis/
├── MarketAnalysisSuite.tsx          # Main orchestrator component with tab interface
├── MarketAnalysisTemplate.ts        # JSON data templates and schemas
├── MarketAnalyzer.tsx               # Analysis utilities and helper functions
├── index.ts                         # Barrel exports
└── modules/                         # Specialized analysis modules
    ├── MarketSizingModule.tsx       # TAM/SAM/SOM analysis with charts
    ├── CompetitiveIntelligenceModule.tsx  # Competitor analysis & positioning
    ├── CustomerAnalysisModule.tsx   # Customer segmentation & personas
    ├── StrategicPlanningModule.tsx  # Strategic planning & roadmaps
    ├── OpportunityAssessmentModule.tsx    # Market opportunity evaluation
    └── DataManagementModule.tsx     # JSON import/export & data validation
```

### Integration Points

- **Root Integration**: `/src/components/MarketAnalysis.tsx` - Wrapper for BusinessCaseAnalyzer integration
- **Routing**: Direct route in App.tsx at `/market` path
- **State Management**: Uses AppContext for global state and localStorage persistence
- **Data Flow**: MarketData interface from `lib/market-calculations.ts`

## Features

### 🎯 Market Sizing Module
- **TAM/SAM/SOM Analysis**: Total, Serviceable, and Obtainable market calculations
- **Market Segmentation**: Geographic and demographic breakdowns
- **Growth Projections**: Timeline-based market growth visualization
- **Charts**: PieChart, BarChart, LineChart, AreaChart (Recharts)

### 🏆 Competitive Intelligence Module
- **Competitor Mapping**: Market share and positioning analysis
- **Threat Assessment**: High/medium/low threat level categorization
- **Competitive Advantages**: Sustainability and differentiation analysis
- **Charts**: ScatterChart (positioning), RadarChart (capabilities), BarChart (market share)

### 👥 Customer Analysis Module
- **Market Segments**: Customer segment definition and scoring
- **Value Drivers**: Key factors driving customer decisions
- **Target Share Analysis**: Segment-specific market penetration goals
- **Charts**: BarChart (segment sizes), LineChart (growth rates)

### 💡 Strategic Planning Module
- **Market Entry Strategies**: Go-to-market planning and execution
- **Penetration Drivers**: Factors influencing market penetration
- **Milestone Tracking**: Key milestone definition and progress
- **Charts**: AreaChart (strategy timelines), LineChart (milestone tracking)

### 🔍 Opportunity Assessment Module
- **Market Opportunities**: Risk/reward analysis and prioritization
- **Barrier Analysis**: Entry barriers and mitigation strategies
- **ROI Projections**: Return on investment calculations
- **Charts**: Custom visualizations for opportunity scoring

### 📊 Data Management Module
- **JSON Import/Export**: Full data persistence and sharing
- **Template System**: Pre-built market analysis templates
- **Data Validation**: Comprehensive data quality checking
- **Sample Data**: Rich sample datasets for testing and demos

## Data Structure

### MarketData Interface
```typescript
interface MarketData {
  schema_version: string;
  meta: {
    title: string;
    description: string;
    currency: string;
    base_year: number;
    analysis_horizon_years: number;
    created_date: string;
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
}
```

### Key Calculations
- **Suite Metrics**: Calculated via `calculateSuiteMetrics()` from `lib/market-suite-calculations.ts`
- **Data Validation**: `validateMarketSuiteData()` ensures data quality and completeness
- **Real-time Updates**: All modules support live data editing with immediate chart updates

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Charts**: Recharts library for all visualizations
- **State Management**: React Context (AppContext) with localStorage
- **Routing**: React Router for navigation
- **Data Validation**: Custom validation with comprehensive error handling

## Usage

### Basic Usage
```tsx
import { MarketAnalysisSuite } from './market-analysis/MarketAnalysisSuite';

function App() {
  return <MarketAnalysisSuite />;
}
```

### With Custom Handlers
```tsx
<MarketAnalysisSuite
  onExportResults={(data) => console.log('Exported:', data)}
  onImportData={(data) => console.log('Imported:', data)}
  className="custom-styling"
/>
```

### Integration with Business Case
```tsx
import { MarketAnalysis } from './MarketAnalysis';

// Used in BusinessCaseAnalyzer as a tab component
<TabsContent value="market">
  <MarketAnalysis />
</TabsContent>
```

## Development

### Adding New Modules
1. Create new module in `modules/` folder
2. Follow the standard interface: `{ marketData, onDataUpdate, metrics }`
3. Export from module and import in MarketAnalysisSuite
4. Add to moduleConfig array with icon and description

### Data Flow
1. Data loaded via DataManagementModule or sample data
2. Stored in AppContext and persisted to localStorage
3. Passed down to all modules via props
4. Modules can update data via `onDataUpdate` callback
5. Changes automatically sync across all modules

### Chart Integration
All modules use Recharts components with consistent styling:
- ResponsiveContainer for responsive design
- Custom colors matching Tailwind theme
- Tooltips and legends for interactivity
- Loading states and error boundaries

## Testing

### Sample Data
The suite includes comprehensive sample data covering:
- AI-powered customer service platform market analysis
- Multiple customer segments with detailed profiles
- Competitive landscape with major players
- 5-year strategic planning timeline

### Validation
- Schema validation for all data imports
- Type safety with TypeScript interfaces
- Runtime validation with helpful error messages
- Data quality warnings for incomplete information

## Performance

- **Bundle Size**: ~911KB minified (includes all chart libraries)
- **Module Loading**: All modules loaded upfront for instant tab switching
- **Data Persistence**: Efficient localStorage with selective updates
- **Chart Rendering**: Optimized Recharts with responsive containers

## Future Enhancements

- **Export Formats**: PDF and Excel export capabilities
- **Real-time Collaboration**: Multi-user editing and sharing
- **Advanced Analytics**: Machine learning insights and predictions
- **Integration APIs**: Connect with external data sources
- **Mobile Optimization**: Enhanced mobile interface and touch interactions
