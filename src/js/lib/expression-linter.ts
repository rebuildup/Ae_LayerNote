import * as monaco from 'monaco-editor';

export interface LintingRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  category: 'syntax' | 'performance' | 'deprecated' | 'best-practice';
}

export interface LintingError {
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  ruleId: string;
  source: string;
  suggestions?: string[];
}

export interface LintingOptions {
  rules: Record<string, boolean>;
  maxComplexity: number;
  maxLineLength: number;
  allowDeprecated: boolean;
  strictMode: boolean;
}

export const DEFAULT_LINTING_OPTIONS: LintingOptions = {
  rules: {
    'no-undefined-variables': true,
    'no-deprecated-functions': true,
    'prefer-modern-syntax': true,
    'no-infinite-loops': true,
    'max-complexity': true,
    'no-unused-variables': true,
    'prefer-const': true,
    'no-magic-numbers': false,
    'consistent-naming': true,
    'performance-warnings': true,
  },
  maxComplexity: 10,
  maxLineLength: 120,
  allowDeprecated: false,
  strictMode: false,
};

// After Effects deprecated functions and their modern alternatives
const DEPRECATED_FUNCTIONS: Record<
  string,
  { replacement: string; reason: string }
> = {
  'Math.round': {
    replacement: 'Math.round',
    reason:
      "Use native Math.round instead of AE's version for better performance",
  },
  random: {
    replacement: 'Math.random',
    reason: 'Use Math.random() for better randomization',
  },
  seedRandom: {
    replacement: 'Math.seedrandom',
    reason: 'Use Math.seedrandom() for seeded random generation',
  },
  comp: {
    replacement: 'thisComp',
    reason: 'Use thisComp for better readability and consistency',
  },
  layer: {
    replacement: 'thisLayer',
    reason: 'Use thisLayer for better readability and consistency',
  },
  effect: {
    replacement: 'thisLayer.effect',
    reason: 'Use full path for better clarity',
  },
};

// Common After Effects functions and properties for validation
const AE_GLOBAL_FUNCTIONS = [
  'linear',
  'ease',
  'easeIn',
  'easeOut',
  'easeInOut',
  'clamp',
  'normalize',
  'smoothstep',
  'posterizeTime',
  'valueAtTime',
  'velocityAtTime',
  'speedAtTime',
  'timeToFrames',
  'framesToTime',
  'timeToTimecode',
  'timecodeToTime',
  'rgbToHsl',
  'hslToRgb',
  'hexToRgb',
  'rgbToHex',
  'degreesToRadians',
  'radiansToDegrees',
  'length',
  'lookAt',
  'cross',
  'dot',
  'normalize',
  'createPath',
  'points',
  'inTangents',
  'outTangents',
  'isClosed',
  'wiggle',
  'loopIn',
  'loopOut',
  'loopInDuration',
  'loopOutDuration',
  'key',
  'nearestKey',
  'numKeys',
  'timeToNearestKey',
  'Math',
  'String',
  'Number',
  'Array',
  'Object',
  'Date',
  'thisComp',
  'thisLayer',
  'thisProperty',
  'time',
  'colorDepth',
  'downsampleFactor',
  'posterizeTime',
  'value',
  'index',
  'hasParent',
];

const AE_LAYER_PROPERTIES = [
  'anchorPoint',
  'position',
  'scale',
  'rotation',
  'opacity',
  'transform',
  'effects',
  'layerStyles',
  'geometryOptions',
  'materialOptions',
  'audio',
  'marker',
  'time',
  'startTime',
  'outPoint',
  'inPoint',
  'stretch',
  'blendingMode',
  'threeDLayer',
  'shy',
  'solo',
  'locked',
  'hasVideo',
  'hasAudio',
  'active',
  'enabled',
  'selected',
  'motionBlur',
  'frameBlending',
  'quality',
  'samplingQuality',
  'width',
  'height',
  'index',
  'parent',
  'hasParent',
  'inPoint',
  'outPoint',
  'startTime',
  'stretch',
  'timeRemapEnabled',
  'source',
  'mask',
  'effect',
  'layerStyle',
  'content',
];

/**
 * After Effects Expression Linter
 * Provides linting capabilities for AE expressions
 */
