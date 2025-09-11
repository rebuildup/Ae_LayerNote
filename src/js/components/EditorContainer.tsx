import React, { useState, useCallback, useEffect } from 'react';
import { LazyMonacoEditor } from './LazyComponents';
import { useEditorConfig } from '../contexts/EditorContext';
import { useAppContext } from '../contexts/AppContext';
import { EditorState } from '../types/editor';
import { useDebounce } from '../lib/performance/debounce-throttle';
import '../styles/editor.scss';

interface EditorContainerProps {
  title: string;
  initialValue?: string;
  language?: 'javascript' | 'plaintext';
  onSave?: (value: string) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

const EditorContainer: React.FC<EditorContainerProps> = ({
  title,
  initialValue = '',
  language = 'javascript',
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const { config } = useEditorConfig();
  const {
    setUnsavedChanges,
    markAsSaved,
    saveStateToHistory,
    setLoading,
    setError,
  } = useAppContext();

  const [editorState, setEditorState] = useState<EditorState>({
    content: initialValue,
    isDirty: false,
    language,
    errors: [],
  });

  // Update app-level unsaved changes state
  useEffect(() => {
    setUnsavedChanges(editorState.isDirty);
  }, [editorState.isDirty, setUnsavedChanges]);

  // Debounce editor changes to improve performance
  const debouncedSaveStateToHistory = useDebounce(saveStateToHistory, 1000);

  const handleEditorChange = useCallback(
    (value: string) => {
      setEditorState(prev => ({
        ...prev,
        content: value,
        isDirty: value !== initialValue,
      }));

      // Debounced save state to history for undo/redo
      debouncedSaveStateToHistory();
    },
    [initialValue, debouncedSaveStateToHistory]
  );

  const handleSave = useCallback(async () => {
    if (onSave && editorState.isDirty) {
      try {
        setLoading(true);
        setError(null);

        await onSave(editorState.content);

        setEditorState(prev => ({ ...prev, isDirty: false }));
        markAsSaved();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to save');
      } finally {
        setLoading(false);
      }
    }
  }, [
    onSave,
    editorState.content,
    editorState.isDirty,
    setLoading,
    setError,
    markAsSaved,
  ]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    // Reset to initial value
    setEditorState(prev => ({
      ...prev,
      content: initialValue,
      isDirty: false,
    }));
    setUnsavedChanges(false);
  }, [onCancel, initialValue, setUnsavedChanges]);

  const monacoOptions = {
    theme:
      config.theme === 'dark' ? ('vs-dark' as const) : ('vs-light' as const),
    fontSize: config.fontSize,
    wordWrap: config.wordWrap,
    minimap: config.minimap,
    autoFormat: config.autoFormat,
    linting: config.linting.enabled,
  };

  return (
    <div className="editor-container" data-theme={config.theme}>
      <div className="editor-header">
        <div className="editor-title">{title}</div>
        <div className="editor-actions">
          {editorState.isDirty && (
            <>
              <button
                className="editor-button"
                onClick={handleCancel}
                disabled={readOnly}
              >
                Cancel
              </button>
              <button
                className="editor-button"
                onClick={handleSave}
                disabled={readOnly}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="editor-content">
        <LazyMonacoEditor
          value={editorState.content}
          language={language}
          onChange={handleEditorChange}
          onSave={handleSave}
          options={monacoOptions}
        />
      </div>

      <div className="editor-status">
        <div className="editor-status-left">
          <span>Language: {language}</span>
          <span>Lines: {editorState.content.split('\n').length}</span>
        </div>
        <div className="editor-status-right">
          {editorState.isDirty && <span>Modified</span>}
          {editorState.errors.length > 0 && (
            <span>Errors: {editorState.errors.length}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorContainer;
