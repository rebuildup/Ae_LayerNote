import * as monaco from 'monaco-editor';

export interface SearchOptions {
  query: string;
  isRegex: boolean;
  matchCase: boolean;
  matchWholeWord: boolean;
  includeComments: boolean;
  includeNotes: boolean;
  searchScope: 'current' | 'project' | 'selection';
}

export interface SearchResult {
  id: string;
  layerName: string;
  layerId: string;
  propertyName: string;
  propertyPath: string;
  expression: string;
  matches: SearchMatch[];
  type: 'expression' | 'comment' | 'note';
}

export interface SearchMatch {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  matchText: string;
  contextBefore: string;
  contextAfter: string;
  lineText: string;
}

export interface ReplaceOptions {
  replaceText: string;
  replaceAll: boolean;
  confirmEach: boolean;
  preserveCase: boolean;
}

export interface ReplaceResult {
  searchResultId: string;
  matchIndex: number;
  originalText: string;
  replacedText: string;
  success: boolean;
  error?: string;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  query: '',
  isRegex: false,
  matchCase: false,
  matchWholeWord: false,
  includeComments: true,
  includeNotes: true,
  searchScope: 'current',
};

/**
 * Expression Search and Replace Engine
 * Provides search and replace capabilities for AE expressions
 */
export class ExpressionSearchEngine {
  private searchOptions: SearchOptions;
  private searchResults: SearchResult[];
  private currentResultIndex: number;

