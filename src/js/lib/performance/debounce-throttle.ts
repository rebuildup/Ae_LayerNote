/**
 * Debounce and Throttle Utilities
 * Optimizes performance by controlling function execution frequency
 */

import React, { useCallback, useRef, useEffect } from 'react';

// Debounce function - delays execution until after delay has passed since last call
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function - limits execution to once per delay period
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// React hook for debounced functions
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFunc;
}

// React hook for throttled functions
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);

  const throttledFunc = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        func(...args);
      }
    },
    [func, delay]
  );

  return throttledFunc;
}

// React hook for debounced values
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Advanced debounce with immediate execution option
export function advancedDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (!immediate) func(...args);
    }, delay);

    if (callNow) func(...args);
  };
}

// Throttle with leading and trailing options
export function advancedThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<T>;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (!lastCall && !leading) {
      lastCall = now;
    }

    const remaining = delay - (now - lastCall);

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      lastCall = now;
      func(...args);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCall = leading ? 0 : Date.now();
        timeoutId = undefined;
        func(...lastArgs);
      }, remaining);
    }
  };
}

// Batch function calls
export function batchCalls<T extends (...args: any[]) => any>(
  func: T,
  batchSize: number = 10,
  delay: number = 100
): (...args: Parameters<T>) => void {
  let batch: Parameters<T>[] = [];
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    batch.push(args);

    if (batch.length >= batchSize) {
      // Execute immediately if batch is full
      const currentBatch = [...batch];
      batch = [];
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      currentBatch.forEach(batchArgs => func(...batchArgs));
    } else if (!timeoutId) {
      // Schedule execution if batch is not full
      timeoutId = setTimeout(() => {
        const currentBatch = [...batch];
        batch = [];
        timeoutId = undefined;
        currentBatch.forEach(batchArgs => func(...batchArgs));
      }, delay);
    }
  };
}

// React hook for batched updates
export function useBatchedUpdates<T>(
  updateFunc: (items: T[]) => void,
  batchSize: number = 10,
  delay: number = 100
) {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const addToBatch = useCallback(
    (item: T) => {
      batchRef.current.push(item);

      if (batchRef.current.length >= batchSize) {
        // Execute immediately if batch is full
        const currentBatch = [...batchRef.current];
        batchRef.current = [];
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = undefined;
        }
        updateFunc(currentBatch);
      } else if (!timeoutRef.current) {
        // Schedule execution if batch is not full
        timeoutRef.current = setTimeout(() => {
          const currentBatch = [...batchRef.current];
          batchRef.current = [];
          timeoutRef.current = undefined;
          if (currentBatch.length > 0) {
            updateFunc(currentBatch);
          }
        }, delay);
      }
    },
    [updateFunc, batchSize, delay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return addToBatch;
}
