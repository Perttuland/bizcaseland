import '@testing-library/jest-dom';
import { vi, beforeAll } from 'vitest';

// Mock ResizeObserver for chart components
beforeAll(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});
