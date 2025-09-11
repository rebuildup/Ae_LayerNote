import type {
  LayerInfo,
  PropertyInfo,
  ExpressionInfo,
  SearchResult,
  ValidationResult,
  ExpressionError,
  ExpressionWarning,
} from '../../shared/universals';

/**
 * After Effects API wrapper functions
 */

/**
 * Get information about currently selected layers
 */
export const getSelectedLayers = (): LayerInfo[] => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return [];
    }

    const selectedLayers: LayerInfo[] = [];

    for (let i = 1; i <= comp.numLayers; i++) {
      const layer = comp.layer(i);
      if (layer.selected) {
        selectedLayers.push({
          id: layer.index.toString(),
          name: layer.name,
          comment: layer.comment || '',
          index: layer.index,
          selected: true,
        });
      }
    }

    return selectedLayers;
  } catch (error) {
    throw new Error(`Failed to get selected layers: ${String(error)}`);
  }
};

/**
 * Get all layers in the current composition
 */
export const getAllLayers = (): LayerInfo[] => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return [];
    }

    const allLayers: LayerInfo[] = [];

    for (let i = 1; i <= comp.numLayers; i++) {
      const layer = comp.layer(i);
      let layerType = 'unknown';
      try {
        if (layer instanceof TextLayer) layerType = 'text';
        else if (layer instanceof ShapeLayer) layerType = 'shape';
        else if (layer instanceof CameraLayer) layerType = 'camera';
        else if (layer instanceof LightLayer) layerType = 'light';
        else if ((layer as any).nullLayer) layerType = 'null';
        else if ((layer as any).hasVideo && (layer as any).source?.mainSource)
          layerType = 'footage';
        else if ((layer as any).adjustmentLayer) layerType = 'adjustment';
        else layerType = 'av';
      } catch (e) {}
      allLayers.push({
        id: layer.index.toString(),
        name: layer.name,
        comment: layer.comment || '',
        index: layer.index,
        selected: layer.selected,
        layerType,
        locked: (layer as any).locked === true,
      });
    }

    return allLayers;
  } catch (error) {
    throw new Error(`Failed to get all layers: ${String(error)}`);
  }
};

/**
 * Get layer information by ID
 */
export const getLayerById = (layerId: string): LayerInfo | null => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return null;
    }

    const layerIndex = parseInt(layerId);
    if (isNaN(layerIndex) || layerIndex < 1 || layerIndex > comp.numLayers) {
      return null;
    }

    const layer = comp.layer(layerIndex);
    return {
      id: layer.index.toString(),
      name: layer.name,
      comment: layer.comment || '',
      index: layer.index,
      selected: layer.selected,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Get comment for a specific layer
 */
export const getLayerComment = (layerId: string): string => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error('No active composition');
    }

    const layerIndex = parseInt(layerId);
    if (isNaN(layerIndex) || layerIndex < 1 || layerIndex > comp.numLayers) {
      throw new Error(`Invalid layer ID: ${layerId}`);
    }

    const layer = comp.layer(layerIndex);
    return layer.comment || '';
  } catch (error) {
    throw new Error(`Failed to get layer comment: ${String(error)}`);
  }
};

/**
 * Set comment for a specific layer
 */
export const setLayerComment = (layerId: string, comment: string): boolean => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      throw new Error('No active composition');
    }

    const layerIndex = parseInt(layerId);
    if (isNaN(layerIndex) || layerIndex < 1 || layerIndex > comp.numLayers) {
      throw new Error(`Invalid layer ID: ${layerId}`);
    }

    const layer = comp.layer(layerIndex);
    layer.comment = comment;
    return true;
  } catch (error) {
    throw new Error(`Failed to set layer comment: ${String(error)}`);
  }
};

/**
 * Get expression for a specific property
 */
export const getPropertyExpression = (propertyPath: string): string => {
  try {
    const property = getPropertyByPath(propertyPath);
    if (!property) {
      throw new Error(`Property not found: ${propertyPath}`);
    }

    return property.expression || '';
  } catch (error) {
    throw new Error(`Failed to get property expression: ${String(error)}`);
  }
};

/**
 * Set expression for a specific property
 */
export const setPropertyExpression = (
  propertyPath: string,
  expression: string
): boolean => {
  try {
    const property = getPropertyByPath(propertyPath);
    if (!property) {
      throw new Error(`Property not found: ${propertyPath}`);
    }

    property.expression = expression;
    return true;
  } catch (error) {
    throw new Error(`Failed to set property expression: ${String(error)}`);
  }
};

/**
 * Validate an expression (enhanced syntax and semantic check)
 */
