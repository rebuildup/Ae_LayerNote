/**
 * Performance Monitoring Utilities
 * Monitors and optimizes application performance
 */

// interface PerformanceMetrics {
//   componentRenderTime: number;
//   memoryUsage: number;
//   bundleSize: number;
//   loadTime: number;
//   interactionTime: number;
// }

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  type: 'render' | 'interaction' | 'load' | 'custom';
}

class PerformanceMonitor {
  private metrics: PerformanceEntry[] = [];
  private observers: PerformanceObserver[] = [];
  private memoryCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeObservers();
    this.startMemoryMonitoring();
  }

  private initializeObservers() {
    if (typeof PerformanceObserver !== 'undefined') {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(
                `Long task detected: ${entry.name} took ${entry.duration}ms`
              );
              this.recordMetric({
                name: entry.name,
                startTime: entry.startTime,
                duration: entry.duration,
                type: 'custom',
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }

      // Monitor navigation timing
      try {
        const navigationObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: 'navigation',
              startTime: entry.startTime,
              duration: entry.duration,
              type: 'load',
            });
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        console.warn('Navigation observer not supported');
      }

      // Monitor resource loading
      try {
        const resourceObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) {
              console.warn(
                `Slow resource: ${entry.name} took ${entry.duration}ms`
              );
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported');
      }
    }
  }

  private startMemoryMonitoring() {
    if (typeof (performance as any).memory !== 'undefined') {
      this.memoryCheckInterval = setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };

        // Warn if memory usage is high
        const usagePercentage = (memoryUsage.used / memoryUsage.limit) * 100;
        if (usagePercentage > 80) {
          console.warn(`High memory usage: ${usagePercentage.toFixed(2)}%`);
        }

        this.recordMetric({
          name: 'memory-usage',
          startTime: performance.now(),
          duration: memoryUsage.used,
          type: 'custom',
        });
      }, 30000); // Check every 30 seconds
    }
  }

  recordMetric(entry: PerformanceEntry) {
    this.metrics.push(entry);

    // Keep only last 100 entries to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  measureComponentRender<T>(componentName: string, renderFn: () => T): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();

    this.recordMetric({
      name: `component-render-${componentName}`,
      startTime,
      duration: endTime - startTime,
      type: 'render',
    });

    return result;
  }

  measureInteraction<T>(interactionName: string, interactionFn: () => T): T {
    const startTime = performance.now();
    const result = interactionFn();
    const endTime = performance.now();

    this.recordMetric({
      name: `interaction-${interactionName}`,
      startTime,
      duration: endTime - startTime,
      type: 'interaction',
    });

    return result;
  }

  getMetrics(): PerformanceEntry[] {
    return [...this.metrics];
  }

  getAverageRenderTime(componentName?: string): number {
    const renderMetrics = this.metrics.filter(m => {
      if (componentName) {
        return m.type === 'render' && m.name.includes(componentName);
      }
      return m.type === 'render';
    });

    if (renderMetrics.length === 0) return 0;

    const totalTime = renderMetrics.reduce(
      (sum, metric) => sum + metric.duration,
      0
    );
    return totalTime / renderMetrics.length;
  }

  getSlowOperations(threshold: number = 100): PerformanceEntry[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  generateReport(): string {
    const report = {
      totalMetrics: this.metrics.length,
      averageRenderTime: this.getAverageRenderTime(),
      slowOperations: this.getSlowOperations().length,
      memoryMetrics: this.metrics.filter(m => m.name === 'memory-usage').length,
      recentSlowOps: this.getSlowOperations().slice(-5),
    };

    return JSON.stringify(report, null, 2);
  }

  cleanup() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }

    // Clear metrics
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const measureRender = (componentName: string, renderFn: () => void) => {
    return performanceMonitor.measureComponentRender(componentName, renderFn);
  };

  const measureInteraction = (
    interactionName: string,
    interactionFn: () => void
  ) => {
    return performanceMonitor.measureInteraction(
      interactionName,
      interactionFn
    );
  };

  return {
    measureRender,
    measureInteraction,
    getMetrics: () => performanceMonitor.getMetrics(),
    getReport: () => performanceMonitor.generateReport(),
  };
};