export class ExpressionLinter {
  private options: LintingOptions;
  private rules: LintingRule[];

  constructor(options: Partial<LintingOptions> = {}) {
    this.options = { ...DEFAULT_LINTING_OPTIONS, ...options };
    this.rules = this.initializeRules();
  }

  private initializeRules(): LintingRule[] {
    return [
      {
        id: 'no-undefined-variables',
        name: 'No Undefined Variables',
        description: 'Detect usage of undefined variables',
        severity: 'error',
        enabled: this.options.rules['no-undefined-variables'],
        category: 'syntax',
      },
      {
        id: 'no-deprecated-functions',
        name: 'No Deprecated Functions',
        description: 'Warn about deprecated After Effects functions',
        severity: 'warning',
        enabled: this.options.rules['no-deprecated-functions'],
        category: 'deprecated',
      },
      {
        id: 'prefer-modern-syntax',
        name: 'Prefer Modern Syntax',
        description: 'Suggest modern JavaScript syntax',
        severity: 'info',
        enabled: this.options.rules['prefer-modern-syntax'],
        category: 'best-practice',
      },
      {
        id: 'no-infinite-loops',
        name: 'No Infinite Loops',
        description: 'Detect potential infinite loops',
        severity: 'error',
        enabled: this.options.rules['no-infinite-loops'],
        category: 'performance',
      },
      {
        id: 'max-complexity',
        name: 'Maximum Complexity',
        description: 'Limit cyclomatic complexity',
        severity: 'warning',
        enabled: this.options.rules['max-complexity'],
        category: 'performance',
      },
      {
        id: 'no-unused-variables',
        name: 'No Unused Variables',
        description: 'Detect unused variable declarations',
        severity: 'warning',
        enabled: this.options.rules['no-unused-variables'],
        category: 'best-practice',
      },
      {
        id: 'prefer-const',
        name: 'Prefer Const',
        description: 'Prefer const over var for constants',
        severity: 'info',
        enabled: this.options.rules['prefer-const'],
        category: 'best-practice',
      },
      {
        id: 'no-magic-numbers',
        name: 'No Magic Numbers',
        description: 'Avoid magic numbers in expressions',
        severity: 'info',
        enabled: this.options.rules['no-magic-numbers'],
        category: 'best-practice',
      },
      {
        id: 'consistent-naming',
        name: 'Consistent Naming',
        description: 'Use consistent variable naming conventions',
        severity: 'info',
        enabled: this.options.rules['consistent-naming'],
        category: 'best-practice',
      },
      {
        id: 'performance-warnings',
        name: 'Performance Warnings',
        description: 'Warn about potential performance issues',
        severity: 'warning',
        enabled: this.options.rules['performance-warnings'],
        category: 'performance',
      },
    ];
  }

  /**
   * Lint the given expression code
   */
  lintExpression(code: string): LintingError[] {
    const errors: LintingError[] = [];
    const lines = code.split('\n');

    // Parse the code for analysis
    const tokens = this.tokenize(code);
    const ast = this.parseTokens(tokens);

    // Apply linting rules
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      switch (rule.id) {
        case 'no-undefined-variables':
          errors.push(...this.checkUndefinedVariables(ast, lines));
          break;
        case 'no-deprecated-functions':
          errors.push(...this.checkDeprecatedFunctions(ast, lines));
          break;
        case 'prefer-modern-syntax':
          errors.push(...this.checkModernSyntax(ast, lines));
          break;
        case 'no-infinite-loops':
          errors.push(...this.checkInfiniteLoops(ast, lines));
          break;
        case 'max-complexity':
          errors.push(...this.checkComplexity(ast, lines));
          break;
        case 'no-unused-variables':
          errors.push(...this.checkUnusedVariables(ast, lines));
          break;
        case 'prefer-const':
          errors.push(...this.checkPreferConst(ast, lines));
          break;
        case 'no-magic-numbers':
          errors.push(...this.checkMagicNumbers(ast, lines));
          break;
        case 'consistent-naming':
          errors.push(...this.checkNamingConventions(ast, lines));
          break;
        case 'performance-warnings':
          errors.push(...this.checkPerformanceIssues(ast, lines));
          break;
      }
    }