export const validateExpression = (expression: string): ValidationResult => {
  const errors: ExpressionError[] = [];
  const warnings: ExpressionWarning[] = [];

  try {
    // Basic syntax validation
    const trimmedExpression = expression.replace(/^\s+|\s+$/g, '');
    if (trimmedExpression === '') {
      return { isValid: true, errors: [], warnings: [] };
    }

    // Check for common syntax errors
    const lines = expression.split('\n');
    let openParensCount = 0;
    let openBracketsCount = 0;
    let openBracesCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/^\s+|\s+$/g, '');
      const lineNum = i + 1;

      // Skip empty lines and comments
      if (line === '' || line.startsWith('//')) {
        continue;
      }

      // Track bracket matching across lines
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        switch (char) {
          case '(':
            openParensCount++;
            break;
          case ')':
            openParensCount--;
            if (openParensCount < 0) {
              errors.push({
                line: lineNum,
                column: j,
                message: 'Unexpected closing parenthesis',
                type: 'syntax',
              });
            }
            break;
          case '[':
            openBracketsCount++;
            break;
          case ']':
            openBracketsCount--;
            if (openBracketsCount < 0) {
              errors.push({
                line: lineNum,
                column: j,
                message: 'Unexpected closing bracket',
                type: 'syntax',
              });
            }
            break;
          case '{':
            openBracesCount++;
            break;
          case '}':
            openBracesCount--;
            if (openBracesCount < 0) {
              errors.push({
                line: lineNum,
                column: j,
                message: 'Unexpected closing brace',
                type: 'syntax',
              });
            }
            break;
        }
      }

      // Check for common syntax patterns
      validateLineSyntax(line, lineNum, errors, warnings);
    }

    // Check for unmatched brackets at end
    if (openParensCount > 0) {
      errors.push({
        line: lines.length,
        column: 0,
        message: `${openParensCount} unclosed parenthesis(es)`,
        type: 'syntax',
      });
    }
    if (openBracketsCount > 0) {
      errors.push({
        line: lines.length,
        column: 0,
        message: `${openBracketsCount} unclosed bracket(s)`,
        type: 'syntax',
      });
    }
    if (openBracesCount > 0) {
      errors.push({
        line: lines.length,
        column: 0,
        message: `${openBracesCount} unclosed brace(s)`,
        type: 'syntax',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push({
      line: 1,
      column: 0,
      message: `Validation error: ${String(error)}`,
      type: 'syntax',
    });

    return {
      isValid: false,
      errors,
      warnings,
    };
  }
};

/**
 * Validate individual line syntax
 */
function validateLineSyntax(
  line: string,
  lineNum: number,
  errors: ExpressionError[],
  warnings: ExpressionWarning[]
): void {
  // Check for deprecated functions
  const deprecatedFunctions = [
    { name: 'random', alternative: 'seedRandom' },
    { name: 'noise', alternative: 'seedRandom' },
    { name: 'Math.random', alternative: 'seedRandom' },
  ];

  for (const func of deprecatedFunctions) {
    const regex = new RegExp(`\\b${func.name}\\s*\\(`, 'gi');
    let match;
    while ((match = regex.exec(line)) !== null) {
      warnings.push({
        line: lineNum,
        column: match.index,
        message: `Function '${func.name}' is deprecated. Consider using '${func.alternative}' instead.`,
        type: 'deprecated',
      });
    }
  }

  // Check for common mistakes
  const commonMistakes = [
    {
      pattern: /\bthis_comp\b/g,
      message: "Use 'thisComp' instead of 'this_comp'",
    },
    {
      pattern: /\bthis_layer\b/g,
      message: "Use 'thisLayer' instead of 'this_layer'",
    },
    {
      pattern: /\btime\s*\*\s*360\b/g,
      message:
        "Consider using 'time * 360' for rotation - this creates very fast rotation",
      type: 'performance' as const,
    },
  ];

  for (const mistake of commonMistakes) {
    let match;
    while ((match = mistake.pattern.exec(line)) !== null) {
      warnings.push({
        line: lineNum,
        column: match.index,
        message: mistake.message,
        type: mistake.type || 'style',
      });
    }
  }

  // Check for potential performance issues
  const performancePatterns = [
    {
      pattern: /for\s*\(/g,
      message:
        'For loops in expressions can impact performance. Consider alternatives.',
    },
    {
      pattern: /while\s*\(/g,
      message:
        'While loops in expressions can impact performance and may cause infinite loops.',
    },
  ];

  for (const pattern of performancePatterns) {
    let match;
    while ((match = pattern.pattern.exec(line)) !== null) {
      warnings.push({
        line: lineNum,
        column: match.index,
        message: pattern.message,
        type: 'performance',
      });
    }
  }

  // Check for syntax errors
  const syntaxPatterns = [
    {
      pattern: /[^=!<>]=(?!=)/g,
      message: "Use '==' for comparison, not '=' (assignment)",
    },
    {
      pattern: /\b(var|let|const)\s+\w+/g,
      message:
        'Variable declarations are not supported in After Effects expressions',
    },
  ];

  for (const pattern of syntaxPatterns) {
    let match;
    while ((match = pattern.pattern.exec(line)) !== null) {
      errors.push({
        line: lineNum,
        column: match.index,
        message: pattern.message,
        type: 'syntax',
      });
    }
  }
}

/**
 * Get all expressions in the current composition
 */
export const getAllExpressions = (): ExpressionInfo[] => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return [];
    }

    const expressions: ExpressionInfo[] = [];

    for (let i = 1; i <= comp.numLayers; i++) {
      const layer = comp.layer(i);
      collectLayerExpressions(layer, expressions);
    }

    return expressions;
  } catch (error) {
    throw new Error(`Failed to get all expressions: ${String(error)}`);
  }
};

