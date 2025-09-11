/**
 * Memory Management Utilities
 * Prevents memory leaks and optimizes memory usage
 */

import React, { useEffect, useRef, useCallback } from 'react';

// Memory leak detector
class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private eventListeners: Map<string, number> = new Map();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private observers: Set<any> = new Set();

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  trackEventListener(event: string) {
    const count = this.eventListeners.get(event) || 0;
    this.eventListeners.set(event, count + 1);
  }

  untrackEventListener(event: string) {
    const count = this.eventListeners.get(event) || 0;
    if (count > 0) {
      this.eventListeners.set(event, count - 1);
    }
  }

  trackTimer(timerId: NodeJS.Timeout) {
    this.timers.add(timerId);
  }

  untrackTimer(timerId: NodeJS.Timeout) {
    this.timers.delete(timerId);
  }

  trackInterval(intervalId: NodeJS.Timeout) {
    this.intervals.add(intervalId);
  }

  untrackInterval(intervalId: NodeJS.Timeout) {
    this.intervals.delete(intervalId);
  }

  trackObserver(observer: any) {
    this.observers.add(observer);
  }

  untrackObserver(observer: any) {
    this.observers.delete(observer);
  }

  getReport() {
    return {
      eventListeners: Object.fromEntries(this.eventListeners),
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      activeObservers: this.observers.size,
    };
  }

  cleanup() {
    // Clear all tracked timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Clear all tracked intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();

    // Disconnect all tracked observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Clear event listener tracking
    this.eventListeners.clear();
  }
}

export const memoryLeakDetector = MemoryLeakDetector.getInstance();

// Safe event listener hook
export function useSafeEventListener(
  target: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef<EventListener | undefined>(undefined);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!target) return;

    const eventListener = (event: Event) => savedHandler.current?.(event);

    target.addEventListener(event, eventListener, options);
    memoryLeakDetector.trackEventListener(event);

    return () => {
      target.removeEventListener(event, eventListener, options);
      memoryLeakDetector.untrackEventListener(event);
    };
  }, [target, event, options]);
}

// Safe timer hooks
export function useSafeTimeout(callback: () => void, delay: number | null) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const savedCallback = useRef<() => void | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current?.();

    timeoutRef.current = setTimeout(tick, delay);
    memoryLeakDetector.trackTimer(timeoutRef.current);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        memoryLeakDetector.untrackTimer(timeoutRef.current);
      }
    };
  }, [delay]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      memoryLeakDetector.untrackTimer(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  return clearTimer;
}

export function useSafeInterval(callback: () => void, delay: number | null) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const savedCallback = useRef<() => void | undefined>(undefined);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current?.();

    intervalRef.current = setInterval(tick, delay);
    memoryLeakDetector.trackInterval(intervalRef.current);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        memoryLeakDetector.untrackInterval(intervalRef.current);
      }
    };
  }, [delay]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      memoryLeakDetector.untrackInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  return clearTimer;
}

// Safe observer hook
export function useSafeObserver<T extends { disconnect: () => void }>(
  createObserver: () => T,
  dependencies: any[] = []
) {
  const observerRef = useRef<T | undefined>(undefined);

  useEffect(() => {
    observerRef.current = createObserver();
    memoryLeakDetector.trackObserver(observerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        memoryLeakDetector.untrackObserver(observerRef.current);
      }
    };
  }, dependencies);

  return observerRef.current;
}

// Memory usage monitor
export function useMemoryMonitor(interval: number = 30000) {
  const [memoryInfo, setMemoryInfo] = React.useState<any>(null);

  useSafeInterval(() => {
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      });
    }
  }, interval);

  return memoryInfo;
}

// Cleanup utility for components
export function useCleanup(cleanupFn: () => void) {
  const cleanupRef = useRef<() => void | undefined>(undefined);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);
}

// WeakMap-based cache for preventing memory leaks
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

// LRU Cache with size limit
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// React hook for LRU cache
export function useLRUCache<K, V>(maxSize: number = 100) {
  const cacheRef = useRef(new LRUCache<K, V>(maxSize));

  useEffect(() => {
    return () => {
      cacheRef.current.clear();
    };
  }, []);

  return cacheRef.current;
}
