/**
 * @description Declare event types for listening with listenTS() and dispatching with dispatchTS()
 */
export type EventTS = {
  myCustomEvent: {
    oneValue: string;
    anotherValue: number;
  };

  // Layer operations
  getSelectedLayers: {};
  getAllLayers: {};
  getLayerById: { layerId: string };
  getLayerComment: { layerId: string };
  setLayerComment: { layerId: string; comment: string };
  getLayerProperties: { layerId: string };

  // Property operations
  getPropertyInfo: { propertyPath: string };
  getPropertyExpression: { propertyPath: string };
  setPropertyExpression: { propertyPath: string; expression: string };
  validateExpression: { expression: string };
  testExpression: { propertyPath: string; expression: string };

  // Project operations
  getAllExpressions: {};
  searchExpressions: { pattern: string; isRegex: boolean };
  getProjectInfo: {};
  getCompositionInfo: {};
  getExpressionsStats: {};

  // Response events
  layersResponse: LayerInfo[];
  allLayersResponse: LayerInfo[];
  layerByIdResponse: { layerId: string; layer: LayerInfo | null };
  layerCommentResponse: { layerId: string; comment: string };
  layerCommentSetResponse: { layerId: string; success: boolean };
  layerPropertiesResponse: { layerId: string; properties: PropertyInfo[] };
  propertyInfoResponse: { propertyPath: string; info: PropertyInfo | null };
  propertyExpressionResponse: { propertyPath: string; expression: string };
  propertyExpressionSetResponse: { propertyPath: string; success: boolean };
  expressionValidationResponse: ValidationResult;
  expressionTestResponse: ValidationResult;
  allExpressionsResponse: ExpressionInfo[];
  searchExpressionsResponse: SearchResult[];
  projectInfoResponse: ProjectInfo;
  compositionInfoResponse: CompositionInfo | null;
  expressionsStatsResponse: ExpressionsStats;

  // Error events
  bridgeError: CEPError;
};

// Data types
export interface LayerInfo {
  id: string;
  name: string;
  comment: string;
  index: number;
  selected: boolean;
}

export interface PropertyInfo {
  path: string;
  name: string;
  expression: string;
  hasExpression: boolean;
  propertyType: string;
}

export interface ExpressionInfo {
  layerName: string;
  propertyPath: string;
  expression: string;
  lineCount: number;
}

export interface SearchResult {
  layerName: string;
  propertyPath: string;
  matches: {
    line: number;
    column: number;
    text: string;
  }[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ExpressionError[];
  warnings: ExpressionWarning[];
}

export interface ExpressionError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'runtime' | 'reference';
}

export interface ExpressionWarning {
  line: number;
  column: number;
  message: string;
  type: 'deprecated' | 'performance' | 'style';
}

export interface CEPError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ProjectInfo {
  name: string;
  path: string | null;
  numItems: number;
  activeItemName: string | null;
  activeItemType: string;
  saved: boolean;
}

export interface CompositionInfo {
  name: string;
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  workAreaStart: number;
  workAreaDuration: number;
  numLayers: number;
  currentTime: number;
  bgColor: [number, number, number];
}

export interface ExpressionsStats {
  totalExpressions: number;
  totalLines: number;
  layersWithExpressions: number;
  averageLinesPerExpression: number;
  longestExpression: {
    lineCount: number;
    layerName: string;
    propertyPath: string;
    expression: string;
  };
}
