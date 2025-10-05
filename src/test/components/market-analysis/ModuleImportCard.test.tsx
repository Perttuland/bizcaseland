/**
 * Simplified tests for ModuleImportCard component
 * Basic smoke tests to verify component renders and functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleImportCard } from '@/components/market-analysis/shared/ModuleImportCard';

// Mock dependencies
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/lib/clipboard-utils', () => ({
  copyTextToClipboard: vi.fn()
}));

describe('ModuleImportCard', () => {
  it('should render with module name', () => {
    render(
      <ModuleImportCard
        moduleId="strategic_planning"
        moduleName="Strategic Planning"
        icon="Target"
        onDataUpload={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /Strategic Planning/i })).toBeInTheDocument();
  });

  it('should have Get Template button', () => {
    render(
      <ModuleImportCard
        moduleId="market_sizing"
        moduleName="Market Sizing"
        onDataUpload={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /get template/i })).toBeInTheDocument();
  });

  it('should have Paste Data button', () => {
    render(
      <ModuleImportCard
        moduleId="customer_analysis"
        moduleName="Customer Analysis"
        onDataUpload={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /paste data/i })).toBeInTheDocument();
  });

  it('should call clipboard copy when Get Template is clicked', async () => {
    const { copyTextToClipboard } = await import('@/lib/clipboard-utils');
    vi.mocked(copyTextToClipboard).mockResolvedValue({ 
      success: true,
      method: 'clipboard-api' 
    });

    render(
      <ModuleImportCard
        moduleId="strategic_planning"
        moduleName="Strategic Planning"
        onDataUpload={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /get template/i });
    await userEvent.click(button);

    expect(copyTextToClipboard).toHaveBeenCalled();
  });
});
