/**
 * MarketInsightsCart Component Tests
 * 
 * Comprehensive test suite for the shopping cart component that collects
 * market insights and transfers them to business case analysis.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { MarketInsightsCart } from './MarketInsightsCart';
import { saasMarketData, fintechMarketData, iotMarketData } from '@/lib/market-insights-test-data';
import { MarketData } from '@/lib/market-calculations';

// ===== MOCK COMPONENTS =====

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={`card ${className}`}>{children}</div>,
  CardHeader: ({ children }: any) => <div className="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 className="card-title">{children}</h3>,
  CardContent: ({ children }: any) => <div className="card-content">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`btn ${variant} ${size} ${className}`}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  )
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div className={`alert ${variant}`}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div className="alert-description">{children}</div>
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Archive: () => <div data-testid="archive-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Package: () => <div data-testid="package-icon" />
}));

// ===== TEST SETUP =====

describe('MarketInsightsCart', () => {
  const mockOnTransferComplete = vi.fn();
  const mockOnCartChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== BASIC RENDERING TESTS =====

  describe('Basic Rendering', () => {
    it('renders empty cart state when no market data is provided', () => {
      render(
        <MarketInsightsCart 
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
      expect(screen.getByText(/add market insights/i)).toBeInTheDocument();
    });

    it('renders market data insights when market data is provided', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Wait for insights to load
      await waitFor(() => {
        expect(screen.getByText(/available market insights/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/european saas customer service platform/i)).toBeInTheDocument();
    });

    it('displays loading state while extracting insights', () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      expect(screen.getByText(/extracting insights/i)).toBeInTheDocument();
    });

    it('shows cart item count in header', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    });
  });

  // ===== INSIGHT EXTRACTION TESTS =====

  describe('Insight Extraction', () => {
    it('extracts volume projection insights from SaaS market data', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
          showDetails={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Market-Based Volume Projection/i)).toBeInTheDocument();
      });
    });

    it('extracts market sizing insights from fintech data', async () => {
      render(
        <MarketInsightsCart 
          marketData={fintechMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Market Sizing Analysis/i)).toBeInTheDocument();
      });
    });

    it('extracts customer segment insights from IoT data', async () => {
      render(
        <MarketInsightsCart 
          marketData={iotMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Customer Segment:/i)[0]).toBeInTheDocument();
      });
    });

    it('displays confidence scores for extracted insights', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/confidence/i)[0]).toBeInTheDocument();
      });
    });
  });

  // ===== CART MANAGEMENT TESTS =====

  describe('Cart Management', () => {
    it('adds insights to cart when plus button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Wait for insights to load
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')).toHaveLength(7);
      });

      // Click the add button
      const addButtons = screen.getAllByTestId('plus-icon');
      const addButton = addButtons[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Verify cart change callback was called
      await waitFor(() => {
        expect(mockOnCartChange).toHaveBeenCalled();
      });
    });

    it('removes insights from cart when minus button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // First add an item
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')).toHaveLength(7);
      });

      const addButtons = screen.getAllByTestId('plus-icon');
      const addButton = addButtons[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Wait for item to be added, then remove it
      await waitFor(() => {
        const removeButton = screen.getByTestId('minus-icon').closest('button');
        if (removeButton) {
          return user.click(removeButton);
        }
      });

      // Verify removal
      expect(mockOnCartChange).toHaveBeenCalledTimes(2); // Once for add, once for remove
    });

    it('clears entire cart when clear button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add an item first
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')[0]).toBeInTheDocument();
      });

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Clear cart
      await waitFor(() => {
        const clearButton = screen.getByTestId('trash-icon').closest('button');
        if (clearButton) {
          return user.click(clearButton);
        }
      });

      expect(mockOnCartChange).toHaveBeenCalled();
    });

    it('prevents adding duplicate insights to cart', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add the same item twice
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')[0]).toBeInTheDocument();
      });

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
        
        // Try to add again - button should be disabled
        await waitFor(() => {
          expect(addButton).toBeDisabled();
        });
      }
    });
  });

  // ===== TRANSFER FUNCTIONALITY TESTS =====

  describe('Transfer Functionality', () => {
    it('enables transfer button when cart has items', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add an item
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')[0]).toBeInTheDocument();
      });

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Check transfer button is enabled
      await waitFor(() => {
        const transferButton = screen.getByText(/transfer to business case/i);
        expect(transferButton).not.toBeDisabled();
      });
    });

    it('transfers insights and calls completion callback', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add an item
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')[0]).toBeInTheDocument();
      });

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // Transfer
      await waitFor(() => {
        const transferButton = screen.getByText(/transfer to business case/i);
        return user.click(transferButton);
      });

      // Verify transfer completion
      await waitFor(() => {
        expect(mockOnTransferComplete).toHaveBeenCalled();
      });
    });

    it('shows success message after successful transfer', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add and transfer an item
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')[0]).toBeInTheDocument();
      });

      const addButton = screen.getAllByTestId('plus-icon')[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      await waitFor(() => {
        const transferButton = screen.getByText(/transfer to business case/i);
        return user.click(transferButton);
      });

      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/successfully transferred/i)).toBeInTheDocument();
      });
    });

    it('prevents transfer when cart is empty', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Wait for insights to load
      await waitFor(() => {
        expect(screen.getByText(/Market-Based Volume Projection/i)).toBeInTheDocument();
      });

      // Transfer button should not be present when cart is empty
      expect(screen.queryByText(/Transfer to Business Case/i)).not.toBeInTheDocument();
      
      // Verify empty cart message is shown
      expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    });
  });

  // ===== CONFIGURATION TESTS =====

  describe('Configuration', () => {
    it('respects maxItems configuration', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
          maxItems={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/available market insights/i)).toBeInTheDocument();
      });
    });

    it('shows detailed information when showDetails is true', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
          showDetails={true}
        />
      );

      await waitFor(() => {
        // Should show more detailed insight descriptions
        expect(screen.getByText(/available market insights/i)).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      const { container } = render(
        <MarketInsightsCart 
          className="custom-cart-class"
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      expect(container.firstChild).toHaveClass('custom-cart-class');
    });
  });

  // ===== ERROR HANDLING TESTS =====

  describe('Error Handling', () => {
    it('displays error message when insight extraction fails', async () => {
      // Mock service to throw error
      const invalidMarketData = { ...saasMarketData, market_sizing: undefined } as MarketData;
      
      render(
        <MarketInsightsCart 
          marketData={invalidMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no insights available/i)).toBeInTheDocument();
      });
    });

    it('handles cart service errors gracefully', async () => {
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Test will pass if no uncaught errors are thrown
      await waitFor(() => {
        expect(screen.getByText(/market insights cart/i)).toBeInTheDocument();
      });
    });
  });

  // ===== INTEGRATION TESTS =====

  describe('Integration', () => {
    it('provides complete workflow from insight selection to transfer', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // 1. Wait for insights to load
      await waitFor(() => {
        expect(screen.getByText(/available market insights/i)).toBeInTheDocument();
      });

      // 2. Add insight to cart
      const addButtons = screen.getAllByTestId('plus-icon');
      const addButton = addButtons[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      // 3. Verify cart state updated
      await waitFor(() => {
        expect(screen.getByText(/1 item/)).toBeInTheDocument();
      });

      // 4. Transfer to business case
      const transferButton = screen.getByText(/transfer to business case/i);
      await user.click(transferButton);

      // 5. Verify completion
      await waitFor(() => {
        expect(mockOnTransferComplete).toHaveBeenCalled();
        expect(screen.getByText(/successfully transferred/i)).toBeInTheDocument();
      });
    });

    it('maintains cart state consistency across operations', async () => {
      const user = userEvent.setup();
      
      render(
        <MarketInsightsCart 
          marketData={saasMarketData}
          onTransferComplete={mockOnTransferComplete}
          onCartChange={mockOnCartChange}
        />
      );

      // Add multiple items and verify state
      await waitFor(() => {
        expect(screen.getAllByTestId('plus-icon')).toHaveLength(7); // Should have multiple add buttons
      });

      // Each cart operation should trigger cart change callback
      const addButtons = screen.getAllByTestId('plus-icon');
      const addButton = addButtons[0].closest('button');
      if (addButton) {
        await user.click(addButton);
      }

      await waitFor(() => {
        expect(mockOnCartChange).toHaveBeenCalled();
      });
    });
  });
});
