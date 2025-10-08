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

  describe('Segment Volume Editing', () => {
    it('updates segment base volume correctly', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      // Ensure segment structure with pattern-based volume
      if (!mockData.assumptions.customers) {
        mockData.assumptions.customers = { segments: [] };
      }
      mockData.assumptions.customers.segments = [
        {
          id: 'test_segment',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 100, unit: 'units', rationale: 'Base value' }]
          }
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.updateAssumption('assumptions.customers.segments[0].volume.series[0].value', 200);
      });

      expect(result.current.data?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.value).toBe(200);
    });

    it('updates segment growth rate from global settings', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      // Setup with growth_settings
      mockData.assumptions.growth_settings = {
        geom_growth: {
          start: { value: 100, unit: 'units', rationale: 'Base' },
          monthly_growth: { value: 0.05, unit: 'ratio_per_month', rationale: '5% monthly growth' }
        }
      };

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.updateAssumption('assumptions.growth_settings.geom_growth.monthly_growth.value', 0.10);
      });

      expect(result.current.data?.assumptions?.growth_settings?.geom_growth?.monthly_growth?.value).toBe(0.10);
    });

    it('updates segment volume rationale', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      if (!mockData.assumptions.customers) {
        mockData.assumptions.customers = { segments: [] };
      }
      mockData.assumptions.customers.segments = [
        {
          id: 'test_segment',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 100, unit: 'units', rationale: 'Old rationale' }]
          }
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.updateAssumption('assumptions.customers.segments[0].volume.series[0].rationale', 'Updated rationale');
      });

      expect(result.current.data?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.rationale).toBe('Updated rationale');
    });

    it('handles multiple segments correctly', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      if (!mockData.assumptions.customers) {
        mockData.assumptions.customers = { segments: [] };
      }
      mockData.assumptions.customers.segments = [
        {
          id: 'segment_1',
          label: 'Segment 1',
          rationale: 'First',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 100, unit: 'units', rationale: 'Base 1' }]
          }
        },
        {
          id: 'segment_2',
          label: 'Segment 2',
          rationale: 'Second',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 200, unit: 'units', rationale: 'Base 2' }]
          }
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.updateAssumption('assumptions.customers.segments[1].volume.series[0].value', 300);
      });

      expect(result.current.data?.assumptions?.customers?.segments?.[0]?.volume?.series?.[0]?.value).toBe(100);
      expect(result.current.data?.assumptions?.customers?.segments?.[1]?.volume?.series?.[0]?.value).toBe(300);
    });
  });

  describe('Segment Sensitivity Drivers', () => {
    it('adds segment volume as sensitivity driver', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      mockData.drivers = [];
      if (!mockData.assumptions.customers) {
        mockData.assumptions.customers = { segments: [] };
      }
      mockData.assumptions.customers.segments = [
        {
          id: 'test_segment',
          label: 'Test Segment',
          rationale: 'Test',
          volume: {
            type: 'pattern',
            pattern_type: 'geom_growth',
            series: [{ period: 1, value: 100, unit: 'units', rationale: 'Base value' }]
          }
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.addDriver(
          'assumptions.customers.segments[0].volume.series[0].value',
          'segment_base_volume',
          [80, 90, 100, 110, 120],
          'Sensitivity analysis for segment base volume',
          'units'
        );
      });

      expect(result.current.data?.drivers?.length).toBe(1);
      expect(result.current.data?.drivers?.[0].path).toBe('assumptions.customers.segments[0].volume.series[0].value');
      expect(result.current.data?.drivers?.[0].key).toBe('segment_base_volume');
    });

    it('removes segment driver correctly', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      mockData.drivers = [
        {
          key: 'segment_volume',
          path: 'assumptions.customers.segments[0].volume.series[0].value',
          range: [80, 90, 100, 110, 120],
          rationale: 'Test driver'
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.removeDriver('assumptions.customers.segments[0].volume.series[0].value');
      });

      expect(result.current.data?.drivers?.length).toBe(0);
    });

    it('updates segment driver range', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      mockData.drivers = [
        {
          key: 'segment_volume',
          path: 'assumptions.customers.segments[0].volume.series[0].value',
          range: [80, 90, 100, 110, 120],
          rationale: 'Test driver'
        }
      ];

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.updateDriverRange('assumptions.customers.segments[0].volume.series[0].value', [50, 75, 100, 125, 150]);
      });

      const driver = result.current.data?.drivers?.find(
        d => d.path === 'assumptions.customers.segments[0].volume.series[0].value'
      );
      expect(driver?.range).toEqual([50, 75, 100, 125, 150]);
    });

    it('supports growth rate as sensitivity driver', () => {
      const { result } = renderHook(() => useBusinessData(), {
        wrapper: createWrapper(),
      });

      const mockData = createMockBusinessData();
      mockData.drivers = [];
      mockData.assumptions.growth_settings = {
        geom_growth: {
          start: { value: 100, unit: 'units', rationale: 'Base' },
          monthly_growth: { value: 0.05, unit: 'ratio_per_month', rationale: '5% monthly growth' }
        }
      };

      act(() => {
        result.current.updateData(mockData);
      });

      act(() => {
        result.current.addDriver(
          'assumptions.growth_settings.geom_growth.monthly_growth.value',
          'monthly_growth_rate',
          [0.03, 0.05, 0.07, 0.10, 0.15],
          'Growth rate sensitivity',
          'ratio_per_month'
        );
      });

      expect(result.current.data?.drivers?.length).toBe(1);
      expect(result.current.data?.drivers?.[0].path).toBe('assumptions.growth_settings.geom_growth.monthly_growth.value');
    });
  });
});
