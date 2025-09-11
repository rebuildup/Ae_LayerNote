import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { MonacoEditorProps, EditorError } from '../types/editor';
import '../lib/monaco-environment'; // Ensure Monaco is configured for CEP

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  language,
  onChange,
  onSave,
  onFocusChange,
  options,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;

    // Add save keyboard shortcut (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Configure editor options
    editor.updateOptions({
      fontSize: options.fontSize,
      wordWrap: options.wordWrap ? 'on' : 'off',
      minimap: { enabled: options.minimap },
      tabSize: 2,
      insertSpaces: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      lineNumbers: 'on',
      folding: true,
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: options.autoFormat,
      formatOnType: options.autoFormat,
      // Helps IME candidate window position correctly when parent has overflow/scroll
      fixedOverflowWidgets: true,
      padding: {
        top:
          typeof (options as any).paddingTop === 'number'
            ? (options as any).paddingTop
            : 4,
      },
    });

    if (onFocusChange) {
      // Text widget focus (strongest indicator of caret in editor)
      editor.onDidFocusEditorText?.(() => onFocusChange(true));
      editor.onDidBlurEditorText?.(() => onFocusChange(false));
      // Fallbacks
      editor.onDidFocusEditorWidget?.(() => onFocusChange(true));
      editor.onDidBlurEditorWidget?.(() => onFocusChange(false));
      // Initialize
      try {
        onFocusChange(editor.hasTextFocus());
      } catch {
        // ignore
      }
    }
  };

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  // Set error markers
  const setErrorMarkers = (errors: EditorError[]) => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = errors.map(error => ({
          startLineNumber: error.startLineNumber,
          startColumn: error.startColumn,
          endLineNumber: error.endLineNumber,
          endColumn: error.endColumn,
          message: error.message,
          severity:
            error.severity === 'error'
              ? monaco.MarkerSeverity.Error
              : error.severity === 'warning'
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Info,
        }));

        monaco.editor.setModelMarkers(model, 'owner', markers);
      }
    }
  };

  // Expose methods for parent components
  useEffect(() => {
    if (editorRef.current) {
      (editorRef.current as any).setErrorMarkers = setErrorMarkers;
    }
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        theme={options.theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: options.readOnly ?? false,
          cursorStyle: 'line',
          automaticLayout: true,
          fixedOverflowWidgets: true,
        }}
      />
    </div>
  );
};

export default MonacoEditor;
