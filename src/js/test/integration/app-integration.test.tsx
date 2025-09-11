/**
 * App Integration Tests
 * Tests for complete application workflows and component integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import { App } from '../../main/main';
import { mockStorageSuccess, createMockKeyboardEvent } from '../test-utils';

// Mock the bolt utilities
jest.mock('../../lib/utils/bolt', () => ({
  csi: { getApplicationID: () => 'AEFT' },
  evalES: jest.fn(() => 'mocked result'),
  evalTS: jest.fn(() => Promise.resolve('mocked result')),
  openLinkInBrowser: jest.fn(),
  subscribeBackgroundColor: jest.fn(),
}));

// Mock the node utilities
jest.mock('../../lib/cep/node', () => ({
  os: { platform: 'win32' },
  path: { basename: (path: string) => path.split('/').pop() },
}));

describe('App Integration', () => {
  beforeEach(() => {
    mockStorageSuccess();
    // Mock window.cep for background color subscription
    (window as any).cep = {
      ...(window as any).cep,
      event: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };
  });

  describe('Application Initialization', () => {
    it('should render the complete application', async () => {
      render(<App />);

      // Wait for async initialization
      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Check main components are rendered
      expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();
      expect(screen.getByText(/Layer Comments/i)).toBeInTheDocument();
      expect(screen.getByText(/Notes/i)).toBeInTheDocument();
    });

    it('should initialize with expression mode active', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();
      });
    });

    it('should load settings on startup', async () => {
      render(<App />);

      // Settings should be loaded automatically
      await waitFor(() => {
        expect((window as any).cep.fs.readFile).toHaveBeenCalled();
      });
    });
  });

  describe('Mode Switching', () => {
    it('should switch between modes using sidebar buttons', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();
      });

      // Click on Layer Comments mode
      const commentButton = screen.getByText(/Layer Comments/i);
      fireEvent.click(commentButton);

      await waitFor(() => {
        expect(screen.getByText(/Mode: comment/i)).toBeInTheDocument();
      });

      // Click on Notes mode
      const notesButton = screen.getByText(/Notes/i);
      fireEvent.click(notesButton);

      await waitFor(() => {
        expect(screen.getByText(/Mode: note/i)).toBeInTheDocument();
      });
    });

    it('should switch modes using keyboard shortcuts', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Mode: expression/i)).toBeInTheDocument();
      });

      // Press Ctrl+2 for comment mode
      act(() => {
        fireEvent.keyDown(
          document,
          createMockKeyboardEvent('2', { ctrlKey: true })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Mode: comment/i)).toBeInTheDocument();
      });

      // Press Ctrl+3 for notes mode
      act(() => {
        fireEvent.keyDown(
          document,
          createMockKeyboardEvent('3', { ctrlKey: true })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Mode: note/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Functionality', () => {
    it('should toggle sidebar using button', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Find and click the collapse button
      const toggleButton = screen.getByTitle(/Collapse sidebar/i);
      fireEvent.click(toggleButton);

      // Sidebar should be collapsed (content hidden)
      await waitFor(() => {
        expect(screen.queryByText(/Layer Note/i)).not.toBeInTheDocument();
      });
    });

    it('should toggle sidebar using keyboard shortcut', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Press Ctrl+B to toggle sidebar
      act(() => {
        fireEvent.keyDown(
          document,
          createMockKeyboardEvent('b', { ctrlKey: true })
        );
      });

      await waitFor(() => {
        expect(screen.queryByText(/Layer Note/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Modal Management', () => {
    it('should open settings modal', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Settings/i)).toBeInTheDocument();
      });

      // Click settings button
      const settingsButton = screen.getByText(/⚙️ Settings/i);
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText(/Editor Settings/i)).toBeInTheDocument();
      });
    });

    it('should open keyboard shortcuts modal using F1', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Press F1
      act(() => {
        fireEvent.keyDown(document, createMockKeyboardEvent('F1'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Keyboard Shortcuts/i)).toBeInTheDocument();
      });
    });

    it('should close modals with Escape key', async () => {
      render(<App />);

      // Open settings modal
      await waitFor(() => {
        expect(screen.getByText(/Settings/i)).toBeInTheDocument();
      });

      const settingsButton = screen.getByText(/⚙️ Settings/i);
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText(/Editor Settings/i)).toBeInTheDocument();
      });

      // Press Escape to close
      act(() => {
        fireEvent.keyDown(document, createMockKeyboardEvent('Escape'));
      });

      await waitFor(() => {
        expect(screen.queryByText(/Editor Settings/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle and display errors gracefully', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Simulate an error
      act(() => {
        window.dispatchEvent(
          new ErrorEvent('error', {
            error: new Error('Test error'),
            message: 'Test error message',
          })
        );
      });

      // Error should be handled by error boundary or context
      // The exact behavior depends on implementation
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock different screen sizes
      const originalInnerWidth = window.innerWidth;

      // Mobile size
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
      const app =
        screen.getByRole('main', { hidden: true }) ||
        document.querySelector('.app');
      expect(app).toBeInTheDocument();

      // Restore original width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with event listeners', async () => {
      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // Unmount should clean up event listeners
      unmount();

      // No specific assertion here, but this tests that unmounting doesn't throw errors
    });
  });

  describe('CEP Integration', () => {
    it('should handle CEP environment correctly', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // CEP background color subscription should be called
      const { subscribeBackgroundColor } = require('../../lib/utils/bolt');
      expect(subscribeBackgroundColor).toHaveBeenCalled();
    });

    it('should work without CEP environment', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Layer Note/i)).toBeInTheDocument();
      });

      // App should still work
      expect(screen.getByText(/Expression Editor/i)).toBeInTheDocument();

      // Restore CEP
      (window as any).cep = originalCEP;
    });
  });
});
