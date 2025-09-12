import type {
  LayerInfo,
  ExpressionInfo,
  SearchResult,
  ValidationResult,
  CEPError,
} from '../../shared/universals';
import { evalTS, listenTS } from './utils/bolt';

/**
 * CEP Bridge client for communicating with JSX layer
 */

type Listener = (data: any, error?: CEPError) => void;

export class CEPBridgeClient {
  private eventListeners: Map<string, Listener[]> = new Map();
  private requestTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for responses from JSX layer
   */
  private initializeEventListeners() {
    // Layer responses
    listenTS('layersResponse', (data: LayerInfo[]) => {
      this.handleResponse('getSelectedLayers', data);
    });

    listenTS(
      'layerCommentResponse',
      (data: { layerId: string; comment: string }) => {
        this.handleResponse(`getLayerComment_${data.layerId}`, data.comment);
      }
    );

    listenTS(
      'layerCommentSetResponse',
      (data: { layerId: string; success: boolean }) => {
        this.handleResponse(`setLayerComment_${data.layerId}`, data.success);
      }
    );

    // Expression responses
    listenTS(
      'propertyExpressionResponse',
      (data: { propertyPath: string; expression: string }) => {
        this.handleResponse(
          `getPropertyExpression_${data.propertyPath}`,
          data.expression
        );
      }
    );

    listenTS(
      'propertyExpressionSetResponse',
      (data: { propertyPath: string; success: boolean }) => {
        this.handleResponse(
          `setPropertyExpression_${data.propertyPath}`,
          data.success
        );
      }
    );

    listenTS('expressionValidationResponse', (data: ValidationResult) => {
      this.handleResponse('validateExpression', data);
    });

    listenTS('allExpressionsResponse', (data: ExpressionInfo[]) => {
      this.handleResponse('getAllExpressions', data);
    });

    listenTS('searchExpressionsResponse', (data: SearchResult[]) => {
      this.handleResponse('searchExpressions', data);
    });

    // Error responses
    listenTS('bridgeError', (data: CEPError) => {
      this.handleError(data);
    });

    // Project info
    listenTS('projectInfoResponse', (data: any) => {
      this.handleResponse('getProjectInfo', data);
    });
    // Layers list (all layers in active comp)
    listenTS('allLayersResponse', (data: LayerInfo[]) => {
      this.handleResponse('getAllLayers', data);
    });

    // Layer properties list
    listenTS(
      'layerPropertiesResponse',
      (data: { layerId: string; properties: any[] }) => {
        this.handleResponse(
          `getLayerProperties_${data.layerId}`,
          data.properties
        );
      }
    );

    // Property info
    listenTS(
      'propertyInfoResponse',
      (data: { propertyPath: string; info: any }) => {
        this.handleResponse(`getPropertyInfo_${data.propertyPath}`, data.info);
      }
    );
  }