/**
 * Search for expressions matching a pattern
 */
export const searchExpressions = (
  pattern: string,
  isRegex: boolean
): SearchResult[] => {
  try {
    const allExpressions = getAllExpressions();
    const results: SearchResult[] = [];

    for (const expr of allExpressions) {
      const matches: SearchResult['matches'] = [];
      const lines = expr.expression.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        if (isRegex) {
          try {
            const regex = new RegExp(pattern, 'gi');
            let match;
            while ((match = regex.exec(line)) !== null) {
              matches.push({
                line: lineNum,
                column: match.index,
                text: match[0],
              });
            }
          } catch (regexError) {
            // Invalid regex, skip
            continue;
          }
        } else {
          // Simple text search
          const lowerLine = line.toLowerCase();
          const lowerPattern = pattern.toLowerCase();
          let index = lowerLine.indexOf(lowerPattern);

          while (index !== -1) {
            matches.push({
              line: lineNum,
              column: index,
              text: line.substr(index, pattern.length),
            });
            index = lowerLine.indexOf(lowerPattern, index + 1);
          }
        }
      }

      if (matches.length > 0) {
        results.push({
          layerName: expr.layerName,
          propertyPath: expr.propertyPath,
          matches,
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to search expressions: ${String(error)}`);
  }
};

/**
 * Get properties with expressions for a specific layer
 */
export const getLayerProperties = (layerId: string): PropertyInfo[] => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return [];
    }

    const layerIndex = parseInt(layerId);
    if (isNaN(layerIndex) || layerIndex < 1 || layerIndex > comp.numLayers) {
      return [];
    }

    const layer = comp.layer(layerIndex);
    const properties: PropertyInfo[] = [];

    collectLayerProperties(layer, '', properties);

    return properties;
  } catch (error) {
    throw new Error(`Failed to get layer properties: ${String(error)}`);
  }
};

/**
 * Get property information by path
 */
export const getPropertyInfo = (propertyPath: string): PropertyInfo | null => {
  try {
    const property = getPropertyByPath(propertyPath);
    if (!property) {
      return null;
    }

    return {
      path: propertyPath,
      name: property.name,
      expression: property.expression || '',
      hasExpression: !!(
        property.expression && property.expression.replace(/^\s+|\s+$/g, '')
      ),
      propertyType: getPropertyType(property),
    };
  } catch (error) {
    return null;
  }
};

/**
 * Helper function to get property by path
 */
function getPropertyByPath(propertyPath: string): Property | null {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return null;
    }

    // Parse property path (format: "layerIndex.propertyName")
    const parts = propertyPath.split('.');
    if (parts.length < 2) {
      return null;
    }

    const layerIndex = parseInt(parts[0]);
    if (isNaN(layerIndex) || layerIndex < 1 || layerIndex > comp.numLayers) {
      return null;
    }

    const layer = comp.layer(layerIndex);
    let property: Property | PropertyGroup = layer;

    // Navigate through property hierarchy
    for (let i = 1; i < parts.length; i++) {
      const propName = parts[i];
      if (property instanceof PropertyGroup) {
        try {
          property = property.property(propName);
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    return property instanceof Property ? property : null;
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to collect properties from a layer
 */
function collectLayerProperties(
  prop: Property | PropertyGroup | Layer,
  basePath: string,
  properties: PropertyInfo[]
): void {
  try {
    if (prop instanceof Property) {
      const fullPath = basePath || prop.name;
      properties.push({
        path: fullPath,
        name: prop.name,
        expression: prop.expression || '',
        hasExpression: !!(
          prop.expression && prop.expression.replace(/^\s+|\s+$/g, '')
        ),
        propertyType: getPropertyType(prop),
      });
    } else if (
      prop.constructor.name === 'PropertyGroup' ||
      prop.constructor.name === 'Layer'
    ) {
      const numProps =
        prop.constructor.name === 'Layer'
          ? getLayerPropertyCount(prop as Layer)
          : (prop as PropertyGroup).numProperties;

      for (let i = 1; i <= numProps; i++) {
        try {
          const childProp =
            prop.constructor.name === 'Layer'
              ? getLayerProperty(prop as Layer, i)
              : (prop as PropertyGroup).property(i);

          if (childProp) {
            const childPath = basePath
              ? `${basePath}.${childProp.name}`
              : childProp.name;
            collectLayerProperties(childProp, childPath, properties);
          }
        } catch {
          // Skip properties that can't be accessed
          continue;
        }
      }
    }
  } catch (error) {
    // Skip properties that can't be processed
  }
}

/**
 * Helper function to get property type
 */
function getPropertyType(property: Property): string {
  try {
    if (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
      return '3D_SPATIAL';
    } else if (property.propertyValueType === PropertyValueType.TwoD_SPATIAL) {
      return '2D_SPATIAL';
    } else if (property.propertyValueType === PropertyValueType.OneD) {
      return '1D';
    } else if (property.propertyValueType === PropertyValueType.COLOR) {
      return 'COLOR';
    } else if (property.propertyValueType === PropertyValueType.CUSTOM_VALUE) {
      return 'CUSTOM';
    } else if (property.propertyValueType === PropertyValueType.MARKER) {
      return 'MARKER';
    } else if (property.propertyValueType === PropertyValueType.LAYER_INDEX) {
      return 'LAYER_INDEX';
    } else if (property.propertyValueType === PropertyValueType.MASK_INDEX) {
      return 'MASK_INDEX';
    } else if (property.propertyValueType === PropertyValueType.SHAPE) {
      return 'SHAPE';
    } else if (property.propertyValueType === PropertyValueType.TEXT_DOCUMENT) {
      return 'TEXT_DOCUMENT';
    }
    return 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Helper function to get layer property count
 */
function getLayerPropertyCount(layer: Layer): number {
  try {
    // Common layer properties that might have expressions
    const commonProps = [
      'Transform',
      'Effects',
      'Masks',
      'Material Options',
      'Audio',
    ];

    let count = 0;
    for (const propName of commonProps) {
      try {
        const prop = layer.property(propName);
        if (prop) count++;
      } catch {
        // Property doesn't exist, continue
      }
    }

    return count;
  } catch {
    return 0;
  }
}

/**
 * Helper function to get layer property by index
 */
function getLayerProperty(
  layer: Layer,
  index: number
): Property | PropertyGroup | null {
  try {
    const commonProps = [
      'Transform',
      'Effects',
      'Masks',
      'Material Options',
      'Audio',
    ];

    let currentIndex = 0;
    for (const propName of commonProps) {
      try {
        const prop = layer.property(propName);
        if (prop) {
          currentIndex++;
          if (currentIndex === index) {
            return prop;
          }
        }
      } catch {
        // Property doesn't exist, continue
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Helper function to collect expressions from a layer
 */
function collectLayerExpressions(
  layer: Layer,
  expressions: ExpressionInfo[]
): void {
  try {
    collectPropertyExpressions(layer, layer.name, '', expressions);
  } catch (error) {
    // Skip layers that can't be processed
  }
}

/**
 * Get current project information
 */
export const getProjectInfo = () => {
  try {
    const project = app.project;
    const activeItem = project.activeItem;

    return {
      name: project.file ? project.file.name : 'Untitled Project',
      path: project.file ? project.file.fsName : null,
      numItems: project.numItems,
      activeItemName: activeItem ? activeItem.name : null,
      activeItemType:
        activeItem instanceof CompItem
          ? 'composition'
          : activeItem instanceof FootageItem
            ? 'footage'
            : activeItem instanceof FolderItem
              ? 'folder'
              : 'unknown',
      saved: true, // Note: project.dirty is not available in all AE versions
    };
  } catch (error) {
    throw new Error(`Failed to get project info: ${String(error)}`);
  }
};

/**
 * Get current composition information
 */
export const getCompositionInfo = () => {
  try {
    const comp = app.project.activeItem as CompItem;
    if (!comp || !(comp instanceof CompItem)) {
      return null;
    }

    return {
      name: comp.name,
      width: comp.width,
      height: comp.height,
      duration: comp.duration,
      frameRate: comp.frameRate,
      workAreaStart: comp.workAreaStart,
      workAreaDuration: comp.workAreaDuration,
      numLayers: comp.numLayers,
      currentTime: comp.time,
      bgColor: [comp.bgColor[0], comp.bgColor[1], comp.bgColor[2]],
    };
  } catch (error) {
    throw new Error(`Failed to get composition info: ${String(error)}`);
  }
};

/**
 * Get expressions statistics
 */
export const getExpressionsStats = () => {
  try {
    const allExpressions = getAllExpressions();

    // Calculate total lines manually
    let totalLines = 0;
    for (let i = 0; i < allExpressions.length; i++) {
      totalLines += allExpressions[i].lineCount;
    }

    // Get unique layer names manually
    const uniqueLayerNames: { [key: string]: boolean } = {};
    for (let i = 0; i < allExpressions.length; i++) {
      uniqueLayerNames[allExpressions[i].layerName] = true;
    }
    const layersWithExpressions = Object.keys(uniqueLayerNames).length;

    // Find longest expression manually
    let longestExpression = {
      lineCount: 0,
      layerName: '',
      propertyPath: '',
      expression: '',
    };
    for (let i = 0; i < allExpressions.length; i++) {
      if (allExpressions[i].lineCount > longestExpression.lineCount) {
        longestExpression = allExpressions[i];
      }
    }

    const stats = {
      totalExpressions: allExpressions.length,
      totalLines: totalLines,
      layersWithExpressions: layersWithExpressions,
      averageLinesPerExpression:
        allExpressions.length > 0
          ? Math.round((totalLines / allExpressions.length) * 10) / 10
          : 0,
      longestExpression: longestExpression,
    };

    return stats;
  } catch (error) {
    throw new Error(`Failed to get expressions stats: ${String(error)}`);
  }
};

/**
 * Backup and restore expression
 */
export const backupExpression = (propertyPath: string): string | null => {
  try {
    const property = getPropertyByPath(propertyPath);
    if (!property) {
      return null;
    }

    // Store backup in a comment-like format
    const backup = property.expression || '';
    return backup;
  } catch (error) {
    return null;
  }
};

/**
 * Test expression without applying it
 */
export const testExpression = (
  propertyPath: string,
  expression: string
): ValidationResult => {
  try {
    const property = getPropertyByPath(propertyPath);
    if (!property) {
      return {
        isValid: false,
        errors: [
          {
            line: 1,
            column: 0,
            message: 'Property not found',
            type: 'reference',
          },
        ],
        warnings: [],
      };
    }

    // First do basic validation
    const basicValidation = validateExpression(expression);
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Try to apply expression temporarily to test for runtime errors
    const originalExpression = property.expression;
    try {
      property.expression = expression;
      // If we get here, the expression was accepted by After Effects
      property.expression = originalExpression; // Restore original

      return {
        isValid: true,
        errors: [],
        warnings: basicValidation.warnings,
      };
    } catch (runtimeError) {
      property.expression = originalExpression; // Restore original

      return {
        isValid: false,
        errors: [
          {
            line: 1,
            column: 0,
            message: `Runtime error: ${String(runtimeError)}`,
            type: 'runtime',
          },
        ],
        warnings: basicValidation.warnings,
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          line: 1,
          column: 0,
          message: `Test error: ${String(error)}`,
          type: 'runtime',
        },
      ],
      warnings: [],
    };
  }
};

/**
 * Helper function to recursively collect expressions from properties
 */
function collectPropertyExpressions(
  prop: Property | PropertyGroup,
  layerName: string,
  basePath: string,
  expressions: ExpressionInfo[]
): void {
  try {
    if (prop instanceof Property) {
      if (prop.expression && prop.expression.replace(/^\s+|\s+$/g, '') !== '') {
        expressions.push({
          layerName,
          propertyPath: basePath,
          expression: prop.expression,
          lineCount: prop.expression.split('\n').length,
        });
      }
    } else if (prop instanceof PropertyGroup) {
      for (let i = 1; i <= prop.numProperties; i++) {
        const childProp = prop.property(i);
        const childPath = basePath
          ? `${basePath}.${childProp.name}`
          : childProp.name;
        collectPropertyExpressions(
          childProp,
          layerName,
          childPath,
          expressions
        );
      }
    }
  } catch (error) {
    // Skip properties that can't be processed
  }
}
