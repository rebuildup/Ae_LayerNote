import type { CEPError } from '../../shared/universals';

/**
 * CEP Bridge Error Handler
 */

export class CEPErrorHandler {
  private static errorListeners: ((error: CEPError) => void)[] = [];

  /**
   * Handle bridge error
   */
  static handleBridgeError(error: CEPError): void {
    console.error('CEP Bridge Error:', error);

    // Notify all error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    // Show user-friendly error message
    this.showUserFriendlyError(error);
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
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

        console.warn(
          `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
          error
        );

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Show user-friendly error message
   */
  static showUserFriendlyError(error: CEPError): void {
    const userMessage = this.getUserFriendlyMessage(error);

    // In a real application, you might want to show this in a toast or modal
    // For now, we'll just log it
    console.warn('User-friendly error:', userMessage);

    // You could dispatch a custom event here for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cep-error', {
          detail: { error, userMessage },
        })
      );
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: CEPError): string {
    switch (error.code) {
      case 'TIMEOUT':
        return 'The operation took too long to complete. Please try again.';

      case 'BRIDGE_ERROR_GETSELECTEDLAYERS':
        return 'Unable to get selected layers. Please make sure you have a composition open and layers selected.';

      case 'BRIDGE_ERROR_GETLAYERCOMMENT':
        return 'Unable to get layer comment. The layer may not exist or may have been deleted.';

      case 'BRIDGE_ERROR_SETLAYERCOMMENT':
        return 'Unable to save layer comment. Please make sure the layer exists and try again.';

      case 'BRIDGE_ERROR_GETPROPERTYEXPRESSION':
        return 'Unable to get property expression. The property may not exist or may not support expressions.';

      case 'BRIDGE_ERROR_SETPROPERTYEXPRESSION':
        return 'Unable to save expression. Please check the expression syntax and try again.';

      case 'BRIDGE_ERROR_VALIDATEEXPRESSION':
        return 'Unable to validate expression. Please check the expression syntax.';

      case 'BRIDGE_ERROR_GETALLEXPRESSIONS':
        return 'Unable to get expressions. Please make sure you have a composition open.';

      case 'BRIDGE_ERROR_SEARCHEXPRESSIONS':
        return 'Unable to search expressions. Please check your search pattern and try again.';

      default:
        return `An error occurred: ${error.message}`;
    }
  }

  /**
   * Add error listener
   */
  static addErrorListener(listener: (error: CEPError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  static removeErrorListener(listener: (error: CEPError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Clear all error listeners
   */
  static clearErrorListeners(): void {
    this.errorListeners = [];
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverableError(error: CEPError): boolean {
    const recoverableCodes = [
      'TIMEOUT',
      'BRIDGE_ERROR_GETSELECTEDLAYERS',
      'BRIDGE_ERROR_GETLAYERCOMMENT',
      'BRIDGE_ERROR_GETPROPERTYEXPRESSION',
      'BRIDGE_ERROR_GETALLEXPRESSIONS',
      'BRIDGE_ERROR_SEARCHEXPRESSIONS',
    ];

    return recoverableCodes.includes(error.code);
  }

  /**
   * Get retry suggestion for error
   */
  static getRetrySuggestion(error: CEPError): string | null {
    if (!this.isRecoverableError(error)) {
      return null;
    }

    switch (error.code) {
      case 'TIMEOUT':
        return 'The operation timed out. Try again or check your connection.';

      case 'BRIDGE_ERROR_GETSELECTEDLAYERS':
        return 'Make sure you have a composition open and try selecting some layers.';

      case 'BRIDGE_ERROR_GETLAYERCOMMENT':
      case 'BRIDGE_ERROR_GETPROPERTYEXPRESSION':
        return 'The layer or property may have been deleted. Try refreshing the layer list.';

      case 'BRIDGE_ERROR_GETALLEXPRESSIONS':
      case 'BRIDGE_ERROR_SEARCHEXPRESSIONS':
        return 'Make sure you have a composition open with some expressions.';

      default:
        return 'Please try the operation again.';
    }
  }

  /**
   * Create error report
   */
  static createErrorReport(error: CEPError): string {
    const report = {
      timestamp: error.timestamp.toISOString(),
      code: error.code,
      message: error.message,
      details: error.details,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    };

    return JSON.stringify(report, null, 2);
  }
}
