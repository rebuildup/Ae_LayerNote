import * as monaco from 'monaco-editor';

export interface FormattingOptions {
  tabSize: number;
  insertSpaces: boolean;
  indentSize: number;
  maxLineLength: number;
  insertFinalNewline: boolean;
  trimTrailingWhitespace: boolean;
  indentStyle: 'spaces' | 'tabs';
  bracketSpacing: boolean;
  semicolons: boolean;
  quoteStyle: 'single' | 'double';
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
  tabSize: 2,
  insertSpaces: true,
  indentSize: 2,
  maxLineLength: 80,
  insertFinalNewline: true,
  trimTrailingWhitespace: true,
  indentStyle: 'spaces',
  bracketSpacing: true,
  semicolons: true,
  quoteStyle: 'double',
};

/**
 * After Effects Expression Formatter
 * Provides formatting capabilities for AE expressions
 */
export class ExpressionFormatter {
  private options: FormattingOptions;

  constructor(options: Partial<FormattingOptions> = {}) {
    this.options = { ...DEFAULT_FORMATTING_OPTIONS, ...options };
  }

  /**
   * Format the given expression code
   */
  formatExpression(code: string): string {
    try {
      // Basic formatting steps
      let formatted = code;

      // 1. Normalize line endings
      formatted = this.normalizeLineEndings(formatted);

      // 2. Trim trailing whitespace
      if (this.options.trimTrailingWhitespace) {
        formatted = this.trimTrailingWhitespace(formatted);
      }

      // 3. Format indentation
      formatted = this.formatIndentation(formatted);

      // 4. Format brackets and parentheses
      formatted = this.formatBrackets(formatted);

      // 5. Format operators
      formatted = this.formatOperators(formatted);

      // 6. Format function calls
      formatted = this.formatFunctionCalls(formatted);

      // 7. Format semicolons
      if (this.options.semicolons) {
        formatted = this.formatSemicolons(formatted);
      }

      // 8. Format quotes
      formatted = this.formatQuotes(formatted);

      // 9. Handle line length
      formatted = this.handleLineLength(formatted);

      // 10. Add final newline if needed
      if (this.options.insertFinalNewline && !formatted.endsWith('\n')) {
        formatted += '\n';
      }

      return formatted;
    } catch (error) {
      console.error('Formatting error:', error);
      return code; // Return original code if formatting fails
    }
  }

  /**
   * Get formatting edits for Monaco Editor
   */
  getFormattingEdits(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    _options: monaco.languages.FormattingOptions
  ): monaco.languages.TextEdit[] {
    const originalText = model.getValueInRange(range);
    const formattedText = this.formatExpression(originalText);

    if (originalText === formattedText) {
      return []; // No changes needed
    }

    return [
      {
        range,
        text: formattedText,
      },
    ];
  }

  private normalizeLineEndings(code: string): string {
    return code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  private trimTrailingWhitespace(code: string): string {
    return code
      .split('\n')
      .map(line => line.replace(/\s+$/, ''))
      .join('\n');
  }

  private formatIndentation(code: string): string {
    const lines = code.split('\n');
    const indentChar =
      this.options.indentStyle === 'spaces'
        ? ' '.repeat(this.options.indentSize)
        : '\t';

    let indentLevel = 0;
    const formattedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') {
        formattedLines.push('');
        continue;
      }

      // Decrease indent for closing brackets
      if (this.isClosingBracket(line)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Apply indentation
      const indentedLine = indentChar.repeat(indentLevel) + line;
      formattedLines.push(indentedLine);

      // Increase indent for opening brackets
      if (this.isOpeningBracket(line)) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  }

  private formatBrackets(code: string): string {
    let formatted = code;

    if (this.options.bracketSpacing) {
      // Add spaces inside object literals
      formatted = formatted.replace(/\{([^\s])/g, '{ $1');
      formatted = formatted.replace(/([^\s])\}/g, '$1 }');

      // Add spaces inside array literals
      formatted = formatted.replace(/\[([^\s])/g, '[ $1');
      formatted = formatted.replace(/([^\s])\]/g, '$1 ]');
    }

    // Format function parentheses
    formatted = formatted.replace(/(\w+)\s*\(/g, '$1(');

    return formatted;
  }

  private formatOperators(code: string): string {
    let formatted = code;

    // Add spaces around binary operators
    const binaryOperators = [
      '\\+',
      '-',
      '\\*',
      '/',
      '%',
      '=',
      '==',
      '===',
      '!=',
      '!==',
      '<',
      '>',
      '<=',
      '>=',
      '&&',
      '\\|\\|',
      '&',
      '\\|',
      '\\^',
      '<<',
      '>>',
      '>>>',
      '\\+=',
      '-=',
      '\\*=',
      '/=',
      '%=',
    ];

    binaryOperators.forEach(op => {
      const regex = new RegExp(`\\s*${op}\\s*`, 'g');
      const replacement = op.replace(/\\/g, '');
      formatted = formatted.replace(regex, ` ${replacement} `);
    });

    // Handle unary operators (no space after)
    formatted = formatted.replace(/\s+\+\+/g, '++');
    formatted = formatted.replace(/\s+--/g, '--');
    formatted = formatted.replace(/!\s+/g, '!');

    // Clean up multiple spaces
    formatted = formatted.replace(/\s{2,}/g, ' ');

    return formatted;
  }

  private formatFunctionCalls(code: string): string {
    let formatted = code;

    // Format function parameters
    formatted = formatted.replace(/,\s*/g, ', ');

    // Remove space before function parentheses
    formatted = formatted.replace(/(\w+)\s+\(/g, '$1(');

    return formatted;
  }

  private formatSemicolons(code: string): string {
    let formatted = code;

    // Add semicolons at end of statements (basic implementation)
    const lines = formatted.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();

      // Skip empty lines, comments, and lines that already end with semicolon or bracket
      if (
        !trimmed ||
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.endsWith(';') ||
        trimmed.endsWith('{') ||
        trimmed.endsWith('}') ||
        trimmed.endsWith('(') ||
        trimmed.endsWith(')')
      ) {
        return line;
      }

      // Add semicolon if it looks like a statement
      if (this.isStatement(trimmed)) {
        return line + ';';
      }

      return line;
    });

    return formattedLines.join('\n');
  }

  private formatQuotes(code: string): string {
    let formatted = code;

    if (this.options.quoteStyle === 'single') {
      // Convert double quotes to single quotes (simple implementation)
      formatted = formatted.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, "'$1'");
    } else {
      // Convert single quotes to double quotes (simple implementation)
      formatted = formatted.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
    }

    return formatted;
  }

