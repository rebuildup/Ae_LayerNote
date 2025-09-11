/**
 * Lazy Loading Components
 * Implements code splitting and lazy loading for heavy components
 */

import React, { Suspense, lazy } from 'react';
import LoadingIndicator from './LoadingIndicator';
import ErrorBoundary from './ErrorBoundary';
import '../lib/monaco-loader'; // Configure Monaco loader for CEP

// Lazy load heavy components
const MonacoEditor = lazy(() => import('./MonacoEditor'));
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const KeyboardShortcutsModal = lazy(() => import('./KeyboardShortcutsModal'));
const AboutModal = lazy(() => import('./AboutModal'));

// Lazy wrapper with error boundary and loading state
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <LoadingIndicator message="Loading component..." />,
  errorFallback = <div>Failed to load component</div>,
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
};

// Lazy Monaco Editor with optimized loading
interface LazyMonacoEditorProps {
  value: string;
  language: 'javascript' | 'plaintext';
  onChange: (value: string) => void;
  onSave: () => void;
  options: {
    theme: 'vs-dark' | 'vs-light';
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    autoFormat: boolean;
    linting: boolean;
  };
}

export const LazyMonacoEditor: React.FC<LazyMonacoEditorProps> = props => {
  return (
    <LazyWrapper
      fallback={<LoadingIndicator message="Loading Monaco Editor..." />}
    >
      <MonacoEditor {...props} />
    </LazyWrapper>
  );
};

// Lazy Settings Panel
export const LazySettingsPanel: React.FC = () => {
  return (
    <LazyWrapper fallback={<LoadingIndicator message="Loading Settings..." />}>
      <SettingsPanel />
    </LazyWrapper>
  );
};

// Lazy Keyboard Shortcuts Modal
export const LazyKeyboardShortcutsModal: React.FC = () => {
  return (
    <LazyWrapper fallback={<LoadingIndicator message="Loading Shortcuts..." />}>
      <KeyboardShortcutsModal />
    </LazyWrapper>
  );
};

// Lazy About Modal
export const LazyAboutModal: React.FC = () => {
  return (
    <LazyWrapper fallback={<LoadingIndicator message="Loading About..." />}>
      <AboutModal />
    </LazyWrapper>
  );
};

// Preload components for better UX
export const preloadComponents = () => {
  // Preload Monaco Editor when user hovers over expression mode
  const preloadMonaco = () => import('./MonacoEditor');

  // Preload settings when user hovers over settings button
  const preloadSettings = () => import('./SettingsPanel');

  // Preload modals when user presses relevant keys
  const preloadModals = () => {
    import('./KeyboardShortcutsModal');
    import('./AboutModal');
  };

  return {
    preloadMonaco,
    preloadSettings,
    preloadModals,
  };
};
