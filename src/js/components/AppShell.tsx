import React, { useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useSettings } from '../contexts/SettingsContext';
import ContextMenu from './ContextMenu';
import { useContextMenu } from '../hooks/useContextMenu';

/**
 * AppIntegration component handles global application integration:
 * - Global keyboard shortcuts
 * - Context menus
 * - Cross-component communication
 * - Application-wide event handling
 */
const AppIntegration: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { state, setError, openModal } = useAppContext();
  const { settings } = useSettings();
  const { contextMenu, hideContextMenu } = useContextMenu();

  // Global error handling
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('Unhandled error:', event.error);
      setError(`Unexpected error: ${event.error?.message || 'Unknown error'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(
        `Promise rejection: ${event.reason?.message || 'Unknown error'}`
      );
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, [setError]);

  // Global keyboard shortcuts (beyond what's in MainLayout)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Escape key to close modals/menus
      if (event.key === 'Escape') {
        // Close any open modals
        if (state.ui.activeModals.size > 0) {
          const lastModal = Array.from(state.ui.activeModals).pop();
          if (lastModal) {
            // Don't prevent default here, let individual modals handle it
            return;
          }
        }
      }

      // Ctrl/Cmd + Shift + P for command palette (future feature)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === 'P'
      ) {
        event.preventDefault();
        // Future: open command palette
        console.log('Command palette shortcut (not implemented yet)');
      }

      // Ctrl/Cmd + , for settings
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        openModal('settings');
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [state.ui.activeModals, openModal]);

  // Auto-save functionality
  useEffect(() => {
    if (!settings.editor.autoSave) return;

    const autoSaveInterval = setInterval(() => {
      if (state.hasUnsavedChanges) {
        // Trigger auto-save event
        document.dispatchEvent(new CustomEvent('auto-save'));
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [settings.editor.autoSave, state.hasUnsavedChanges]);

  // Performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) {
            console.warn(
              `Slow operation detected: ${entry.name} took ${entry.duration}ms`
            );
          }
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  // CEP-specific integration
  useEffect(() => {
    if (window.cep) {
      // Handle CEP events
      const handleCEPEvent = (event: any) => {
        console.log('CEP Event:', event);

        switch (event.type) {
          case 'com.adobe.csxs.events.ApplicationActivate':
            // Application became active
            break;
          case 'com.adobe.csxs.events.ApplicationDeactivate':
            // Application became inactive
            break;
          default:
            break;
        }
      };

      // Register for CEP events (if available)
      if (window.cep.event) {
        window.cep.event.addEventListener(
          'com.adobe.csxs.events.ApplicationActivate',
          handleCEPEvent
        );
        window.cep.event.addEventListener(
          'com.adobe.csxs.events.ApplicationDeactivate',
          handleCEPEvent
        );
      }

      return () => {
        if (window.cep.event) {
          window.cep.event.removeEventListener(
            'com.adobe.csxs.events.ApplicationActivate',
            handleCEPEvent
          );
          window.cep.event.removeEventListener(
            'com.adobe.csxs.events.ApplicationDeactivate',
            handleCEPEvent
          );
        }
      };
    }
  }, []);

  // Theme synchronization with After Effects
  useEffect(() => {
    if (window.cep && settings.editor.theme === 'dark') {
      // Sync with After Effects theme if possible
      try {
        // This would be implemented with actual CEP theme detection
        console.log('Syncing theme with After Effects');
      } catch (error) {
        console.warn('Failed to sync theme:', error);
      }
    }
  }, [settings.editor.theme]);

  return (
    <>
      {children}

      {/* Global Context Menu */}
      <ContextMenu
        items={contextMenu.items}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={hideContextMenu}
      />
    </>
  );
};

export default AppIntegration;
