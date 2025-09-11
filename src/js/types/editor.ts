/**
 * Editor Type Definitions
 * Types for Monaco Editor and editor-related functionality
 */

export interface EditorConfig {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoFormat: boolean;
  linting: {
    enabled: boolean;
    rules: Record<string, any>;
  };
  completion: {
    enabled: boolean;
    triggerCharacters: string[];
  };
}

export interface EditorState {
  content: string;
  isDirty: boolean;
  language: string;
  errors: EditorError[];
}

export interface EditorError {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface MonacoEditorProps {
  value: string;
  language: 'javascript' | 'plaintext' | 'markdown';
  onChange: (value: string) => void;
  onSave: () => void;
  onFocusChange?: (focused: boolean) => void;
  options: {
    theme: 'vs-dark' | 'vs-light';
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    autoFormat: boolean;
    linting?: boolean; // Make linting optional
    readOnly?: boolean;
    paddingTop?: number;
  };
}

export interface PropertySelection {
  name: string;
  path: string;
  expression: string;
  hasExpression: boolean;
  propertyType: string;
}
