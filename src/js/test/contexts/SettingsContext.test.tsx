/**
 * SettingsContext Tests
 * Tests for settings management and persistence
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../../contexts/SettingsContext';
import { defaultUserSettings } from '../../types/settings';
import { mockStorageSuccess, mockStorageError } from '../test-utils';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('SettingsContext', () => {
  beforeEach(() => {
    mockStorageSuccess();
  });

  describe('Initial State', () => {
    it('should have correct default settings', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      expect(result.current.settings).toEqual(defaultUserSettings);
    });
  });

  describe('Editor Settings', () => {
    it('should update editor settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateEditorSettings({
          theme: 'light',
          fontSize: 16,
        });
      });

      expect(result.current.settings.editor.theme).toBe('light');
      expect(result.current.settings.editor.fontSize).toBe(16);
      expect(result.current.settings.lastUpdated).toBeDefined();
    });

    it('should preserve other editor settings when updating', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateEditorSettings({
          fontSize: 18,
        });
      });

      expect(result.current.settings.editor.fontSize).toBe(18);
      expect(result.current.settings.editor.theme).toBe(
        defaultUserSettings.editor.theme
      );
      expect(result.current.settings.editor.wordWrap).toBe(
        defaultUserSettings.editor.wordWrap
      );
    });
  });

  describe('Linting Settings', () => {
    it('should update linting settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateLintingSettings({
          enabled: false,
          rules: {
            ...defaultUserSettings.linting.rules,
            deprecatedFunctions: false,
          },
        });
      });

      expect(result.current.settings.linting.enabled).toBe(false);
      expect(result.current.settings.linting.rules.deprecatedFunctions).toBe(
        false
      );
    });
  });

  describe('Formatting Settings', () => {
    it('should update formatting settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateFormattingSettings({
          formatOnSave: false,
          indentSize: 4,
          quotes: 'single',
        });
      });

      expect(result.current.settings.formatting.formatOnSave).toBe(false);
      expect(result.current.settings.formatting.indentSize).toBe(4);
      expect(result.current.settings.formatting.quotes).toBe('single');
    });
  });

  describe('UI Settings', () => {
    it('should update UI settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateUISettings({
          sidebarWidth: 350,
          compactMode: true,
          animationsEnabled: false,
        });
      });

      expect(result.current.settings.ui.sidebarWidth).toBe(350);
      expect(result.current.settings.ui.compactMode).toBe(true);
      expect(result.current.settings.ui.animationsEnabled).toBe(false);
    });
  });

  describe('Keyboard Settings', () => {
    it('should update keyboard settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      const customShortcuts = {
        'custom-action': 'Ctrl+Alt+X',
      };

      await act(async () => {
        await result.current.updateKeyboardSettings({
          customShortcuts,
        });
      });

      expect(result.current.settings.keyboard.customShortcuts).toEqual(
        customShortcuts
      );
    });
  });

  describe('Search Settings', () => {
    it('should update search settings correctly', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await act(async () => {
        await result.current.updateSearchSettings({
          caseSensitive: true,
          regex: true,
          searchHistory: ['test search'],
        });
      });

      expect(result.current.settings.search.caseSensitive).toBe(true);
      expect(result.current.settings.search.regex).toBe(true);
      expect(result.current.settings.search.searchHistory).toEqual([
        'test search',
      ]);
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings automatically after changes', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      const mockCEP = (window as any).cep;

      await act(async () => {
        await result.current.updateEditorSettings({ fontSize: 20 });
      });

      // Wait for auto-save debounce
      await waitFor(
        () => {
          expect(mockCEP.fs.writeFile).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockStorageError('Storage failed');
      const { result } = renderHook(() => useSettings(), { wrapper });

      // Should not throw error
      await act(async () => {
        await result.current.updateEditorSettings({ fontSize: 20 });
      });

      expect(result.current.settings.editor.fontSize).toBe(20);
    });
  });

  describe('Settings Import/Export', () => {
    it('should export settings as JSON string', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      const exported = result.current.exportSettings();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual(result.current.settings);
    });

    it('should import settings from JSON string', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      const customSettings = {
        ...defaultUserSettings,
        editor: {
          ...defaultUserSettings.editor,
          theme: 'light' as const,
          fontSize: 18,
        },
      };

      await act(async () => {
        await result.current.importSettings(JSON.stringify(customSettings));
      });

      expect(result.current.settings.editor.theme).toBe('light');
      expect(result.current.settings.editor.fontSize).toBe(18);
    });

    it('should handle invalid JSON during import', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      await expect(
        act(async () => {
          await result.current.importSettings('invalid json');
        })
      ).rejects.toThrow('Invalid settings format');
    });
  });

  describe('Settings Reset', () => {
    it('should reset settings to defaults', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      // Change some settings
      await act(async () => {
        await result.current.updateEditorSettings({
          theme: 'light',
          fontSize: 20,
        });
      });

      expect(result.current.settings.editor.theme).toBe('light');
      expect(result.current.settings.editor.fontSize).toBe(20);

      // Reset settings
      await act(async () => {
        await result.current.resetSettings();
      });

      expect(result.current.settings.editor.theme).toBe(
        defaultUserSettings.editor.theme
      );
      expect(result.current.settings.editor.fontSize).toBe(
        defaultUserSettings.editor.fontSize
      );
    });
  });

  describe('Settings Validation', () => {
    it('should validate and fix invalid settings during import', async () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      const invalidSettings = {
        editor: {
          theme: 'invalid-theme',
          fontSize: -5, // Invalid font size
        },
        // Missing required fields
      };

      await act(async () => {
        await result.current.importSettings(JSON.stringify(invalidSettings));
      });

      // Should fall back to defaults for invalid values
      expect(result.current.settings.editor.theme).toBe(
        defaultUserSettings.editor.theme
      );
      expect(result.current.settings.editor.fontSize).toBe(
        defaultUserSettings.editor.fontSize
      );
      expect(result.current.settings.linting).toEqual(
        defaultUserSettings.linting
      );
    });
  });
});