  /**
   * Handle response from JSX layer
   */
  private handleResponse(key: string, data: any) {
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in response listener for ${key}:`, error);
        }
      });
      this.eventListeners.delete(key);
    }

    // Clear timeout
    const timeout = this.requestTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.requestTimeouts.delete(key);
    }
  }

  /**
   * Handle error from JSX layer
   */
  private handleError(error: CEPError) {
    console.error('CEP Bridge Error:', error);

    // Find and notify relevant listeners
    for (const [key, listeners] of this.eventListeners.entries()) {
      if (error.details?.operation && key.includes(error.details.operation)) {
        listeners.forEach(listener => {
          try {
            listener(null, error);
          } catch (listenerError) {
            console.error(`Error in error listener for ${key}:`, listenerError);
          }
        });
        this.eventListeners.delete(key);

        // Clear timeout
        const timeout = this.requestTimeouts.get(key);
        if (timeout) {
          clearTimeout(timeout);
          this.requestTimeouts.delete(key);
        }
      }
    }
  }

  /**
   * Add response listener with timeout
   */
  private addResponseListener(key: string, callback: Listener): void {
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key)!.push(callback);

    // Set timeout
    const timeout = setTimeout(() => {
      const listeners = this.eventListeners.get(key);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(null, {
              code: 'TIMEOUT',
              message: `Request timeout for ${key}`,
              details: { key },
              timestamp: new Date(),
            } as CEPError);
          } catch (error) {
            console.error(`Error in timeout handler for ${key}:`, error);
          }
        });
        this.eventListeners.delete(key);
      }
      this.requestTimeouts.delete(key);
    }, this.REQUEST_TIMEOUT);

    this.requestTimeouts.set(key, timeout);
  }

  /**
   * Get selected layers
   */
  async getSelectedLayers(): Promise<LayerInfo[]> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('getSelectedLayers', (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('getSelectedLayers').catch(reject);
    });
  }

  /**
   * Get layer comment
   */
  async getLayerComment(layerId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(`getLayerComment_${layerId}`, (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('getLayerComment', layerId).catch(reject);
    });
  }

  /**
   * Set layer comment
   */
  async setLayerComment(layerId: string, comment: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(`setLayerComment_${layerId}`, (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('setLayerComment', layerId, comment).catch(reject);
    });
  }

  /**
   * Get property expression
   */
  async getPropertyExpression(propertyPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(
        `getPropertyExpression_${propertyPath}`,
        (data, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );

      evalTS('getPropertyExpression', propertyPath).catch(reject);
    });
  }

  /**
   * Set property expression
   */
  async setPropertyExpression(
    propertyPath: string,
    expression: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(
        `setPropertyExpression_${propertyPath}`,
        (data, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );

      evalTS('setPropertyExpression', propertyPath, expression).catch(reject);
    });
  }

  /**
   * Validate expression
   */
  async validateExpression(expression: string): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('validateExpression', (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('validateExpression', expression).catch(reject);
    });
  }

  /**
   * Get all expressions
   */
  async getAllExpressions(): Promise<ExpressionInfo[]> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('getAllExpressions', (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('getAllExpressions').catch(reject);
    });
  }

  /**
   * Get all layers in the active composition
   */
  async getAllLayers(): Promise<LayerInfo[]> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('getAllLayers', (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('getAllLayers').catch(reject);
    });
  }

  /**
   * Get all properties for a layer
   */
  async getLayerProperties(layerId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(
        `getLayerProperties_${layerId}`,
        (data, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );

      evalTS('getLayerProperties', layerId).catch(reject);
    });
  }

  /**
   * Get property info
   */
  async getPropertyInfo(propertyPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.addResponseListener(
        `getPropertyInfo_${propertyPath}`,
        (data, error) => {
          if (error) {
            reject(error);
          } else {
            resolve(data);
          }
        }
      );

      evalTS('getPropertyInfo', propertyPath).catch(reject);
    });
  }

  /**
   * Search expressions
   */
  async searchExpressions(
    pattern: string,
    isRegex: boolean = false
  ): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('searchExpressions', (data, error) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });

      evalTS('searchExpressions', pattern, isRegex).catch(reject);
    });
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if CEP bridge is available
   */
  isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as any).cep !== 'undefined' &&
      typeof evalTS === 'function'
    );
  }

  /**
   * Get current project info (name, path, etc.)
   */
  async getProjectInfo(): Promise<{ name: string; path: string | null }> {
    return new Promise((resolve, reject) => {
      this.addResponseListener('getProjectInfo', (data, error) => {
        if (error) reject(error);
        else resolve(data);
      });
      evalTS('getProjectInfo').catch(reject);
    });
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{ connected: boolean; error?: string }> {
    try {
      if (!this.isAvailable()) {
        return { connected: false, error: 'CEP interface not available' };
      }

      // Test connection with a simple operation
      await this.getSelectedLayers();
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error:
          error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  /**
   * Show ExtendScript-side alert for debugging
   */
  async debugAlert(message: string): Promise<void> {
    await evalTS('debugAlert', message);
  }

  async scanFolder(
    path: string
  ): Promise<{ success: boolean; files?: string[]; error?: string }> {
    try {
      const res = await evalTS('scanFolder', path);
      return res;
    } catch (e) {
      return { success: false, error: String(e) } as any;
    }
  }

  async writeTextFile(
    path: string,
    data: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await evalTS('writeTextFile', path, data);
      return res;
    } catch (e) {
      return { success: false, error: String(e) } as any;
    }
  }
}

// Export singleton instance
export const cepBridge = new CEPBridgeClient();
