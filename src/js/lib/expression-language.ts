import * as monaco from 'monaco-editor';
import {
  AfterEffectsFunction,
  AfterEffectsProperty,
  CompletionItem,
} from '../types/expression';

// After Effects expression language configuration
export const AE_EXPRESSION_LANGUAGE_ID = 'ae-expression';

// After Effects built-in functions
export const AE_FUNCTIONS: AfterEffectsFunction[] = [
  {
    name: 'time',
    description: 'Current time in seconds',
    syntax: 'time',
    parameters: [],
    returnType: 'number',
    category: 'Time',
    examples: ['time * 360', 'Math.sin(time * 2)'],
  },
  {
    name: 'thisComp',
    description: 'Reference to the current composition',
    syntax: 'thisComp',
    parameters: [],
    returnType: 'Comp',
    category: 'Composition',
    examples: ['thisComp.width', 'thisComp.duration'],
  },
  {
    name: 'thisLayer',
    description: 'Reference to the current layer',
    syntax: 'thisLayer',
    parameters: [],
    returnType: 'Layer',
    category: 'Layer',
    examples: ['thisLayer.width', 'thisLayer.index'],
  },
  {
    name: 'value',
    description: 'Current value of the property',
    syntax: 'value',
    parameters: [],
    returnType: 'any',
    category: 'Property',
    examples: ['value + 10', 'value * 2'],
  },
  {
    name: 'linear',
    description: 'Linear interpolation between two values',
    syntax: 'linear(t, tMin, tMax, value1, value2)',
    parameters: [
      { name: 't', type: 'number', description: 'Input value' },
      { name: 'tMin', type: 'number', description: 'Minimum input value' },
      { name: 'tMax', type: 'number', description: 'Maximum input value' },
      {
        name: 'value1',
        type: 'any',
        description: 'Output value when t = tMin',
      },
      {
        name: 'value2',
        type: 'any',
        description: 'Output value when t = tMax',
      },
    ],
    returnType: 'any',
    category: 'Interpolation',
    examples: ['linear(time, 0, 1, 0, 100)'],
  },
  {
    name: 'ease',
    description: 'Smooth interpolation with easing',
    syntax: 'ease(t, tMin, tMax, value1, value2)',
    parameters: [
      { name: 't', type: 'number', description: 'Input value' },
      { name: 'tMin', type: 'number', description: 'Minimum input value' },
      { name: 'tMax', type: 'number', description: 'Maximum input value' },
      {
        name: 'value1',
        type: 'any',
        description: 'Output value when t = tMin',
      },
      {
        name: 'value2',
        type: 'any',
        description: 'Output value when t = tMax',
      },
    ],
    returnType: 'any',
    category: 'Interpolation',
    examples: ['ease(time, 0, 1, [0,0], [100,100])'],
  },
  {
    name: 'easeIn',
    description: 'Ease in interpolation',
    syntax: 'easeIn(t, tMin, tMax, value1, value2)',
    parameters: [
      { name: 't', type: 'number', description: 'Input value' },
      { name: 'tMin', type: 'number', description: 'Minimum input value' },
      { name: 'tMax', type: 'number', description: 'Maximum input value' },
      {
        name: 'value1',
        type: 'any',
        description: 'Output value when t = tMin',
      },
      {
        name: 'value2',
        type: 'any',
        description: 'Output value when t = tMax',
      },
    ],
    returnType: 'any',
    category: 'Interpolation',
  },
  {
    name: 'easeOut',
    description: 'Ease out interpolation',
    syntax: 'easeOut(t, tMin, tMax, value1, value2)',
    parameters: [
      { name: 't', type: 'number', description: 'Input value' },
      { name: 'tMin', type: 'number', description: 'Minimum input value' },
      { name: 'tMax', type: 'number', description: 'Maximum input value' },
      {
        name: 'value1',
        type: 'any',
        description: 'Output value when t = tMin',
      },
      {
        name: 'value2',
        type: 'any',
        description: 'Output value when t = tMax',
      },
    ],
    returnType: 'any',
    category: 'Interpolation',
  },
  {
    name: 'wiggle',
    description: 'Random wiggle animation',
    syntax: 'wiggle(freq, amp, octaves, amp_mult, t)',
    parameters: [
      { name: 'freq', type: 'number', description: 'Frequency of wiggle' },
      { name: 'amp', type: 'number', description: 'Amplitude of wiggle' },
      {
        name: 'octaves',
        type: 'number',
        description: 'Number of octaves',
        optional: true,
        defaultValue: 1,
      },
      {
        name: 'amp_mult',
        type: 'number',
        description: 'Amplitude multiplier',
        optional: true,
        defaultValue: 0.5,
      },
      { name: 't', type: 'number', description: 'Time value', optional: true },
    ],
    returnType: 'number | array',
    category: 'Random',
    examples: ['wiggle(2, 50)', 'wiggle(1, 10, 2, 0.5)'],
  },
  {
    name: 'random',
    description: 'Random value (deprecated, use seedRandom)',
    syntax: 'random(maxValOrArray)',
    parameters: [
      {
        name: 'maxValOrArray',
        type: 'number | array',
        description: 'Maximum value or array',
        optional: true,
      },
    ],
    returnType: 'number',
    category: 'Random',
    deprecated: true,
    alternativeTo: 'seedRandom',
  },
  {
    name: 'seedRandom',
    description: 'Seeded random value',
    syntax: 'seedRandom(seed, timeless)',
    parameters: [
      { name: 'seed', type: 'number', description: 'Random seed' },
      {
        name: 'timeless',
        type: 'boolean',
        description: 'Whether to ignore time',
        optional: true,
        defaultValue: false,
      },
    ],
    returnType: 'number',
    category: 'Random',
    examples: ['seedRandom(1, true) * 100'],
  },
  {
    name: 'Math.sin',
    description: 'Sine function',
    syntax: 'Math.sin(x)',
    parameters: [
      { name: 'x', type: 'number', description: 'Angle in radians' },
    ],
    returnType: 'number',
    category: 'Math',
    examples: ['Math.sin(time)', 'Math.sin(time * Math.PI * 2)'],
  },
  {
    name: 'Math.cos',
    description: 'Cosine function',
    syntax: 'Math.cos(x)',
    parameters: [
      { name: 'x', type: 'number', description: 'Angle in radians' },
    ],
    returnType: 'number',
    category: 'Math',
  },
  {
    name: 'Math.PI',
    description: 'Pi constant (3.14159...)',
    syntax: 'Math.PI',
    parameters: [],
    returnType: 'number',
    category: 'Math',
  },
  {
    name: 'loopOut',
    description: 'Loop keyframes after the last keyframe',
    syntax: 'loopOut(type, numKeyframes)',
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: "Loop type: 'cycle', 'pingpong', 'offset', 'continue'",
        optional: true,
        defaultValue: 'cycle',
      },
      {
        name: 'numKeyframes',
        type: 'number',
        description: 'Number of keyframes to loop',
        optional: true,
      },
    ],
    returnType: 'any',
    category: 'Keyframes',
    examples: ['loopOut()', "loopOut('pingpong', 3)"],
  },
  {
    name: 'loopIn',
    description: 'Loop keyframes before the first keyframe',
    syntax: 'loopIn(type, numKeyframes)',
    parameters: [
      {
        name: 'type',
        type: 'string',
        description: "Loop type: 'cycle', 'pingpong', 'offset', 'continue'",
        optional: true,
        defaultValue: 'cycle',
      },
      {
        name: 'numKeyframes',
        type: 'number',
        description: 'Number of keyframes to loop',
        optional: true,
      },
    ],
    returnType: 'any',
    category: 'Keyframes',
  },
];

