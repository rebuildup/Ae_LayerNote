/**
 * Test Setup and Configuration
 * Sets up the testing environment for React components and utilities
 */

import '@testing-library/jest-dom';

// Mock CEP environment
const mockCEP = {
  fs: {
    writeFile: jest.fn((path: string, data: string, callback: (err: Error | null, res?: any) => void) => {
      callback(null, 'success');
    }),
    readFile: jest.fn((path: string, callback: (err: Error | null, res?: any) => void) => {
      callback(null, '{}');
    }),
    deleteFile: jest.fn((path: string, callback: (err: Error | null) => void) => {
      callback(null);
    }),
    readdir: jest.fn((path: string, callback: (err: Error | null, res?: any[]) => void) => {
      callback(null, []);
    }),
    getDataFolder: jest.fn(() => '/mock/data/folder'),
  },
  event: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
};

// Mock window.cep
Object.defineProperty(window, 'cep', {
  value: mockCEP,
  writable: true,
  configurable: true,
});

// Mock window.cep_node
Object.defineProperty(window, 'cep_node', {
  value: {
    global: {
      __dirname: '/mock/extension/path',
    },
  },
  writable: true,
  configurable: true,
});

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onChange, onMount, value }: any) => {
    const mockEditor = {
      getValue: () => value,
      setValue: (newValue: string) => onChange?.(newValue),
      addCommand: jest.fn(),
      updateOptions: jest.fn(),
      getModel: () => ({
        uri: { toString: () => 'mock://model' },
      }),
    };

    // Simulate onMount callback
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0);
    }

    return (
      <div data-testid="monaco-editor">
        <textarea
          value={value}
          onChange={e => onChange?.(e.target.value)}
          data-testid="monaco-textarea"
        />
      </div>
    );
  },
}));

// Monaco editor is mocked via moduleNameMapper in jest.config.cjs

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'PerformanceObserver', {
  value: class MockPerformanceObserver {
    observe = jest.fn();
    disconnect = jest.fn();
  },
  writable: true,
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  },
  writable: true,
});

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  },
  writable: true,
});

// Mock console methods for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});

  // Suppress console errors/warnings in tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
export const mockCEPEnvironment = mockCEP;
export const mockLocalStorage = localStorageMock;
