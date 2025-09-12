module.exports = {
  KeyMod: {
    CtrlCmd: 2048,
    Shift: 1024,
    Alt: 512,
    WinCtrl: 256,
  },
  KeyCode: {
    KeyS: 49,
    KeyF: 33,
    KeyH: 35,
    KeyZ: 56,
    KeyY: 57,
    Escape: 9,
    Enter: 3,
    Tab: 2,
    Backspace: 1,
    Delete: 6,
    F1: 59,
    F3: 61,
    F8: 66,
    UpArrow: 16,
    DownArrow: 18,
    LeftArrow: 15,
    RightArrow: 17,
  },
  editor: {
    create: jest.fn(() => ({
      dispose: jest.fn(),
      getValue: jest.fn(() => ''),
      setValue: jest.fn(),
      getModel: jest.fn(() => ({
        dispose: jest.fn(),
      })),
      onDidChangeModelContent: jest.fn(),
      addCommand: jest.fn(),
      focus: jest.fn(),
      layout: jest.fn(),
      trigger: jest.fn(),
      setScrollTop: jest.fn(),
      getScrollTop: jest.fn(() => 0),
      revealLine: jest.fn(),
      setPosition: jest.fn(),
      getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
      executeEdits: jest.fn(),
      pushUndoStop: jest.fn(),
      onDidChangeCursorPosition: jest.fn(),
      updateOptions: jest.fn(),
      getAction: jest.fn(() => ({
        run: jest.fn(),
      })),
    })),
    createModel: jest.fn(() => ({
      dispose: jest.fn(),
      setValue: jest.fn(),
      getValue: jest.fn(() => ''),
      onDidChangeContent: jest.fn(),
    })),
    setTheme: jest.fn(),
    defineTheme: jest.fn(),
    getModels: jest.fn(() => []),
  },
  languages: {
    register: jest.fn(),
    setLanguageConfiguration: jest.fn(),
    setMonarchTokensProvider: jest.fn(),
    registerCompletionItemProvider: jest.fn(),
    registerHoverProvider: jest.fn(),
    registerSignatureHelpProvider: jest.fn(),
    registerDefinitionProvider: jest.fn(),
    registerReferenceProvider: jest.fn(),
    registerDocumentFormattingEditProvider: jest.fn(),
    registerCodeActionProvider: jest.fn(),
  },
  Range: jest
    .fn()
    .mockImplementation(
      (startLineNumber, startColumn, endLineNumber, endColumn) => ({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      })
    ),
  Position: jest.fn().mockImplementation((lineNumber, column) => ({
    lineNumber,
    column,
  })),
  Selection: jest
    .fn()
    .mockImplementation(
      (startLineNumber, startColumn, endLineNumber, endColumn) => ({
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
      })
    ),
  MarkerSeverity: {
    Error: 8,
    Warning: 4,
    Info: 2,
    Hint: 1,
  },
  Uri: {
    parse: jest.fn(path => ({ path })),
    file: jest.fn(path => ({ path })),
  },
};