  private handleLineLength(code: string): string {
    if (this.options.maxLineLength <= 0) {
      return code;
    }

    const lines = code.split('\n');
    const formattedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= this.options.maxLineLength) {
        formattedLines.push(line);
        continue;
      }

      // Try to break long lines at appropriate points
      const brokenLines = this.breakLongLine(line);
      formattedLines.push(...brokenLines);
    }

    return formattedLines.join('\n');
  }

  private breakLongLine(line: string): string[] {
    const maxLength = this.options.maxLineLength;
    const indent = line.match(/^\s*/)?.[0] || '';
    const content = line.trim();

    if (content.length <= maxLength - indent.length) {
      return [line];
    }

    // Try to break at operators or commas
    const breakPoints = [',', '&&', '||', '+', '-', '*', '/', '==', '!='];

    for (const breakPoint of breakPoints) {
      const index = content.lastIndexOf(breakPoint, maxLength - indent.length);
      if (index > 0) {
        const firstPart =
          indent + content.substring(0, index + breakPoint.length);
        const secondPart =
          indent + '  ' + content.substring(index + breakPoint.length).trim();

        return [firstPart, ...this.breakLongLine(secondPart)];
      }
    }

    // If no good break point found, just break at max length
    const firstPart = line.substring(0, maxLength);
    const secondPart = indent + '  ' + line.substring(maxLength).trim();

    return [firstPart, ...this.breakLongLine(secondPart)];
  }

  private isOpeningBracket(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.endsWith('{') ||
      trimmed.endsWith('(') ||
      (trimmed.includes('if') && trimmed.endsWith(')')) ||
      (trimmed.includes('for') && trimmed.endsWith(')')) ||
      (trimmed.includes('while') && trimmed.endsWith(')'))
    );
  }

  private isClosingBracket(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('}') ||
      trimmed.startsWith(')') ||
      trimmed === '}' ||
      trimmed === ')'
    );
  }

  private isStatement(line: string): boolean {
    // Simple heuristic to determine if a line is a statement
    const keywords = ['var', 'let', 'const', 'return', 'break', 'continue'];
    const hasKeyword = keywords.some(keyword => line.includes(keyword));
    const hasAssignment =
      line.includes('=') && !line.includes('==') && !line.includes('!=');
    const hasFunctionCall = /\w+\s*\(.*\)/.test(line);

    return hasKeyword || hasAssignment || hasFunctionCall;
  }

  /**
   * Update formatting options
   */
  updateOptions(options: Partial<FormattingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current formatting options
   */
  getOptions(): FormattingOptions {
    return { ...this.options };
  }
}

/**
 * Register formatting provider for After Effects expressions
 */
export function registerExpressionFormattingProvider(languageId: string) {
  const formatter = new ExpressionFormatter();

  // Document formatting provider
  monaco.languages.registerDocumentFormattingEditProvider(languageId, {
    provideDocumentFormattingEdits: (model, _options, _token) => {
      const fullRange = model.getFullModelRange();
      return formatter.getFormattingEdits(model, fullRange, _options);
    },
  });

  // Range formatting provider
  monaco.languages.registerDocumentRangeFormattingEditProvider(languageId, {
    provideDocumentRangeFormattingEdits: (model, range, _options, _token) => {
      return formatter.getFormattingEdits(model, range, _options);
    },
  });

  // On-type formatting provider
  monaco.languages.registerOnTypeFormattingEditProvider(languageId, {
    autoFormatTriggerCharacters: [';', '}', ')'],
    provideOnTypeFormattingEdits: (model, position, ch, _options, _token) => {
      // Simple on-type formatting for closing brackets
      if (ch === '}' || ch === ')') {
        const line = model.getLineContent(position.lineNumber);
        const range = new monaco.Range(
          position.lineNumber,
          1,
          position.lineNumber,
          line.length + 1
        );

        return formatter.getFormattingEdits(model, range, _options);
      }

      return [];
    },
  });

  return formatter;
}
