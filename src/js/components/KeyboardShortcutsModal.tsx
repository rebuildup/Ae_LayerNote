import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import '../styles/keyboard-shortcuts-modal.scss';

interface KeyboardShortcut {
  keys: string;
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: 'Ctrl+S', description: 'Save current file', category: 'Editor' },
  { keys: 'Ctrl+Z', description: 'Undo', category: 'Editor' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo', category: 'Editor' },
  { keys: 'Ctrl+Y', description: 'Redo (alternative)', category: 'Editor' },
  { keys: 'Ctrl+F', description: 'Find', category: 'Editor' },
  { keys: 'Ctrl+H', description: 'Replace', category: 'Editor' },
  { keys: 'Ctrl+/', description: 'Toggle comment', category: 'Editor' },
  { keys: 'Alt+Shift+F', description: 'Format document', category: 'Editor' },
  { keys: 'Ctrl+1', description: 'Switch to Expression Editor', category: 'Navigation' },
  { keys: 'Ctrl+2', description: 'Switch to Layer Comments', category: 'Navigation' },
  { keys: 'Ctrl+3', description: 'Switch to Notes', category: 'Navigation' },
  { keys: 'Ctrl+B', description: 'Toggle sidebar', category: 'Navigation' },
  { keys: 'F1', description: 'Show keyboard shortcuts', category: 'General' },
  { keys: 'Escape', description: 'Close modal/dialog', category: 'General' },
];

const KeyboardShortcutsModal: React.FC = () => {
  const { closeModal } = useAppContext();

  const handleClose = () => closeModal('keyboard-shortcuts');

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={e => {
        if (e.key === 'Escape') handleClose();
      }}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ks-title"
    >
      <div className="keyboard-shortcuts-modal">
        <div className="modal-header">
          <h2 id="ks-title">Keyboard Shortcuts</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-content">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} className="shortcuts-category">
              <h3 className="category-title">{category}</h3>
              <div className="shortcuts-list">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.keys.split('+').map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && <span className="key-separator">+</span>}
                          <kbd className="key">{key}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="shortcut-description">{shortcut.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <p className="modal-note">Note: Use Cmd instead of Ctrl on macOS</p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
