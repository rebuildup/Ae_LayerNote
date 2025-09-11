/**
 * Monaco Editor Environment Configuration for CEP
 *
 * This configuration prevents RequireJS conflicts in Adobe CEP environments
 * by disabling Monaco Editor workers and providing dummy implementations.
 */

// Configure Monaco Environment for CEP compatibility
export const configureMonacoForCEP = () => {
  if (typeof window !== 'undefined') {
    // Only configure if not already set
    if (!(window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: () => {
          // Return data URL to prevent external worker loading
          return 'data:text/javascript;charset=utf-8,';
        },
        getWorker: () => {
          // Return dummy worker to prevent RequireJS conflicts
          return {
            postMessage: () => {},
            terminate: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            onmessage: null,
            onerror: null,
          };
        },
      };

      console.log('Monaco Editor configured for CEP environment');
    }
  }
};

// Auto-configure on import in CEP environment
if (typeof window !== 'undefined' && window.cep) {
  configureMonacoForCEP();
}




