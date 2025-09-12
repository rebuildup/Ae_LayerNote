/**
 * Monaco Editor Loader Configuration for CEP
 *
 * This configuration ensures Monaco Editor loads properly in Adobe CEP environments
 * by configuring the loader before any Monaco components are rendered.
 */

import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco loader for CEP environment
export const configureMonacoLoader = () => {
  try {
    // Set monaco instance directly to avoid loader issues
    loader.config({ monaco });

    // Configure Monaco to work without workers
    if (typeof window !== 'undefined') {
      (window as any).MonacoEnvironment = {
        getWorkerUrl: () => 'data:text/javascript;charset=utf-8,',
        getWorker: () => ({
          postMessage: () => {},
          terminate: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          onmessage: null,
          onerror: null,
        }),
      };
    }

    console.log('Monaco loader configured for CEP environment');
  } catch (error) {
    console.warn('Failed to configure Monaco loader:', error);
  }
};

// Auto-configure if in CEP environment
if (typeof window !== 'undefined' && window.cep) {
  configureMonacoLoader();
}
