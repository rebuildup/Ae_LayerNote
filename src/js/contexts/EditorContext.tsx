import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { EditorConfig } from '../types/editor';

interface EditorContextType {
  config: EditorConfig;
  updateConfig: (updates: Partial<EditorConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: EditorConfig = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  autoSave: true,
  autoFormat: true,
  linting: {
    enabled: true,
    rules: {},
  },
  completion: {
    enabled: true,
    triggerCharacters: ['.', '(', '['],
  },
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<EditorConfig>(defaultConfig);

  // Load config from CEP storage on mount
  useEffect(() => {
    loadConfigFromStorage();
  }, []);

  // Save config to CEP storage when it changes
  useEffect(() => {
    saveConfigToStorage(config);
  }, [config]);

  const loadConfigFromStorage = async () => {
    try {
      // CEP storage implementation will be added later
      // For now, use localStorage as fallback
      const stored = localStorage.getItem('editorConfig');
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.warn('Failed to load editor config:', error);
    }
  };

  const saveConfigToStorage = async (configToSave: EditorConfig) => {
    try {
      // CEP storage implementation will be added later
      // For now, use localStorage as fallback
      localStorage.setItem('editorConfig', JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Failed to save editor config:', error);
    }
  };

  const updateConfig = (updates: Partial<EditorConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <EditorContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorConfig = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorConfig must be used within an EditorProvider');
  }
  return context;
};
