/**
 * User Settings and Preferences Types
 */

export interface EditorSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoFormat: boolean;
  lineNumbers: boolean;
  folding: boolean;
  matchBrackets: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
}

export interface LintingSettings {
  enabled: boolean;
  rules: {
    deprecatedFunctions: boolean;
    syntaxErrors: boolean;
    typeErrors: boolean;
    unusedVariables: boolean;
    undefinedVariables: boolean;
  };
  severity: {
    deprecatedFunctions: 'error' | 'warning' | 'info';
    syntaxErrors: 'error' | 'warning' | 'info';
    typeErrors: 'error' | 'warning' | 'info';
    unusedVariables: 'error' | 'warning' | 'info';
    undefinedVariables: 'error' | 'warning' | 'info';
  };
}

export interface FormattingSettings {
  enabled: boolean;
  formatOnSave: boolean;
  formatOnType: boolean;
  indentSize: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
  semicolons: boolean;
  quotes: 'single' | 'double';
  trailingComma: 'none' | 'es5' | 'all';
}

export interface UISettings {
  sidebarWidth: number;
  propertiesWidth: number;
  sidebarCollapsed: boolean;
  showStatusBar: boolean;
  showMinimap: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

export interface KeyboardSettings {
  shortcuts: Record<string, string>;
  customShortcuts: Record<string, string>;
}

export interface SearchSettings {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  searchHistory: string[];
  maxHistoryItems: number;
}

export interface NotesSettings {
  folderPath?: string; // Custom notes folder; default: AE project folder
}

export interface UserSettings {
  editor: EditorSettings;
  linting: LintingSettings;
  formatting: FormattingSettings;
  ui: UISettings;
  keyboard: KeyboardSettings;
  search: SearchSettings;
  notes?: NotesSettings;
  version: string;
  lastUpdated: string;
}

// Default settings
export const defaultEditorSettings: EditorSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: "Consolas, 'Courier New', monospace",
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: false,
  autoFormat: true,
  lineNumbers: true,
  folding: true,
  matchBrackets: true,
  renderWhitespace: 'selection',
};

export const defaultLintingSettings: LintingSettings = {
  enabled: true,
  rules: {
    deprecatedFunctions: true,
    syntaxErrors: true,
    typeErrors: true,
    unusedVariables: true,
    undefinedVariables: true,
  },
  severity: {
    deprecatedFunctions: 'warning',
    syntaxErrors: 'error',
    typeErrors: 'error',
    unusedVariables: 'warning',
    undefinedVariables: 'error',
  },
};

export const defaultFormattingSettings: FormattingSettings = {
  enabled: true,
  formatOnSave: true,
  formatOnType: false,
  indentSize: 2,
  insertFinalNewline: true,
  trimTrailingWhitespace: true,
  semicolons: true,
  quotes: 'double',
  trailingComma: 'es5',
};

export const defaultUISettings: UISettings = {
  sidebarWidth: 300,
  propertiesWidth: 250,
  sidebarCollapsed: false,
  showStatusBar: true,
  showMinimap: true,
  compactMode: false,
  animationsEnabled: true,
};

export const defaultKeyboardSettings: KeyboardSettings = {
  shortcuts: {
    save: 'Ctrl+S',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Shift+Z',
    find: 'Ctrl+F',
    replace: 'Ctrl+H',
    comment: 'Ctrl+/',
    format: 'Alt+Shift+F',
    expressionMode: 'Ctrl+1',
    commentMode: 'Ctrl+2',
    noteMode: 'Ctrl+3',
    toggleSidebar: 'Ctrl+B',
    showShortcuts: 'F1',
  },
  customShortcuts: {},
};

export const defaultSearchSettings: SearchSettings = {
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  searchHistory: [],
  maxHistoryItems: 20,
};

export const defaultNotesSettings: NotesSettings = {
  folderPath: undefined,
};

export const defaultUserSettings: UserSettings = {
  editor: defaultEditorSettings,
  linting: defaultLintingSettings,
  formatting: defaultFormattingSettings,
  ui: defaultUISettings,
  keyboard: defaultKeyboardSettings,
  search: defaultSearchSettings,
  notes: defaultNotesSettings,
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
};

// Settings validation
export const validateSettings = (
  settings: Partial<UserSettings>
): UserSettings => {
  return {
    editor: { ...defaultEditorSettings, ...settings.editor },
    linting: { ...defaultLintingSettings, ...settings.linting },
    formatting: { ...defaultFormattingSettings, ...settings.formatting },
    ui: { ...defaultUISettings, ...settings.ui },
    keyboard: { ...defaultKeyboardSettings, ...settings.keyboard },
    search: { ...defaultSearchSettings, ...settings.search },
    notes: { ...defaultNotesSettings, ...(settings.notes || {}) },
    version: settings.version || defaultUserSettings.version,
    lastUpdated: new Date().toISOString(),
  };
};
