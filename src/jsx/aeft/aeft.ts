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
import * as AEAPI from './ae-api';
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

// Debug: show ExtendScript alert from CEP
export const debugAlert = (message: string) => {
  try {
    alert(String(message));
  } catch (e) {}
};

// Scan a folder and return file names (notes helper)
export const scanFolder = (folderPath: string) => {
  try {
    var f = new Folder(String(folderPath));
    if (!f.exists) {
      return { success: false, error: 'Folder not found: ' + folderPath };
    }
    var files = f.getFiles();
    var names = [] as string[];
    for (var i = 0; i < files.length; i++) {
      try {
        var file = files[i];
        if (file instanceof File) {
          names.push(String(file.name));
        }
      } catch (e) {}
    }
    return { success: true, files: names };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

// Write a text file at an absolute path
export const writeTextFile = (filePath: string, data: string) => {
  try {
    var path = String(filePath);
    // Normalize common separators
    path = path.replace(/\\/g, '\\');
    var f = new File(path);
    if (!f.parent || !f.parent.exists) {
      // Try to create parent folder chain
      try {
        if (f.parent) f.parent.create();
      } catch (e) {}
    }
    if (!f.open('w')) {
      return { success: false, error: 'open failed: ' + f.error };
    }
    try {
      f.write(String(data || ''));
    } catch (e) {
      try {
        f.close();
      } catch (ee) {}
      return { success: false, error: 'write failed: ' + String(e) };
    }
    f.close();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};
