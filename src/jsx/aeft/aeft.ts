import {
  helloVoid,
  helloError,
  helloStr,
  helloNum,
  helloArrayStr,
  helloObj,
} from '../utils/samples';
export { helloError, helloStr, helloNum, helloArrayStr, helloObj, helloVoid };
import { dispatchTS } from '../utils/utils';
import * as CEPBridge from './cep-bridge';
import type { EventTS } from '../../shared/universals';

export const helloWorld = () => {
  alert('Hello from After Effects!');
  app.project.activeItem;
};

// CEP Bridge API exports
export const getSelectedLayers = () => {
  CEPBridge.handleGetSelectedLayers();
};

export const getAllLayers = () => {
  CEPBridge.handleGetAllLayers();
};

export const getLayerById = (layerId: string) => {
  CEPBridge.handleGetLayerById({ layerId });
};

export const getLayerComment = (layerId: string) => {
  CEPBridge.handleGetLayerComment({ layerId });
};

export const setLayerComment = (layerId: string, comment: string) => {
  CEPBridge.handleSetLayerComment({ layerId, comment });
};

export const getLayerProperties = (layerId: string) => {
  CEPBridge.handleGetLayerProperties({ layerId });
};

export const getPropertyInfo = (propertyPath: string) => {
  CEPBridge.handleGetPropertyInfo({ propertyPath });
};

export const getPropertyExpression = (propertyPath: string) => {
  CEPBridge.handleGetPropertyExpression({ propertyPath });
};

export const setPropertyExpression = (
  propertyPath: string,
  expression: string
) => {
  CEPBridge.handleSetPropertyExpression({ propertyPath, expression });
};

export const validateExpression = (expression: string) => {
  CEPBridge.handleValidateExpression({ expression });
};

export const testExpression = (propertyPath: string, expression: string) => {
  CEPBridge.handleTestExpression({ propertyPath, expression });
};

export const getAllExpressions = () => {
  CEPBridge.handleGetAllExpressions();
};

export const searchExpressions = (pattern: string, isRegex: boolean) => {
  CEPBridge.handleSearchExpressions({ pattern, isRegex });
};

export const getProjectInfo = () => {
  CEPBridge.handleGetProjectInfo();
};

export const getCompositionInfo = () => {
  CEPBridge.handleGetCompositionInfo();
};

export const getExpressionsStats = () => {
  CEPBridge.handleGetExpressionsStats();
};
