/**
 * Vite Configuration for Performance Optimization
 * Optimizes bundle size and loading performance
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  // Build optimizations
  build: {
    // Enable minification
    minify: "terser",

    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      mangle: {
        safari10: true,
      },
    },

    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "vendor-react": ["react", "react-dom"],
          "vendor-monaco": ["@monaco-editor/react", "monaco-editor"],

          // Feature chunks
          "feature-settings": [
            "./src/js/contexts/SettingsContext.tsx",
            "./src/js/components/SettingsPanel.tsx",
          ],
          "feature-editor": [
            "./src/js/components/MonacoEditor.tsx",
            "./src/js/components/EditorContainer.tsx",
          ],
          "feature-notes": [
            "./src/js/components/NotesManager.tsx",
            "./src/js/components/NoteEditor.tsx",
          ],

          // Utility chunks
          "utils-performance": [
            "./src/js/lib/performance/performance-monitor.ts",
            "./src/js/lib/performance/debounce-throttle.ts",
            "./src/js/lib/performance/memory-management.ts",
          ],
          "utils-storage": [
            "./src/js/lib/storage/cep-storage.ts",
            "./src/js/lib/storage/migration.ts",
          ],
        },

        // Optimize chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(".tsx", "")
                .replace(".ts", "")
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },

        // Optimize asset names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Source map for debugging (disable in production)
    sourcemap: process.env.NODE_ENV === "development",

    // Target modern browsers for better optimization
    target: "es2020",

    // Optimize CSS
    cssCodeSplit: true,

    // Report bundle size
    reportCompressedSize: true,

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Development optimizations
  server: {
    // Enable HMR
    hmr: true,

    // Optimize deps
    fs: {
      allow: [".."],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: ["react", "react-dom", "@monaco-editor/react"],
    exclude: [
      // Exclude large dependencies that should be loaded on demand
    ],
  },

  // Resolve optimizations
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/js/components"),
      "@contexts": resolve(__dirname, "src/js/contexts"),
      "@lib": resolve(__dirname, "src/js/lib"),
      "@styles": resolve(__dirname, "src/js/styles"),
      "@types": resolve(__dirname, "src/js/types"),
    },
  },

  // CSS optimizations
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: "camelCase",
    },

    // PostCSS optimizations
    postcss: {
      plugins: [
        // Add autoprefixer and other PostCSS plugins here
      ],
    },

    // Preprocess options
    preprocessorOptions: {
      scss: {
        additionalData: `@use "src/js/variables.scss" as *;`,
      },
    },
  },

  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV === "development",
    __PROD__: process.env.NODE_ENV === "production",
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
  },

  // Worker optimizations
  worker: {
    format: "es",
  },
});
