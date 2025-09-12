import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render, mockLocalStorage } from '@/test/test-utils';
import { CrossToolIntegrationDemo } from '@/pages/CrossToolDemo';

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/demo' }),
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('Cross-Tool Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage();
  });

  it('renders cross-tool demo page', () => {
    render(<CrossToolIntegrationDemo />);
    expect(screen.getByText('Cross-Tool Integration Demo')).toBeInTheDocument();
  });

  it('displays sample market data', () => {
    render(<CrossToolIntegrationDemo />);
    
    expect(screen.getByText('Sample Market Analysis Data')).toBeInTheDocument();
    expect(screen.getByText(/using sample saas platform market analysis/i)).toBeInTheDocument();
  });

  it('shows market data summary cards', () => {
    render(<CrossToolIntegrationDemo />);
    
    // Should show TAM, SAM, SOM values - using getAllByText for elements that appear multiple times
    expect(screen.getAllByText(/€2\.5M/)[0]).toBeInTheDocument(); // TAM
    expect(screen.getAllByText(/60%/)[0]).toBeInTheDocument(); // SAM percentage
    expect(screen.getAllByText(/30%/)[0]).toBeInTheDocument(); // SOM percentage
  });

  it('displays customer segments', () => {
    render(<CrossToolIntegrationDemo />);
    
    expect(screen.getByText('Available Customer Segments')).toBeInTheDocument();
  });

  it('provides clear user guidance', () => {
    render(<CrossToolIntegrationDemo />);
    
    // Should have clear instructions for users
    expect(screen.getByText(/Demo Instructions/i)).toBeInTheDocument();
  });

  it('displays technical implementation details', () => {
    render(<CrossToolIntegrationDemo />);
    
    // Should show technical information about the integration
    const technicalTexts = ['volume', 'data', 'analysis', 'calculation'];
    const hasTechnicalInfo = technicalTexts.some(term =>
      screen.queryAllByText(new RegExp(term, 'i')).length > 0
    );
    
    expect(hasTechnicalInfo).toBe(true);
  });

  it('shows market metrics correctly', () => {
    render(<CrossToolIntegrationDemo />);
    
    // Check each metric is displayed (using queryAllByText for multiple matches)
    const metricsTexts = ['TAM', 'SAM', 'SOM'];
    metricsTexts.forEach(metric => {
      const elements = screen.queryAllByText(new RegExp(metric, 'i'));
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
