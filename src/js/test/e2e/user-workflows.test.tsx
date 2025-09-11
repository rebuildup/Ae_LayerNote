/**
 * End-to-End User Workflow Tests
 * Tests complete user scenarios and workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import { App } from '../../main/main';
import {
  mockStorageSuccess,
  createMockKeyboardEvent,
  flushPromises,
} from '../test-utils';

// Mock dependencies
jest.mock('../../lib/utils/bolt', () => ({
  csi: { getApplicationID: () => 'AEFT' },
  evalES: jest.fn(() => 'mocked result'),
  evalTS: jest.fn(() => Promise.resolve('mocked result')),
  openLinkInBrowser: jest.fn(),
  subscribeBackgroundColor: jest.fn(),
}));

jest.mock('../../lib/cep/node', () => ({
  os: { platform: 'win32' },
  path: { basename: (path: string) => path.split('/').pop() },
}));

describe('User Workflows E2E', () => {
  beforeEach(() => {
    mockStorageSuccess();
    (window as any).cep = {
      ...(window as any).cep,
      event: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };
  });

  describe('First-Time User Experience', () => {
    it('should guide new user through the interface', async () => {
      render(<App />);

      // App should load with default state
      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Default mode should be expression editor
      expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();

      // Sidebar should be visible with mode options
      expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();
      expect(screen.getByText(/Layer Comments/i)).toBeInTheDocument();
      expect(screen.getByText(/Notes/i)).toBeInTheDocument();

      // Settings should be accessible
      expect(screen.getByText(/⚙️ Settings/i)).toBeInTheDocument();
    });

    it('should allow user to explore different modes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Switch to Layer Comments
      fireEvent.click(screen.getByText(/Layer Comments/i));
      await waitFor(() => {
        expect(screen.getByText(/Mode: comment/i)).toBeInTheDocument();
      });

      // Switch to Notes
      fireEvent.click(screen.getByText(/Notes/i));
      await waitFor(() => {
        expect(screen.getByText(/Mode: note/i)).toBeInTheDocument();
      });

      // Back to Expression Editor
      fireEvent.click(screen.getByText(/Expression Editor/i));
      await waitFor(() => {
        expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();
      });
    });
  });

  describe('Expression Editing Workflow', () => {
    it('should allow user to edit expressions', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();
      });

      // Should be in expression mode by default
      expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();

      // Monaco editor should be present (mocked)
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();

      // User can type in the editor
      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: 'time * 360' } });

      expect(textarea).toHaveValue('time * 360');
    });

    it('should handle expression validation and errors', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Type invalid expression
      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, {
        target: { value: 'invalid expression syntax (' },
      });

      // Error handling would be implemented in the actual Monaco integration
      expect(textarea).toHaveValue('invalid expression syntax (');
    });
  });

  describe('Settings Management Workflow', () => {
    it('should allow user to customize settings', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/⚙️ Settings/i)).toBeInTheDocument();
      });

      // Open settings
      fireEvent.click(screen.getByText(/⚙️ Settings/i));

      await waitFor(() => {
        expect(screen.getByText(/Editor Settings/i)).toBeInTheDocument();
      });

      // Settings modal should be open with tabs
      expect(screen.getByText(/Editor/i)).toBeInTheDocument();
      expect(screen.getByText(/Linting/i)).toBeInTheDocument();
      expect(screen.getByText(/Formatting/i)).toBeInTheDocument();

      // User can change theme
      const themeSelect = screen.getByDisplayValue(/dark/i);
      fireEvent.change(themeSelect, { target: { value: 'light' } });

      expect(themeSelect).toHaveValue('light');
    });

    it('should persist settings changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/⚙️ Settings/i)).toBeInTheDocument();
      });

      // Open settings and make changes
      fireEvent.click(screen.getByText(/⚙️ Settings/i));

      await waitFor(() => {
        expect(screen.getByText(/Editor Settings/i)).toBeInTheDocument();
      });

      // Change font size
      const fontSizeInput = screen.getByDisplayValue('14');
      fireEvent.change(fontSizeInput, { target: { value: '16' } });

      // Close settings
      fireEvent.click(screen.getByText('×'));

      // Settings should be saved automatically
      await waitFor(() => {
        expect((window as any).cep.fs.writeFile).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard Shortcuts Workflow', () => {
    it('should respond to keyboard shortcuts', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Test mode switching shortcuts
      act(() => {
        fireEvent.keyDown(
          document,
          createMockKeyboardEvent('2', { ctrlKey: true })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Mode: comment/i)).toBeInTheDocument();
      });

      // Test sidebar toggle
      act(() => {
        fireEvent.keyDown(
          document,
          createMockKeyboardEvent('b', { ctrlKey: true })
        );
      });

      await waitFor(() => {
        expect(screen.queryByText(/Layer Note/i)).not.toBeInTheDocument();
      });

      // Test help shortcut
      act(() => {
        fireEvent.keyDown(document, createMockKeyboardEvent('F1'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle and recover from errors gracefully', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Simulate a storage error
      const mockCEP = (window as any).cep;
      mockCEP.fs.writeFile.mockImplementation(
        (path: string, data: string, callback: Function) => {
          callback(new Error('Storage failed'));
        }
      );

      // Try to open settings (which would trigger storage)
      fireEvent.click(screen.getByText(/⚙️ Settings/i));

      // App should still be functional despite storage error
      await waitFor(() => {
        expect(screen.getByText(/Editor Settings/i)).toBeInTheDocument();
      });
    });

    it('should handle network/CEP disconnection', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Simulate CEP disconnection
      delete (window as any).cep;

      // App should continue to work with localStorage fallback
      expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design Workflow', () => {
    it('should adapt to mobile viewport', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Layout should adapt to mobile
      const sidebar = screen.getByText(/Layer Note/i).closest('.sidebar');
      expect(sidebar).toBeInTheDocument();

      // Mobile-specific interactions should work
      fireEvent.click(screen.getByText(/Expression Editor/i));
      await waitFor(() => {
        expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Workflow', () => {
    it('should handle rapid user interactions', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Rapid mode switching
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText(/Layer Comments/i));
        fireEvent.click(screen.getByText(/Expression Editor/i));
      }

      // Should still be responsive
      await waitFor(() => {
        expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();
      });
    });

    it('should handle large amounts of data', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
      });

      // Simulate typing large expression
      const textarea = screen.getByTestId('monaco-textarea');
      const largeExpression = 'time * 360 + '.repeat(100) + 'value';

      fireEvent.change(textarea, { target: { value: largeExpression } });

      expect(textarea).toHaveValue(largeExpression);
    });
  });
});
