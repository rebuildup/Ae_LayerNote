import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { PropertySelection } from '../types/expression';
import { Note } from '../types/notes';

// Application modes
export type EditorMode = 'comment' | 'note' | 'expression';

// UI states
export interface UIState {
  isLoading: boolean;
  error: string | null;
  sidebarCollapsed: boolean;
  panelSizes: {
    sidebar: number;
    editor: number;
    properties: number;
  };
  activeModals: Set<string>;
}

// Application state
export interface AppState {
  // Current mode and selections
  currentMode: EditorMode;
  selectedProperty: PropertySelection | null;
  selectedNote: Note | null;

  // UI state
  ui: UIState;

  // Editor states
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;

  // History for undo/redo
  history: {
    past: AppState[];
    present: AppState;
    future: AppState[];
  } | null;
}

// Action types
export type AppAction =
  | { type: 'SET_MODE'; payload: EditorMode }
  | { type: 'SET_SELECTED_PROPERTY'; payload: PropertySelection | null }
  | { type: 'SET_SELECTED_NOTE'; payload: Note | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_PANEL_SIZES'; payload: Partial<UIState['panelSizes']> }
  | { type: 'OPEN_MODAL'; payload: string }
  | { type: 'CLOSE_MODAL'; payload: string }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_STATE_TO_HISTORY' }
  | { type: 'RESET_STATE' };

// Initial state
const initialUIState: UIState = {
  isLoading: false,
  error: null,
  sidebarCollapsed: false,
  panelSizes: {
    sidebar: 300,
    editor: 600,
    properties: 250,
  },
  activeModals: new Set(),
};

const initialAppState: AppState = {
  currentMode: 'expression',
  selectedProperty: null,
  selectedNote: null,
  ui: initialUIState,
  hasUnsavedChanges: false,
  lastSavedAt: null,
  history: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload,
        // Clear selections when switching modes
        selectedProperty:
          action.payload === 'expression' ? state.selectedProperty : null,
        selectedNote: action.payload === 'note' ? state.selectedNote : null,
      };

    case 'SET_SELECTED_PROPERTY':
      return {
        ...state,
        selectedProperty: action.payload,
        currentMode: action.payload ? 'expression' : state.currentMode,
      };

    case 'SET_SELECTED_NOTE':
      return {
        ...state,
        selectedNote: action.payload,
        currentMode: action.payload ? 'note' : state.currentMode,
      };

    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
        },
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: !state.ui.sidebarCollapsed,
        },
      };

    case 'SET_PANEL_SIZES':
      return {
        ...state,
        ui: {
          ...state.ui,
          panelSizes: {
            ...state.ui.panelSizes,
            ...action.payload,
          },
        },
      };

    case 'OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeModals: new Set([...state.ui.activeModals, action.payload]),
        },
      };

    case 'CLOSE_MODAL':
      const newModals = new Set(state.ui.activeModals);
      newModals.delete(action.payload);
      return {
        ...state,
        ui: {
          ...state.ui,
          activeModals: newModals,
        },
      };

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload,
      };

    case 'SET_LAST_SAVED':
      return {
        ...state,
        lastSavedAt: action.payload,
        hasUnsavedChanges: false,
      };

    case 'SAVE_STATE_TO_HISTORY':
      return {
        ...state,
        history: {
          past: state.history
            ? [...state.history.past, state.history.present]
            : [state],
          present: state,
          future: [],
        },
      };

    case 'UNDO':
      if (!state.history || state.history.past.length === 0) {
        return state;
      }

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(
        0,
        state.history.past.length - 1
      );

      return {
        ...previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.history.present, ...state.history.future],
        },
      };

    case 'REDO':
      if (!state.history || state.history.future.length === 0) {
        return state;
      }

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      return {
        ...next,
        history: {
          past: [...state.history.past, state.history.present],
          present: next,
          future: newFuture,
        },
      };

    case 'RESET_STATE':
      return initialAppState;

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // Convenience methods
  setMode: (mode: EditorMode) => void;
  setSelectedProperty: (property: PropertySelection | null) => void;
  setSelectedNote: (note: Note | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  setPanelSizes: (sizes: Partial<UIState['panelSizes']>) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  markAsSaved: () => void;
  undo: () => void;
  redo: () => void;
  saveStateToHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Convenience methods
  const setMode = useCallback((mode: EditorMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setSelectedProperty = useCallback(
    (property: PropertySelection | null) => {
      dispatch({ type: 'SET_SELECTED_PROPERTY', payload: property });
    },
    []
  );

  const setSelectedNote = useCallback((note: Note | null) => {
    dispatch({ type: 'SET_SELECTED_NOTE', payload: note });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const setPanelSizes = useCallback((sizes: Partial<UIState['panelSizes']>) => {
    dispatch({ type: 'SET_PANEL_SIZES', payload: sizes });
  }, []);

  const openModal = useCallback((modalId: string) => {
    dispatch({ type: 'OPEN_MODAL', payload: modalId });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    dispatch({ type: 'CLOSE_MODAL', payload: modalId });
  }, []);

  const setUnsavedChanges = useCallback((hasChanges: boolean) => {
    dispatch({ type: 'SET_UNSAVED_CHANGES', payload: hasChanges });
  }, []);

  const markAsSaved = useCallback(() => {
    dispatch({ type: 'SET_LAST_SAVED', payload: new Date() });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const saveStateToHistory = useCallback(() => {
    dispatch({ type: 'SAVE_STATE_TO_HISTORY' });
  }, []);

  const canUndo = state.history ? state.history.past.length > 0 : false;
  const canRedo = state.history ? state.history.future.length > 0 : false;

  const contextValue: AppContextType = {
    state,
    dispatch,
    setMode,
    setSelectedProperty,
    setSelectedNote,
    setLoading,
    setError,
    toggleSidebar,
    setPanelSizes,
    openModal,
    closeModal,
    setUnsavedChanges,
    markAsSaved,
    undo,
    redo,
    saveStateToHistory,
    canUndo,
    canRedo,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Selectors for common state access patterns
export const useCurrentMode = () => {
  const { state } = useAppContext();
  return state.currentMode;
};

export const useSelectedProperty = () => {
  const { state } = useAppContext();
  return state.selectedProperty;
};

export const useSelectedNote = () => {
  const { state } = useAppContext();
  return state.selectedNote;
};

export const useUIState = () => {
  const { state } = useAppContext();
  return state.ui;
};

export const useUnsavedChanges = () => {
  const { state } = useAppContext();
  return {
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSavedAt: state.lastSavedAt,
  };
};