// After Effects built-in properties
export const AE_PROPERTIES: AfterEffectsProperty[] = [
  {
    name: 'width',
    description: 'Width of the composition or layer',
    type: 'number',
    category: 'Dimensions',
    readOnly: true,
    examples: ['thisComp.width', 'thisLayer.width'],
  },
  {
    name: 'height',
    description: 'Height of the composition or layer',
    type: 'number',
    category: 'Dimensions',
    readOnly: true,
  },
  {
    name: 'duration',
    description: 'Duration of the composition or layer',
    type: 'number',
    category: 'Time',
    readOnly: true,
  },
  {
    name: 'frameDuration',
    description: 'Duration of one frame',
    type: 'number',
    category: 'Time',
    readOnly: true,
  },
  {
    name: 'index',
    description: 'Layer index number',
    type: 'number',
    category: 'Layer',
    readOnly: true,
  },
  {
    name: 'name',
    description: 'Layer or composition name',
    type: 'string',
    category: 'Layer',
    readOnly: true,
  },
];

// Keywords and operators
export const AE_KEYWORDS = [
  'if',
  'else',
  'for',
  'while',
  'do',
  'break',
  'continue',
  'function',
  'return',
  'var',
  'let',
  'const',
  'true',
  'false',
  'null',
  'undefined',
  'typeof',
  'new',
  'this',
  'try',
  'catch',
  'finally',
  'throw',
];