  constructor(options: Partial<SearchOptions> = {}) {
    this.searchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...options };
    this.searchResults = [];
    this.currentResultIndex = -1;
  }

  /**
   * Search in current editor content
   */
  searchInEditor(
    content: string,
    options: Partial<SearchOptions> = {}
  ): SearchMatch[] {
    const searchOpts = { ...this.searchOptions, ...options };

    if (!searchOpts.query.trim()) {
      return [];
    }

    const matches: SearchMatch[] = [];
    const lines = content.split('\n');

    try {
      const regex = this.createSearchRegex(searchOpts);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        let match;

        // Reset regex lastIndex for global searches
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          const startColumn = match.index + 1;
          const endColumn = startColumn + match[0].length;

          matches.push({
            startLine: lineIndex + 1,
            startColumn,
            endLine: lineIndex + 1,
            endColumn,
            matchText: match[0],
            contextBefore: line.substring(0, match.index),
            contextAfter: line.substring(match.index + match[0].length),
            lineText: line,
          });

          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }

          // Break if not global search
          if (!regex.global) {
            break;
          }
        }
      }
    } catch (error) {
      console.error('Search regex error:', error);
      return [];
    }

    return matches;
  }

  /**
   * Search across project expressions
   */
  async searchInProject(
    getProjectExpressions: () => Promise<ProjectExpression[]>,
    options: Partial<SearchOptions> = {}
  ): Promise<SearchResult[]> {
    const searchOpts = { ...this.searchOptions, ...options };

    if (!searchOpts.query.trim()) {
      return [];
    }

    try {
      const expressions = await getProjectExpressions();
      const results: SearchResult[] = [];

      for (const expr of expressions) {
        const matches = this.searchInEditor(expr.expression, searchOpts);

        if (matches.length > 0) {
          results.push({
            id: `${expr.layerId}-${expr.propertyPath}`,
            layerName: expr.layerName,
            layerId: expr.layerId,
            propertyName: expr.propertyName,
            propertyPath: expr.propertyPath,
            expression: expr.expression,
            matches,
            type: 'expression',
          });
        }
      }

      this.searchResults = results;
      this.currentResultIndex = results.length > 0 ? 0 : -1;

      return results;
    } catch (error) {
      console.error('Project search error:', error);
      return [];
    }
  }

  /**
   * Replace text in editor content
   */
  replaceInEditor(
    content: string,
    replaceOptions: ReplaceOptions,
    searchOptions: Partial<SearchOptions> = {}
  ): { newContent: string; replacements: number } {
    const searchOpts = { ...this.searchOptions, ...searchOptions };

    if (!searchOpts.query.trim()) {
      return { newContent: content, replacements: 0 };
    }

    try {
      const regex = this.createSearchRegex(searchOpts);
      let replacements = 0;

      const newContent = content.replace(regex, (match, ...args) => {
        replacements++;

        if (replaceOptions.preserveCase && !searchOpts.isRegex) {
          return this.preserveCase(match, replaceOptions.replaceText);
        }

        // Handle regex capture groups
        if (searchOpts.isRegex) {
          let replacement = replaceOptions.replaceText;

          // Replace $1, $2, etc. with capture groups
          for (let i = 1; i < args.length - 2; i++) {
            const captureGroup = args[i - 1];
            if (captureGroup !== undefined) {
              replacement = replacement.replace(
                new RegExp(`\\$${i}`, 'g'),
                captureGroup
              );
            }
          }

          return replacement;
        }

        return replaceOptions.replaceText;
      });

      return { newContent, replacements };
    } catch (error) {
      console.error('Replace error:', error);
      return { newContent: content, replacements: 0 };
    }
  }

  /**
   * Replace in specific search result
   */
  async replaceInResult(
    result: SearchResult,
    matchIndex: number,
    replaceOptions: ReplaceOptions,
    updateExpression: (
      propertyPath: string,
      newExpression: string
    ) => Promise<boolean>
  ): Promise<ReplaceResult> {
    try {
      if (matchIndex < 0 || matchIndex >= result.matches.length) {
        return {
          searchResultId: result.id,
          matchIndex,
          originalText: '',
          replacedText: '',
          success: false,
          error: 'Invalid match index',
        };
      }

      const match = result.matches[matchIndex];
      const lines = result.expression.split('\n');
      const line = lines[match.startLine - 1];

      const beforeMatch = line.substring(0, match.startColumn - 1);
      const afterMatch = line.substring(match.endColumn - 1);

      let replacementText = replaceOptions.replaceText;

      if (replaceOptions.preserveCase && !this.searchOptions.isRegex) {
        replacementText = this.preserveCase(match.matchText, replacementText);
      }

      const newLine = beforeMatch + replacementText + afterMatch;
      lines[match.startLine - 1] = newLine;
      const newExpression = lines.join('\n');

      const success = await updateExpression(
        result.propertyPath,
        newExpression
      );

      return {
        searchResultId: result.id,
        matchIndex,
        originalText: match.matchText,
        replacedText: replacementText,
        success,
        error: success ? undefined : 'Failed to update expression',
      };
    } catch (error) {
      return {
        searchResultId: result.id,
        matchIndex,
        originalText: '',
        replacedText: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Navigate to next search result
   */
  nextResult(): SearchResult | null {
    if (this.searchResults.length === 0) return null;

    this.currentResultIndex =
      (this.currentResultIndex + 1) % this.searchResults.length;
    return this.searchResults[this.currentResultIndex];
  }

  /**
   * Navigate to previous search result
   */
  previousResult(): SearchResult | null {
    if (this.searchResults.length === 0) return null;

    this.currentResultIndex =
      this.currentResultIndex <= 0
        ? this.searchResults.length - 1
        : this.currentResultIndex - 1;
    return this.searchResults[this.currentResultIndex];
  }

  /**
   * Get current search result
   */
  getCurrentResult(): SearchResult | null {
    if (
      this.currentResultIndex < 0 ||
      this.currentResultIndex >= this.searchResults.length
    ) {
      return null;
    }
    return this.searchResults[this.currentResultIndex];
  }

  /**
   * Get all search results
   */
  getResults(): SearchResult[] {
    return [...this.searchResults];
  }

  /**
   * Get search statistics
   */
  getStatistics(): SearchStatistics {
    const totalMatches = this.searchResults.reduce(
      (sum, result) => sum + result.matches.length,
      0
    );

    return {
      totalResults: this.searchResults.length,
      totalMatches,
      currentIndex: this.currentResultIndex,
      query: this.searchOptions.query,
    };
  }

  /**
   * Clear search results
   */
  clearResults(): void {
    this.searchResults = [];
    this.currentResultIndex = -1;
  }

  /**
   * Update search options
   */
  updateOptions(options: Partial<SearchOptions>): void {
    this.searchOptions = { ...this.searchOptions, ...options };
  }

  /**
   * Get current search options
   */
  getOptions(): SearchOptions {
    return { ...this.searchOptions };
  }

  private createSearchRegex(options: SearchOptions): RegExp {
    let pattern = options.query;

    if (!options.isRegex) {
      // Escape special regex characters
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.matchWholeWord && !options.isRegex) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = [
      'g', // global
      !options.matchCase ? 'i' : '', // case insensitive
    ]
      .filter(Boolean)
      .join('');

    return new RegExp(pattern, flags);
  }

  private preserveCase(original: string, replacement: string): string {
    if (original.length === 0) return replacement;

    // All uppercase
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }

    // All lowercase
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }

    // Title case (first letter uppercase)
    if (
      original[0] === original[0].toUpperCase() &&
      original.slice(1) === original.slice(1).toLowerCase()
    ) {
      return (
        replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase()
      );
    }

    // Mixed case - return as is
    return replacement;
  }
}

