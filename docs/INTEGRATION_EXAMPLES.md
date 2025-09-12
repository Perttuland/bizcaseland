# Integration Examples: How to add shared data management to your existing app

## 1. Update App.tsx to include the DataManagerProvider

```tsx
import { DataManagerProvider } from "./contexts/DataManagerContext";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="bizcaseland-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppProvider>
              <BusinessDataProvider>
                <DataManagerProvider>  {/* Add this wrapper */}
                  <Toaster />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/business" element={<BusinessCaseAnalyzer />} />
                      <Route path="/market" element={<MarketAnalysisSuite />} />
                      <Route path="/data-manager" element={<SharedDataManagerPage />} />  {/* New route */}
                      <Route path="/legacy" element={<Index />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </DataManagerProvider>  {/* Add this wrapper */}
              </BusinessDataProvider>
            </AppProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

## 2. Create a dedicated page for data management

```tsx
import React from 'react';
import { SharedDataManager } from '@/components/shared';

export function SharedDataManagerPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Data Management Hub</h1>
      <SharedDataManager />
    </div>
  );
}
```

## 3. Add integration to BusinessCaseAnalyzer

```tsx
import { useDataManager } from '@/contexts/DataManagerContext';

export function BusinessCaseAnalyzer() {
  const { 
    currentProject, 
    updateBusinessData, 
    getMarketInsights 
  } = useDataManager();
  
  const insights = getMarketInsights();
  
  return (
    <div className="space-y-6">
      {/* Show sync opportunity */}
      {currentProject?.marketData && !currentProject?.businessData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Market analysis data is available. 
            <Button variant="link" onClick={() => {/* navigate to sync */}}>
              Sync market insights to business case
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show alignment warnings */}
      {insights && insights.volumeAlignment.alignmentScore < 0.7 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Volume assumptions may not align with market analysis 
            (Score: {(insights.volumeAlignment.alignmentScore * 100).toFixed(0)}%)
          </AlertDescription>
        </Alert>
      )}
      
      {/* Rest of existing BusinessCaseAnalyzer component */}
      {/* ... */}
    </div>
  );
}
```

## 4. Add integration to MarketAnalysisSuite

```tsx
import { useDataManager } from '@/contexts/DataManagerContext';

export function MarketAnalysisSuite() {
  const { 
    currentProject, 
    updateMarketData,
    validateDataConsistency 
  } = useDataManager();
  
  const validationResults = validateDataConsistency();
  
  const handleDataUpdate = (newMarketData: MarketData) => {
    updateMarketData(newMarketData);
    // Existing market analysis logic...
  };
  
  return (
    <div className="space-y-6">
      {/* Show business case integration opportunity */}
      {currentProject?.marketData && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Market analysis complete. Ready to create business case projections.
            <Button variant="link" onClick={() => {/* navigate to business case */}}>
              Generate business case
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Show validation warnings */}
      {validationResults.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validationResults.length} data validation issue(s) found.
            <Button variant="link" onClick={() => {/* show details */}}>
              View details
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Rest of existing MarketAnalysisSuite component */}
      {/* ... */}
    </div>
  );
}
```

## 5. Navigation integration

```tsx
export function LandingPage() {
  const { projects, createProject } = useDataManager();
  
  return (
    <div className="space-y-8">
      {/* Project quick access */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.slice(0, 3).map(project => (
            <Card key={project.projectId}>
              <CardHeader>
                <CardTitle>{project.projectName}</CardTitle>
                <CardDescription>
                  Last modified: {new Date(project.lastModified).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Badge variant={project.businessData ? 'default' : 'secondary'}>
                    Business Case
                  </Badge>
                  <Badge variant={project.marketData ? 'default' : 'secondary'}>
                    Market Analysis
                  </Badge>
                </div>
                <Button onClick={() => {/* load project */}}>
                  Open Project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Create new project */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Start New Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => createProject('New Market Analysis', 'market')}
            className="h-24"
          >
            Market Analysis
          </Button>
          <Button 
            onClick={() => createProject('New Business Case', 'business')}
            className="h-24"
          >
            Business Case
          </Button>
          <Button 
            onClick={() => createProject('Integrated Analysis', 'unified')}
            className="h-24"
          >
            Unified Project
          </Button>
        </div>
      </section>
    </div>
  );
}
```
