import type { EventTS, CEPError } from '../../shared/universals';
import { dispatchTS } from '../utils/utils';
import * as AEAPI from './ae-api';

/**
 * CEP Bridge handlers for After Effects API operations
 */

/**
 * Handle get selected layers request
 */
export const handleGetSelectedLayers = () => {
  try {
    const layers = AEAPI.getSelectedLayers();
    dispatchTS('layersResponse', layers);
  } catch (error) {
    handleBridgeError('getSelectedLayers', error);
  }
};

/**
 * Handle get layer comment request
 */
export const handleGetLayerComment = (data: EventTS['getLayerComment']) => {
  try {
    const comment = AEAPI.getLayerComment(data.layerId);
    dispatchTS('layerCommentResponse', {
      layerId: data.layerId,
      comment,
    });
  } catch (error) {
    handleBridgeError('getLayerComment', error);
  }
};

/**
 * Handle set layer comment request
 */
export const handleSetLayerComment = (data: EventTS['setLayerComment']) => {
  try {
    const success = AEAPI.setLayerComment(data.layerId, data.comment);
    dispatchTS('layerCommentSetResponse', {
      layerId: data.layerId,
      success,
    });
  } catch (error) {
    handleBridgeError('setLayerComment', error);
  }
};

/**
 * Handle get property expression request
 */
export const handleGetPropertyExpression = (
  data: EventTS['getPropertyExpression']
) => {
  try {
    const expression = AEAPI.getPropertyExpression(data.propertyPath);
    dispatchTS('propertyExpressionResponse', {
      propertyPath: data.propertyPath,
      expression,
    });
  } catch (error) {
    handleBridgeError('getPropertyExpression', error);
  }
};

/**
 * Handle set property expression request
 */
export const handleSetPropertyExpression = (
  data: EventTS['setPropertyExpression']
) => {
  try {
    const success = AEAPI.setPropertyExpression(
      data.propertyPath,
      data.expression
    );
    dispatchTS('propertyExpressionSetResponse', {
      propertyPath: data.propertyPath,
      success,
    });
  } catch (error) {
    handleBridgeError('setPropertyExpression', error);
  }
};

/**
 * Handle validate expression request
 */
export const handleValidateExpression = (
  data: EventTS['validateExpression']
) => {
  try {
    const result = AEAPI.validateExpression(data.expression);
    dispatchTS('expressionValidationResponse', result);
  } catch (error) {
    handleBridgeError('validateExpression', error);
  }
};

/**
 * Handle get all expressions request
 */
export const handleGetAllExpressions = () => {
  try {
    const expressions = AEAPI.getAllExpressions();
    dispatchTS('allExpressionsResponse', expressions);
  } catch (error) {
    handleBridgeError('getAllExpressions', error);
  }
};

/**
 * Handle search expressions request
 */
export const handleSearchExpressions = (data: EventTS['searchExpressions']) => {
  try {
    const results = AEAPI.searchExpressions(data.pattern, data.isRegex);
    dispatchTS('searchExpressionsResponse', results);
  } catch (error) {
    handleBridgeError('searchExpressions', error);
  }
};

/**
 * Handle get all layers request
 */
export const handleGetAllLayers = () => {
  try {
    const layers = AEAPI.getAllLayers();
    dispatchTS('allLayersResponse', layers);
  } catch (error) {
    handleBridgeError('getAllLayers', error);
  }
};

/**
 * Handle get layer by ID request
 */
export const handleGetLayerById = (data: EventTS['getLayerById']) => {
  try {
    const layer = AEAPI.getLayerById(data.layerId);
    dispatchTS('layerByIdResponse', {
      layerId: data.layerId,
      layer,
    });
  } catch (error) {
    handleBridgeError('getLayerById', error);
  }
};

/**
 * Handle get layer properties request
 */
export const handleGetLayerProperties = (
  data: EventTS['getLayerProperties']
) => {
  try {
    const properties = AEAPI.getLayerProperties(data.layerId);
    dispatchTS('layerPropertiesResponse', {
      layerId: data.layerId,
      properties,
    });
  } catch (error) {
    handleBridgeError('getLayerProperties', error);
  }
};

/**
 * Handle get property info request
 */
export const handleGetPropertyInfo = (data: EventTS['getPropertyInfo']) => {
  try {
    const info = AEAPI.getPropertyInfo(data.propertyPath);
    dispatchTS('propertyInfoResponse', {
      propertyPath: data.propertyPath,
      info,
    });
  } catch (error) {
    handleBridgeError('getPropertyInfo', error);
  }
};

/**
 * Handle test expression request
 */
export const handleTestExpression = (data: EventTS['testExpression']) => {
  try {
    const result = AEAPI.testExpression(data.propertyPath, data.expression);
    dispatchTS('expressionTestResponse', result);
  } catch (error) {
    handleBridgeError('testExpression', error);
  }
};

/**
 * Handle get project info request
 */
export const handleGetProjectInfo = () => {
  try {
    const info = AEAPI.getProjectInfo();
    dispatchTS('projectInfoResponse', info);
  } catch (error) {
    handleBridgeError('getProjectInfo', error);
  }
};

/**
 * Handle get composition info request
 */
export const handleGetCompositionInfo = () => {
  try {
    const info = AEAPI.getCompositionInfo();
    dispatchTS('compositionInfoResponse', info);
  } catch (error) {
    handleBridgeError('getCompositionInfo', error);
  }
};

/**
 * Handle get expressions stats request
 */
export const handleGetExpressionsStats = () => {
  try {
    const stats = AEAPI.getExpressionsStats();
    dispatchTS('expressionsStatsResponse', stats);
  } catch (error) {
    handleBridgeError('getExpressionsStats', error);
  }
};

/**
 * Handle bridge errors
 */
function handleBridgeError(operation: string, error: any) {
  const now = new Date();
  const cepError: CEPError = {
    code: `BRIDGE_ERROR_${operation.toUpperCase()}`,
    message: error.toString(),
    details: {
      operation,
      timestamp: now.toString(),
    },
    timestamp: now,
  };

  dispatchTS('bridgeError', cepError);
}

/**
 * Initialize CEP bridge event listeners
 */
export const initializeCEPBridge = () => {
  // Note: In a real CEP extension, you would set up event listeners here
  // For now, we'll export the handlers to be called from the main JSX file
  // Example of how event listeners would be set up:
  // app.addEventListener("getSelectedLayers", handleGetSelectedLayers);
  // app.addEventListener("getLayerComment", handleGetLayerComment);
  // etc.
  // For bolt-cep, we'll integrate these handlers in the main aeft.ts file
};
