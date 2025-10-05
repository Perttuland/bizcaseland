import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssumptionsTab } from '../../../components/business-case/AssumptionsTab';
import { TooltipProvider } from '../../../components/ui/tooltip';

// Mock the hook
const mockUseBusinessData = vi.fn();
vi.mock('../../../contexts/BusinessDataContext', () => ({
  useBusinessData: () => mockUseBusinessData()
}));

// Mock data with per_month units to test formatting bug fix
const testData = {
  schema_version: "1.0",
  meta: {
    title: "Volume Formatting Test",
    description: "Test data to verify Month prefix bug is fixed",
    business_model: "revenue_growth",
    currency: "EUR",
    periods: 12,
    frequency: "monthly"
  },
  assumptions: {
    customers: {
      segments: [
        {
          id: 'test_segment',
          label: 'Test Segment',
          rationale: 'Testing volume formatting',
          volume: {
            type: 'pattern',
            base_value: 50,
            unit: 'customers_per_month',
            rationale: 'Should show as 50, not Month 50'
          },
          growth_rate: {
            type: 'pattern',
            value: 0.15,
            unit: 'decimal',
            rationale: 'Test growth rate'
          },
          pattern_type: {
            type: 'fixed',
            value: 'geometric',
            unit: 'n/a',
            rationale: 'Test pattern'
          }
        }
      ]
    },
    pricing: {
      avg_unit_price: {
        value: 99,
        unit: 'EUR_per_month',
        rationale: 'Test price'
      }
    },
    financial: {
      analysis_period: {
        value: 12,
        unit: 'month',
        rationale: 'Test period'
      }
    }
  }
};

describe('AssumptionsTab formatValue Bug Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBusinessData.mockReturnValue({
      data: testData,
      updateData: vi.fn(),
      updateAssumption: vi.fn(),
      updateDriver: vi.fn(),
      exportData: vi.fn()
    });
  });

  it('should format per_month units without Month prefix (bug fix verification)', () => {
    render(
      <TooltipProvider>
        <AssumptionsTab />
      </TooltipProvider>
    );
    
    // Critical test: ensure "50" appears without "Month" prefix
    expect(screen.getByText('50')).toBeInTheDocument();
    
    // Critical regression test: ensure "Month 50" does NOT appear
    expect(screen.queryByText('Month 50')).not.toBeInTheDocument();
    
    // Also check that actual month values still get Month prefix
    expect(screen.getByText('Month 12')).toBeInTheDocument(); // analysis_period should still have Month prefix
  });

  it('should handle actual month units with Month prefix correctly', () => {
    render(
      <TooltipProvider>
        <AssumptionsTab />
      </TooltipProvider>
    );
    
    // The analysis_period with unit 'month' should still show "Month 12"
    expect(screen.getByText('Month 12')).toBeInTheDocument();
  });
});
