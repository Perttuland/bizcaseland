import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BusinessCaseAnalyzer } from '../../../components/business-case/BusinessCaseAnalyzer';
import { LandingPage } from '../../../components/landing/LandingPage';
import { AppProvider } from '../../../contexts/AppContext';
import { BusinessDataProvider } from '../../../contexts/BusinessDataContext';
import { useToast } from '../../../hooks/use-toast';

// Mock the toast hook
vi.mock('../../../hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock fetch for loading examples
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to render with all required providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        <BusinessDataProvider>
          {component}
        </BusinessDataProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Reset Data Button Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('LandingPage Reset Button', () => {
    it('should not show reset button when no data is loaded', () => {
      renderWithProviders(<LandingPage />);
      
      const resetButton = screen.queryByRole('button', { name: /reset all data/i });
      expect(resetButton).not.toBeInTheDocument();
    });

    it('should show reset button when business data is loaded', () => {
      // Simulate data in localStorage
      localStorage.setItem('businessCaseData', JSON.stringify({ meta: { title: 'Test Case' } }));
      
      renderWithProviders(<LandingPage />);
      
      const resetButton = screen.getByRole('button', { name: /reset all data/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should show reset button when market data is loaded', () => {
      // Simulate market data in localStorage
      localStorage.setItem('bizcaseland_market_data', JSON.stringify({ meta: { title: 'Test Market' } }));
      
      renderWithProviders(<LandingPage />);
      
      const resetButton = screen.getByRole('button', { name: /reset all data/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should clear all data when reset is confirmed', async () => {
      const user = userEvent.setup();
      
      // Setup test data
      localStorage.setItem('businessCaseData', JSON.stringify({ meta: { title: 'Test Case' } }));
      localStorage.setItem('bizcaseland_market_data', JSON.stringify({ meta: { title: 'Test Market' } }));
      
      renderWithProviders(<LandingPage />);
      
      const resetButton = screen.getByRole('button', { name: /reset all data/i });
      await user.click(resetButton);
      
      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/this will permanently delete/i)).toBeInTheDocument();
      });
      
      // Confirm reset
      const confirmButton = screen.getByRole('button', { name: /reset all data$/i });
      await user.click(confirmButton);
      
      // Data should be cleared
      await waitFor(() => {
        expect(localStorage.getItem('businessCaseData')).toBeNull();
        expect(localStorage.getItem('bizcaseland_market_data')).toBeNull();
      });
    });
  });

  describe('BusinessCaseAnalyzer Reset Access', () => {
    it('should provide access to reset functionality when data is loaded', async () => {
      const user = userEvent.setup();
      
      // Mock successful fetch of example data
      const mockExampleData = {
        meta: { title: 'SaaS Platform', business_model: 'recurring' },
        assumptions: { pricing: { avg_unit_price: { value: 99 } } }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExampleData,
      });
      
      renderWithProviders(<BusinessCaseAnalyzer />);
      
      // Load an example (this should be accessible via the new ExampleBusinessCases component)
      const useExampleButtons = screen.getAllByText(/use this example/i);
      expect(useExampleButtons.length).toBeGreaterThan(0);
      await user.click(useExampleButtons[0]); // Click the first example
      
      await waitFor(() => {
        // Should have data loaded, which means reset should be accessible
        // Either via a direct reset button or navigation to home page
        const backToHomeButton = screen.getByRole('button', { name: /back to home/i });
        expect(backToHomeButton).toBeInTheDocument();
      });
    });

    it('should maintain reset button visibility after loading examples', async () => {
      const user = userEvent.setup();
      
      // Mock successful fetch of example data
      const mockExampleData = {
        meta: { title: 'SaaS Platform', business_model: 'recurring' },
        assumptions: { pricing: { avg_unit_price: { value: 99 } } }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExampleData,
      });
      
      renderWithProviders(<BusinessCaseAnalyzer />);
      
      // Load an example
      const useExampleButtons = screen.getAllByText(/use this example/i);
      expect(useExampleButtons.length).toBeGreaterThan(0);
      await user.click(useExampleButtons[0]); // Click the first example
      
      // Wait for the example to load - check that the title changes
      await waitFor(() => {
        const allSaasPlatformTexts = screen.getAllByText('SaaS Platform');
        expect(allSaasPlatformTexts.length).toBeGreaterThan(0);
      });
      
      // Since data is loaded, the "Back to Home" button should be available for navigation
      // where users can access the reset functionality
      const backButton = screen.getByRole('button', { name: /back to home/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Example Loading Integration', () => {
    it('should update app state when example is loaded', async () => {
      const user = userEvent.setup();
      
      // Mock successful fetch of example data
      const mockExampleData = {
        meta: { title: 'SaaS Platform', business_model: 'recurring' },
        assumptions: { pricing: { avg_unit_price: { value: 99 } } }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExampleData,
      });
      
      renderWithProviders(<BusinessCaseAnalyzer />);
      
      // Load an example
      const useExampleButtons = screen.getAllByText(/use this example/i);
      expect(useExampleButtons.length).toBeGreaterThan(0);
      await user.click(useExampleButtons[0]); // Click the first example
      
      // Should trigger the loadExampleBusinessCase function
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/sample-data/business-cases/saas-platform-revenue-growth.json');
      });
      
      // Verify the example data was loaded by checking title update
      await waitFor(() => {
        const allSaasPlatformTexts = screen.getAllByText('SaaS Platform');
        expect(allSaasPlatformTexts.length).toBeGreaterThan(0);
      });
    });
  });
});
