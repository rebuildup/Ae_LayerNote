import { ValidationResult, PropertyInfo } from '../../shared/universals';

export interface ExpressionEditorState {
  propertyPath: string | null;
  expression: string;
  originalExpression: string;
  isDirty: boolean;
  isValidating: boolean;
  validationResult: ValidationResult | null;
  isApplying: boolean;
  lastAppliedExpression: string;
}

export interface PropertySelection {
  layerId: string;
  layerName: string;
  propertyPath: string;
  propertyName: string;
  propertyType: string;
  currentExpression: string;
  hasExpression: boolean;
}

export interface ExpressionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  variables?: ExpressionVariable[];
}

export interface ExpressionVariable {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array';
  defaultValue: any;
  description?: string;
}

export interface ExpressionSnippet {
  prefix: string;
  name: string;
  description: string;
  body: string[];
  scope?: string[];
}

export interface ExpressionHistory {
  id: string;
  propertyPath: string;
  expression: string;
  timestamp: Date;
  description?: string;
}

export interface ExpressionEditorConfig {
  autoValidate: boolean;
  autoApply: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  fontSize: number;
  tabSize: number;
  enableSnippets: boolean;
  enableAutoCompletion: boolean;
  validateOnType: boolean;
  debounceDelay: number;
}

export interface AfterEffectsFunction {
  name: string;
  description: string;
  syntax: string;
  parameters: AfterEffectsParameter[];
  returnType: string;
  category: string;
  examples?: string[];
  deprecated?: boolean;
  alternativeTo?: string;
}

export interface AfterEffectsParameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: any;
}

export interface AfterEffectsProperty {
  name: string;
  description: string;
  type: string;
  category: string;
  readOnly?: boolean;
  examples?: string[];
}

export interface CompletionItem {
  label: string;
  kind: 'function' | 'property' | 'keyword' | 'snippet' | 'variable';
  detail?: string;
  documentation?: string;
  insertText: string;
  sortText?: string;
  filterText?: string;
}

export interface ExpressionError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
  source: string;
}

export interface ExpressionAnalysis {
  functions: string[];
  properties: string[];
  variables: string[];
  complexity: number;
  lineCount: number;
  characterCount: number;
  hasLoops: boolean;
  hasConditionals: boolean;
  estimatedPerformance: 'good' | 'moderate' | 'poor';
}
