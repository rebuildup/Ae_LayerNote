import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  UserSettings,
  defaultUserSettings,
  validateSettings,
} from '../types/settings';
import { cepStorage } from '../lib/storage/cep-storage';
import { DataMigration } from '../lib/storage/migration';

// Settings actions
export type SettingsAction =
  | { type: 'LOAD_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_EDITOR_SETTINGS'; payload: Partial<UserSettings['editor']> }
  | {
      type: 'UPDATE_LINTING_SETTINGS';
      payload: Partial<UserSettings['linting']>;
    }
  | {
      type: 'UPDATE_FORMATTING_SETTINGS';
      payload: Partial<UserSettings['formatting']>;
    }
  | { type: 'UPDATE_UI_SETTINGS'; payload: Partial<UserSettings['ui']> }
  | {
      type: 'UPDATE_KEYBOARD_SETTINGS';
      payload: Partial<UserSettings['keyboard']>;
    }
  | { type: 'UPDATE_SEARCH_SETTINGS'; payload: Partial<UserSettings['search']> }
  | { type: 'RESET_SETTINGS' }
  | { type: 'IMPORT_SETTINGS'; payload: UserSettings };

// Settings reducer
function settingsReducer(
  state: UserSettings,
  action: SettingsAction
): UserSettings {
  switch (action.type) {
    case 'LOAD_SETTINGS':
      return validateSettings(action.payload);

    case 'UPDATE_EDITOR_SETTINGS':
      return {
        ...state,
        editor: { ...state.editor, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_LINTING_SETTINGS':
      return {
        ...state,
        linting: { ...state.linting, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_FORMATTING_SETTINGS':
      return {
        ...state,
        formatting: { ...state.formatting, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_UI_SETTINGS':
      return {
        ...state,
        ui: { ...state.ui, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_KEYBOARD_SETTINGS':
      return {
        ...state,
        keyboard: { ...state.keyboard, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_SEARCH_SETTINGS':
      return {
        ...state,
        search: { ...state.search, ...action.payload },
        lastUpdated: new Date().toISOString(),
      };

    case 'RESET_SETTINGS':
      return { ...defaultUserSettings, lastUpdated: new Date().toISOString() };

    case 'IMPORT_SETTINGS':
      return validateSettings({
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      });

    default:
      return state;
  }
}

// Settings context type
interface SettingsContextType {
  settings: UserSettings;
  dispatch: React.Dispatch<SettingsAction>;

  // Convenience methods
  updateEditorSettings: (
    settings: Partial<UserSettings['editor']>
  ) => Promise<void>;
  updateLintingSettings: (
    settings: Partial<UserSettings['linting']>
  ) => Promise<void>;
  updateFormattingSettings: (
    settings: Partial<UserSettings['formatting']>
  ) => Promise<void>;
  updateUISettings: (settings: Partial<UserSettings['ui']>) => Promise<void>;
  updateKeyboardSettings: (
    settings: Partial<UserSettings['keyboard']>
  ) => Promise<void>;
  updateSearchSettings: (
    settings: Partial<UserSettings['search']>
  ) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<void>;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Settings provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, dispatch] = useReducer(settingsReducer, defaultUserSettings);

  // Load settings on mount with migration
  useEffect(() => {
    initializeSettings();
  }, []);

  // Initialize settings with migration check
  const initializeSettings = useCallback(async () => {
    try {
      // Check if migration is needed
      const needsMigration = await DataMigration.needsMigration();

      if (needsMigration) {
        console.log('Data migration needed, creating backup...');
        await DataMigration.createBackup();

        console.log('Running data migration...');
        const migrationResult = await DataMigration.migrate();

        if (migrationResult.success) {
          console.log('Migration completed successfully');
          await DataMigration.cleanupBackups();
        } else {
          console.error('Migration failed:', migrationResult.errors);
        }
      }

      // Load settings after migration
      await loadSettings();
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Fallback to loading settings without migration
      await loadSettings();
    }
  }, []);

  // Auto-save settings when they change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Save settings to storage
  const saveSettings = useCallback(async () => {
    try {
      await cepStorage.setItem('userSettings', settings);
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      const savedSettings =
        await cepStorage.getItem<UserSettings>('userSettings');
      if (savedSettings) {
        dispatch({ type: 'LOAD_SETTINGS', payload: savedSettings });
        console.log('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Convenience methods
  const updateEditorSettings = useCallback(
    async (editorSettings: Partial<UserSettings['editor']>) => {
      dispatch({ type: 'UPDATE_EDITOR_SETTINGS', payload: editorSettings });
    },
    []
  );

  const updateLintingSettings = useCallback(
    async (lintingSettings: Partial<UserSettings['linting']>) => {
      dispatch({ type: 'UPDATE_LINTING_SETTINGS', payload: lintingSettings });
    },
    []
  );

  const updateFormattingSettings = useCallback(
    async (formattingSettings: Partial<UserSettings['formatting']>) => {
      dispatch({
        type: 'UPDATE_FORMATTING_SETTINGS',
        payload: formattingSettings,
      });
    },
    []
  );

  const updateUISettings = useCallback(
    async (uiSettings: Partial<UserSettings['ui']>) => {
      dispatch({ type: 'UPDATE_UI_SETTINGS', payload: uiSettings });
    },
    []
  );

  const updateKeyboardSettings = useCallback(
    async (keyboardSettings: Partial<UserSettings['keyboard']>) => {
      dispatch({ type: 'UPDATE_KEYBOARD_SETTINGS', payload: keyboardSettings });
    },
    []
  );

  const updateSearchSettings = useCallback(
    async (searchSettings: Partial<UserSettings['search']>) => {
      dispatch({ type: 'UPDATE_SEARCH_SETTINGS', payload: searchSettings });
    },
    []
  );

  const resetSettings = useCallback(async () => {
    dispatch({ type: 'RESET_SETTINGS' });
    await cepStorage.removeItem('userSettings');
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback(async (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson) as UserSettings;
      dispatch({ type: 'IMPORT_SETTINGS', payload: importedSettings });
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    dispatch,
    updateEditorSettings,
    updateLintingSettings,
    updateFormattingSettings,
    updateUISettings,
    updateKeyboardSettings,
    updateSearchSettings,
    resetSettings,
    exportSettings,
    importSettings,
    saveSettings,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Selector hooks for specific settings
export const useEditorSettings = () => {
  const { settings } = useSettings();
  return settings.editor;
};

export const useLintingSettings = () => {
  const { settings } = useSettings();
  return settings.linting;
};

export const useFormattingSettings = () => {
  const { settings } = useSettings();
  return settings.formatting;
};

export const useUISettings = () => {
  const { settings } = useSettings();
  return settings.ui;
};

export const useKeyboardSettings = () => {
  const { settings } = useSettings();
  return settings.keyboard;
};

export const useSearchSettings = () => {
  const { settings } = useSettings();
  return settings.search;
};