// Supporting interfaces
export interface ProjectExpression {
  layerId: string;
  layerName: string;
  propertyName: string;
  propertyPath: string;
  expression: string;
  hasExpression: boolean;
}

export interface SearchStatistics {
  totalResults: number;
  totalMatches: number;
  currentIndex: number;
  query: string;
}

/**
 * Configure Monaco Editor search widget
 */
export function configureMonacoSearch(
  editor: monaco.editor.IStandaloneCodeEditor
) {
  // Enable search widget
  editor.updateOptions({
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never',
      seedSearchStringFromSelection: 'selection',
    },
  });

  // Add custom search commands
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
    editor.getAction('actions.find')?.run();
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
    editor.getAction('editor.action.startFindReplaceAction')?.run();
  });

  editor.addCommand(monaco.KeyCode.F3, () => {
    editor.getAction('editor.action.nextMatchFindAction')?.run();
  });

  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F3, () => {
    editor.getAction('editor.action.previousMatchFindAction')?.run();
  });

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG, () => {
    editor.getAction('editor.action.nextMatchFindAction')?.run();
  });

  editor.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyG,
    () => {
      editor.getAction('editor.action.previousMatchFindAction')?.run();
    }
  );
}

/**
 * Highlight search matches in Monaco Editor
 */
export function highlightSearchMatches(
  editor: monaco.editor.IStandaloneCodeEditor,
  matches: SearchMatch[],
  _decorationId: string = 'search-highlights'
): string[] {
  const model = editor.getModel();
  if (!model) return [];

  const decorations: monaco.editor.IModelDeltaDecoration[] = matches.map(
    match => ({
      range: new monaco.Range(
        match.startLine,
        match.startColumn,
        match.endLine,
        match.endColumn
      ),
      options: {
        className: 'search-highlight',
        stickiness:
          monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        minimap: {
          color: '#ffd700',
          position: monaco.editor.MinimapPosition.Inline,
        },
        overviewRuler: {
          color: '#ffd700',
          position: monaco.editor.OverviewRulerLane.Full,
        },
      },
    })
  );

  return editor.deltaDecorations([], decorations);
}

/**
 * Clear search highlights
 */
export function clearSearchHighlights(
  editor: monaco.editor.IStandaloneCodeEditor,
  decorationIds: string[]
): void {
  editor.deltaDecorations(decorationIds, []);
}
