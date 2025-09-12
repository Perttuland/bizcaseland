import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusinessDataProvider } from "./contexts/BusinessDataContext";
import { DataManagerProvider } from "./contexts/DataManagerContext";
import { AppProvider } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { ErrorBoundary } from "./components/shared";
import { Index } from "./pages/Index";
import { NotFound } from "./pages/NotFound";
import { CrossToolIntegrationDemo } from "./pages/CrossToolDemo";
import { LandingPage } from "./components/landing";
import { BusinessCaseAnalyzer } from "./components/business-case";
import { MarketAnalysisSuite } from "./components/market-analysis/MarketAnalysisSuite";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="bizcaseland-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppProvider>
              <BusinessDataProvider>
                <DataManagerProvider>
                  <Toaster />
                  <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/business" element={<BusinessCaseAnalyzer />} />
                    <Route path="/market" element={<MarketAnalysisSuite />} />
                    <Route path="/demo" element={<CrossToolIntegrationDemo />} />
                    <Route path="/legacy" element={<Index />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                </DataManagerProvider>
            </BusinessDataProvider>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export { App };