    return errors;
  }

  private tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      let columnIndex = 0;

      while (columnIndex < line.length) {
        const char = line[columnIndex];

        // Skip whitespace
        if (/\s/.test(char)) {
          columnIndex++;
          continue;
        }

        // Comments
        if (char === '/' && line[columnIndex + 1] === '/') {
          tokens.push({
            type: 'comment',
            value: line.slice(columnIndex),
            line: lineIndex + 1,
            column: columnIndex + 1,
          });
          break;
        }

        // String literals
        if (char === '"' || char === "'") {
          const quote = char;
          let value = char;
          columnIndex++;

          while (columnIndex < line.length && line[columnIndex] !== quote) {
            if (line[columnIndex] === '\\') {
              value += line[columnIndex] + (line[columnIndex + 1] || '');
              columnIndex += 2;
            } else {
              value += line[columnIndex];
              columnIndex++;
            }
          }

          if (columnIndex < line.length) {
            value += line[columnIndex];
            columnIndex++;
          }

          tokens.push({
            type: 'string',
            value,
            line: lineIndex + 1,
            column: columnIndex - value.length + 1,
          });
          continue;
        }

        // Numbers
        if (/\d/.test(char)) {
          let value = '';
          while (columnIndex < line.length && /[\d.]/.test(line[columnIndex])) {
            value += line[columnIndex];
            columnIndex++;
          }

          tokens.push({
            type: 'number',
            value,
            line: lineIndex + 1,
            column: columnIndex - value.length + 1,
          });
          continue;
        }

        // Identifiers and keywords
        if (/[a-zA-Z_$]/.test(char)) {
          let value = '';
          while (
            columnIndex < line.length &&
            /[a-zA-Z0-9_$]/.test(line[columnIndex])
          ) {
            value += line[columnIndex];
            columnIndex++;
          }

          const type = this.getTokenType(value);
          tokens.push({
            type,
            value,
            line: lineIndex + 1,
            column: columnIndex - value.length + 1,
          });
          continue;
        }

        // Operators and punctuation
        const operators = [
          '==',
          '!=',
          '<=',
          '>=',
          '&&',
          '||',
          '++',
          '--',
          '+=',
          '-=',
          '*=',
          '/=',
        ];
        let matched = false;

        for (const op of operators) {
          if (line.slice(columnIndex, columnIndex + op.length) === op) {
            tokens.push({
              type: 'operator',
              value: op,
              line: lineIndex + 1,
              column: columnIndex + 1,
            });
            columnIndex += op.length;
            matched = true;
            break;
          }
        }

        if (!matched) {
          tokens.push({
            type: 'punctuation',
            value: char,
            line: lineIndex + 1,
            column: columnIndex + 1,
          });
          columnIndex++;
        }
      }
    }

    return tokens;
  }

  private getTokenType(value: string): string {
    const keywords = [
      'var',
      'let',
      'const',
      'function',
      'if',
      'else',
      'for',
      'while',
      'do',
      'switch',
      'case',
      'default',
      'break',
      'continue',
      'return',
      'try',
      'catch',
      'finally',
      'throw',
      'new',
      'this',
      'true',
      'false',
      'null',
      'undefined',
    ];

    if (keywords.includes(value)) {
      return 'keyword';
    }

    if (AE_GLOBAL_FUNCTIONS.includes(value)) {
      return 'ae-function';
    }

    if (AE_LAYER_PROPERTIES.includes(value)) {
      return 'ae-property';
    }

    return 'identifier';
  }

  private parseTokens(tokens: Token[]): ASTNode {
    // Simple AST parsing for basic analysis
    return {
      type: 'Program',
      body: [],
      tokens,
    };
  }

  private checkUndefinedVariables(
    ast: ASTNode,
    lines: string[]
  ): LintingError[] {
    const errors: LintingError[] = [];
    const definedVariables = new Set<string>();
    const usedVariables = new Set<string>();

    // First pass: collect variable declarations
    for (const token of ast.tokens) {
      if (
        token.type === 'keyword' &&
        ['var', 'let', 'const'].includes(token.value)
      ) {
        // Look for the next identifier
        const nextToken = ast.tokens.find(
          t =>
            t.line === token.line &&
            t.column > token.column &&
            t.type === 'identifier'
        );
        if (nextToken) {
          definedVariables.add(nextToken.value);
        }
      }
    }

    // Add built-in AE variables
    const builtInVariables = [
      'time',
      'value',
      'index',
      'thisComp',
      'thisLayer',
      'thisProperty',
    ];
    builtInVariables.forEach(v => definedVariables.add(v));

    // Second pass: check for undefined variables
    for (const token of ast.tokens) {
      if (
        token.type === 'identifier' &&
        !definedVariables.has(token.value) &&
        !AE_GLOBAL_FUNCTIONS.includes(token.value)
      ) {
        usedVariables.add(token.value);

        errors.push({
          line: token.line,
          column: token.column,
          endLine: token.line,
          endColumn: token.column + token.value.length,
          message: `'${token.value}' is not defined`,
          severity: 'error',
          ruleId: 'no-undefined-variables',
          source: lines[token.line - 1],
          suggestions: this.getSimilarVariables(token.value, definedVariables),
        });
      }
    }

    return errors;
  }

  private checkDeprecatedFunctions(
    ast: ASTNode,
    lines: string[]
  ): LintingError[] {
    const errors: LintingError[] = [];

    for (const token of ast.tokens) {
      if (token.type === 'identifier' && DEPRECATED_FUNCTIONS[token.value]) {
        const deprecated = DEPRECATED_FUNCTIONS[token.value];

        errors.push({
          line: token.line,
          column: token.column,
          endLine: token.line,
          endColumn: token.column + token.value.length,
          message: `'${token.value}' is deprecated. ${deprecated.reason}`,
          severity: 'warning',
          ruleId: 'no-deprecated-functions',
          source: lines[token.line - 1],
          suggestions: [deprecated.replacement],
        });
      }
    }

    return errors;
  }

  private checkModernSyntax(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];

    for (let i = 0; i < ast.tokens.length - 1; i++) {
      const token = ast.tokens[i];
      const nextToken = ast.tokens[i + 1];

      // Check for var usage
      if (token.type === 'keyword' && token.value === 'var') {
        errors.push({
          line: token.line,
          column: token.column,
          endLine: token.line,
          endColumn: token.column + token.value.length,
          message: "Consider using 'let' or 'const' instead of 'var'",
          severity: 'info',
          ruleId: 'prefer-modern-syntax',
          source: lines[token.line - 1],
          suggestions: ['let', 'const'],
        });
      }

      // Check for function expressions vs arrow functions
      if (
        token.type === 'keyword' &&
        token.value === 'function' &&
        nextToken?.type === 'punctuation' &&
        nextToken.value === '('
      ) {
        errors.push({
          line: token.line,
          column: token.column,
          endLine: token.line,
          endColumn: token.column + token.value.length,
          message: 'Consider using arrow function syntax',
          severity: 'info',
          ruleId: 'prefer-modern-syntax',
          source: lines[token.line - 1],
          suggestions: ['() => {}'],
        });
      }
    }

    return errors;
  }

  private checkInfiniteLoops(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];

    for (let i = 0; i < ast.tokens.length; i++) {
      const token = ast.tokens[i];

      if (
        token.type === 'keyword' &&
        (token.value === 'while' || token.value === 'for')
      ) {
        // Simple heuristic: check for obvious infinite loops
        const lineContent = lines[token.line - 1];

        if (
          lineContent.includes('while(true)') ||
          lineContent.includes('while (true)')
        ) {
          errors.push({
            line: token.line,
            column: token.column,
            endLine: token.line,
            endColumn: token.column + token.value.length,
            message: 'Potential infinite loop detected',
            severity: 'error',
            ruleId: 'no-infinite-loops',
            source: lines[token.line - 1],
            suggestions: ['Add a break condition', 'Use a counter variable'],
          });
        }
      }
    }

    return errors;
  }

  private checkComplexity(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];
    let complexity = 1; // Base complexity

    for (const token of ast.tokens) {
      if (token.type === 'keyword') {
        switch (token.value) {
          case 'if':
          case 'else':
          case 'while':
          case 'for':
          case 'switch':
          case 'case':
          case 'catch':
            complexity++;
            break;
        }
      } else if (token.type === 'operator') {
        if (token.value === '&&' || token.value === '||') {
          complexity++;
        }
      }
    }

    if (complexity > this.options.maxComplexity) {
      errors.push({
        line: 1,
        column: 1,
        endLine: lines.length,
        endColumn: lines[lines.length - 1]?.length || 1,
        message: `Expression complexity (${complexity}) exceeds maximum allowed (${this.options.maxComplexity})`,
        severity: 'warning',
        ruleId: 'max-complexity',
        source: 'entire expression',
        suggestions: [
          'Break down into smaller functions',
          'Simplify conditional logic',
        ],
      });
    }

    return errors;
  }

  private checkUnusedVariables(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];
    const declaredVariables = new Map<string, Token>();
    const usedVariables = new Set<string>();

    // Collect variable declarations
    for (let i = 0; i < ast.tokens.length - 1; i++) {
      const token = ast.tokens[i];
      const nextToken = ast.tokens[i + 1];

      if (
        token.type === 'keyword' &&
        ['var', 'let', 'const'].includes(token.value) &&
        nextToken?.type === 'identifier'
      ) {
        declaredVariables.set(nextToken.value, nextToken);
      }
    }

    // Collect variable usage
    for (const token of ast.tokens) {
      if (token.type === 'identifier' && declaredVariables.has(token.value)) {
        usedVariables.add(token.value);
      }
    }

    // Check for unused variables
    for (const [varName, token] of declaredVariables) {
      if (!usedVariables.has(varName)) {
        errors.push({
          line: token.line,
          column: token.column,
          endLine: token.line,
          endColumn: token.column + token.value.length,
          message: `'${varName}' is declared but never used`,
          severity: 'warning',
          ruleId: 'no-unused-variables',
          source: lines[token.line - 1],
          suggestions: [`Remove '${varName}' declaration`],
        });
      }
    }

    return errors;
  }

  private checkPreferConst(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];
    const variableAssignments = new Map<string, number>();

    // Track variable assignments
    for (let i = 0; i < ast.tokens.length - 2; i++) {
      const token = ast.tokens[i];
      const nextToken = ast.tokens[i + 1];
      const afterToken = ast.tokens[i + 2];

      if (
        token.type === 'identifier' &&
        nextToken?.type === 'operator' &&
        nextToken.value === '=' &&
        afterToken
      ) {
        const count = variableAssignments.get(token.value) || 0;
        variableAssignments.set(token.value, count + 1);
      }
    }

    // Check for var declarations that could be const
    for (let i = 0; i < ast.tokens.length - 1; i++) {
      const token = ast.tokens[i];
      const nextToken = ast.tokens[i + 1];

      if (
        token.type === 'keyword' &&
        token.value === 'var' &&
        nextToken?.type === 'identifier'
      ) {
        const assignments = variableAssignments.get(nextToken.value) || 0;

        if (assignments <= 1) {
          errors.push({
            line: token.line,
            column: token.column,
            endLine: token.line,
            endColumn: token.column + token.value.length,
            message: `'${nextToken.value}' is never reassigned. Use 'const' instead of 'var'`,
            severity: 'info',
            ruleId: 'prefer-const',
            source: lines[token.line - 1],
            suggestions: ['const'],
          });
        }
      }
    }

    return errors;
  }

  private checkMagicNumbers(ast: ASTNode, lines: string[]): LintingError[] {
    const errors: LintingError[] = [];
    const allowedNumbers = new Set([
      '0',
      '1',
      '-1',
      '2',
      '10',
      '100',
      '360',
      '180',
      '90',
    ]);

    for (const token of ast.tokens) {
      if (token.type === 'number' && !allowedNumbers.has(token.value)) {
        const num = parseFloat(token.value);
        if (!isNaN(num) && Math.abs(num) > 1) {
          errors.push({
            line: token.line,
            column: token.column,
            endLine: token.line,
            endColumn: token.column + token.value.length,
            message: `Magic number '${token.value}' should be replaced with a named constant`,
            severity: 'info',
            ruleId: 'no-magic-numbers',
            source: lines[token.line - 1],
            suggestions: [`const CONSTANT_NAME = ${token.value}`],
          });
        }
      }
    }

    return errors;
  }

  private checkNamingConventions(
    ast: ASTNode,
    lines: string[]
  ): LintingError[] {
    const errors: LintingError[] = [];

    for (const token of ast.tokens) {
      if (token.type === 'identifier') {
        // Check camelCase convention
        if (
          !/^[a-z][a-zA-Z0-9]*$/.test(token.value) &&
          !AE_GLOBAL_FUNCTIONS.includes(token.value) &&
          !AE_LAYER_PROPERTIES.includes(token.value)
        ) {
          errors.push({
            line: token.line,
            column: token.column,
            endLine: token.line,
            endColumn: token.column + token.value.length,
            message: `'${token.value}' should use camelCase naming convention`,
            severity: 'info',
            ruleId: 'consistent-naming',
            source: lines[token.line - 1],
            suggestions: [this.toCamelCase(token.value)],
          });
        }
      }
    }

    return errors;
  }

  private checkPerformanceIssues(
    ast: ASTNode,
    lines: string[]
  ): LintingError[] {
    const errors: LintingError[] = [];

    // Check for expensive operations in loops
    let inLoop = false;
    let loopDepth = 0;

    for (const token of ast.tokens) {
      if (
        token.type === 'keyword' &&
        (token.value === 'for' || token.value === 'while')
      ) {
        inLoop = true;
        loopDepth++;
      } else if (token.type === 'punctuation' && token.value === '}') {
        if (loopDepth > 0) {
          loopDepth--;
          if (loopDepth === 0) {
            inLoop = false;
          }
        }
      }

      if (inLoop && token.type === 'ae-function') {
        const expensiveFunctions = ['wiggle', 'random', 'noise', 'valueAtTime'];
        if (expensiveFunctions.includes(token.value)) {
          errors.push({
            line: token.line,
            column: token.column,
            endLine: token.line,
            endColumn: token.column + token.value.length,
            message: `'${token.value}' inside a loop may cause performance issues`,
            severity: 'warning',
            ruleId: 'performance-warnings',
            source: lines[token.line - 1],
            suggestions: [
              'Move expensive operations outside the loop',
              'Cache the result',
            ],
          });
        }
      }
    }

    return errors;
  }

  private getSimilarVariables(
    target: string,
    variables: Set<string>
  ): string[] {
    const suggestions: string[] = [];
    const targetLower = target.toLowerCase();

    for (const variable of variables) {
      const variableLower = variable.toLowerCase();

      // Simple similarity check
      if (
        variableLower.includes(targetLower) ||
        targetLower.includes(variableLower)
      ) {
        suggestions.push(variable);
      } else if (this.levenshteinDistance(targetLower, variableLower) <= 2) {
        suggestions.push(variable);
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }

  /**
   * Update linting options
   */
  updateOptions(options: Partial<LintingOptions>): void {
    this.options = { ...this.options, ...options };
    this.rules = this.initializeRules();
  }

  /**
   * Get current linting options
   */
  getOptions(): LintingOptions {
    return { ...this.options };
  }

  /**
   * Get available linting rules
   */
  getRules(): LintingRule[] {
    return [...this.rules];
  }

  /**
   * Enable or disable a specific rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.options.rules[ruleId] = enabled;
    }
  }
}

// Token and AST interfaces
interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

interface ASTNode {
  type: string;
  body: any[];
  tokens: Token[];
}

/**
 * Register linting provider for After Effects expressions
 */
export function registerExpressionLintingProvider(languageId: string) {
  const linter = new ExpressionLinter();

  // Create diagnostic collection
  monaco.editor.createModel('', languageId);

  // Register code action provider for quick fixes
  monaco.languages.registerCodeActionProvider(languageId, {
    provideCodeActions: (model, range, context, _token) => {
      const actions: monaco.languages.CodeAction[] = [];

      for (const marker of context.markers) {
        if (marker.source === 'ae-expression-linter') {
          // Add quick fix actions based on the error
          const error = marker as any;
          if (error.suggestions) {
            for (const suggestion of error.suggestions) {
              actions.push({
                title: `Replace with '${suggestion}'`,
                kind: 'quickfix',
                edit: {
                  edits: [
                    {
                      resource: model.uri,
                      edit: {
                        range: marker,
                        text: suggestion,
                      },
                    },
                  ],
                },
                isPreferred: true,
              } as any);
            }
          }
        }
      }

      return {
        actions,
        dispose: () => {},
      };
    },
  });

  return linter;
}
