import { useState, useEffect, useCallback } from 'react';
import { cepBridge } from '../lib/cep-bridge';
import { CEPErrorHandler } from '../lib/cep-error-handler';
import type {
  LayerInfo,
  ExpressionInfo,
  CEPError,
} from '../../shared/universals';

/**
 * React hook for CEP Bridge operations
 */

interface CEPBridgeState {
  isConnected: boolean;
  isLoading: boolean;
  error: CEPError | null;
  connectionStatus: string;
}

export const useCEPBridge = () => {
  const [state, setState] = useState<CEPBridgeState>({
    isConnected: false,
    isLoading: true,
    error: null,
    connectionStatus: 'Checking connection...',
  });

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Add error listener
  useEffect(() => {
    const errorListener = (error: CEPError) => {
      setState(prev => ({ ...prev, error }));
    };

    CEPErrorHandler.addErrorListener(errorListener);

    return () => {
      CEPErrorHandler.removeErrorListener(errorListener);
    };
  }, []);

  const checkConnection = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      connectionStatus: 'Checking connection...',
    }));

    try {
      const status = await cepBridge.getConnectionStatus();
      setState(prev => ({
        ...prev,
        isConnected: status.connected,
        isLoading: false,
        error: status.error
          ? ({
              code: 'CONNECTION_ERROR',
              message: status.error,
              timestamp: new Date(),
            } as CEPError)
          : null,
        connectionStatus: status.connected
          ? 'Connected'
          : `Disconnected: ${status.error}`,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error as CEPError,
        connectionStatus: 'Connection failed',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    checkConnection,
    clearError,
    bridge: cepBridge,
  };
};

/**
 * Hook for layer operations
 */
export const useLayerOperations = () => {
  const [selectedLayers, setSelectedLayers] = useState<LayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CEPError | null>(null);

  const getSelectedLayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const layers = await cepBridge.getSelectedLayers();
      setSelectedLayers(layers);
      return layers;
    } catch (err) {
      const error = err as CEPError;
      setError(error);
      CEPErrorHandler.handleBridgeError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLayerComment = useCallback(async (layerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const comment = await cepBridge.getLayerComment(layerId);
      return comment;
    } catch (err) {
      const error = err as CEPError;
      setError(error);
      CEPErrorHandler.handleBridgeError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setLayerComment = useCallback(
    async (layerId: string, comment: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await cepBridge.setLayerComment(layerId, comment);
        return success;
      } catch (err) {
        const error = err as CEPError;
        setError(error);
        CEPErrorHandler.handleBridgeError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    selectedLayers,
    isLoading,
    error,
    getSelectedLayers,
    getLayerComment,
    setLayerComment,
    clearError: () => setError(null),
  };
};

/**
 * Hook for expression operations
 */
export const useExpressionOperations = () => {
  const [expressions, setExpressions] = useState<ExpressionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CEPError | null>(null);

  const getPropertyExpression = useCallback(async (propertyPath: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const expression = await cepBridge.getPropertyExpression(propertyPath);
      return expression;
    } catch (err) {
      const error = err as CEPError;
      setError(error);
      CEPErrorHandler.handleBridgeError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPropertyExpression = useCallback(
    async (propertyPath: string, expression: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await cepBridge.setPropertyExpression(
          propertyPath,
          expression
        );
        return success;
      } catch (err) {
        const error = err as CEPError;
        setError(error);
        CEPErrorHandler.handleBridgeError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const validateExpression = useCallback(async (expression: string) => {
    setError(null);

    try {
      const result = await cepBridge.validateExpression(expression);
      return result;
    } catch (err) {
      const error = err as CEPError;
      setError(error);
      throw error;
    }
  }, []);

  const getAllExpressions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allExpressions = await cepBridge.getAllExpressions();
      setExpressions(allExpressions);
      return allExpressions;
    } catch (err) {
      const error = err as CEPError;
      setError(error);
      CEPErrorHandler.handleBridgeError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchExpressions = useCallback(
    async (pattern: string, isRegex: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await cepBridge.searchExpressions(pattern, isRegex);
        return results;
      } catch (err) {
        const error = err as CEPError;
        setError(error);
        CEPErrorHandler.handleBridgeError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    expressions,
    isLoading,
    error,
    getPropertyExpression,
    setPropertyExpression,
    validateExpression,
    getAllExpressions,
    searchExpressions,
    clearError: () => setError(null),
  };
};
