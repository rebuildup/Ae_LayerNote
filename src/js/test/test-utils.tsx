/**
 * Test Utilities
 * Custom render functions and test helpers for React components
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { AppProvider } from '../contexts/AppContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { EditorProvider } from '../contexts/EditorContext';
import { UserSettings, defaultUserSettings } from '../types/settings';

// Custom render function with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialSettings?: Partial<UserSettings>;
  initialAppState?: any;
}

const AllTheProviders: React.FC<{
  children: React.ReactNode;
  initialSettings?: Partial<UserSettings>;
}> = ({ children, initialSettings }) => {
  return (
    <SettingsProvider>
      <AppProvider>
        <EditorProvider>{children}</EditorProvider>
      </AppProvider>
    </SettingsProvider>
  );
};

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { initialSettings, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialSettings={initialSettings}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Test data factories
export const createMockNote = (overrides = {}) => ({
  id: 'test-note-1',
  title: 'Test Note',
  content: 'This is a test note content',
  category: 'general',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockLayerInfo = (overrides = {}) => ({
  id: 'layer-1',
  name: 'Test Layer',
  comment: 'Test comment',
  index: 1,
  selected: true,
  ...overrides,
});

export const createMockPropertyInfo = (overrides = {}) => ({
  path: 'layer.transform.position',
  name: 'Position',
  expression: 'time * 100',
  hasExpression: true,
  propertyType: 'TwoD_SPATIAL',
  ...overrides,
});

export const createMockUserSettings = (
  overrides: Partial<UserSettings> = {}
): UserSettings => ({
  ...defaultUserSettings,
  ...overrides,
});

// Mock event creators
export const createMockKeyboardEvent = (key: string, modifiers: any = {}) => {
  return new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrlKey || false,
    metaKey: modifiers.metaKey || false,
    shiftKey: modifiers.shiftKey || false,
    altKey: modifiers.altKey || false,
    bubbles: true,
  });
};

export const createMockMouseEvent = (type: string, coordinates: any = {}) => {
  return new MouseEvent(type, {
    clientX: coordinates.x || 0,
    clientY: coordinates.y || 0,
    bubbles: true,
  });
};

// Async test helpers
export const waitForAsyncOperation = (ms: number = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};

// Mock storage helpers
export const mockStorageSuccess = () => {
  const mockCEP = (window as any).cep;
  mockCEP.fs.writeFile.mockImplementation(
    (path: string, data: string, callback: Function) => {
      callback(null, 'success');
    }
  );
  mockCEP.fs.readFile.mockImplementation((path: string, callback: Function) => {
    callback(null, data || '{}');
  });
};

export const mockStorageError = (errorMessage: string = 'Storage error') => {
  const mockCEP = (window as any).cep;
  mockCEP.fs.writeFile.mockImplementation(
    (path: string, data: string, callback: Function) => {
      callback(new Error(errorMessage));
    }
  );
  mockCEP.fs.readFile.mockImplementation((path: string, callback: Function) => {
    callback(new Error(errorMessage));
  });
};

// Component test helpers
export const getByTestId = (container: HTMLElement, testId: string) => {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!element) {
    throw new Error(`Element with testId "${testId}" not found`);
  }
  return element;
};

export const queryByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`);
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };
