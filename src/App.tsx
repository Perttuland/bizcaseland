import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BusinessDataProvider } from "./contexts/BusinessDataContext";
import { AppProvider } from "./contexts/AppContext";
import { ErrorBoundary } from "./components/shared";
import { Index } from "./pages/Index";
import { NotFound } from "./pages/NotFound";
import { LandingPage } from "./components/landing";
import { BusinessCaseAnalyzer } from "./components/business-case";
import { MarketAnalysisSuite } from "./components/market-analysis/MarketAnalysisSuite";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <BusinessDataProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/business" element={<BusinessCaseAnalyzer />} />
                  <Route path="/market" element={<MarketAnalysisSuite />} />
                  <Route path="/legacy" element={<Index />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </BusinessDataProvider>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export { App };
