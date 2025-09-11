import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as monaco from 'monaco-editor';
import Editor from '@monaco-editor/react';
import '../lib/monaco-environment'; // Ensure Monaco is configured for CEP
import { useExpressionOperations } from '../hooks/useCEPBridge';
import { useEditorConfig } from '../contexts/EditorContext';
import {
  PropertySelection,
  ExpressionEditorState,
  ExpressionAnalysis,
} from '../types/expression';
import { ValidationResult } from '../../shared/universals';
import {
  registerAEExpressionLanguage,
  AE_EXPRESSION_LANGUAGE_ID,
} from '../lib/expression-language';
import {
  ExpressionFormatter,
  FormattingOptions,
  DEFAULT_FORMATTING_OPTIONS,
  registerExpressionFormattingProvider,
} from '../lib/expression-formatter';
import {
  ExpressionLinter,
  LintingOptions,
  LintingError,
  DEFAULT_LINTING_OPTIONS,
  registerExpressionLintingProvider,
} from '../lib/expression-linter';
import {
  ExpressionSearchEngine,
  SearchResult,
  configureMonacoSearch,
  highlightSearchMatches,
  clearSearchHighlights,
} from '../lib/expression-search';
import FormattingSettings from './FormattingSettings';
import LintingSettings from './LintingSettings';
// import SearchPanel from './SearchPanel'; // Removed as part of simplification
import {
  AlertTriangle,
  Settings,
  Undo,
  Loader2,
  Play,
  Trash2,
} from 'lucide-react';
import '../styles/expression-editor.scss';

interface ExpressionEditorProps {
  selectedProperty: PropertySelection | null;
  onPropertyChange?: (property: PropertySelection) => void;
}

