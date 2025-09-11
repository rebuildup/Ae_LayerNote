import { useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';

interface VSCodeShortcuts {
  [key: string]: () => void;
}

export const useVSCodeShortcuts = () => {
  const {
    setMode,
    openModal,
    toggleSidebar,
    undo,
    redo,
    canUndo,
    canRedo,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    state,
  } = useAppContext();

  const shortcuts: VSCodeShortcuts = {
    // File operations
    'ctrl+n': () => openModal('new-file'),
    'ctrl+o': () => openModal('open-file'),
    'ctrl+s': () => openModal('save'),
    'ctrl+shift+s': () => openModal('save-as'),
    'ctrl+w': () => openModal('close-file'),
    'ctrl+shift+w': () => openModal('close-all'),

    // Edit operations
    'ctrl+z': () => canUndo && undo(),
    'ctrl+y': () => canRedo && redo(),
    'ctrl+shift+z': () => canRedo && redo(),
    'ctrl+x': () => document.execCommand('cut'),
    'ctrl+c': () => document.execCommand('copy'),
    'ctrl+v': () => document.execCommand('paste'),
    'ctrl+a': () => document.execCommand('selectAll'),
    'ctrl+f': () => openModal('search'),
    'ctrl+h': () => openModal('replace'),
    'ctrl+g': () => openModal('go-to-line'),

    // View operations
    'ctrl+shift+e': () => setMode('expression'),
    'ctrl+shift+c': () => setMode('comment'),
    'ctrl+shift+n': () => setMode('note'),
    'ctrl+b': () => toggleSidebar(),
    'ctrl+shift+p': () => openModal('command-palette'),
    'ctrl+`': () => openModal('terminal'),
    'ctrl+shift+`': () => openModal('new-terminal'),

    // Window operations
    'ctrl+shift+alt+n': () => openModal('new-window'),
    'ctrl+shift+alt+w': () => openModal('close-window'),
    'ctrl+tab': () => openModal('switch-tab'),
    'ctrl+shift+tab': () => openModal('switch-tab-previous'),

    // Help
    f1: () => openModal('help'),
    'ctrl+shift+h': () => openModal('keyboard-shortcuts'),
    'ctrl+,': () => openModal('settings'),

    // Debug
    f5: () => openModal('debug-start'),
    'shift+f5': () => openModal('debug-stop'),
    f9: () => openModal('toggle-breakpoint'),
    f10: () => openModal('debug-step-over'),
    f11: () => openModal('debug-step-into'),
    'shift+f11': () => openModal('debug-step-out'),
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Build shortcut string
      const modifiers = [];
      if (event.ctrlKey) modifiers.push('ctrl');
      if (event.shiftKey) modifiers.push('shift');
      if (event.altKey) modifiers.push('alt');
      if (event.metaKey) modifiers.push('meta');

      const key = event.key.toLowerCase();
      const shortcut = [...modifiers, key].join('+');

      // Handle special keys
      const specialKeys: { [key: string]: string } = {
        ' ': 'space',
        arrowup: 'up',
        arrowdown: 'down',
        arrowleft: 'left',
        arrowright: 'right',
        enter: 'enter',
        escape: 'escape',
        backspace: 'backspace',
        delete: 'delete',
        tab: 'tab',
      };

      const normalizedKey = specialKeys[key] || key;
      const normalizedShortcut = [...modifiers, normalizedKey].join('+');

      // Check for exact match first
      if (shortcuts[shortcut]) {
        event.preventDefault();
        shortcuts[shortcut]();
        return;
      }

      // Check for normalized match
      if (shortcuts[normalizedShortcut]) {
        event.preventDefault();
        shortcuts[normalizedShortcut]();
        return;
      }

      // Handle function keys
      if (key.startsWith('f') && key.length <= 3) {
        const fKey = key.toUpperCase();
        if (shortcuts[fKey]) {
          event.preventDefault();
          shortcuts[fKey]();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    handleKeyDown,
  };
};
