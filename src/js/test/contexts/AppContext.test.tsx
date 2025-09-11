/**
 * AppContext Tests
 * Tests for the main application context and state management
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { AppProvider, useAppContext } from '../../contexts/AppContext';
import { createMockNote } from '../test-utils';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current.state.currentMode).toBe('expression');
      expect(result.current.state.selectedProperty).toBeNull();
      expect(result.current.state.selectedNote).toBeNull();
      expect(result.current.state.hasUnsavedChanges).toBe(false);
      expect(result.current.state.ui.isLoading).toBe(false);
      expect(result.current.state.ui.error).toBeNull();
      expect(result.current.state.ui.sidebarCollapsed).toBe(false);
    });

    it('should have correct initial panel sizes', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current.state.ui.panelSizes.sidebar).toBe(300);
      expect(result.current.state.ui.panelSizes.editor).toBe(600);
      expect(result.current.state.ui.panelSizes.properties).toBe(250);
    });
  });

  describe('Mode Management', () => {
    it('should change mode correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setMode('comment');
      });

      expect(result.current.state.currentMode).toBe('comment');
    });

    it('should clear selections when switching modes', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      const mockNote = createMockNote();

      // Set a note selection
      act(() => {
        result.current.setSelectedNote(mockNote);
      });

      expect(result.current.state.selectedNote).toEqual(mockNote);
      expect(result.current.state.currentMode).toBe('note');

      // Switch to expression mode
      act(() => {
        result.current.setMode('expression');
      });

      expect(result.current.state.currentMode).toBe('expression');
      expect(result.current.state.selectedNote).toBeNull();
    });
  });

  describe('UI State Management', () => {
    it('should toggle sidebar correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current.state.ui.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.ui.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.state.ui.sidebarCollapsed).toBe(false);
    });

    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.state.ui.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.state.ui.isLoading).toBe(false);
    });

    it('should set error state correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      const errorMessage = 'Test error message';

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.state.ui.error).toBe(errorMessage);

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.ui.error).toBeNull();
    });

    it('should update panel sizes correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setPanelSizes({ sidebar: 400, properties: 300 });
      });

      expect(result.current.state.ui.panelSizes.sidebar).toBe(400);
      expect(result.current.state.ui.panelSizes.properties).toBe(300);
      expect(result.current.state.ui.panelSizes.editor).toBe(600); // Should remain unchanged
    });
  });

  describe('Modal Management', () => {
    it('should open and close modals correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      // Open modal
      act(() => {
        result.current.openModal('settings');
      });

      expect(result.current.state.ui.activeModals.has('settings')).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal('settings');
      });

      expect(result.current.state.ui.activeModals.has('settings')).toBe(false);
    });

    it('should handle multiple modals', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.openModal('settings');
        result.current.openModal('keyboard-shortcuts');
      });

      expect(result.current.state.ui.activeModals.has('settings')).toBe(true);
      expect(
        result.current.state.ui.activeModals.has('keyboard-shortcuts')
      ).toBe(true);

      act(() => {
        result.current.closeModal('settings');
      });

      expect(result.current.state.ui.activeModals.has('settings')).toBe(false);
      expect(
        result.current.state.ui.activeModals.has('keyboard-shortcuts')
      ).toBe(true);
    });
  });

  describe('Unsaved Changes Tracking', () => {
    it('should track unsaved changes correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.setUnsavedChanges(true);
      });

      expect(result.current.state.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.markAsSaved();
      });

      expect(result.current.state.hasUnsavedChanges).toBe(false);
      expect(result.current.state.lastSavedAt).toBeInstanceOf(Date);
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should initialize without undo/redo capability', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should save state to history', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      act(() => {
        result.current.saveStateToHistory();
      });

      // After saving state to history, we should be able to undo
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should perform undo/redo operations', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });

      // Save initial state
      act(() => {
        result.current.saveStateToHistory();
      });

      // Change mode
      act(() => {
        result.current.setMode('comment');
      });

      expect(result.current.state.currentMode).toBe('comment');

      // Save new state
      act(() => {
        result.current.saveStateToHistory();
      });

      // Undo
      act(() => {
        result.current.undo();
      });

      expect(result.current.state.currentMode).toBe('expression');
      expect(result.current.canRedo).toBe(true);

      // Redo
      act(() => {
        result.current.redo();
      });

      expect(result.current.state.currentMode).toBe('comment');
    });
  });

  describe('Selection Management', () => {
    it('should manage property selection correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      const mockProperty = {
        name: 'Position',
        path: 'layer.transform.position',
        expression: 'time * 100',
        hasExpression: true,
        propertyType: 'TwoD_SPATIAL',
      };

      act(() => {
        result.current.setSelectedProperty(mockProperty);
      });

      expect(result.current.state.selectedProperty).toEqual(mockProperty);
      expect(result.current.state.currentMode).toBe('expression');
    });

    it('should manage note selection correctly', () => {
      const { result } = renderHook(() => useAppContext(), { wrapper });
      const mockNote = createMockNote();

      act(() => {
        result.current.setSelectedNote(mockNote);
      });

      expect(result.current.state.selectedNote).toEqual(mockNote);
      expect(result.current.state.currentMode).toBe('note');
    });
  });
});