const ExpressionEditor: React.FC<ExpressionEditorProps> = ({
  selectedProperty,
  onPropertyChange,
}) => {
  const { config } = useEditorConfig();
  const { getPropertyExpression, setPropertyExpression, validateExpression } =
    useExpressionOperations();

  const [editorState, setEditorState] = useState<ExpressionEditorState>({
    propertyPath: null,
    expression: '',
    originalExpression: '',
    isDirty: false,
    isValidating: false,
    validationResult: null,
    isApplying: false,
    lastAppliedExpression: '',
  });

  const [showValidation, setShowValidation] = useState(true);
  const [autoValidate, setAutoValidate] = useState(true);
  const [analysis, setAnalysis] = useState<ExpressionAnalysis | null>(null);
  const [showFormattingSettings, setShowFormattingSettings] = useState(false);
  const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>(
    DEFAULT_FORMATTING_OPTIONS
  );
  const [formatter, setFormatter] = useState<ExpressionFormatter | null>(null);
  const [autoFormatOnSave, setAutoFormatOnSave] = useState(true);

  // Linting state
  const [showLintingSettings, setShowLintingSettings] = useState(false);
  const [lintingOptions, setLintingOptions] = useState<LintingOptions>(
    DEFAULT_LINTING_OPTIONS
  );
  const [linter, setLinter] = useState<ExpressionLinter | null>(null);
  const [lintingErrors, setLintingErrors] = useState<LintingError[]>([]);
  const [autoLint, setAutoLint] = useState(true);

  // Search state
  // const [showSearchPanel, setShowSearchPanel] = useState(false); // Removed as part of simplification
  const [searchEngine, setSearchEngine] =
    useState<ExpressionSearchEngine | null>(null);
  const [searchHighlights, setSearchHighlights] = useState<string[]>([]);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Register AE expression language, formatter, linter, and search on mount
  useEffect(() => {
    registerAEExpressionLanguage();
    const formatterInstance = registerExpressionFormattingProvider(
      AE_EXPRESSION_LANGUAGE_ID
    );
    const linterInstance = registerExpressionLintingProvider(
      AE_EXPRESSION_LANGUAGE_ID
    );
    const searchEngineInstance = new ExpressionSearchEngine();

    setFormatter(formatterInstance);
    setLinter(linterInstance);
    setSearchEngine(searchEngineInstance);

    // Load options from storage
    loadFormattingOptions();
    loadLintingOptions();
  }, []);

  // Load formatting options from CEP storage
  const loadFormattingOptions = useCallback(async () => {
    try {
      if (window.cep && window.cep.fs) {
        const extPath = window.cep.fs.getSystemPath('extension');
        const optionsPath = `${extPath}/formatting-options.json`;
        const result = window.cep.fs.readFile(optionsPath);

        if (result.err === 0 && result.data) {
          const options = JSON.parse(result.data);
          setFormattingOptions({ ...DEFAULT_FORMATTING_OPTIONS, ...options });
          setAutoFormatOnSave(options.autoFormatOnSave ?? true);
        }
      }
    } catch (error) {
      console.log('No stored formatting options found, using defaults');
    }
  }, []);

  // Save formatting options to CEP storage
  const saveFormattingOptions = useCallback(
    async (options: FormattingOptions, autoFormat: boolean) => {
      try {
        if (window.cep && window.cep.fs) {
          const extPath = window.cep.fs.getSystemPath('extension');
          const optionsPath = `${extPath}/formatting-options.json`;
          const optionsToSave = { ...options, autoFormatOnSave: autoFormat };

          window.cep.fs.writeFile(
            optionsPath,
            JSON.stringify(optionsToSave, null, 2)
          );
        }
      } catch (error) {
        console.error('Failed to save formatting options:', error);
      }
    },
    []
  );

  // Load linting options from CEP storage
  const loadLintingOptions = useCallback(async () => {
    try {
      if (window.cep && window.cep.fs) {
        const extPath = window.cep.fs.getSystemPath('extension');
        const optionsPath = `${extPath}/linting-options.json`;
        const result = window.cep.fs.readFile(optionsPath);

        if (result.err === 0 && result.data) {
          const options = JSON.parse(result.data);
          setLintingOptions({ ...DEFAULT_LINTING_OPTIONS, ...options });
          setAutoLint(options.autoLint ?? true);
        }
      }
    } catch (error) {
      console.log('No stored linting options found, using defaults');
    }
  }, []);

  // Save linting options to CEP storage
  const saveLintingOptions = useCallback(
    async (options: LintingOptions, autoLintEnabled: boolean) => {
      try {
        if (window.cep && window.cep.fs) {
          const extPath = window.cep.fs.getSystemPath('extension');
          const optionsPath = `${extPath}/linting-options.json`;
          const optionsToSave = { ...options, autoLint: autoLintEnabled };

          window.cep.fs.writeFile(
            optionsPath,
            JSON.stringify(optionsToSave, null, 2)
          );
        }
      } catch (error) {
        console.error('Failed to save linting options:', error);
      }
    },
    []
  );

  // Load expression when property changes
  useEffect(() => {
    if (selectedProperty) {
      loadPropertyExpression(selectedProperty);
    } else {
      clearEditor();
    }
  }, [selectedProperty]);

  // Auto-validate on expression change
  useEffect(() => {
    if (autoValidate && editorState.expression && editorState.isDirty) {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      validationTimeoutRef.current = setTimeout(() => {
        validateCurrentExpression();
      }, 500);
    }

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [editorState.expression, editorState.isDirty, autoValidate]);

  // Auto-lint on expression change
  useEffect(() => {
    if (autoLint && linter && editorState.expression) {
      const errors = linter.lintExpression(editorState.expression);
      setLintingErrors(errors);
      updateLintingMarkers(errors);
    } else {
      setLintingErrors([]);
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          monaco.editor.setModelMarkers(model, 'ae-expression-linter', []);
        }
      }
    }
  }, [editorState.expression, autoLint, linter]);

  const loadPropertyExpression = useCallback(
    async (property: PropertySelection) => {
      try {
        const expression = property.hasExpression
          ? await getPropertyExpression(property.propertyPath)
          : '';

        setEditorState({
          propertyPath: property.propertyPath,
          expression,
          originalExpression: expression,
          isDirty: false,
          isValidating: false,
          validationResult: null,
          isApplying: false,
          lastAppliedExpression: expression,
        });

        // Analyze expression
        if (expression) {
          analyzeExpression(expression);
        } else {
          setAnalysis(null);
        }
      } catch (error) {
        console.error('Failed to load property expression:', error);
      }
    },
    [getPropertyExpression]
  );

  const clearEditor = useCallback(() => {
    setEditorState({
      propertyPath: null,
      expression: '',
      originalExpression: '',
      isDirty: false,
      isValidating: false,
      validationResult: null,
      isApplying: false,
      lastAppliedExpression: '',
    });
    setAnalysis(null);
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;

    setEditorState(prev => ({
      ...prev,
      expression: value,
      isDirty: value !== prev.originalExpression,
      validationResult: null,
    }));

    // Analyze expression
    if (value) {
      analyzeExpression(value);
    } else {
      setAnalysis(null);
    }
  }, []);

  const validateCurrentExpression = useCallback(async () => {
    if (!editorState.expression.trim()) {
      setEditorState(prev => ({ ...prev, validationResult: null }));
      return;
    }

    setEditorState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await validateExpression(editorState.expression);
      setEditorState(prev => ({
        ...prev,
        validationResult: result,
        isValidating: false,
      }));

      // Update editor markers
      updateEditorMarkers(result);
    } catch (error) {
      console.error('Validation failed:', error);
      setEditorState(prev => ({ ...prev, isValidating: false }));
    }
  }, [editorState.expression, validateExpression]);

  const updateEditorMarkers = useCallback(
    (validationResult: ValidationResult) => {
      if (!editorRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      const markers: monaco.editor.IMarkerData[] = [];

      // Add error markers
      validationResult.errors.forEach(error => {
        markers.push({
          startLineNumber: error.line,
          startColumn: error.column,
          endLineNumber: error.line,
          endColumn: error.column + 1,
          message: error.message,
          severity: monaco.MarkerSeverity.Error,
          source: 'ae-expression',
        });
      });

      // Add warning markers
      validationResult.warnings.forEach(warning => {
        markers.push({
          startLineNumber: warning.line,
          startColumn: warning.column,
          endLineNumber: warning.line,
          endColumn: warning.column + 1,
          message: warning.message,
          severity: monaco.MarkerSeverity.Warning,
          source: 'ae-expression',
        });
      });

      monaco.editor.setModelMarkers(model, 'ae-expression', markers);
    },
    []
  );

  const updateLintingMarkers = useCallback((lintingErrors: LintingError[]) => {
    if (!editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = [];

    // Add linting markers
    lintingErrors.forEach(error => {
      const severity =
        error.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : error.severity === 'warning'
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Info;

      markers.push({
        startLineNumber: error.line,
        startColumn: error.column,
        endLineNumber: error.endLine,
        endColumn: error.endColumn,
        message: error.message,
        severity,
        source: 'ae-expression-linter',
        code: error.ruleId,
      });
    });

    monaco.editor.setModelMarkers(model, 'ae-expression-linter', markers);
  }, []);

  const analyzeExpression = useCallback((expression: string) => {
    const lines = expression.split('\n');
    const functions: string[] = [];
    const properties: string[] = [];
    const variables: string[] = [];

    // Simple analysis - could be enhanced
    const functionMatches = expression.match(/\b\w+\s*\(/g);
    if (functionMatches) {
      functions.push(
        ...functionMatches.map(match => match.replace(/\s*\(/, ''))
      );
    }

    const propertyMatches = expression.match(/\b\w+\.\w+/g);
    if (propertyMatches) {
      properties.push(...propertyMatches);
    }

    const variableMatches = expression.match(/\b\w+(?=\s*[=;])/g);
    if (variableMatches) {
      variables.push(...variableMatches);
    }

    setEditorState(prev => ({
      ...prev,
      analysis: {
        lines: lines.length,
        functions: [...new Set(functions)],
        properties: [...new Set(properties)],
        variables: [...new Set(variables)],
      },
    }));
  }, []);

  const formatExpression = useCallback(() => {
    if (!editorRef.current || !formatter) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    try {
      const formattedCode = formatter.formatExpression(editorState.expression);

      if (formattedCode !== editorState.expression) {
        setEditorState(prev => ({
          ...prev,
          expression: formattedCode,
          isDirty: formattedCode !== prev.originalExpression,
        }));

        // Update editor content
        editorRef.current.setValue(formattedCode);

        // Analyze formatted expression
        if (formattedCode) {
          analyzeExpression(formattedCode);
        }
      }
    } catch (error) {
      console.error('Failed to format expression:', error);
    }
  }, [editorState.expression, formatter, analyzeExpression]);

  const applyExpression = useCallback(async () => {
    if (!selectedProperty || !editorState.propertyPath) return;

    setEditorState(prev => ({ ...prev, isApplying: true }));

    try {
      let expressionToApply = editorState.expression;

      // Auto-format on save if enabled
      if (autoFormatOnSave && formatter) {
        expressionToApply = formatter.formatExpression(editorState.expression);

        // Update editor if formatting changed the code
        if (expressionToApply !== editorState.expression) {
          setEditorState(prev => ({
            ...prev,
            expression: expressionToApply,
          }));
          if (editorRef.current) {
            editorRef.current.setValue(expressionToApply);
          }
        }
      }

      const success = await setPropertyExpression(
        editorState.propertyPath,
        expressionToApply
      );

      if (success) {
        setEditorState(prev => ({
          ...prev,
          originalExpression: expressionToApply,
          isDirty: false,
          isApplying: false,
          lastAppliedExpression: expressionToApply,
        }));

        // Update property selection
        if (onPropertyChange) {
          onPropertyChange({
            ...selectedProperty,
            currentExpression: expressionToApply,
            hasExpression: expressionToApply.trim() !== '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to apply expression:', error);
      setEditorState(prev => ({ ...prev, isApplying: false }));
    }
  }, [
    selectedProperty,
    editorState.propertyPath,
    editorState.expression,
    setPropertyExpression,
    onPropertyChange,
    autoFormatOnSave,
    formatter,
  ]);

  const revertExpression = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      expression: prev.originalExpression,
      isDirty: false,
      validationResult: null,
    }));

    // Clear editor markers
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelMarkers(model, 'ae-expression', []);
      }
    }

    // Analyze original expression
    if (editorState.originalExpression) {
      analyzeExpression(editorState.originalExpression);
    } else {
      setAnalysis(null);
    }
  }, [editorState.originalExpression]);

  const clearExpression = useCallback(async () => {
    if (!selectedProperty || !editorState.propertyPath) return;

    if (
      confirm(
        'Are you sure you want to remove the expression from this property?'
      )
    ) {
      setEditorState(prev => ({ ...prev, isApplying: true }));

      try {
        const success = await setPropertyExpression(
          editorState.propertyPath,
          ''
        );

        if (success) {
          setEditorState(prev => ({
            ...prev,
            expression: '',
            originalExpression: '',
            isDirty: false,
            isApplying: false,
            lastAppliedExpression: '',
            validationResult: null,
          }));

          setAnalysis(null);

          // Update property selection
          if (onPropertyChange) {
            onPropertyChange({
              ...selectedProperty,
              currentExpression: '',
              hasExpression: false,
            });
          }

          // Clear editor markers
          if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
              monaco.editor.setModelMarkers(model, 'ae-expression', []);
            }
          }
        }
      } catch (error) {
        console.error('Failed to clear expression:', error);
        setEditorState(prev => ({ ...prev, isApplying: false }));
      }
    }
  }, [
    selectedProperty,
    editorState.propertyPath,
    setPropertyExpression,
    onPropertyChange,
  ]);

  const handleFormattingOptionsChange = useCallback(
    (options: FormattingOptions) => {
      setFormattingOptions(options);
      if (formatter) {
        formatter.updateOptions(options);
      }
      saveFormattingOptions(options, autoFormatOnSave);
    },
    [formatter, autoFormatOnSave, saveFormattingOptions]
  );

  const handleAutoFormatToggle = useCallback(
    (enabled: boolean) => {
      setAutoFormatOnSave(enabled);
      saveFormattingOptions(formattingOptions, enabled);
    },
    [formattingOptions, saveFormattingOptions]
  );

  const handleLintingOptionsChange = useCallback(
    (options: LintingOptions) => {
      setLintingOptions(options);
      if (linter) {
        linter.updateOptions(options);
        // Re-lint current expression with new options
        if (editorState.expression) {
          const errors = linter.lintExpression(editorState.expression);
          setLintingErrors(errors);
          updateLintingMarkers(errors);
        }
      }
      saveLintingOptions(options, autoLint);
    },
    [
      linter,
      editorState.expression,
      autoLint,
      saveLintingOptions,
      updateLintingMarkers,
    ]
  );

  const handleRuleToggle = useCallback(
    (ruleId: string, enabled: boolean) => {
      if (linter) {
        linter.setRuleEnabled(ruleId, enabled);
        // Re-lint current expression with updated rules
        if (editorState.expression) {
          const errors = linter.lintExpression(editorState.expression);
          setLintingErrors(errors);
          updateLintingMarkers(errors);
        }
      }
    },
    [linter, editorState.expression, updateLintingMarkers]
  );

  const handleAutoLintToggle = useCallback(
    (enabled: boolean) => {
      setAutoLint(enabled);
      saveLintingOptions(lintingOptions, enabled);

      if (!enabled) {
        // Clear linting markers when auto-lint is disabled
        setLintingErrors([]);
        if (editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            monaco.editor.setModelMarkers(model, 'ae-expression-linter', []);
          }
        }
      }
    },
    [lintingOptions, saveLintingOptions]
  );

  const runLinting = useCallback(() => {
    if (linter && editorState.expression) {
      const errors = linter.lintExpression(editorState.expression);
      setLintingErrors(errors);
      updateLintingMarkers(errors);
    }
  }, [linter, editorState.expression, updateLintingMarkers]);

  // Search handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearchResults = useCallback(
    (results: SearchResult[]) => {
      // Clear previous highlights
      if (editorRef.current && searchHighlights.length > 0) {
        clearSearchHighlights(editorRef.current, searchHighlights);
        setSearchHighlights([]);
      }

      // If searching in current editor, highlight matches
      if (results.length > 0 && searchEngine) {
        const currentResult = searchEngine.getCurrentResult();
        if (currentResult && editorRef.current) {
          const highlights = highlightSearchMatches(
            editorRef.current,
            currentResult.matches
          );
          setSearchHighlights(highlights);
        }
      }
    },
    [searchHighlights, searchEngine]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNavigateToResult = useCallback(
    (result: SearchResult, matchIndex?: number) => {
      if (!editorRef.current) return;

      // If this is a different property, we would need to switch to it
      // For now, we'll just highlight the match in the current editor
      if (result.matches.length > 0) {
        const match = result.matches[matchIndex || 0];

        // Navigate to the match position
        editorRef.current.setPosition({
          lineNumber: match.startLine,
          column: match.startColumn,
        });

        // Select the match
        editorRef.current.setSelection({
          startLineNumber: match.startLine,
          startColumn: match.startColumn,
          endLineNumber: match.endLine,
          endColumn: match.endColumn,
        });

        // Focus the editor
        editorRef.current.focus();
      }
    },
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReplaceInResult = useCallback(
    async (
      result: SearchResult,
      matchIndex: number,
      replaceText: string
    ): Promise<boolean> => {
      if (!searchEngine || !selectedProperty) return false;

      try {
        const replaceResult = await searchEngine.replaceInResult(
          result,
          matchIndex,
          {
            replaceText,
            replaceAll: false,
            confirmEach: false,
            preserveCase: false,
          },
          async (propertyPath: string, newExpression: string) => {
            // Update the current editor if it's the same property
            if (propertyPath === selectedProperty.propertyPath) {
              setEditorState(prev => ({
                ...prev,
                expression: newExpression,
                isDirty: newExpression !== prev.originalExpression,
              }));

              // Update the editor content
              if (editorRef.current) {
                editorRef.current.setValue(newExpression);
              }

              return true;
            }

            // For other properties, we would need to update them via CEP bridge
            return await setPropertyExpression(propertyPath, newExpression);
          }
        );

        return replaceResult.success;
      } catch (error) {
        console.error('Replace error:', error);
        return false;
      }
    },
    [searchEngine, selectedProperty, setPropertyExpression]
  );

  // Search panel functions removed as part of simplification
  // const openSearchPanel = useCallback(() => {
  //   setShowSearchPanel(true);
  // }, []);

  // const closeSearchPanel = useCallback(() => {
  //   setShowSearchPanel(false);
  //   // Clear search highlights when closing
  //   if (editorRef.current && searchHighlights.length > 0) {
  //     clearSearchHighlights(editorRef.current, searchHighlights);
  //     setSearchHighlights([]);
  //   }
  // }, [searchHighlights]);

  const handleEditorDidMount = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Configure Monaco search
      configureMonacoSearch(editor);

      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        applyExpression();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
        revertExpression();
      });

      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV,
        () => {
          validateCurrentExpression();
        }
      );

      // Add format command
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          formatExpression();
        }
      );

      // Add format settings command
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          setShowFormattingSettings(true);
        }
      );

      // Add lint command
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
        () => {
          runLinting();
        }
      );

      // Add lint settings command
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyL,
        () => {
          setShowLintingSettings(true);
        }
      );

      // Add search panel command
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        () => {
          // openSearchPanel(); // Removed as part of simplification
        }
      );
    },
    [
      applyExpression,
      revertExpression,
      validateCurrentExpression,
      formatExpression,
      runLinting,
      // openSearchPanel, // Removed as part of simplification
    ]
  );

  if (!selectedProperty) {
    return (
      <div className="expression-editor">
        <div className="no-property-selected">
          <div className="placeholder-content">
            <h3>Expression Editor</h3>
            <p>Select a property to edit its expression</p>
            <div className="features-list">
              <div className="feature">✨ Syntax highlighting</div>
              <div className="feature">🔍 Auto-completion</div>
              <div className="feature">
                <AlertTriangle size={14} />
                Error detection
              </div>
              <div className="feature">📊 Performance analysis</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expression-editor">
      {/* Header */}
      <div className="expression-editor-header">
        <div className="property-info">
          <div className="property-name">{selectedProperty.propertyName}</div>
          <div className="layer-name">{selectedProperty.layerName}</div>
          <div className="property-path">{selectedProperty.propertyPath}</div>
        </div>

        <div className="editor-controls">
          <label className="auto-validate-toggle">
            <input
              type="checkbox"
              checked={autoValidate}
              onChange={e => setAutoValidate(e.target.checked)}
            />
            <span>Auto-validate</span>
          </label>

          <label className="auto-format-toggle">
            <input
              type="checkbox"
              checked={autoFormatOnSave}
              onChange={e => handleAutoFormatToggle(e.target.checked)}
            />
            <span>Auto-format</span>
          </label>

          <label className="auto-lint-toggle">
            <input
              type="checkbox"
              checked={autoLint}
              onChange={e => handleAutoLintToggle(e.target.checked)}
            />
            <span>Auto-lint</span>
          </label>

          <button
            className="format-btn"
            onClick={formatExpression}
            disabled={!editorState.expression.trim()}
            title="Format code (Ctrl+Shift+F)"
          >
            🎨 Format
          </button>

          <button
            className="format-settings-btn"
            onClick={() => setShowFormattingSettings(true)}
            title="Format settings (Ctrl+Alt+F)"
          >
            <Settings size={16} />
          </button>

          <button
            className="lint-btn"
            onClick={runLinting}
            disabled={!editorState.expression.trim()}
            title="Run linting (Ctrl+Shift+L)"
          >
            🔍 Lint
          </button>

          <button
            className="lint-settings-btn"
            onClick={() => setShowLintingSettings(true)}
            title="Linting settings (Ctrl+Alt+L)"
          >
            <Settings size={16} />
          </button>

          {/* Search button removed as part of simplification */}

          <button
            className="validate-btn"
            onClick={validateCurrentExpression}
            disabled={
              editorState.isValidating || !editorState.expression.trim()
            }
          >
            {editorState.isValidating ? '⟳' : '✓'} Validate
          </button>

          <button
            className="revert-btn"
            onClick={revertExpression}
            disabled={!editorState.isDirty}
          >
            <Undo size={16} /> Revert
          </button>

          <button
            className="apply-btn"
            onClick={applyExpression}
            disabled={
              !editorState.isDirty ||
              editorState.isApplying ||
              (editorState.validationResult !== null &&
                !editorState.validationResult.isValid)
            }
          >
            {editorState.isApplying ? (
              <Loader2 size={16} />
            ) : (
              <Play size={16} />
            )}{' '}
            Apply
          </button>

          <button
            className="clear-btn"
            onClick={clearExpression}
            disabled={editorState.isApplying}
          >
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        <Editor
          height="100%"
          language={AE_EXPRESSION_LANGUAGE_ID}
          value={editorState.expression}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={config.theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            fontSize: config.fontSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            minimap: { enabled: config.minimap },
            tabSize: config.tabSize,
            insertSpaces: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            lineNumbers: 'on',
            folding: true,
            matchBrackets: 'always',
            autoIndent: 'full',
            formatOnPaste: config.autoFormat,
            formatOnType: config.autoFormat,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
          }}
        />
      </div>

      {/* Status and Analysis */}
      <div className="editor-status">
        <div className="status-left">
          <div className="editor-stats">
            <span>Lines: {editorState.expression.split('\n').length}</span>
            <span>Characters: {editorState.expression.length}</span>
            {analysis && (
              <>
                <span>Functions: {analysis.functions.length}</span>
                <span
                  className={`performance ${analysis.estimatedPerformance}`}
                >
                  Performance: {analysis.estimatedPerformance}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="status-right">
          {editorState.isDirty && (
            <span className="dirty-indicator">Modified</span>
          )}
          {editorState.isValidating && (
            <span className="validating-indicator">Validating...</span>
          )}
          {editorState.validationResult && (
            <span
              className={`validation-status ${editorState.validationResult.isValid ? 'valid' : 'invalid'}`}
            >
              {editorState.validationResult.isValid ? '✓ Valid' : '✗ Invalid'}
            </span>
          )}
          {lintingErrors.length > 0 && (
            <span className="linting-status">
              🔍 {lintingErrors.filter(e => e.severity === 'error').length}{' '}
              errors,{' '}
              {lintingErrors.filter(e => e.severity === 'warning').length}{' '}
              warnings
            </span>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {showValidation && editorState.validationResult && (
        <div className="validation-panel">
          <div className="validation-header">
            <span>Validation Results</span>
            <button
              className="toggle-validation"
              onClick={() => setShowValidation(!showValidation)}
            >
              ▼
            </button>
          </div>

          <div className="validation-content">
            {editorState.validationResult.errors.length > 0 && (
              <div className="validation-section errors">
                <h4>Errors ({editorState.validationResult.errors.length})</h4>
                {editorState.validationResult.errors.map((error, index) => (
                  <div key={index} className="validation-item error">
                    <span className="line-number">Line {error.line}:</span>
                    <span className="message">{error.message}</span>
                  </div>
                ))}
              </div>
            )}

            {editorState.validationResult.warnings.length > 0 && (
              <div className="validation-section warnings">
                <h4>
                  Warnings ({editorState.validationResult.warnings.length})
                </h4>
                {editorState.validationResult.warnings.map((warning, index) => (
                  <div key={index} className="validation-item warning">
                    <span className="line-number">Line {warning.line}:</span>
                    <span className="message">{warning.message}</span>
                  </div>
                ))}
              </div>
            )}

            {editorState.validationResult.errors.length === 0 &&
              editorState.validationResult.warnings.length === 0 && (
                <div className="validation-success">
                  ✓ Expression is valid with no issues
                </div>
              )}
          </div>
        </div>
      )}

      {/* Formatting Settings Modal */}
      {showFormattingSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FormattingSettings
              options={formattingOptions}
              onOptionsChange={handleFormattingOptionsChange}
              onClose={() => setShowFormattingSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Linting Settings Modal */}
      {showLintingSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <LintingSettings
              options={lintingOptions}
              rules={linter?.getRules() || []}
              onOptionsChange={handleLintingOptionsChange}
              onRuleToggle={handleRuleToggle}
              onClose={() => setShowLintingSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Search Panel Modal removed as part of simplification */}

      {/* Keyboard Shortcuts Help */}
      <div className="shortcuts-help">
        <div className="shortcut">
          <kbd>Ctrl+Enter</kbd> Apply Expression
        </div>
        <div className="shortcut">
          <kbd>Ctrl+R</kbd> Revert Changes
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Shift+V</kbd> Validate
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Shift+F</kbd> Format Code
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Alt+F</kbd> Format Settings
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Shift+L</kbd> Run Linting
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Alt+L</kbd> Linting Settings
        </div>
        <div className="shortcut">
          <kbd>Ctrl+Shift+F</kbd> Search Panel
        </div>
        <div className="shortcut">
          <kbd>Ctrl+F</kbd> Quick Search
        </div>
        <div className="shortcut">
          <kbd>Ctrl+H</kbd> Quick Replace
        </div>
      </div>
    </div>
  );
};

export default ExpressionEditor;
