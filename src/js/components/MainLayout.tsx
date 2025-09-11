import React from 'react';
import { useAppContext, useUIState } from '../contexts/AppContext';
import LoadingIndicator from './LoadingIndicator';
import {
  LazyKeyboardShortcutsModal,
  LazySettingsPanel,
  LazyAboutModal,
} from './LazyComponents';
import SimpleEditorLayout from './SimpleEditorLayout';

const MainLayout: React.FC = () => {
  const { state } = useAppContext();
  const uiState = useUIState();

  return (
    <div className="app">
      {uiState.isLoading && <LoadingIndicator />}

      <SimpleEditorLayout />

      {/* Modals */}
      {state.ui.activeModals.has('keyboard-shortcuts') && (
        <LazyKeyboardShortcutsModal />
      )}
      {state.ui.activeModals.has('settings') && <LazySettingsPanel />}
      {state.ui.activeModals.has('about') && <LazyAboutModal />}
    </div>
  );
};

export default MainLayout;
