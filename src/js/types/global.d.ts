/**
 * Global Type Definitions
 * Defines global types and interfaces for the application
 */

// CEP (Common Extensibility Platform) types
declare global {
  interface Window {
    cep?: {
      fs?: {
        writeFile: (
          path: string,
          data: string,
          callback: (err: any, data?: any) => void
        ) => void;
        readFile: (
          path: string,
          callback: (err: any, data?: string) => void
        ) => void;
        deleteFile: (path: string, callback: (err: any) => void) => void;
        readdir: (
          path: string,
          callback: (err: any, files?: string[]) => void
        ) => void;
        getDataFolder: () => string;
      };
      event?: {
        addEventListener: (
          type: string,
          listener: (event: any) => void
        ) => void;
        removeEventListener: (
          type: string,
          listener: (event: any) => void
        ) => void;
      };
    };
    cep_node?: {
      global: {
        __dirname: string;
      };
    };
  }

  // Performance memory extension
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

// Module declarations for assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Environment variables
declare const __DEV__: boolean;
declare const __PROD__: boolean;
declare const __VERSION__: string;

export {};