export const AE_OPERATORS = [
  '+',
  '-',
  '*',
  '/',
  '%',
  '++',
  '--',
  '=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '==',
  '!=',
  '===',
  '!==',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '!',
  '&',
  '|',
  '^',
  '~',
  '<<',
  '>>',
  '>>>',
];

// Register the After Effects expression language
export function registerAEExpressionLanguage() {
  // Register the language
  monaco.languages.register({ id: AE_EXPRESSION_LANGUAGE_ID });

  // Set language configuration
  monaco.languages.setLanguageConfiguration(AE_EXPRESSION_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });

  // Set tokenization rules
  monaco.languages.setMonarchTokensProvider(AE_EXPRESSION_LANGUAGE_ID, {
    tokenizer: {
      root: [
        // Comments
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],

        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, 'string', '@string_single'],

        // Numbers
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],

        // Keywords
        [
          /\b(if|else|for|while|do|break|continue|function|return|var|let|const|true|false|null|undefined|typeof|new|this|try|catch|finally|throw)\b/,
          'keyword',
        ],

        // After Effects specific
        [
          /\b(time|thisComp|thisLayer|value|linear|ease|easeIn|easeOut|wiggle|random|seedRandom|loopOut|loopIn)\b/,
          'keyword.ae',
        ],

        // Math functions
        [
          /\bMath\.(sin|cos|tan|asin|acos|atan|atan2|exp|log|pow|sqrt|abs|ceil|floor|round|min|max|PI|E)\b/,
          'keyword.math',
        ],

        // Identifiers
        [/[a-zA-Z_$][\w$]*/, 'identifier'],

        // Operators
        [/[+\-*/%=<>!&|^~]/, 'operator'],

        // Delimiters
        [/[{}()\[\]]/, 'delimiter'],
        [/[;,.]/, 'delimiter'],
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment'],
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  });

  // Set completion provider
  monaco.languages.registerCompletionItemProvider(AE_EXPRESSION_LANGUAGE_ID, {
    provideCompletionItems: (model, position) => {
      const suggestions: monaco.languages.CompletionItem[] = [];
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      // Add function completions
      AE_FUNCTIONS.forEach(func => {
        const insertText =
          func.parameters.length > 0
            ? `${func.name}(${func.parameters.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ')})`
            : `${func.name}()`;

        suggestions.push({
          label: func.name,
          kind: monaco.languages.CompletionItemKind.Function,
          detail: func.syntax,
          documentation: {
            value: `**${func.name}**\n\n${func.description}\n\n**Category:** ${func.category}\n\n**Returns:** ${func.returnType}${func.deprecated ? '\n\n⚠️ **Deprecated** - Use ' + func.alternativeTo + ' instead' : ''}`,
          },
          insertText: insertText,
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          sortText: func.deprecated ? 'z' + func.name : 'a' + func.name,
          range: range,
        });
      });

      // Add property completions
      AE_PROPERTIES.forEach(prop => {
        suggestions.push({
          label: prop.name,
          kind: monaco.languages.CompletionItemKind.Property,
          detail: prop.type,
          documentation: {
            value: `**${prop.name}**\n\n${prop.description}\n\n**Type:** ${prop.type}\n\n**Category:** ${prop.category}${prop.readOnly ? '\n\n🔒 **Read-only**' : ''}`,
          },
          insertText: prop.name,
          sortText: 'b' + prop.name,
          range: range,
        });
      });

      // Add keyword completions
      AE_KEYWORDS.forEach(keyword => {
        suggestions.push({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          sortText: 'c' + keyword,
          range: range,
        });
      });

      return { suggestions };
    },
  });

  // Set hover provider
  monaco.languages.registerHoverProvider(AE_EXPRESSION_LANGUAGE_ID, {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const wordText = word.word;

      // Check functions
      const func = AE_FUNCTIONS.find(f => f.name === wordText);
      if (func) {
        const paramsList = func.parameters
          .map(p => `${p.name}: ${p.type}${p.optional ? ' (optional)' : ''}`)
          .join('\n');

        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${func.name}**` },
            { value: func.description },
            { value: `**Syntax:** \`${func.syntax}\`` },
            { value: `**Parameters:**\n${paramsList || 'None'}` },
            { value: `**Returns:** ${func.returnType}` },
            { value: `**Category:** ${func.category}` },
            ...(func.examples
              ? [
                  {
                    value: `**Examples:**\n\`\`\`javascript\n${func.examples.join('\n')}\n\`\`\``,
                  },
                ]
              : []),
            ...(func.deprecated
              ? [
                  {
                    value: `⚠️ **Deprecated** - Use ${func.alternativeTo} instead`,
                  },
                ]
              : []),
          ],
        };
      }

      // Check properties
      const prop = AE_PROPERTIES.find(p => p.name === wordText);
      if (prop) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**${prop.name}**` },
            { value: prop.description },
            { value: `**Type:** ${prop.type}` },
            { value: `**Category:** ${prop.category}` },
            ...(prop.readOnly ? [{ value: '🔒 **Read-only**' }] : []),
            ...(prop.examples
              ? [
                  {
                    value: `**Examples:**\n\`\`\`javascript\n${prop.examples.join('\n')}\n\`\`\``,
                  },
                ]
              : []),
          ],
        };
      }

      return null;
    },
  });

  // Set signature help provider
  monaco.languages.registerSignatureHelpProvider(AE_EXPRESSION_LANGUAGE_ID, {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp: (model, position) => {
      // Find the function call
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const match = textUntilPosition.match(/(\w+)\s*\([^)]*$/);
      if (!match) return null;

      const functionName = match[1];
      const func = AE_FUNCTIONS.find(f => f.name === functionName);
      if (!func) return null;

      const signature: monaco.languages.SignatureInformation = {
        label: func.syntax,
        documentation: func.description,
        parameters: func.parameters.map(param => ({
          label: param.name,
          documentation: `${param.description}${param.optional ? ' (optional)' : ''}`,
        })),
      };

      // Calculate active parameter
      const openParenIndex = textUntilPosition.lastIndexOf('(');
      const textAfterParen = textUntilPosition.substring(openParenIndex + 1);
      const commaCount = (textAfterParen.match(/,/g) || []).length;

      return {
        value: {
          signatures: [signature],
          activeSignature: 0,
          activeParameter: Math.min(commaCount, func.parameters.length - 1),
        },
        dispose: () => {},
      };
    },
  });
}

// Create completion items from functions and properties
export function createCompletionItems(): CompletionItem[] {
  const items: CompletionItem[] = [];

  // Add functions
  AE_FUNCTIONS.forEach(func => {
    items.push({
      label: func.name,
      kind: 'function',
      detail: func.syntax,
      documentation: func.description,
      insertText:
        func.parameters.length > 0
          ? `${func.name}(${func.parameters.map(p => p.name).join(', ')})`
          : `${func.name}()`,
      sortText: func.deprecated ? 'z' + func.name : 'a' + func.name,
    });
  });

  // Add properties
  AE_PROPERTIES.forEach(prop => {
    items.push({
      label: prop.name,
      kind: 'property',
      detail: prop.type,
      documentation: prop.description,
      insertText: prop.name,
      sortText: 'b' + prop.name,
    });
  });

  // Add keywords
  AE_KEYWORDS.forEach(keyword => {
    items.push({
      label: keyword,
      kind: 'keyword',
      insertText: keyword,
      sortText: 'c' + keyword,
    });
  });

  return items;
}
