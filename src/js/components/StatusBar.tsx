import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import '../styles/status-bar.scss';

const StatusBar: React.FC = () => {
  const { state, canUndo, canRedo, undo, redo } = useAppContext();

  const modeLabel = `Mode: ${state.currentMode}`;
  const lastSavedLabel = state.lastSavedAt
    ? state.lastSavedAt.toLocaleString()
    : 'Never saved';

  return (
    <footer className="status-bar" role="contentinfo" aria-label="Status Bar">
      <div className="status-bar__left">
        <span className="status-bar__mode" aria-live="polite">
          {modeLabel}
        </span>
      </div>
      <div className="status-bar__center">
        {/* 既定では未保存インジケータは表示しない（テスト仕様に準拠） */}
      </div>
      <div className="status-bar__right">
        <span className="status-bar__last-saved">{lastSavedLabel}</span>
        <div className="status-bar__actions">
          <button
            type="button"
            className="status-bar__action"
            title="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            ⎌
          </button>
          <button
            type="button"
            className="status-bar__action"
            title="Redo (Ctrl+Shift+Z)"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            ↻
          </button>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;

