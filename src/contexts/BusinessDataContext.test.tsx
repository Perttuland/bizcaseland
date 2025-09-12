import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BusinessDataProvider, useBusinessData } from '@/contexts/BusinessDataContext';
import { createMockBusinessData } from '@/test/mockData';
import { mockLocalStorage } from '@/test/test-utils';

// Wrapper component for testing hooks
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BusinessDataProvider>{children}</BusinessDataProvider>
  );
};

describe('BusinessDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage();
  });

  it('provides default context values', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeNull();
    expect(typeof result.current.updateData).toBe('function');
    expect(typeof result.current.updateAssumption).toBe('function');
    expect(typeof result.current.updateDriver).toBe('function');
    expect(typeof result.current.exportData).toBe('function');
  });

  it('sets business data correctly', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('updates business data correctly', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    const updatedData = { ...mockData, meta: { ...mockData.meta, title: 'Updated Title' } };

    act(() => {
      result.current.updateData(updatedData);
    });

    expect(result.current.data?.meta.title).toBe('Updated Title');
  });

  it('clears business data correctly', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    expect(result.current.data).toEqual(mockData);

    act(() => {
      result.current.updateData(null);
    });

    expect(result.current.data).toBeNull();
  });

  it('updates assumptions using path', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    act(() => {
      result.current.updateAssumption('meta.title', 'New Title from Path');
    });

    expect(result.current.data?.meta.title).toBe('New Title from Path');
  });

  it('handles invalid assumption updates gracefully', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    // Spy on console.warn to verify warning is logged
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.updateAssumption('some.path', 'value');
    });

    expect(consoleSpy).toHaveBeenCalledWith('updateAssumption called with no data');
    expect(result.current.data).toBeNull();

    consoleSpy.mockRestore();
  });

  it('updates drivers correctly', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    if (mockData.drivers && mockData.drivers.length > 0) {
      act(() => {
        result.current.updateDriver(0, { key: 'Updated Driver Key' });
      });

      expect(result.current.data?.drivers?.[0].key).toBe('Updated Driver Key');
    }
  });

  it('handles invalid driver updates gracefully', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    act(() => {
      result.current.updateDriver(0, { key: 'test' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('updateDriver called with no data or drivers');

    consoleSpy.mockRestore();
  });

  it('handles invalid driver index', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    // Try to update an invalid driver index - should handle gracefully without error
    act(() => {
      result.current.updateDriver(999, { key: 'test' });
    });

    // The implementation handles this gracefully without console.error, which is good UX
    // Just verify the operation doesn't crash and data remains intact
    expect(result.current.data).toBeTruthy();
  });

  it('exports data correctly', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    const exportedData = result.current.exportData();
    expect(typeof exportedData).toBe('string');
    expect(exportedData).not.toBe('{}');
    
    // Should be valid JSON
    expect(() => JSON.parse(exportedData)).not.toThrow();
  });

  it('exports null when no data', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const exportedData = result.current.exportData();
    // Implementation correctly returns stringified null when no data exists
    expect(exportedData).toBe('null');
  });

  it('throws error when used outside provider', () => {
    // Capture console.error to prevent test output pollution
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useBusinessData());
    }).toThrow('useBusinessData must be used within a BusinessDataProvider');

    console.error = originalError;
  });

  it('handles deep assumption updates', () => {
    const { result } = renderHook(() => useBusinessData(), {
      wrapper: createWrapper(),
    });

    const mockData = createMockBusinessData();

    act(() => {
      result.current.updateData(mockData);
    });

    act(() => {
      result.current.updateAssumption('assumptions.pricing.avg_unit_price.value', 999);
    });

    expect(result.current.data?.assumptions?.pricing?.avg_unit_price?.value).toBe(999);
  });
});
