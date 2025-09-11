import React, { useState, useCallback } from 'react';
import { useAppContext, useCurrentMode } from '../contexts/AppContext';
import MonacoEditor from './MonacoEditor';
import {
  Code,
  MessageSquare,
  StickyNote,
  Settings,
  Undo,
  Redo,
  Save,
  Menu,
} from 'lucide-react';
import { useLayerOperations } from '../hooks/useCEPBridge';
import type { LayerInfo } from '../../shared/universals';
import '../styles/simple-editor-layout.scss';

const SimpleEditorLayout: React.FC = () => {
  const { state, setMode, openModal, undo, redo, canUndo, canRedo } =
    useAppContext();
  const currentMode = useCurrentMode();
  const [editorValue, setEditorValue] = useState(
    '// After Effects Expression Editor\n// Write your expressions here...\n\n'
  );

  // Layer selection + comments via CEP bridge (avoid broken useLayerSelection)
  const { getSelectedLayers, getLayerComment, setLayerComment } =
    useLayerOperations();
  const [selectedLayers, setSelectedLayers] = useState<LayerInfo[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [layerComment, setLayerCommentText] = useState('');
  const [baselineComment, setBaselineComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  // Poll AE selection
  React.useEffect(() => {
    let isMounted = true;
    const sync = async () => {
      try {
        const layers = await getSelectedLayers();
        if (!isMounted) return;
        setSelectedLayers(layers);
        if (layers.length > 0) {
          const stillValid = layers.find(l => l.id === activeLayerId);
          const nextId = stillValid ? activeLayerId : layers[0].id;
          if (nextId !== activeLayerId) {
            setActiveLayerId(nextId);
          }
        } else {
          setActiveLayerId(null);
          setLayerCommentText('');
        }
      } catch (_) {
        // ignore
      }
    };

    // Initial + interval
    sync();
    const interval = setInterval(sync, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getSelectedLayers, activeLayerId]);

  // Load comment when active layer changes
  React.useEffect(() => {
    const load = async () => {
      if (!activeLayerId) return;
      setIsCommentLoading(true);
      try {
        const comment = await getLayerComment(activeLayerId);
        const text = comment || '';
        setLayerCommentText(text);
        setBaselineComment(text);
        setSaveStatus('idle');
      } catch (_) {
        setLayerCommentText('');
        setBaselineComment('');
        setSaveStatus('idle');
      } finally {
        setIsCommentLoading(false);
      }
    };
    load();
  }, [activeLayerId, getLayerComment]);

  const handleEditorChange = useCallback(
    (value: string) => {
      if (currentMode === 'comment') {
        setLayerCommentText(value);
      } else {
        setEditorValue(value);
      }
    },
    [currentMode]
  );

  const handleSave = useCallback(async () => {
    if (currentMode === 'comment') {
      if (!activeLayerId) return;
      setIsSavingComment(true);
      setSaveStatus('saving');
      try {
        await setLayerComment(activeLayerId, layerComment);
        setBaselineComment(layerComment);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } finally {
        setIsSavingComment(false);
      }
      return;
    }
    // TODO: Implement save functionality
    console.log('Saving...', editorValue);
  }, [currentMode, activeLayerId, layerComment, editorValue, setLayerComment]);

  const modes = [
    {
      id: 'expression' as const,
      label: 'Expressions',
      icon: Code,
      tooltip: 'Edit After Effects expressions (Ctrl+1)',
    },
    {
      id: 'comment' as const,
      label: 'Comments',
      icon: MessageSquare,
      tooltip: 'Manage layer comments (Ctrl+2)',
    },
    {
      id: 'note' as const,
      label: 'Notes',
      icon: StickyNote,
      tooltip: 'Create and organize notes (Ctrl+3)',
    },
  ];

  const getEditorLanguage = () => {
    switch (currentMode) {
      case 'expression':
        return 'javascript';
      case 'comment':
        return 'markdown';
      case 'note':
        return 'markdown';
      default:
        return 'javascript';
    }
  };

  const getEditorPlaceholder = () => {
    switch (currentMode) {
      case 'expression':
        return '// Expressions are not available yet.\n// This area is read-only for now.\n';
      case 'comment':
        if (!activeLayerId) {
          return '# No layer selected\n\nSelect a layer in After Effects to edit its comment.';
        }
        {
          const layerName =
            selectedLayers.find(l => l.id === activeLayerId)?.name || '';
          return `# Comment for ${layerName}\n\nEdit the comment in this editor. Use Ctrl+S to save.`;
        }
      case 'note':
        return '# Notes are not available yet.\n\nThis area is read-only for now.';
      default:
        return '// After Effects Expression Editor\n// Write your expressions here...\n\n';
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with IME composition (e.g., Japanese input)
      if ((event as any).isComposing || event.key === 'Process') {
        return;
      }

      // If focused inside Monaco editor, avoid handling mode/undo/redo shortcuts here
      const target = event.target as HTMLElement | null;
      const inMonaco = !!target?.closest('.monaco-editor');

      // Mode switching shortcuts
      if (!inMonaco && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setMode('expression');
            break;
          case '2':
            event.preventDefault();
            setMode('comment');
            break;
          case '3':
            event.preventDefault();
            setMode('note');
            break;
        }
      }

      // Settings shortcut
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        openModal('settings');
      }

      // Save shortcut
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handleSave();
        return;
      }

      // Undo/Redo shortcuts (handled by Monaco but also available globally)
      if (
        !inMonaco &&
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        if (canUndo) {
          event.preventDefault();
          undo();
        }
      }
      if (
        !inMonaco &&
        (((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === 'Z') ||
          ((event.ctrlKey || event.metaKey) && event.key === 'y'))
      ) {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
      }
    },
    [setMode, openModal, undo, redo, canUndo, canRedo, handleSave]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Update editor content when mode changes
  React.useEffect(() => {
    setEditorValue(getEditorPlaceholder());
  }, [currentMode]);

  const isModeUnavailable =
    currentMode === 'expression' || currentMode === 'note';

  const isDirty = currentMode === 'comment' && layerComment !== baselineComment;

  const handleSelectLayer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveLayerId(e.target.value || null);
  };

  const handleCommentSave = async () => {
    if (!activeLayerId) return;
    setIsSavingComment(true);
    try {
      await setLayerComment(activeLayerId, layerComment);
    } finally {
      setIsSavingComment(false);
    }
  };

  const activeLayer = activeLayerId
    ? selectedLayers.find(l => l.id === activeLayerId) || null
    : null;

  return (
    <div className="simple-editor-layout">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar__left">
          <div className="toolbar__brand">
            <Menu size={20} />
            <span>Layer Note</span>
          </div>
          <div className="toolbar__modes">
            {modes.map(mode => (
              <button
                key={mode.id}
                className={`toolbar__mode-btn ${
                  currentMode === mode.id ? 'toolbar__mode-btn--active' : ''
                } ${mode.id !== 'comment' ? 'toolbar__mode-btn--disabled' : ''}`}
                onClick={() => setMode(mode.id)}
                title={
                  mode.id === 'comment'
                    ? mode.tooltip
                    : `${mode.label} is not available yet`
                }
              >
                <mode.icon size={16} />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar__right">
          <div className="toolbar__actions">
            <button
              className="toolbar__action-btn"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              className="toolbar__action-btn"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo size={16} />
            </button>
            <button
              className="toolbar__action-btn"
              onClick={handleSave}
              title={
                currentMode === 'comment'
                  ? 'Save comment (Ctrl+S)'
                  : 'Save (disabled)'
              }
              disabled={
                currentMode !== 'comment' ||
                !activeLayerId ||
                isCommentLoading ||
                isSavingComment ||
                !isDirty
              }
            >
              <Save size={16} />
            </button>
            <button
              className="toolbar__action-btn"
              onClick={() => openModal('settings')}
              title="Settings (Ctrl+,)"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="editor-area">
        <div
          className={`editor-overlay ${isModeUnavailable ? 'editor-overlay--visible' : ''}`}
        >
          {currentMode === 'expression' && (
            <span>Expressions are not available yet.</span>
          )}
          {currentMode === 'note' && <span>Notes are not available yet.</span>}
        </div>
        <MonacoEditor
          value={currentMode === 'comment' ? layerComment : editorValue}
          language={getEditorLanguage()}
          onChange={handleEditorChange}
          onSave={handleSave}
          options={{
            theme: 'vs-dark',
            fontSize: 14,
            wordWrap: true,
            minimap: false,
            autoFormat: true,
            readOnly:
              currentMode !== 'comment' || !activeLayerId || isCommentLoading,
          }}
        />
      </div>

      {/* Status Bar / Footer */}
      <div className="status-bar">
        <div className="status-bar__left">
          <span className="status-bar__mode">Mode: {currentMode}</span>
          <span className="status-bar__language">
            Language: {getEditorLanguage()}
          </span>
        </div>

        <div className="status-bar__center">
          {selectedLayers.length > 0 ? (
            <span className="status-bar__info">
              Selected: {activeLayer ? activeLayer.name : '—'}
              {selectedLayers.length > 1
                ? ` (+${selectedLayers.length - 1})`
                : ''}
            </span>
          ) : state.ui.error ? (
            <span className="status-bar__error">Error: {state.ui.error}</span>
          ) : (
            <span className="status-bar__info">No selection</span>
          )}
        </div>

        <div className="status-bar__right">
          <span className="status-bar__info">
            {currentMode === 'comment' && activeLayer
              ? saveStatus === 'saving'
                ? 'Saving…'
                : saveStatus === 'saved'
                  ? 'Saved'
                  : isDirty
                    ? 'Unsaved changes'
                    : 'Up to date'
              : selectedLayers.length > 0
                ? `${selectedLayers.length} selected`
                : 'No selection'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SimpleEditorLayout;
