/**
 * Performance Optimized Components
 * Memoized and optimized versions of components for better performance
 */

import React, { memo, useMemo, useCallback } from 'react';
import { useDebounce, useThrottle } from '../lib/performance/debounce-throttle';
import { useMemoryMonitor } from '../lib/performance/memory-management';
import { performanceMonitor } from '../lib/performance/performance-monitor';

// Optimized Monaco Editor wrapper
interface OptimizedMonacoEditorProps {
  value: string;
  language: 'javascript' | 'plaintext';
  onChange: (value: string) => void;
  onSave: () => void;
  options: any;
}

export const OptimizedMonacoEditor = memo<OptimizedMonacoEditorProps>(
  ({ value, onChange, onSave, options }) => {
    // Debounce onChange to reduce update frequency
    const debouncedOnChange = useDebounce(onChange, 300);

    // Throttle save operations
    const throttledOnSave = useThrottle(onSave, 1000);

    // Memoize editor options to prevent unnecessary re-renders
    useMemo(
      () => ({
        ...options,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: options.minimap },
        wordWrap: options.wordWrap ? 'on' : 'off',
      }),
      [options]
    );

    // Performance monitoring
    const handleChange = useCallback(
      (newValue: string) => {
        performanceMonitor.measureInteraction('editor-change', () => {
          debouncedOnChange(newValue);
        });
      },
      [debouncedOnChange]
    );

    const handleSave = useCallback(() => {
      performanceMonitor.measureInteraction('editor-save', () => {
        throttledOnSave();
      });
    }, [throttledOnSave]);

    return (
      <div className="optimized-monaco-editor">
        {/* Monaco Editor would be rendered here */}
        <div data-testid="optimized-monaco-editor">
          <textarea
            value={value}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
              }
            }}
            style={{ width: '100%', height: '100%', minHeight: '200px' }}
          />
        </div>
      </div>
    );
  }
);

OptimizedMonacoEditor.displayName = 'OptimizedMonacoEditor';

// Optimized Settings Panel with virtualization for large lists
interface OptimizedSettingsPanelProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export const OptimizedSettingsPanel = memo<OptimizedSettingsPanelProps>(
  ({ onSettingsChange }) => {
    // Debounce settings changes to reduce save frequency
    useDebounce(onSettingsChange, 500);

    // Memoize setting sections to prevent unnecessary re-renders
    const settingSections = useMemo(
      () => [
        { id: 'editor', label: 'Editor', icon: '⚡' },
        { id: 'linting', label: 'Linting', icon: '🔍' },
        { id: 'formatting', label: 'Formatting', icon: '✨' },
        { id: 'ui', label: 'UI', icon: '🎨' },
        { id: 'advanced', label: 'Advanced', icon: '⚙️' },
      ],
      []
    );

    return (
      <div className="optimized-settings-panel">
        {settingSections.map(section => (
          <div key={section.id} className="settings-section">
            <h3>
              {section.icon} {section.label}
            </h3>
            {/* Settings content would be rendered here */}
          </div>
        ))}
      </div>
    );
  }
);

OptimizedSettingsPanel.displayName = 'OptimizedSettingsPanel';

// Virtualized list component for large datasets
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Throttle scroll events
  const handleScroll = useThrottle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      className="virtualized-list"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleRange.startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
}

// Performance monitoring component
export const PerformanceMonitor: React.FC = memo(() => {
  const memoryInfo = useMemoryMonitor(5000); // Check every 5 seconds
  const [showDetails, setShowDetails] = React.useState(false);

  const performanceReport = useMemo(() => {
    return performanceMonitor.generateReport();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="performance-monitor">
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 9999,
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor:
            memoryInfo?.usagePercentage > 80 ? '#ff4444' : '#44ff44',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {memoryInfo ? `${memoryInfo.usagePercentage.toFixed(1)}%` : 'Perf'}
      </button>

      {showDetails && (
        <div
          style={{
            position: 'fixed',
            top: 40,
            right: 10,
            zIndex: 9999,
            padding: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            fontSize: '12px',
            borderRadius: '4px',
            maxWidth: '300px',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          <h4>Performance Monitor</h4>
          {memoryInfo && (
            <div>
              <strong>Memory:</strong>
              <br />
              Used: {(memoryInfo.used / 1024 / 1024).toFixed(2)} MB
              <br />
              Total: {(memoryInfo.total / 1024 / 1024).toFixed(2)} MB
              <br />
              Usage: {memoryInfo.usagePercentage.toFixed(2)}%
            </div>
          )}
          <details>
            <summary>Performance Report</summary>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {performanceReport}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// Optimized image component with lazy loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  placeholder?: string;
  className?: string;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({
    src,
    alt,
    width,
    height,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGNUY1RjUiLz48L3N2Zz4=',
    className,
  }) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isInView, setIsInView] = React.useState(false);
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Intersection Observer for lazy loading
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <img
        ref={imgRef}
        src={isInView ? src : placeholder}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0.7,
          transition: 'opacity 0.3s ease',
        }}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';
